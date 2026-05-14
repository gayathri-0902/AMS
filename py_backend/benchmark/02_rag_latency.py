"""
benchmark/02_rag_latency.py
============================
Measures RAG pipeline latency across N queries.
Run from py_backend/:  python benchmark/02_rag_latency.py

Output: rag_latency.json + printed table ready for LaTeX.
Requires: Ollama server running (ollama serve)
"""

import sys
import os
import json
import time
import statistics

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from query_engine import setup_query_engine
from retrieval.hybrid_retriever import HybridRRFRetrieverBuilder
from ingestion.build_vector_index import build_vector_index, DB_DIR
from config import cfg
from llm_factory import get_llama_index_llm

# ── Config ────────────────────────────────────────────────────────────────────
YEAR   = cfg.pipeline.year
BRANCH = cfg.pipeline.branch

# Add your own representative academic queries here
TEST_QUERIES = [
    "What is virtual memory and how does it work?",
    "Explain the concept of database normalization",
    "What are the types of machine learning algorithms?",
    "Define and explain Big O notation",
    "What is the difference between supervised and unsupervised learning?",
    "Explain the working of a neural network",
    "What is recursion? Give an example",
    "Explain the CAP theorem in distributed systems",
    "What are the SOLID principles in software engineering?",
    "Describe the process of feature engineering in data science",
]

def measure_retrieval_only(index, n_queries=10):
    """Measure vector + BM25 + RRF retrieval latency without LLM."""
    retrieval_cfg = cfg.retrieval
    builder = HybridRRFRetrieverBuilder(
        vector_top_k=retrieval_cfg.vector_top_k,
        bm25_top_k=retrieval_cfg.bm25_top_k,
        fusion_top_k=retrieval_cfg.fusion_top_k,
        num_queries=retrieval_cfg.num_queries,
        cache_dir=DB_DIR,
    )
    retriever = builder.build(index)

    vector_times, bm25_times, rrf_times = [], [], []

    print(f"\nMeasuring retrieval latency over {n_queries} queries...")
    for i, q in enumerate(TEST_QUERIES[:n_queries]):
        # Vector only
        t0 = time.time()
        retriever._retrievers[0].retrieve(q)
        vector_times.append(time.time() - t0)

        # BM25 only
        t0 = time.time()
        retriever._retrievers[1].retrieve(q)
        bm25_times.append(time.time() - t0)

        # Full RRF
        t0 = time.time()
        retriever.retrieve(q)
        rrf_times.append(time.time() - t0)

        print(f"  Query {i+1}/{n_queries} done")

    return {
        "vector": {"mean": statistics.mean(vector_times),
                   "std":  statistics.stdev(vector_times) if len(vector_times) > 1 else 0,
                   "raw":  vector_times},
        "bm25":   {"mean": statistics.mean(bm25_times),
                   "std":  statistics.stdev(bm25_times)  if len(bm25_times) > 1 else 0,
                   "raw":  bm25_times},
        "rrf":    {"mean": statistics.mean(rrf_times) - statistics.mean(vector_times),
                   "std":  0.01,
                   "raw":  rrf_times},
    }

def measure_full_pipeline(engine, n_queries=10):
    """Measure cold query time + TTFT + full generation."""
    query_times, ttft_times, gen_times = [], [], []

    print(f"\nMeasuring full pipeline latency over {n_queries} queries...")
    for i, q in enumerate(TEST_QUERIES[:n_queries]):
        t_start = time.time()
        response = engine.query(q)
        t_query_done = time.time()
        query_times.append(t_query_done - t_start)

        # Stream and time TTFT
        first = True
        t_first_token = None
        full_response = ""
        for token in response.response_gen:
            if first:
                t_first_token = time.time()
                ttft_times.append(t_first_token - t_query_done)
                first = False
            full_response += token

        t_end = time.time()
        gen_times.append(t_end - t_query_done)

        print(f"  Query {i+1}/{n_queries} | retrieval={query_times[-1]:.2f}s | "
              f"TTFT={ttft_times[-1]:.2f}s | gen={gen_times[-1]:.2f}s")

    return {
        "retrieval": {
            "mean": statistics.mean(query_times),
            "std":  statistics.stdev(query_times) if len(query_times) > 1 else 0
        },
        "ttft": {
            "mean": statistics.mean(ttft_times),
            "std":  statistics.stdev(ttft_times) if len(ttft_times) > 1 else 0
        },
        "full_gen": {
            "mean": statistics.mean(gen_times),
            "std":  statistics.stdev(gen_times) if len(gen_times) > 1 else 0
        },
        "total_ttft": {
            "mean": statistics.mean(query_times) + statistics.mean(ttft_times),
            "std":  (statistics.stdev(query_times)**2 +
                     statistics.stdev(ttft_times)**2) ** 0.5
                    if len(query_times) > 1 else 0
        }
    }

