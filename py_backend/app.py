"""
app.py
======
Flask server that exposes the ModularRAG query engine as an HTTP API.

Endpoints
---------
POST /api/query
    Accepts: { "query": str, "year": int, "branch": str, "student_name": str }
    Returns: { "answer": str, "sources": [...] }

The query engine is cached in memory and only re-initialised when the
year/branch combination changes.
"""

import sys
import os
import json
from flask import Flask, request, jsonify, Response
from flask_cors import CORS

from query_engine import setup_query_engine
from config import cfg
from agents.assignment_agent import assignment_agent, parse_faculty_request, AssignType

# Add facedetection imports
sys.path.append(os.path.join(os.path.dirname(__file__), 'facedetection', 'core'))
sys.path.append(os.path.join(os.path.dirname(__file__), 'facedetection', 'test'))
from enroll import enroll_all
from recognize import recognize
from group_attendance import recognize_group_faces, compute_final_attendance, reset_attendance_session, get_attendance_status

# ---------------------------------------------------------------------------
# Branch mapping  (DB names → RAG folder identifiers)
# ---------------------------------------------------------------------------
BRANCH_MAP = {
    "CSDS": "ds",
    "DS": "ds",
    "CSE": "cs",
    "CS": "cs",
    "CSAIML": "aiml",
    "AIML": "aiml",
}

# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------
app = Flask(__name__)
CORS(app)

# Engine cache — avoids reloading the LLM on every request
_cached_engine = None
_cached_key = None          # (year, branch) tuple


def _get_engine(year: int, branch: str):
    """Return a cached engine, or build a new one if params changed."""
    global _cached_engine, _cached_key

    key = (year, branch)
    if _cached_engine is not None and _cached_key == key:
        return _cached_engine

    print(f"[app] Building query engine for year={year}, branch={branch} ...")
    # Enable streaming for the engine
    _cached_engine = setup_query_engine(year=year, branch=branch, streaming=True)
    _cached_key = key
    print("[app] Query engine ready.")
    return _cached_engine


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.route("/api/query", methods=["POST"])
def handle_query():
    """
    Accept a student's question along with their context and return
    the RAG-generated answer with source citations.
    """
    data = request.get_json(force=True)

    query = data.get("query", "").strip()
    year = data.get("year")
    db_branch = data.get("branch", "").strip()
    student_name = data.get("student_name", "Student")

    # --- Validation ---
    if not query:
        return jsonify({"error": "query is required"}), 400

    if year is None:
        return jsonify({"error": "year is required"}), 400

    branch = BRANCH_MAP.get(db_branch.upper())
    if branch is None:
        valid = ", ".join(BRANCH_MAP.keys())
        return jsonify({
            "error": f"Unknown branch '{db_branch}'. Valid branches: {valid}"
        }), 400

    try:
        year = int(year)
    except (TypeError, ValueError):
        return jsonify({"error": "year must be an integer"}), 400

    # --- Run the RAG pipeline ---
    try:
        engine = _get_engine(year, branch)

        def generate():
            try:
                # Send initial "processing started" event immediately so frontend connects
                yield f"data: {json.dumps({'status': 'started', 'message': 'Processing your query...'})}\n\n"
                
                # Fetch RAG streaming response (blocks during retrieval)
                response = engine.query(query)
                
                # 1) Stream the text token by token
                for token in response.response_gen:
                    # We yield each token as an SSE event containing a JSON blob
                    chunk_data = json.dumps({"status": "token", "token": token})
                    yield f"data: {chunk_data}\n\n"

                # 2) Collect and yield the source citations as the final event
                sources = []
                for node in response.source_nodes:
                    sources.append({
                        "document": os.path.basename(
                            node.metadata.get("file_path", "Unknown")
                        ),
                        "page": node.metadata.get("page_label", "?"),
                        "score": round(node.score, 4) if node.score else None,
                    })
                
                final_data = json.dumps({
                    "status": "complete",
                    "sources": sources,
                    "student_name": student_name,
                    "done": True
                })
                yield f"data: {final_data}\n\n"
            except Exception as stream_error:
                print(f"[app] Stream error: {stream_error}")
                error_event = json.dumps({"status": "error", "message": str(stream_error)})
                yield f"data: {error_event}\n\n"

        # Return it as an Event-Stream
        return Response(generate(), mimetype="text/event-stream")

    except Exception as e:
        print(f"[app] Query error: {e}")
        return jsonify({"error": f"RAG pipeline error: {str(e)}"}), 500


