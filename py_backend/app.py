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

import os
from flask import Flask, request, jsonify
from flask_cors import CORS

from query_engine import setup_query_engine
from config import cfg

# ---------------------------------------------------------------------------
# Branch mapping  (DB names → RAG folder identifiers)
# ---------------------------------------------------------------------------
BRANCH_MAP = {
    "CSDS": "ds",
    "CSE": "cs",
    "CSAIML": "aiml",
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
    _cached_engine = setup_query_engine(year=year, branch=branch)
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
        response = engine.query(query)

        # Collect source citations
        sources = []
        for node in response.source_nodes:
            sources.append({
                "document": os.path.basename(
                    node.metadata.get("file_path", "Unknown")
                ),
                "page": node.metadata.get("page_label", "?"),
                "score": round(node.score, 4) if node.score else None,
            })

        return jsonify({
            "answer": str(response),
            "sources": sources,
            "student_name": student_name,
        })

    except Exception as e:
        print(f"[app] Query error: {e}")
        return jsonify({"error": f"RAG pipeline error: {str(e)}"}), 500


@app.route("/api/health", methods=["GET"])
def health():
    """Simple health-check for the proxy to verify connectivity."""
    return jsonify({"status": "ok"})


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    port = int(os.environ.get("FLASK_PORT", 5001))
    print(f"[app] Starting Academic AI server on port {port} ...")
    app.run(host="0.0.0.0", port=port, debug=True)
