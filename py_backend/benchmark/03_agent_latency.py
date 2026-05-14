"""
benchmark/03_agent_latency.py
==============================
Measures assignment generation agent latency and revision counts.
Run from py_backend/:  .venv\Scripts\python.exe benchmark/03_agent_latency.py
"""

import sys, os, json, time, statistics, io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from query_engine import setup_query_engine
from agents.assignment_agent import assignment_agent, parse_faculty_request, AssignType
from config import cfg

# ---- Test requests -----------------------------------------------------------
MCQ_REQUESTS = [
    "Generate 5 MCQs on Binary Search Trees focusing on insertion and deletion",
    "Create 5 MCQs about supervised learning algorithms",
    "Generate 5 MCQs on database normalization up to 3NF",
]

WRITTEN_REQUESTS = [
    "Create 4 written questions on the OSI model and its layers",
    "Generate 4 written questions on recursion and dynamic programming",
    "Create 4 written questions on clustering algorithms",
]

CODING_REQUESTS = [
    "Generate 3 coding questions on sorting algorithms",
    "Create 3 coding problems on linked list operations",
    "Generate 3 coding questions on graph traversal",
]

YEAR   = cfg.pipeline.year
BRANCH = cfg.pipeline.branch

TYPE_MAP = {
    "mcq":     AssignType.MCQ,
    "written": AssignType.WRITTEN,
    "coding":  AssignType.CODING,
}


def run_generation(engine, free_text: str, assign_type_str: str):
    """Run one full generation cycle and return timing + revision count."""
    retriever = engine.retriever
    t_start   = time.time()

    parsed     = parse_faculty_request(free_text)
    t_parse    = time.time()

    nodes   = retriever.retrieve(parsed.topic)
    context = "\n\n".join([n.node.get_content() for n in nodes])
    sources = list(set([
        os.path.basename(n.node.metadata.get("file_path", "Unknown"))
        for n in nodes
    ]))
    t_retrieve = time.time()

    a_type = TYPE_MAP.get(assign_type_str.lower(), AssignType.MCQ)
    initial_state = {
        "faculty_instructions": free_text,
        "retrieved_context":    context,
        "extracted_sources":    sources,
        "assignment_type":      a_type,
        "revision_count":       0,
        "current_draft":        {},
        "critique_notes":       "",
        "final":                "",
    }

    result = assignment_agent.invoke(initial_state)
    t_end  = time.time()

    revisions    = result.get("revision_count", 1)
    overall_pass = True
    if result.get("critique_notes"):
        try:
            fb = json.loads(result["critique_notes"])
            overall_pass = fb.get("overall_pass", True)
        except Exception:
            pass

    return {
        "parse_time":    round(t_parse    - t_start,   3),
        "retrieve_time": round(t_retrieve - t_parse,   3),
        "agent_time":    round(t_end      - t_retrieve, 3),
        "total_time":    round(t_end      - t_start,   3),
        "revisions":     revisions,
        "passed":        overall_pass,
        "topic":         parsed.topic,
        "type":          assign_type_str,
    }


def run_batch(engine, requests, type_str):
    results = []
    for i, req in enumerate(requests):
        print(f"  [{type_str.upper()}] {i+1}/{len(requests)}: {req[:60]}...")
        try:
            r = run_generation(engine, req, type_str)
            results.append(r)
            print(f"    total={r['total_time']:.1f}s  revisions={r['revisions']}  passed={r['passed']}")
        except Exception as e:
            print(f"    ERROR: {e}")
    return results


