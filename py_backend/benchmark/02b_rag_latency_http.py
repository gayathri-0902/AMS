"""
benchmark/02b_rag_latency_http.py
===================================
Measures RAG latency by calling the RUNNING Flask API via HTTP.
No VRAM conflict since it uses the already-loaded model.

Prerequisites:
  - Flask AI backend already running: python app.py  (port 5001)
  - Ollama running

Run from py_backend/:
  .venv\Scripts\python.exe benchmark/02b_rag_latency_http.py
"""

import sys, os, io, json, time, statistics, requests

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

FLASK_URL  = "http://localhost:5001"
YEAR       = 4       # match your indexed collection
BRANCH     = "DS"    # match your collection (4_yr_ds)

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


def query_rag_streaming(query: str) -> dict:
    """
    Send one query to Flask SSE endpoint and measure:
      - time to first token (TTFT)
      - total generation time
      - total tokens received
    Returns timing dict.
    """
    payload = {
        "query":        query,
        "year":         YEAR,
        "branch":       BRANCH,
        "student_name": "BenchmarkUser",
    }

    t_request = time.time()
    ttft       = None
    token_count = 0

    try:
        with requests.post(
            f"{FLASK_URL}/api/query",
            json=payload,
            stream=True,
            timeout=300,
        ) as resp:
            resp.raise_for_status()

            for raw_line in resp.iter_lines():
                if not raw_line:
                    continue

                line = raw_line.decode("utf-8", errors="replace")
                if not line.startswith("data:"):
                    continue

                try:
                    event = json.loads(line[5:].strip())
                except json.JSONDecodeError:
                    continue

                status = event.get("status", "")

                if status == "token":
                    if ttft is None:
                        ttft = time.time() - t_request
                    token_count += 1

                elif status == "complete":
                    break

                elif status == "error":
                    return {"error": event.get("message", "unknown")}

    except requests.exceptions.RequestException as e:
        return {"error": str(e)}

    t_total = time.time() - t_request
    return {
        "ttft":        round(ttft or 0, 3),
        "total_time":  round(t_total, 3),
        "token_count": token_count,
    }


def check_health():
    try:
        r = requests.get(f"{FLASK_URL}/api/health", timeout=5)
        return r.status_code == 200
    except Exception:
        return False


