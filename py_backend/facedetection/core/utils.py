import cv2
import numpy as np
from insightface.app import FaceAnalysis

# Initialize once
app = FaceAnalysis(name="buffalo_l")
app.prepare(ctx_id=0)

def extract_embedding(image_path: str, debug: bool = False):

    img = cv2.imread(image_path)

    if img is None:
        print(f"⚠️ Could not read image: {image_path}")
        return None

    faces = app.get(img)

    if len(faces) == 0:
        return None

    # Select largest face
    face = max(faces, key=lambda x: x.bbox[2] - x.bbox[0])

    if debug:
        debug_img = img.copy()

        for f in faces:
            bbox = f.bbox.astype(int)
            x1, y1, x2, y2 = bbox

            # Default color = red (all detected faces)
            color = (0, 0, 255)

            # If this is selected face → green
            if f is face:
                color = (0, 255, 0)

            cv2.rectangle(debug_img, (x1, y1), (x2, y2), color, 2)

        debug_output = "debug_detection.jpg"
        cv2.imwrite(debug_output, debug_img)
        print(f"Saved debug image to {debug_output}")

    embedding = face.embedding

    # Normalize embedding
    embedding = embedding / np.linalg.norm(embedding)

    return embedding
    
extract_embedding("data/images2/tarun/frame_000177.jpg", debug=True)