def main():
    print(f"Setting up engine for year={YEAR}, branch={BRANCH}...")
    engine = setup_query_engine(year=YEAR, branch=BRANCH, streaming=False)
    print("Engine ready.\n")

    all_results = {}

    print("--- MCQ Assignments ---")
    all_results["MCQ"] = run_batch(engine, MCQ_REQUESTS, "mcq")

    print("\n--- Written Assignments ---")
    all_results["Written"] = run_batch(engine, WRITTEN_REQUESTS, "written")

    print("\n--- Coding Assignments ---")
    all_results["Coding"] = run_batch(engine, CODING_REQUESTS, "coding")

    # ---- Aggregate -----------------------------------------------------------
    print("\n" + "=" * 60)
    print("AGGREGATED RESULTS")
    print("=" * 60)

    summary = {}
    for fmt, results in all_results.items():
        if not results:
            continue
        totals    = [r["total_time"] for r in results]
        revisions = [r["revisions"]  for r in results]
        passed    = sum(1 for r in results if r["passed"])
        pass_pct  = round(100 * passed / len(results), 1)

        summary[fmt] = {
            "n":              len(results),
            "mean_total":     round(statistics.mean(totals), 1),
            "min_total":      round(min(totals), 1),
            "max_total":      round(max(totals), 1),
            "mean_revisions": round(statistics.mean(revisions), 1),
            "pass_rate_pct":  pass_pct,
        }

        print(f"\n{fmt}:")
        print(f"  Requests:       {len(results)}")
        print(f"  Mean time:      {summary[fmt]['mean_total']:.1f}s "
              f"(range {summary[fmt]['min_total']}--{summary[fmt]['max_total']}s)")
        print(f"  Mean revisions: {summary[fmt]['mean_revisions']:.1f}")
        print(f"  Pass rate:      {pass_pct}%")

    # ---- Save ----------------------------------------------------------------
    output = {"summary": summary, "raw": {k: v for k, v in all_results.items()}}
    out_path = os.path.join(os.path.dirname(__file__), "agent_latency.json")
    with open(out_path, "w") as f:
        json.dump(output, f, indent=2)
    print(f"\nSaved: {out_path}")

    # ---- LaTeX Table 1: Quality ---------------------------------------------
    n_total = sum(s["n"] for s in summary.values())
    print("\n--- LaTeX Table 1: Quality ---")
    print(r"\begin{table}[htbp]")
    print(r"    \centering")
    print(f"    \\caption{{Assignment Generation Quality ($n = {n_total}$ requests)}}")
    print(r"    \label{tab:agent_quality}")
    print(r"    \begin{tabular}{lccc}")
    print(r"        \toprule")
    print(r"        \textbf{Format} & \textbf{Requests} & \textbf{Pass Rate (\%)} & \textbf{Mean Revisions} \\")
    print(r"        \midrule")
    for fmt, s in summary.items():
        print(f"        {fmt:<10} & {s['n']:>2} & {s['pass_rate_pct']:>5.1f} & {s['mean_revisions']:.1f} \\\\")
    overall_pass_r = sum(s["pass_rate_pct"] * s["n"] for s in summary.values()) / n_total
    overall_rev    = sum(s["mean_revisions"] * s["n"] for s in summary.values()) / n_total
    print(r"        \midrule")
    print(f"        \\textbf{{Overall}} & \\textbf{{{n_total}}} & "
          f"\\textbf{{{overall_pass_r:.1f}}} & \\textbf{{{overall_rev:.1f}}} \\\\")
    print(r"        \bottomrule")
    print(r"    \end{tabular}")
    print(r"\end{table}")

    # ---- LaTeX Table 2: Latency ---------------------------------------------
    print("\n--- LaTeX Table 2: Latency ---")
    print(r"\begin{table}[htbp]")
    print(r"    \centering")
    print(r"    \caption{Assignment Generation Latency by Format}")
    print(r"    \label{tab:agent_latency}")
    print(r"    \begin{tabular}{lcc}")
    print(r"        \toprule")
    print(r"        \textbf{Format} & \textbf{Mean (s)} & \textbf{Range (s)} \\")
    print(r"        \midrule")
    for fmt, s in summary.items():
        print(f"        {fmt:<10} & {s['mean_total']:.1f} & "
              f"{s['min_total']}--{s['max_total']} \\\\")
    print(r"        \bottomrule")
    print(r"    \end{tabular}")
    print(r"\end{table}")


if __name__ == "__main__":
    main()
