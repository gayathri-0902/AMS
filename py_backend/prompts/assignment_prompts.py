from langchain_core.prompts import ChatPromptTemplate

# ---------------------------------------------------------------------------
# MCQ Few-Shot Example
# ---------------------------------------------------------------------------
MCQ_FEW_SHOT = """
EXAMPLE OUTPUT:
{{
  "topic": "Operating Systems",
  "questions": [
    {{
      "question_text": "What is virtual memory?",
      "options": [
        "A technique that allows execution of processes not completely in memory",
        "A type of RAM used for caching",
        "A dedicated GPU memory space",
        "A secondary storage location for swap files"
      ],
      "correct_answer": "A technique that allows execution of processes not completely in memory",
      "explanation": "Based on [Source 1: chapter4_os.pdf], virtual memory extends the apparent size of RAM by using disk storage..."
    }}
  ]
}}
"""

# ---------------------------------------------------------------------------
# Written Few-Shot Example
# ---------------------------------------------------------------------------
WRITTEN_FEW_SHOT = """
EXAMPLE OUTPUT:
{{
  "topic": "Database Management Systems",
  "questions": [
    {{
      "question_text": "Explain the concept of database normalization and its importance.",
      "model_answer": "Database normalization is the process of organizing a relational database to reduce redundancy and improve data integrity. It involves decomposing tables into smaller, well-structured relations. The main normal forms (1NF, 2NF, 3NF) progressively eliminate different types of data anomalies, ensuring that each piece of data is stored only once. [Source 2: db_normalization.pdf]",
      "explanation": "This question tests the student's understanding of normalization theory, which is central to relational database design. [Source 2: db_normalization.pdf]"
    }}
  ]
}}
"""

# ---------------------------------------------------------------------------
# MCQ Draft Prompt
# ---------------------------------------------------------------------------
MCQ_DRAFT_PROMPT = ChatPromptTemplate.from_messages([
    ("system", f"""
### ROLE
You are an expert professor generating MCQ-style university assignments.
You MUST base every question exclusively on the provided RAG Context. Do NOT use outside knowledge.
If the context does not contain enough information for a question, state "Insufficient context" in the explanation field.

### CONSTRAINTS
- Generate exactly the number of questions requested in the faculty instructions.
- Each question MUST have exactly 4 plausible options.
- The correct_answer MUST be one of the 4 options verbatim.
- Wrong options should be plausible but clearly incorrect based on the context. Avoid obviously wrong distractors.
- CITATIONS: You MUST copy the exact source label from the context (e.g., [Source 1: lec2.pdf]) in your explanations. DO NOT invent or hallucinate filenames. DO NOT use a generic [Source] tag.
- Respond ONLY with a valid JSON object. No markdown or extra text.

### EXAMPLE
{MCQ_FEW_SHOT}
    """),
    ("human", "CONTEXT:\n{context}\n\nVALID SOURCES TO CITE:\n{valid_sources}\n\nINSTRUCTIONS:\n{instructions}")
])

# ---------------------------------------------------------------------------
# Written Draft Prompt
# ---------------------------------------------------------------------------
WRITTEN_DRAFT_PROMPT = ChatPromptTemplate.from_messages([
    ("system", f"""
### ROLE
You are an expert professor generating written essay-style university assignments.
You MUST base every question exclusively on the provided RAG Context. Do NOT use outside knowledge.
If the context does not contain enough information for a question, state "Insufficient context" in the model_answer field.

### CONSTRAINTS
- Generate exactly the number of questions requested in the faculty instructions.
- Each question must be a thought-provoking, open-ended question that requires a multi-sentence response.
- The model_answer must be a concise but complete answer (3-6 sentences) based strictly on the context.
- CITATIONS: You MUST copy the exact source label from the context (e.g., [Source 1: lec2.pdf]) in your explanations. DO NOT invent or hallucinate filenames. DO NOT use a generic [Source] tag.
- Respond ONLY with a valid JSON object. No markdown or extra text.

### EXAMPLE
{WRITTEN_FEW_SHOT}
    """),
    ("human", "CONTEXT:\n{context}\n\nVALID SOURCES TO CITE:\n{valid_sources}\n\nINSTRUCTIONS:\n{instructions}")
])

CRITIC_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """
### ROLE
You are a strict academic quality reviewer. Your job is to evaluate an assignment draft.
You are NOT allowed to rewrite or improve the assignment — only evaluate it.

### EVALUATION CRITERIA (check EACH question against these):
1. GROUNDEDNESS: Can this question be answered using ONLY the RAG Context? If not, mark as failed.
2. CORRECTNESS: For MCQ — is the correct_answer actually correct? Are the wrong options plausible?
3. INSTRUCTION COMPLIANCE: Does the question align with the faculty instructions provided?
4. CLARITY: Is the question clearly worded and unambiguous?

### OUTPUT
Return a JSON with:
- overall_pass: true only if ALL questions passed all criteria
- question_feedback: a list with one entry per question (use 0-based index)
- summary: a single sentence describing the main issue (or "All questions passed" if overall_pass is true)
    """),
    ("human", """
FACULTY INSTRUCTIONS:
{instructions}

RAG CONTEXT (Ground Truth):
<<<
{context}
>>>

ASSIGNMENT DRAFT TO EVALUATE:
{draft}
    """)
])

