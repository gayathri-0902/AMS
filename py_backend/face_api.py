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
        
        # Check if maximum 10 photos already processed
        from group_attendance import total_frames_processed
        if total_frames_processed >= 10:
            return jsonify({"error": "Maximum 10 photos allowed per session. Please finalize or reset."}), 400
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
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    port = int(os.environ.get("FACE_API_PORT", 8001))
    print(f"[face_api] Starting Face Detection API on port {port} ...")
    app.run(host="0.0.0.0", port=port, debug=True)