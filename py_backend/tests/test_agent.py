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

from agents.assignment_agent import assignment_agent, AssignType, parse_faculty_request
from retrieval.simple_retriever import get_simple_retriever
from ingestion.build_vector_index import build_vector_index
from llama_index.core import Settings

# ── Simulated faculty free-text input ─────────────────────────────────────────
# In production, this comes from the HTTP request body.
FACULTY_FREE_TEXT = "Create 5 MCQ questions on Predictive Data Analytics, medium difficulty"
YEAR   = 4
BRANCH = "ds"

# ── Step 1: Parse faculty free text into structured fields ────────────────────
print("Parsing faculty request...")
parsed = parse_faculty_request(FACULTY_FREE_TEXT)
print(f"  topic             : {parsed.topic}")
print(f"  assignment_type   : {parsed.assignment_type}")
print(f"  quantity          : {parsed.quantity}")
print(f"  extra instructions: {parsed.additional_instructions}\n")

# ── Step 2: Retrieve real context from ChromaDB ───────────────────────────────
print(f"Retrieving context for Year {YEAR} {BRANCH.upper()}, Topic: '{parsed.topic}'...")

# 1. Load the existing vector index
index = build_vector_index(year=YEAR, branch=BRANCH)

# Disable LlamaIndex OpenAI fallback by reusing the internal embedder
Settings.embed_model = index._embed_model

# 2. Build the simple retriever
retriever = get_simple_retriever(index)

# 3. Retrieve top-K nodes relevant to the topic
nodes = retriever.retrieve(parsed.topic)

# 4. Format into a single string with [Source] labels
labelled_chunks = []
extracted_sources = []
for i, node in enumerate(nodes):
    source_name = node.metadata.get("file_name") or node.metadata.get("source") or f"Chunk {i+1}"
    label = f"[Source {i+1}: {source_name}]"
    extracted_sources.append(label)
    labelled_chunks.append(f"{label}\n{node.text}")

context = "\n\n---\n\n".join(labelled_chunks)
print(f"Retrieved {len(context.split())} words of context from {len(nodes)} sources.\n")

# ── Step 3: Build AssignState from parsed fields ──────────────────────────────
# Map the string from the parser to our AssignType enum
assignment_type = AssignType(parsed.assignment_type.lower())

faculty_instructions = (
    f"Create {parsed.quantity} {parsed.assignment_type} questions on {parsed.topic}."
)
if parsed.additional_instructions:
    faculty_instructions += f" Additional constraints: {parsed.additional_instructions}."

initial_state = {
    "faculty_instructions": faculty_instructions,
    "retrieved_context": context,
    "extracted_sources": extracted_sources,
    "assignment_type": assignment_type,
    "current_draft": {},
    "critique_notes": "",
    "final": "",
    "revision_count": 0,
}

# ── Step 4: Run the agent ─────────────────────────────────────────────────────
print("=" * 60)
print(">> Running Assignment Reflexion Agent ...")
print("=" * 60)

result = assignment_agent.invoke(initial_state)

print(f"\n-- Done after {result['revision_count']} revision(s).\n")
print("-- Final Assignment Draft:")
print(json.dumps(result["current_draft"], indent=2))