@app.route("/api/assignment/generate", methods=["POST"])
def generate_assignment():
    """
    Takes a free-form faculty request, retrieves context, and runs
    the LangGraph Assignment Reflexion Agent via streaming SSE.
    Sends progress updates to keep connection alive and prevent timeouts.
    """
    try:
        data = request.get_json(force=True)
    except Exception as e:
        return jsonify({"error": f"Invalid JSON request: {str(e)}"}), 400

    # Extract required fields
    free_text = data.get("free_text", "").strip() if data.get("free_text") else ""
    year = data.get("year")
    db_branch = data.get("branch", "").strip() if data.get("branch") else ""
    title = data.get("title", "").strip() if data.get("title") else ""

    # Validate all required fields with clear error messages
    missing_fields = []
    
    if not title:
        missing_fields.append("title (assignment title)")
    if not free_text:
        missing_fields.append("free_text (assignment instructions)")
    if year is None or year == "":
        missing_fields.append("year (academic year: 1-4)")
    if not db_branch:
        missing_fields.append("branch (course branch)")

    if missing_fields:
        return jsonify({
            "error": f"Missing required fields: {', '.join(missing_fields)}"
        }), 400

    # Validate year
    try:
        year = int(year)
        if year < 1 or year > 4:
            return jsonify({"error": "Year must be between 1 and 4"}), 400
    except (TypeError, ValueError):
        return jsonify({"error": f"Year must be a valid integer, got: {year}"}), 400

    # Validate branch
    branch = BRANCH_MAP.get(db_branch.upper())
    if branch is None:
        valid = ", ".join(BRANCH_MAP.keys())
        return jsonify({
            "error": f"Invalid branch '{db_branch}'. Valid branches: {valid}"
        }), 400

    print(f"[app] Assignment request: title='{title[:50]}...', year={year}, branch={branch}, instructions_len={len(free_text)}")

    def generate():
        try:
            # Event 1: Started
            yield f"data: {json.dumps({'status': 'started', 'message': 'Initializing assignment generation...'})}\n\n"
            
            # Event 2: Engine setup
            yield f"data: {json.dumps({'status': 'progress', 'step': 'engine_setup', 'message': 'Setting up query engine...'})}\n\n"
            print(f"[app] Initializing engine for year={year}, branch={branch}...")
            engine = _get_engine(year, branch)
            retriever = engine.retriever
            print(f"[app] Retriever ready.")

            # Event 3: Parse request
            yield f"data: {json.dumps({'status': 'progress', 'step': 'parse_request', 'message': 'Parsing your assignment request...'})}\n\n"
            print(f"[app] Parsing request: {free_text}")
            parsed_req = parse_faculty_request(free_text)
            
            # Event 4: Retrieve context
            retrieve_msg = f"Retrieving context for topic: '{parsed_req.topic}'..."
            yield f"data: {json.dumps({'status': 'progress', 'step': 'retrieve_context', 'message': retrieve_msg})}\n\n"
            print(f"[app] Retrieving context for topic: '{parsed_req.topic}' (quantity: {parsed_req.quantity})")
            nodes = retriever.retrieve(parsed_req.topic)
            context = "\n\n".join([n.node.get_content() for n in nodes])
            sources = list(set([os.path.basename(n.node.metadata.get("file_path", "Unknown")) for n in nodes]))
            print(f"[app] Context retrieved: {len(context)} chars from {len(sources)} files.")

            # Event 5: Prepare agent state
            prepare_msg = f"Preparing {parsed_req.assignment_type} assignment generation..."
            yield f"data: {json.dumps({'status': 'progress', 'step': 'prepare_state', 'message': prepare_msg})}\n\n"
            print(f"[app] Preparing agent state for type: {parsed_req.assignment_type}")
            a_type = AssignType.MCQ
            if parsed_req.assignment_type.lower() == "written":
                a_type = AssignType.WRITTEN
            elif parsed_req.assignment_type.lower() == "coding":
                a_type = AssignType.CODING

            initial_state = {
                "faculty_instructions": free_text,
                "retrieved_context": context,
                "extracted_sources": sources,
                "assignment_type": a_type,
                "revision_count": 0,
                "current_draft": {},
                "critique_notes": "",
                "final": ""
            }

            # Event 6: Running agent
            yield f"data: {json.dumps({'status': 'progress', 'step': 'running_agent', 'message': 'Running assignment generation agent (drafting, critiquing, revising...)...'})}\n\n"
            print(f"[app] Running Assignment Agent (type={a_type})...")
            result = assignment_agent.invoke(initial_state)

            # Event 7: Complete - send final result
            assignment_data = result.get("current_draft")
            completion_event = {
                "status": "complete",
                "message": "Assignment generation complete",
                "assignment": assignment_data,
                "sources": sources,
                "metadata": {
                    "topic": parsed_req.topic,
                    "type": parsed_req.assignment_type,
                    "revisions": result.get("revision_count")
                }
            }
            yield f"data: {json.dumps(completion_event)}\n\n"
            print(f"[app] Assignment generated successfully.")

        except Exception as e:
            print(f"[app] Assignment Generation Error: {e}")
            import traceback
            traceback.print_exc()
            error_event = {
                "status": "error",
                "message": f"Assignment generation failed: {str(e)}"
            }
            yield f"data: {json.dumps(error_event)}\n\n"

    return Response(generate(), mimetype="text/event-stream", headers={
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no"
    })


