"""
test_agent.py
=============
Quick end-to-end smoke test for the Assignment Reflexion Agent.
Run from inside the py_backend directory:
    python agents/test_agent.py
"""
import sys
import os
import json

# Make sure py_backend modules are on the path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from agents.assignment_agent import assignment_agent, AssignType
from retrieval.simple_retriever import get_assignment_context

# ── Config ────────────────────────────────────────────────────────────────────
YEAR   = 4          # Only Year 4 DS is populated
BRANCH = "ds"
TOPIC  = "Machine Learning model evaluation metrics"

print(f"Retrieving context for Year {YEAR}, Branch '{BRANCH}', Topic: '{TOPIC}'...")
context = get_assignment_context(year=YEAR, branch=BRANCH, topic=TOPIC, top_k=8)
print(f"Retrieved {len(context.split())} words of context.\n")

initial_state = {
    "faculty_instructions": f"Create 3 MCQ questions on {TOPIC}.",
    "retrieved_context": context,
    "assignment_type": AssignType.MCQ,
    "current_draft": {},
    "critique_notes": "",
    "final": "",
    "revision_count": 0,
}

print("=" * 60)
print(">> Running Assignment Reflexion Agent ...")
print("=" * 60)

result = assignment_agent.invoke(initial_state)

print(f"\n-- Done after {result['revision_count']} revision(s).\n")
print("-- Final Assignment Draft:")
print(json.dumps(result["current_draft"], indent=2))
