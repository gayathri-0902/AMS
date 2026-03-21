import sys
import os
import time

# Make sure py_backend modules are on the path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ingestion.build_vector_index import build_vector_index
from retrieval.simple_retriever import SimpleRetieverBuilder
from retrieval.hybrid_retriever import HybridRRFRetrieverBuilder
from llama_index.core import Settings
from config import cfg

def main():
    YEAR = 4
    BRANCH = "ds"
    QUERY = "What is Data Analytics?"

    print(f"Loading Index for Year {YEAR} {BRANCH.upper()}...")
    index = build_vector_index(year=YEAR, branch=BRANCH)
    Settings.embed_model = index._embed_model

    from query_engine import _build_llm
    print("Loading Local LLM for Hybrid Retriever Fusion...")
    Settings.llm = _build_llm("ollama").get_llm()

    print("\n--- Building Retrievers ---")
    simple_retriever = SimpleRetieverBuilder(vector_top_k=5).build(index)
    
    hybrid_retriever = HybridRRFRetrieverBuilder(
        vector_top_k=5, 
        bm25_top_k=5, 
        fusion_top_k=5,
        num_queries=3, 
        cache_dir=cfg.paths.db_dir
    ).build(index)

    print(f"\nQUERY: '{QUERY}'\n")

    # ----- Simple Retriever -----
    print("="*60)
    print(">> SIMPLE RETRIEVER RESULTS")
    print("="*60)
    t0 = time.time()
    simple_nodes = simple_retriever.retrieve(QUERY)
    t1 = time.time()
    
    print(f"Retrieved {len(simple_nodes)} nodes in {t1-t0:.2f}s\n")
    for i, node in enumerate(simple_nodes):
        source = node.metadata.get('file_name', node.metadata.get('source', 'Unknown'))
        score = node.score if hasattr(node, "score") and node.score is not None else "N/A"
        try:
            score_str = f"{score:.4f}" if isinstance(score, float) else str(score)
        except:
            score_str = str(score)
        print(f"[{i+1}] Source: {source} | Score: {score_str}")
        print(f"    Excerpt: {node.text[:200].replace(chr(10), ' ')}...\n")

    # ----- Hybrid Retriever -----
    print("="*60)
    print(">> HYBRID RRF RETRIEVER RESULTS")
    print("="*60)
    t0 = time.time()
    hybrid_nodes = hybrid_retriever.retrieve(QUERY)
    t1 = time.time()

    print(f"Retrieved {len(hybrid_nodes)} nodes in {t1-t0:.2f}s\n")
    for i, node in enumerate(hybrid_nodes):
        source = node.metadata.get('file_name', node.metadata.get('source', 'Unknown'))
        score = node.score if hasattr(node, "score") and node.score is not None else "N/A"
        try:
            score_str = f"{score:.4f}" if isinstance(score, float) else str(score)
        except:
            score_str = str(score)
        print(f"[{i+1}] Source: {source} | Score: {score_str}")
        print(f"    Excerpt: {node.text[:200].replace(chr(10), ' ')}...\n")

if __name__ == "__main__":
    main()
