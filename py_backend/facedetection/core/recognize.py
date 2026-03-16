import chromadb
from utils import extract_embedding

client = chromadb.PersistentClient(path="./chroma_db")
collection = client.get_collection("faces")

def recognize(image_path, threshold=0.6):
    emb = extract_embedding(image_path)
    if emb is None:
        return "No face detected", 0

    results = collection.query(
        query_embeddings=[emb.tolist()],
        n_results=1
    )

    # safety check
    if not results["distances"] or len(results["distances"][0]) == 0:
        return "Unknown", 0

    distance = results["distances"][0][0]
    similarity = 1 - distance

    if similarity >= threshold:
        name = results["metadatas"][0][0]["name"]
        return name, similarity
    else:
        return "Unknown", similarity

if __name__ == "__main__":
    name, score = recognize("data/images2/test1.jpg")
    print(name, score)