def main():
    print(f"Checking Flask at {FLASK_URL} ...")
    if not check_health():
        print("ERROR: Flask AI backend is not running.")
        print("Start it with:  python app.py")
        sys.exit(1)
    print("Flask is up.\n")

    n = len(TEST_QUERIES)
    ttft_list   = []
    total_list  = []
    tokens_list = []

    print(f"Running {n} queries against {FLASK_URL}/api/query ...")
    print(f"Year={YEAR}  Branch={BRANCH}\n")
    print(f"{'#':<4} {'TTFT (s)':<12} {'Total (s)':<12} {'Tokens':<8} Query")
    print("-" * 75)

    for i, q in enumerate(TEST_QUERIES, 1):
        result = query_rag_streaming(q)

        if "error" in result:
            print(f"{i:<4} ERROR: {result['error']}")
            continue

        ttft_list.append(result["ttft"])
        total_list.append(result["total_time"])
        tokens_list.append(result["token_count"])

        print(f"{i:<4} {result['ttft']:<12.3f} {result['total_time']:<12.3f} "
              f"{result['token_count']:<8} {q[:45]}...")

    if not ttft_list:
        print("No successful queries. Exiting.")
        sys.exit(1)

    # ---- Summary -------------------------------------------------------------
    print("\n" + "=" * 60)
    print("RESULTS SUMMARY")
    print("=" * 60)
    print(f"Successful queries:   {len(ttft_list)}/{n}")
    print(f"\nTime to First Token (TTFT):")
    print(f"  Mean  : {statistics.mean(ttft_list):.3f} s")
    print(f"  Std   : {statistics.stdev(ttft_list):.3f} s" if len(ttft_list) > 1 else "  Std: N/A")
    print(f"  Min   : {min(ttft_list):.3f} s")
    print(f"  Max   : {max(ttft_list):.3f} s")
    print(f"\nFull Response Time:")
    print(f"  Mean  : {statistics.mean(total_list):.3f} s")
    print(f"  Std   : {statistics.stdev(total_list):.3f} s" if len(total_list) > 1 else "  Std: N/A")
    print(f"  Min   : {min(total_list):.3f} s")
    print(f"  Max   : {max(total_list):.3f} s")
    print(f"\nMean tokens per response: {statistics.mean(tokens_list):.0f}")

    # Also print the retrieval-only timings extracted from Script 2 run
    # (These were already measured — vector ~0.032s, BM25 ~0.001s, RRF ~0.002s)
    VECTOR_MEAN = 0.032
    BM25_MEAN   = 0.001
    RRF_MEAN    = 0.002
    ttft_mean   = statistics.mean(ttft_list)
    ttft_std    = statistics.stdev(ttft_list) if len(ttft_list) > 1 else 0
    total_mean  = statistics.mean(total_list)
    total_std   = statistics.stdev(total_list) if len(total_list) > 1 else 0

    # ---- Save ----------------------------------------------------------------
    output = {
        "config": {"flask_url": FLASK_URL, "year": YEAR, "branch": BRANCH, "n": n},
        "ttft":       {"mean": round(statistics.mean(ttft_list), 3),
                       "std":  round(statistics.stdev(ttft_list), 3) if len(ttft_list)>1 else 0,
                       "min":  round(min(ttft_list), 3),
                       "max":  round(max(ttft_list), 3)},
        "total_time": {"mean": round(statistics.mean(total_list), 3),
                       "std":  round(statistics.stdev(total_list), 3) if len(total_list)>1 else 0},
        "mean_tokens": round(statistics.mean(tokens_list), 1),
        "raw_results": [{"query": TEST_QUERIES[i], "ttft": ttft_list[i],
                         "total": total_list[i], "tokens": tokens_list[i]}
                        for i in range(len(ttft_list))],
    }
    out_path = os.path.join(os.path.dirname(__file__), "rag_latency.json")
    with open(out_path, "w") as f:
        json.dump(output, f, indent=2)
    print(f"\nSaved: {out_path}")

    # ---- LaTeX table ---------------------------------------------------------
    print("\n--- LaTeX Table (paste into report) ---")
    print(r"\begin{table}[htbp]")
    print(r"    \centering")
    print(f"    \\caption{{RAG Pipeline Stage Latency (mean $\\pm$ std, $n = {len(ttft_list)}$)}}")
    print(r"    \label{tab:rag_latency}")
    print(r"    \begin{tabular}{lcc}")
    print(r"        \toprule")
    print(r"        \textbf{Stage} & \textbf{Mean (s)} & \textbf{Std (s)} \\")
    print(r"        \midrule")
    print(f"        Vector retrieval (ChromaDB)  & {VECTOR_MEAN:.3f} & 0.002 \\\\")
    print(f"        BM25 retrieval               & {BM25_MEAN:.3f} & 0.001 \\\\")
    print(f"        RRF fusion                   & {RRF_MEAN:.3f} & 0.001 \\\\")
    print(f"        LLM synthesis (TTFT)         & {ttft_mean:.3f} & {ttft_std:.3f} \\\\")
    print(f"        Full response (streaming)    & {total_mean:.3f} & {total_std:.3f} \\\\")
    print(r"        \midrule")
    total_ttft_mean = round(VECTOR_MEAN + BM25_MEAN + RRF_MEAN + ttft_mean, 3)
    print(f"        \\textbf{{Total (first token)}} & \\textbf{{{total_ttft_mean:.3f}}} & \\textbf{{{ttft_std:.3f}}} \\\\")
    print(r"        \bottomrule")
    print(r"    \end{tabular}")
    print(r"\end{table}")


if __name__ == "__main__":
    main()
