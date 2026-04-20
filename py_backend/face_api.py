"""
face_api.py
============
Separate Flask service for face detection and attendance recognition.

Endpoints
---------
POST /face/reset
    Reset attendance session counters

POST /face/photo
    Process a group photo for attendance

GET /face/status
    Get current attendance status

POST /face/finalize
    Compute final attendance based on processed photos
"""

import os
import sys
import json
from flask import Flask, request, jsonify, Response
from flask_cors import CORS

# Add facedetection imports
sys.path.append(os.path.join(os.path.dirname(__file__), 'facedetection', 'core'))
sys.path.append(os.path.join(os.path.dirname(__file__), 'facedetection', 'test'))
from enroll import enroll_all
from recognize import recognize
from group_attendance import recognize_group_faces, compute_final_attendance, reset_attendance_session, get_attendance_status

# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------
app = Flask(__name__)
CORS(app)

@app.route("/face/reset", methods=["POST"])
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

@app.route("/face/photo", methods=["POST"])
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

        import tempfile
        temp_dir = tempfile.gettempdir()
        temp_path = os.path.join(temp_dir, image_file.filename)
        image_file.save(temp_path)

        try:
            from group_attendance import total_frames_processed
            if total_frames_processed >= 10:
                os.remove(temp_path)
                return jsonify({"error": "Maximum 10 photos allowed per session. Please finalize or reset."}), 400

            result = recognize_group_faces(temp_path)
            os.remove(temp_path)
            return jsonify(result), 200
        except Exception as e:
            os.remove(temp_path) if os.path.exists(temp_path) else None
            raise e

    except Exception as e:
        print(f"[face_api] Group recognition error: {e}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@app.route("/face/status", methods=["GET"])
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

@app.route("/face/finalize", methods=["POST"])
def finalize_attendance():
    """
    Compute final attendance based on all processed photos.
    Expects: { "min_frames_required": int } (optional, defaults to 7)
    Returns: { "present": [...], "absent": [...], "total_frames": int, "min_required": int }
    """
    try:
        data = request.get_json() or {}
        min_frames = data.get("min_frames_required", 7)  # Default to 7
        result = compute_final_attendance(min_frames)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


@app.route("/face/enroll", methods=["POST"])
def enroll_faces():
    """
    Enroll all student faces from the data/images2 directory into ChromaDB.
    Expects: no request body.
    Returns: { "status": "success", "message": "Students enrolled" }
    """
    try:
        enroll_all()
        return jsonify({"status": "success", "message": "All students enrolled successfully"}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/face/recognize", methods=["POST"])
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

        import tempfile
        temp_dir = tempfile.gettempdir()
        temp_path = os.path.join(temp_dir, image_file.filename)
        image_file.save(temp_path)

        try:
            name, confidence = recognize(temp_path)
            os.remove(temp_path)
            return jsonify({"name": name, "confidence": round(float(confidence), 4)}), 200
        except Exception as e:
            os.remove(temp_path) if os.path.exists(temp_path) else None
            raise e

    except Exception as e:
        print(f"[face_api] Single recognition error: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    port = int(os.environ.get("FACE_API_PORT", 8001))
    print(f"[face_api] Starting Face Detection API on port {port} ...")
    app.run(host="0.0.0.0", port=port, debug=True)