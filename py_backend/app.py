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
import time
from flask import Flask, request, jsonify, Response
from flask_cors import CORS

from query_engine import setup_query_engine
from faculty_engine import setup_faculty_engine
from config import cfg
from agents.assignment_agent import assignment_agent, parse_faculty_request, AssignType

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

# Engine caches — store multiple engines to prevent eviction when context switches
_student_engines = {}  # key: (year, branch)
_faculty_engines = {}  # key: tuple of sorted subject_codes

def _get_engine(
    year: int | None = None,
    branch: str | None = None,
    subject_code: str | list[str] | None = None
):
    """Return a cached engine, or build a new one if it doesn't exist yet."""
    global _student_engines, _faculty_engines

    if subject_code:
        # --- Faculty pipeline ---
        codes = subject_code if isinstance(subject_code, list) else [subject_code]
        key = tuple(sorted(codes))
        if key in _faculty_engines:
            return _faculty_engines[key]
            
        print(f"[app] Building faculty query engine for subjects={codes} ...")
        _faculty_engines[key] = setup_faculty_engine(subject_codes=codes, streaming=True)
        print("[app] Query engine ready.")
        return _faculty_engines[key]
    else:
        # --- Student pipeline ---
        key = (year, branch)
        if key in _student_engines:
            return _student_engines[key]
            
        print(f"[app] Building query engine for year={year}, branch={branch} ...")
        _student_engines[key] = setup_query_engine(year=year, branch=branch, streaming=True)
        print("[app] Query engine ready.")
        return _student_engines[key]



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
                t_start = time.time()
                response = engine.query(query)
                t_query_done = time.time()
                print(f"[TIMING] engine.query() blocking took {t_query_done - t_start:.4f} seconds (Retrieval + Setup)")
                
                # 1) Stream the text token by token
                first_token = True
                for token in response.response_gen:
                    if first_token:
                        print(f"[TIMING] Time to First Token (TTFT) took {time.time() - t_query_done:.4f} seconds")
                        first_token = False
                    # We yield each token as an SSE event containing a JSON blob
                    chunk_data = json.dumps({"status": "token", "token": token})
                    yield f"data: {chunk_data}\n\n"
                
                print(f"[TIMING] Model total generation time: {time.time() - t_query_done:.4f} seconds")

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


@app.route("/api/faculty/query", methods=["POST"])
def handle_faculty_query():
    """
    Accept a faculty member's question along with a subject code and
    return the subject-specific RAG answer.
    """
    data = request.get_json(force=True)

    query = data.get("query", "").strip()
    subject_codes_raw = data.get("subject_codes") or data.get("subject_code", "")
    
    if isinstance(subject_codes_raw, str):
        subject_codes = [s.strip() for s in subject_codes_raw.split(",") if s.strip()]
    elif isinstance(subject_codes_raw, list):
        subject_codes = subject_codes_raw
    else:
        subject_codes = []

    if not query:
        return jsonify({"error": "query is required"}), 400
    if not subject_codes:
        return jsonify({"error": "subject_code(s) is required"}), 400

    try:
        engine = _get_engine(subject_code=subject_codes)

        def generate():
            try:
                yield f"data: {json.dumps({'status': 'started', 'message': f'Searching {subject_codes} materials...'})}\n\n"
                t_start = time.time()
                response = engine.query(query)
                t_query_done = time.time()
                print(f"[TIMING] Faculty engine.query() blocking took {t_query_done - t_start:.4f} seconds (Retrieval + Setup)")
                
                first_token = True
                for token in response.response_gen:
                    if first_token:
                        print(f"[TIMING] Faculty Time to First Token (TTFT) took {time.time() - t_query_done:.4f} seconds")
                        first_token = False
                    chunk_data = json.dumps({"status": "token", "token": token})
                    yield f"data: {chunk_data}\n\n"
                
                print(f"[TIMING] Faculty Model total generation time: {time.time() - t_query_done:.4f} seconds")

                sources = []
                for node in response.source_nodes:
                    sources.append({
                        "document": os.path.basename(node.metadata.get("file_path", "Unknown")),
                        "page": node.metadata.get("page_label", "?"),
                        "score": round(node.score, 4) if node.score else None,
                    })
                
                final_data = json.dumps({
                    "status": "complete",
                    "sources": sources,
                    "subject_codes": subject_codes,
                    "done": True
                })
                yield f"data: {final_data}\n\n"
            except Exception as stream_error:
                print(f"[app] Faculty Stream error: {stream_error}")
                error_event = json.dumps({"status": "error", "message": str(stream_error)})
                yield f"data: {error_event}\n\n"

        return Response(generate(), mimetype="text/event-stream")

    except Exception as e:
        print(f"[app] Faculty Query error: {e}")
        return jsonify({"error": f"Faculty RAG pipeline error: {str(e)}"}), 500


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
# Entry point
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    port = int(os.environ.get("FLASK_PORT", 5001))  # Changed back to port 5001
    print(f"[app] Starting Academic AI server on port {port} ...")
    app.run(host="0.0.0.0", port=port, debug=True)