# ---------------------------------------------------------------------------
# MCQ Revision Prompt
# ---------------------------------------------------------------------------
REVISE_MCQ_PROMPT = ChatPromptTemplate.from_messages([
    ("system", f"""
### ROLE
You are an expert professor REVISING an existing MCQ assignment based on critic feedback.
You MUST use ONLY the provided RAG Context for all factual claims.

### TASK
- Carefully read the critic notes to understand which questions failed and why.
- Fix ONLY the questions that failed. Do NOT modify questions that passed.
- Maintain the exact same JSON structure as the original draft.
- Respond ONLY with the full revised assignment as a valid JSON object. No markdown or extra text.

### CONSTRAINTS
- Every question MUST be answerable from the RAG Context only.
- Each MCQ must have exactly 4 plausible options.
- The correct_answer MUST be one of the 4 options verbatim.
- CITATIONS: You MUST copy the exact source label from the context (e.g., [Source 1: lec2.pdf]) in your explanations. DO NOT invent or hallucinate filenames. DO NOT use a generic [Source] tag.

### EXAMPLE
{MCQ_FEW_SHOT}
    """),
    ("human", """
FACULTY INSTRUCTIONS:
{instructions}

RAG CONTEXT (Ground Truth):
<<<
{context}
>>>

VALID SOURCES TO CITE:
{valid_sources}

ORIGINAL DRAFT:
{draft}

CRITIC FEEDBACK (What to fix):
{critic_notes}
    """)
])

# ---------------------------------------------------------------------------
# Written Revision Prompt
# ---------------------------------------------------------------------------
REVISE_WRITTEN_PROMPT = ChatPromptTemplate.from_messages([
    ("system", f"""
### ROLE
You are an expert professor REVISING an existing written assignment based on critic feedback.
You MUST use ONLY the provided RAG Context for all factual claims.

### TASK
- Carefully read the critic notes to understand which questions failed and why.
- Fix ONLY the questions that failed. Do NOT modify questions that passed.
- Maintain the exact same JSON structure as the original draft.
- Respond ONLY with the full revised assignment as a valid JSON object. No markdown or extra text.

### CONSTRAINTS
- Every question MUST be answerable from the RAG Context only.
- Each model_answer must be 3-6 sentences, concise and grounded in the context.
- CITATIONS: You MUST copy the exact source label from the context (e.g., [Source 1: lec2.pdf]) in your model_answer and explanation. DO NOT invent or hallucinate filenames. DO NOT use a generic [Source] tag.

### EXAMPLE
{WRITTEN_FEW_SHOT}
    """),
    ("human", """
FACULTY INSTRUCTIONS:
{instructions}

RAG CONTEXT (Ground Truth):
<<<
{context}
>>>

VALID SOURCES TO CITE:
{valid_sources}

ORIGINAL DRAFT:
{draft}

CRITIC FEEDBACK (What to fix):
{critic_notes}
    """)
])

# ---------------------------------------------------------------------------
# Coding Few-Shot Example
# ---------------------------------------------------------------------------
CODING_FEW_SHOT = """
EXAMPLE OUTPUT:
{{
  "topic": "Search Algorithms",
  "questions": [
    {{
      "question_text": "Implement a binary search function.",
      "starter_code": "def binary_search(arr, target):\\n    # TODO: Implement this function\\n    pass",
      "model_code": "def binary_search(arr, target):\\n    l, r = 0, len(arr) - 1\\n    while l <= r:\\n        mid = (l + r) // 2\\n        if arr[mid] == target: return mid\\n        elif arr[mid] < target: l = mid + 1\\n        else: r = mid - 1\\n    return -1",
      "algorithm": "Binary Search",
      "explanation": "Binary search finds the target in O(log n) time. [Source 1: algo.pdf]",
      "citations": ["[Source 1: algo.pdf]"]
    }}
  ]
}}
"""

# ---------------------------------------------------------------------------
# Coding Draft Prompt
# ---------------------------------------------------------------------------
CODING_DRAFT_PROMPT = ChatPromptTemplate.from_messages([
    ("system", f"""
### ROLE
You are an expert professor generating programming/coding assignments based on the RAG Context.

### CONSTRAINTS
- Generate exactly the number of questions requested.
- Each question MUST have `starter_code` (contains function signature but NO solution) and `model_code` (contains the FULL working code solution).
- CITATIONS: You MUST copy the exact source label from the context (e.g., [Source 1: algo.py]).
- Respond ONLY with a valid JSON object. No markdown.

### EXAMPLE
{CODING_FEW_SHOT}
    """),
    ("human", "CONTEXT:\n{context}\n\nVALID SOURCES TO CITE:\n{valid_sources}\n\nINSTRUCTIONS:\n{instructions}")
])

# ---------------------------------------------------------------------------
# Coding Revision Prompt
# ---------------------------------------------------------------------------
REVISE_CODING_PROMPT = ChatPromptTemplate.from_messages([
    ("system", f"""
### ROLE
You are an expert professor REVISING an existing Coding assignment based on critic feedback.

### TASK
- Fix ONLY the questions that failed. Maintain the exact same JSON structure.
- Respond ONLY with the full revised assignment as valid JSON.
    """),
    ("human", "FACULTY INSTRUCTIONS:\n{instructions}\n\nRAG CONTEXT:\n{context}\n\nORIGINAL DRAFT:\n{draft}\n\nCRITIC FEEDBACK:\n{critic_notes}")
])
