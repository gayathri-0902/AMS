import os
import sys
import cv2
from collections import defaultdict
import chromadb

# Import InsightFace model from utils (avoid naming conflict with Flask app)
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'core'))
from utils import app as insight_face_model

# Get absolute paths relative to this file's location
FACEDETECTION_DIR = os.path.dirname(os.path.dirname(__file__))
CHROMA_DB_PATH = os.path.join(FACEDETECTION_DIR, 'chroma_db')
GROUP_PHOTOS_DIR = os.path.join(FACEDETECTION_DIR, 'data', 'group_photos')

# Connect to vector database
try:
    client = chromadb.PersistentClient(path=CHROMA_DB_PATH)
    collection = client.get_collection("faces")
    print(f"Connected to ChromaDB at {CHROMA_DB_PATH}")
except Exception as e:
    print(f"Warning: Could not load ChromaDB: {e}")
    collection = None

# Recognition threshold
SIMILARITY_THRESHOLD = 0.35

# Global attendance tracking for multi-photo sessions
attendance_counter = defaultdict(int)
total_frames_processed = 0


def recognize_embedding(embedding):
    """Recognize a face embedding and return the student name."""
    if collection is None:
        return None
   
    results = collection.query(
        query_embeddings=[embedding.tolist()],
        n_results=1
    )

    if not results["distances"] or len(results["distances"][0]) == 0:
        return None

    distance = results["distances"][0][0]
    similarity = 1 - distance

    if similarity >= SIMILARITY_THRESHOLD:
        return results["metadatas"][0][0]["name"]
    else:
        return None


def process_group_image(image_path, return_list=True, save_output=True):
    """
    Detect and recognize all faces in a group photo.
    Updates global attendance_counter for each recognized student.
    
    Args:
        image_path: Path to the group image
        return_list: If True, returns list of recognized names; if False, just processes
        save_output: If True, saves annotated image to group_photos directory
        
    Returns:
        List of recognized student names (if return_list=True)
    """
    global total_frames_processed, attendance_counter
    
    total_frames_processed += 1

    img = cv2.imread(image_path)

    if img is None:
        print(f"Could not read {image_path}")
        return [] if return_list else None

    faces = insight_face_model.get(img)
    
    if len(faces) == 0:
        print(f"No faces detected in {image_path}")
        return [] if return_list else None

    seen_in_frame = set()
    recognized_names = []

    for face in faces:
        bbox = face.bbox.astype(int)
        x1, y1, x2, y2 = bbox

        face_width = x2 - x1
        face_height = y2 - y1

        # Skip small faces
        if min(face_width, face_height) < 40:
            continue

        embedding = face.embedding
        name = recognize_embedding(embedding)

        # Only count if recognized and not already seen in this frame
        if name and name not in seen_in_frame:
            attendance_counter[name] += 1  # Increment attendance count
            seen_in_frame.add(name)
            recognized_names.append(name)

            # Draw bounding box and label if saving output
            if save_output:
                cv2.rectangle(img, (x1, y1), (x2, y2), (0, 255, 0), 2)
                cv2.putText(
                    img,
                    name,
                    (x1, y1 - 10),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.6,
                    (0, 255, 0),
                    2
                )

    # Save processed image if requested
    if save_output:
        os.makedirs(GROUP_PHOTOS_DIR, exist_ok=True)
        output_path = os.path.join(GROUP_PHOTOS_DIR, f"output_{os.path.basename(image_path)}")
        cv2.imwrite(output_path, img)
        print(f"Saved annotated image to {output_path}")
    
    print(f"Frame {total_frames_processed}: Recognized students: {recognized_names}")
    
    return recognized_names if return_list else None


