"""
benchmark/01_corpus_stats.py
=============================
Counts nodes per ChromaDB collection.
Run from py_backend/:  .venv\Scripts\python.exe benchmark/01_corpus_stats.py
"""

import sys, os, json, io

# Force UTF-8 so Windows cp1252 doesn't choke on special chars
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import chromadb
from config import cfg

DB_DIR = cfg.paths.db_dir


def count_files_under(path):
    """Recursively count PDF/DOCX/TXT files."""
    if not os.path.exists(path):
        return 0
    total = 0
    for root, _, files in os.walk(path):
        total += sum(1 for f in files if f.lower().endswith((".pdf", ".docx", ".txt")))
    return total


def main():
    db = chromadb.PersistentClient(path=DB_DIR)
    all_cols = db.list_collections()
    all_names = sorted(c.name for c in all_cols)

    print(f"\nChromaDB path: {DB_DIR}")
    print(f"Total collections found: {len(all_names)}\n")

    # Separate student vs faculty
    student_names = [n for n in all_names if not n.startswith("faculty_")]
    faculty_names = [n for n in all_names if n.startswith("faculty_")]

    # ---- Student collections ------------------------------------------------
    print(f"{'Collection':<35} {'Nodes':>8}")
    print("-" * 45)

    results = []
    branch_totals = {}

    for col_name in student_names:
        coll  = db.get_collection(col_name)
        nodes = coll.count()

        # Infer branch label from collection name
        branch = "OTHER"
        for b in ["ds", "cs", "aiml", "maths", "stats"]:
            if b in col_name.lower():
                branch = b.upper()
                break

        print(f"{col_name:<35} {nodes:>8}")
        results.append({"collection": col_name, "branch": branch, "nodes": nodes})

        if branch not in branch_totals:
            branch_totals[branch] = {"nodes": 0, "collections": 0}
        branch_totals[branch]["nodes"]       += nodes
        branch_totals[branch]["collections"] += 1

    total_nodes = sum(r["nodes"] for r in results)
    print("-" * 45)
    print(f"{'TOTAL':<35} {total_nodes:>8}")

    # ---- Data directory file count ------------------------------------------
    data_dir = os.path.join(cfg.paths.base_dir, "data")
    total_docs = count_files_under(data_dir)
    print(f"\nSource documents under {data_dir}: {total_docs}")

    # ---- Faculty collections ------------------------------------------------
    print(f"\nFaculty collections ({len(faculty_names)}):")
    faculty_results = []
    for fname in faculty_names:
        coll  = db.get_collection(fname)
        nodes = coll.count()
        print(f"  {fname:<35} nodes={nodes}")
        faculty_results.append({"collection": fname, "nodes": nodes})

    avg_fac = (
        sum(f["nodes"] for f in faculty_results) / len(faculty_results)
        if faculty_results else 0
    )
    if faculty_results:
        print(f"  Average nodes/collection: {avg_fac:.1f}")
    else:
        print("  (none found)")

    # ---- Save JSON ----------------------------------------------------------
    output = {
        "student_collections": results,
        "branch_totals":       branch_totals,
        "grand_total_nodes":   total_nodes,
        "total_source_docs":   total_docs,
        "faculty_collections": faculty_results,
        "avg_faculty_nodes":   round(avg_fac, 1),
    }
    out_path = os.path.join(os.path.dirname(__file__), "corpus_stats.json")
    with open(out_path, "w") as f:
        json.dump(output, f, indent=2)
    print(f"\nSaved: {out_path}")

    # ---- LaTeX table --------------------------------------------------------
    print("\n--- LaTeX Table (paste into report) ---")
    print(r"\begin{table}[htbp]")
    print(r"    \centering")
    print(r"    \caption{ChromaDB Corpus Statistics}")
    print(r"    \label{tab:corpus}")
    print(r"    \begin{tabular}{llr}")
    print(r"        \toprule")
    print(r"        \textbf{Collection} & \textbf{Branch} & \textbf{Nodes} \\")
    print(r"        \midrule")
    for r in results:
        print(f"        \\texttt{{{r['collection']}}} & {r['branch']} & {r['nodes']} \\\\")
    if faculty_results:
        print(r"        \midrule")
        for f in faculty_results:
            print(f"        \\texttt{{{f['collection']}}} & Faculty & {f['nodes']} \\\\")
    print(r"        \midrule")
    print(f"        \\textbf{{Total}} & & \\textbf{{{total_nodes}}} \\\\")
    print(r"        \bottomrule")
    print(r"    \end{tabular}")
    print(r"\end{table}")


if __name__ == "__main__":
    main()
