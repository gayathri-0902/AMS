import os
import cv2
from collections import defaultdict
import chromadb
from utils import app  # reuse the initialized InsightFace model

# Connect to vector database
client = chromadb.PersistentClient(path="./chroma_db")
collection = client.get_collection("faces")

# Attendance counter
attendance_counter = defaultdict(int)

# Track number of frames processed
total_frames = 0

# Recognition threshold
SIMILARITY_THRESHOLD = 0.35


def recognize_embedding(embedding):
   
    results = collection.query(
        query_embeddings=[embedding.tolist()],
        n_results=1
    )

    if not results["distances"] or len(results["distances"][0]) == 0:
        return None

    distance = results["distances"][0][0]
    similarity = 1 - distance

    print(f"Similarity: {similarity:.3f}")

    if similarity >= SIMILARITY_THRESHOLD:
        return results["metadatas"][0][0]["name"]
    else:
        return None


# def process_group_image(image_path):
#     """
#     Detect and recognize all faces in a group photo
#     """

#     global total_frames
#     total_frames += 1

#     img = cv2.imread(image_path)

#     if img is None:
#         print(f"Could not read {image_path}")
#         return

#     faces = app.get(img)

#     # Avoid double counting same person in one frame
#     seen_in_frame = set()

#     for face in faces:
#         bbox = face.bbox
#         face_width = bbox[2] - bbox[0]
#         face_height = bbox[3] - bbox[1]

#         if min(face_width, face_height) < 80:
#             continue

#         embedding = face.embedding
#         name = recognize_embedding(embedding)

#         if name and name not in seen_in_frame:
#             attendance_counter[name] += 1
#             seen_in_frame.add(name)

def process_group_image(image_path):

    global total_frames
    total_frames += 1

    img = cv2.imread(image_path)

    if img is None:
        print(f"Could not read {image_path}")
        return

    faces = app.get(img)

    seen_in_frame = set()

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

        # ✅ Only draw box if recognized
        if name and name not in seen_in_frame:

            attendance_counter[name] += 1
            seen_in_frame.add(name)

            # Draw bounding box (green)
            cv2.rectangle(img, (x1, y1), (x2, y2), (0, 255, 0), 2)

            # Put name label
            cv2.putText(
                img,
                name,
                (x1, y1 - 10),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.6,
                (0, 255, 0),
                2
            )

    # Save processed image
    output_path = f"group_photos/output_{os.path.basename(image_path)}"
    cv2.imwrite(output_path, img)

    print(f"Saved annotated image to {output_path}")

def process_group_folder(folder_path):
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
        process_group_image(img_path)


def compute_attendance():
    """
    Final attendance decision
    """

    attendance = {}

    for student, count in attendance_counter.items():

        ratio = count / total_frames

        if ratio >= 0.6:
            attendance[student] = "Present"
        else:
            attendance[student] = "Absent"

    return attendance


# if __name__ == "__main__":

#     GROUP_IMAGES_FOLDER = "group_photos"

#     process_group_folder(GROUP_IMAGES_FOLDER)

#     attendance = compute_attendance()

#     print("\nFinal Attendance\n")

#     for student, status in attendance.items():
#         print(f"{student} : {status}")

if __name__ == "__main__":

    test_image = "group_photos/group1.jpeg"
    process_group_image(test_image)

    # img = cv2.imread(test_image)
    # faces = app.get(img)

    # print(f"\nDetected {len(faces)} faces\n")

    # for face in faces:

    #     bbox = face.bbox
    #     face_width = bbox[2] - bbox[0]
    #     face_height = bbox[3] - bbox[1]

    #     print(f"Face size: {face_width:.1f} x {face_height:.1f}")

    #     if min(face_width, face_height) < 40:
    #         print("Skipped (too small)\n")
    #         continue

    #     embedding = face.embedding
    #     name = recognize_embedding(embedding)

    #     if name:
    #         print(f"Recognized: {name}\n")
    #     else:
    #         print("Recognized: Unknown\n")