@app.route("/api/health", methods=["GET"])
def health():
    """Simple health-check for the proxy to verify connectivity."""
    return jsonify({"status": "ok"})


# ---------------------------------------------------------------------------
# Face Detection Routes
# ---------------------------------------------------------------------------

@app.route("/api/enroll", methods=["POST"])
def enroll_faces():
    """
    Enroll all student faces from the data/images2 directory into ChromaDB.
    Expects: No body required (uses the fixed DATASET_DIR from enroll.py)
    Returns: { "status": "success", "message": "Students enrolled" }
    """
    try:
        print("[app] Starting face enrollment...")
        enroll_all()
        print("[app] Face enrollment completed successfully")
        return jsonify({
            "status": "success",
            "message": "All students enrolled successfully"
        }), 200
    except Exception as e:
        print(f"[app] Enrollment error: {e}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


@app.route("/api/recognize", methods=["POST"])
def recognize_single_face():
    """
    Recognize a single face in an uploaded image.
    Expects: form-data with 'image' file
    Returns: { "name": str, "confidence": float }
    """
    try:
        if 'image' not in request.files:
            return jsonify({"error": "No image provided"}), 400
        
        image_file = request.files['image']
        if image_file.filename == '':
            return jsonify({"error": "No file selected"}), 400
        
        # Save temporary file
        import tempfile
        temp_dir = tempfile.gettempdir()
        temp_path = os.path.join(temp_dir, image_file.filename)
        image_file.save(temp_path)
        
        try:
            # Recognize the face
            name, confidence = recognize(temp_path)
            os.remove(temp_path)
            
            return jsonify({
                "name": name,
                "confidence": round(float(confidence), 4)
            }), 200
        except Exception as e:
            os.remove(temp_path) if os.path.exists(temp_path) else None
            raise e
            
    except Exception as e:
        print(f"[app] Recognition error: {e}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


@app.route("/api/recognize-group", methods=["POST"])
def recognize_group_faces_api():
    """
    Recognize faces in a group photo for attendance.
    Expects: form-data with 'image' file
    Returns: { "recognized": [...], "face_count": int, "unknown_faces": int, "output_image": str }
    """
    try:
        if 'image' not in request.files:
            return jsonify({"error": "No image provided"}), 400
        
        image_file = request.files['image']
        if image_file.filename == '':
            return jsonify({"error": "No file selected"}), 400
        
        # Save temporary file
        import tempfile
        temp_dir = tempfile.gettempdir()
        temp_path = os.path.join(temp_dir, image_file.filename)
        image_file.save(temp_path)
        
        try:
            # Recognize faces in group
            result = recognize_group_faces(temp_path)
            os.remove(temp_path)
            
            return jsonify(result), 200
        except Exception as e:
            os.remove(temp_path) if os.path.exists(temp_path) else None
            raise e
            
    except Exception as e:
        print(f"[app] Group recognition error: {e}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@app.route("/api/attendance/reset", methods=["POST"])
def reset_attendance():
    """
    Reset attendance counters for a new class session.
    Call this at the start of each class.
    """
    try:
        reset_attendance_session()
        return jsonify({
            "status": "success",
            "message": "Attendance session reset - ready for new class"
        }), 200
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


@app.route("/api/attendance/status", methods=["GET"])
def get_attendance_status_api():
    """
    Get current attendance status during a session.
    Returns current counts without finalizing attendance.
    """
    try:
        status = get_attendance_status()
        return jsonify(status), 200
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


@app.route("/api/attendance/finalize", methods=["POST"])
def finalize_attendance():
    """
    Compute final attendance based on all processed photos.
    Expects: { "min_frames_required": int } (optional, defaults to 70% of total frames)
    Returns: { "present": [...], "absent": [...], "total_frames": int, "min_required": int }
    """
    try:
        data = request.get_json() or {}
        min_frames = data.get("min_frames_required")
        
        result = compute_final_attendance(min_frames)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    port = int(os.environ.get("FLASK_PORT", 5001))  # Changed back to port 5001
    print(f"[app] Starting Academic AI server on port {port} ...")
    app.run(host="0.0.0.0", port=port, debug=True)
