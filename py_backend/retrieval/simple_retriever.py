"""
retrieval/simple_retriever.py
==============================
A lightweight, dependency-minimal retriever for the Assignment Agent.
Uses ChromaDB + the local BGE embedding model directly (no LlamaIndex overhead).
Returns the top-K most relevant text chunks as a single plain-text string.
"""
import os
import yaml
import chromadb
from chromadb.utils import embedding_functions


# ── Load config ──────────────────────────────────────────────────────────────
_CFG_PATH = os.path.join(os.path.dirname(__file__), "..", "config.yaml")
with open(_CFG_PATH, "r") as f:
    _cfg = yaml.safe_load(f)

_BASE_DIR       = _cfg["paths"]["base_dir"]
_DB_DIR         = os.path.join(_BASE_DIR, _cfg["paths"]["db_dir"])
_EMBEDDING_DIR  = os.path.join(_BASE_DIR, _cfg["paths"]["embedding_model"])

# ── Singleton ChromaDB client ─────────────────────────────────────────────────
_chroma_client: chromadb.PersistentClient | None = None

def _get_client() -> chromadb.PersistentClient:
    global _chroma_client
    if _chroma_client is None:
        _chroma_client = chromadb.PersistentClient(path=_DB_DIR)
    return _chroma_client


# ── Embedding function (same BGE-M3 model as the main RAG pipeline) ───────────
_embed_fn = embedding_functions.SentenceTransformerEmbeddingFunction(
    model_name=_EMBEDDING_DIR
)


def get_assignment_context(
    year: int,
    branch: str,
    topic: str,
    top_k: int = 8
) -> str:
    """
    Retrieves the top-K most relevant document chunks from ChromaDB for a
    given topic, year, and branch.

    Args:
        year:   Academic year (e.g., 3)
        branch: Branch code (e.g., "cs", "ds")
        topic:  The topic/subject the faculty wants questions about.
        top_k:  Number of chunks to retrieve. Defaults to 8.

    Returns:
        A single string of all retrieved chunks joined by newlines.
        Returns a fallback message if the collection doesn't exist.
    """
    collection_name = f"{year}_yr_{branch.lower()}"
    client = _get_client()

    # Check if collection exists
    existing = [c.name for c in client.list_collections()]
    if collection_name not in existing:
        return f"[No documents found for Year {year}, Branch '{branch}'. Please ensure the index has been built.]"

    collection = client.get_collection(
        name=collection_name,
        embedding_function=_embed_fn
    )

    results = collection.query(
        query_texts=[topic],
        n_results=min(top_k, collection.count()),
        include=["documents"]
    )

    # Flatten and join the retrieved chunks into a single context string
    chunks = results["documents"][0]  # list of strings for the first (only) query
    return "\n\n---\n\n".join(chunks)
