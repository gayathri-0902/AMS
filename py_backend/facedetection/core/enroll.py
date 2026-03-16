import os
import random
import chromadb
from utils import extract_embedding

# Deterministic sampling
random.seed(42)

DATASET_DIR = "data/images2"
MAX_IMAGES_PER_PERSON = 10

# Persistent Chroma client (modern API)
client = chromadb.PersistentClient(path="./chroma_db")

# Safe reset (prevents duplicate buildup)
try:
    client.delete_collection("faces")
except Exception:
    pass

collection = client.get_or_create_collection(
    name="faces",
    metadata={"hnsw:space": "cosine"}
)


def enroll_all():
    total_people = 0
    total_embeddings = 0

    if not os.path.exists(DATASET_DIR):
        print(f" Dataset directory not found: {DATASET_DIR}")
        return

    for person_name in os.listdir(DATASET_DIR):
        person_path = os.path.join(DATASET_DIR, person_name)

        if not os.path.isdir(person_path):
            continue

        total_people += 1
        print(f"\n🔹 Enrolling: {person_name}")

        # Only image files
        image_files = [
            f for f in os.listdir(person_path)
            if f.lower().endswith((".jpg", ".jpeg", ".png"))
        ]

        if len(image_files) == 0:
            print("   ⚠️ No valid images found")
            continue

        # Random sampling to avoid redundant frames
        if len(image_files) > MAX_IMAGES_PER_PERSON:
            image_files = random.sample(image_files, MAX_IMAGES_PER_PERSON)

        added = 0

        for i, img_name in enumerate(image_files):
            img_path = os.path.join(person_path, img_name)

            emb = extract_embedding(img_path)
            if emb is None:
                continue

            collection.add(
                ids=[f"{person_name}_{i}"],
                embeddings=[emb.tolist()],
                metadatas=[{"name": person_name}]
            )

            added += 1
            total_embeddings += 1

        print(f" Added {added} embeddings")

    print("\nEnrollment complete!")
    print(f"People enrolled: {total_people}")
    print(f"Total embeddings: {total_embeddings}")


if __name__ == "__main__":
    enroll_all()