def recognize_group_faces(image_path):
    """
    API-friendly function to recognize faces in a group photo.
    
    Args:
        image_path: Path to the group image
        
    Returns:
        dict: {
            "recognized": ["student1", "student2", ...],
            "face_count": int,
            "unknown_faces": int,
            "output_image": str (path to annotated image)
        }
    """
    img = cv2.imread(image_path)

    if img is None:
        return {
            "error": f"Could not read image: {image_path}",
            "recognized": [],
            "face_count": 0,
            "unknown_faces": 0
        }

    faces = insight_face_model.get(img)
    face_count = len(faces)
    
    if face_count == 0:
        return {
            "recognized": [],
            "face_count": 0,
            "unknown_faces": 0,
            "message": "No faces detected"
        }

    seen_in_frame = set()
    recognized_names = []
    unknown_count = 0

    for face in faces:
        bbox = face.bbox.astype(int)
        x1, y1, x2, y2 = bbox

        face_width = x2 - x1
        face_height = y2 - y1

        # Skip small faces
        if min(face_width, face_height) < 40:
            continue

        embedding = face.embedding
        name = recognize_embedding(embedding)

        if name and name not in seen_in_frame:
            seen_in_frame.add(name)
            recognized_names.append(name)
            
            # Draw bounding box and label
            cv2.rectangle(img, (x1, y1), (x2, y2), (0, 255, 0), 2)
            cv2.putText(
                img,
                name,
                (x1, y1 - 10),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.6,
                (0, 255, 0),
                2
            )
        else:
            unknown_count += 1
            # Draw red box for unknown faces
            cv2.rectangle(img, (x1, y1), (x2, y2), (0, 0, 255), 2)

    # Save processed image
    os.makedirs(GROUP_PHOTOS_DIR, exist_ok=True)
    output_filename = f"output_{os.path.basename(image_path)}"
    output_path = os.path.join(GROUP_PHOTOS_DIR, output_filename)
    cv2.imwrite(output_path, img)

    return {
        "recognized": recognized_names,
        "face_count": face_count,
        "unknown_faces": unknown_count,
        "output_image": output_path,
        "message": f"Recognized {len(recognized_names)} students, {unknown_count} unknown faces"
    }


def compute_final_attendance(min_frames_required=None):
    """
    Compute final attendance based on attendance_counter.
    
    Args:
        min_frames_required: Minimum frames a student must appear in to be marked present.
                           If None, uses 70% of total_frames_processed.
    
    Returns:
        dict: {
            "present": ["student1", "student2", ...],
            "absent": ["student3", ...],
            "total_frames": int,
            "min_required": int
        }
    """
    if min_frames_required is None:
        # Default: 70% of total frames
        min_frames_required = max(1, int(total_frames_processed * 0.7))
    
    present_students = []
    absent_students = []
    
    # Get all students who appeared at least once
    all_students = list(attendance_counter.keys())
    
    for student in all_students:
        count = attendance_counter[student]
        if count >= min_frames_required:
            present_students.append(student)
        else:
            absent_students.append({
                "name": student,
                "frames_present": count,
                "frames_required": min_frames_required
            })
    
    return {
        "present": present_students,
        "absent": absent_students,
        "total_frames": total_frames_processed,
        "min_required": min_frames_required,
        "attendance_summary": f"{len(present_students)} present, {len(absent_students)} absent (min {min_frames_required}/{total_frames_processed} frames)"
    }


def reset_attendance_session():
    """
    Reset attendance counters for a new session.
    Call this before starting a new class session.
    """
    global attendance_counter, total_frames_processed
    attendance_counter.clear()
    total_frames_processed = 0
    print("Attendance session reset - ready for new class")


def get_attendance_status():
    """
    Get current attendance status without computing final results.
    
    Returns:
        dict: Current attendance counts for all students
    """
    return {
        "current_counts": dict(attendance_counter),
        "total_frames": total_frames_processed,
        "students_tracked": len(attendance_counter)
    }
    """
    Process all group photos from a session
    """
    images = [
        f for f in os.listdir(folder_path)
        if f.lower().endswith((".jpg", ".jpeg", ".png"))
    ]

    for img_name in images:
        img_path = os.path.join(folder_path, img_name)
        print(f"Processing {img_name}")
        process_group_image(img_path, return_list=False)


def compute_attendance():
    """
    Final attendance decision based on frames where student was detected.
    Returns dictionary of {student: "Present"/"Absent"}
    """
    if total_frames == 0:
        return {}

    attendance = {}

    for student, count in attendance_counter.items():
        ratio = count / total_frames

        if ratio >= 0.6:
            attendance[student] = "Present"
        else:
            attendance[student] = "Absent"

    return attendance


def reset_attendance():
    """Reset the attendance counter for a new session."""
    global attendance_counter, total_frames
    attendance_counter = defaultdict(int)
    total_frames = 0


if __name__ == "__main__":

    test_image = os.path.join(GROUP_PHOTOS_DIR, "group1.jpeg")
    
    if os.path.exists(test_image):
        recognized = process_group_image(test_image)
        print(f"\nRecognized students: {recognized}\n")
        
        attendance = compute_attendance()
        print("\nFinal Attendance:\n")
        for student, status in attendance.items():
            print(f"{student}: {status}")
    else:
        print(f"Test image not found: {test_image}")

    #     embedding = face.embedding
    #     name = recognize_embedding(embedding)

    #     if name:
    #         print(f"Recognized: {name}\n")
    #     else:
    #         print("Recognized: Unknown\n")