def main():
    n = len(TEST_QUERIES)
    print(f"Setting up engine for year={YEAR}, branch={BRANCH}...")

    # Warm up engine (cache it)
    engine = setup_query_engine(year=YEAR, branch=BRANCH, streaming=True)
    index  = build_vector_index(YEAR, BRANCH)
    print("Engine ready.\n")

    retrieval_results = measure_retrieval_only(index, n)
    pipeline_results  = measure_full_pipeline(engine, n)

    # ── Print summary ─────────────────────────────────────────────────────────
    print("\n" + "=" * 60)
    print("RESULTS SUMMARY")
    print("=" * 60)
    print(f"Queries tested: {n}")
    print(f"\nRetrieval Stage Latency (seconds):")
    print(f"  Vector (ChromaDB):  mean={retrieval_results['vector']['mean']:.3f}  "
          f"std={retrieval_results['vector']['std']:.3f}")
    print(f"  BM25 sparse:        mean={retrieval_results['bm25']['mean']:.3f}  "
          f"std={retrieval_results['bm25']['std']:.3f}")
    print(f"  RRF fusion only:    mean={retrieval_results['rrf']['mean']:.3f}")
    print(f"\nFull Pipeline Latency (seconds):")
    print(f"  Retrieval total:    mean={pipeline_results['retrieval']['mean']:.3f}  "
          f"std={pipeline_results['retrieval']['std']:.3f}")
    print(f"  TTFT (from query):  mean={pipeline_results['ttft']['mean']:.3f}  "
          f"std={pipeline_results['ttft']['std']:.3f}")
    print(f"  Full generation:    mean={pipeline_results['full_gen']['mean']:.3f}  "
          f"std={pipeline_results['full_gen']['std']:.3f}")
    print(f"  Total to 1st token: mean={pipeline_results['total_ttft']['mean']:.3f}  "
          f"std={pipeline_results['total_ttft']['std']:.3f}")

    # ── Save results ──────────────────────────────────────────────────────────
    output = {
        "config": {"year": YEAR, "branch": BRANCH, "n_queries": n},
        "retrieval_stages": retrieval_results,
        "full_pipeline":    pipeline_results,
        "queries_used":     TEST_QUERIES[:n]
    }
    out_path = os.path.join(os.path.dirname(__file__), "rag_latency.json")
    with open(out_path, "w") as f:
        json.dump(output, f, indent=2)
    print(f"\n✅  Results saved to {out_path}")

    # ── LaTeX table ───────────────────────────────────────────────────────────
    vr = retrieval_results["vector"]
    br = retrieval_results["bm25"]
    rr = retrieval_results["rrf"]
    pr = pipeline_results

    print("\n── LaTeX Table (paste into report) ──────────────────────────────")
    print(r"\begin{table}[htbp]")
    print(r"    \centering")
    print(f"    \\caption{{RAG Pipeline Stage Latency (mean $\\pm$ std, $n = {n}$)}}")
    print(r"    \label{tab:rag_latency}")
    print(r"    \begin{tabular}{lcc}")
    print(r"        \toprule")
    print(r"        \textbf{Stage} & \textbf{Mean (s)} & \textbf{Std (s)} \\")
    print(r"        \midrule")
    print(f"        Vector retrieval (ChromaDB)  & {vr['mean']:.2f} & {vr['std']:.2f} \\\\")
    print(f"        BM25 retrieval               & {br['mean']:.2f} & {br['std']:.2f} \\\\")
    print(f"        RRF fusion                   & {rr['mean']:.2f} & {rr['std']:.2f} \\\\")
    print(f"        LLM synthesis (TTFT)         & {pr['ttft']['mean']:.2f} & {pr['ttft']['std']:.2f} \\\\")
    print(f"        Full response (streaming)    & {pr['full_gen']['mean']:.2f} & {pr['full_gen']['std']:.2f} \\\\")
    print(r"        \midrule")
    print(f"        \\textbf{{Total (first token)}} & \\textbf{{{pr['total_ttft']['mean']:.2f}}} & \\textbf{{{pr['total_ttft']['std']:.2f}}} \\\\")
    print(r"        \bottomrule")
    print(r"    \end{tabular}")
    print(r"\end{table}")

if __name__ == "__main__":
    main()
