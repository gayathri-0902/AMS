# ModularRAG + Assignment Agent — Developer Guide

This guide covers how to extend both the RAG pipeline and the AI Assignment Generation system.

---

## Part 1: RAG Pipeline (ModularRAG)

### The Golden Rule

Every new RAG component follows the same 3-step pattern:

```
1. Create a class that inherits from the right ABC in interfaces/
2. Implement the required abstract method(s)
3. Register it — either via config.yaml or by passing it directly
```

---

### 0. Config-First Approach

Before writing any code, check if `config.yaml` already supports what you need.
Many changes (model name, top-k values, backend switch) require **zero code changes**:

```yaml
# config.yaml
pipeline:
  llm_backend: "ollama"
  streaming: true

retrieval:
  vector_top_k: 10
  fusion_top_k: 5
```

---

### 1. New Document Loader

**Interface:** `BaseDocumentLoader` → must implement `get_document_updates()`

```python
# ingestion/s3_loader.py
from interfaces import BaseDocumentLoader

class S3DocumentLoader(BaseDocumentLoader):
    def __init__(self, bucket_name: str) -> None:
        self._bucket_name = bucket_name

    def get_document_updates(self, year, branch, db_dir):
        # List, compare, and download changed files from S3
        ...
        return needs_update, changed_docs, deleted_files, current_hashes, state_log
```

---

### 2. New Embedding Model

**Interface:** `BaseEmbedder` → must implement `get_model()`

```python
# ingestion/openai_embedder.py
from interfaces import BaseEmbedder
from llama_index.embeddings.openai import OpenAIEmbedding

class OpenAIEmbedder(BaseEmbedder):
    def __init__(self, model: str = "text-embedding-3-small") -> None:
        self._model = model

    def get_model(self) -> OpenAIEmbedding:
        return OpenAIEmbedding(model=self._model)
```

Pass directly to `VectorIndexBuilder(embedder=OpenAIEmbedder())`.

---

### 3. New LLM

**Interface:** `BaseLLMLoader` → must implement `get_llm()`

Two loaders ship already:

| Class | File | Backend |
|---|---|---|
| `QuantizedLocalLLM` | `llm_loaders/local_llm_loader.py` | HuggingFace + 4-bit |
| `OllamaLoader` | `llm_loaders/ollama_loader.py` | Ollama server |

To add a new one, create the class and add a branch to `_build_llm()` in `query_engine.py`.

> ⚠️ Do NOT call `super().__init__()` with kwargs. Store args as `self._attr = value`.

---

### 4. New Retriever

**Interface:** `BaseRetrieverBuilder` → must implement `build(index)`

```python
# retrieval/vector_only_retriever.py
from interfaces import BaseRetrieverBuilder

class VectorOnlyRetrieverBuilder(BaseRetrieverBuilder):
    def __init__(self, top_k: int = 10) -> None:
        self._top_k = top_k

    def build(self, index):
        from llama_index.core.retrievers import VectorIndexRetriever
        return VectorIndexRetriever(index=index, similarity_top_k=self._top_k)
```

---

### 5. New Index Builder

**Interface:** `BaseIndexBuilder` → must implement `build(year, branch)`

---

### 6. New Prompt (RAG)

**Interface:** `BasePromptProvider` → must implement `get_prompt()`

```python
# prompts/concise_prompt.py
from interfaces import BasePromptProvider
from llama_index.core import PromptTemplate

class ConcisePromptProvider(BasePromptProvider):
    def get_prompt(self) -> PromptTemplate:
        return PromptTemplate("Answer in 2-3 sentences using only:\n{context_str}\nQ: {query_str}\nA:")
```

---

### Quick Reference

| What you want | Interface | Required method |
|---|---|---|
| New document source | `BaseDocumentLoader` | `get_document_updates(year, branch, db_dir)` |
| New embedding model | `BaseEmbedder` | `get_model()` |
| New LLM | `BaseLLMLoader` | `get_llm()` |
| New retrieval strategy | `BaseRetrieverBuilder` | `build(index)` |
| New index backend | `BaseIndexBuilder` | `build(year, branch)` |
| New prompt style | `BasePromptProvider` | `get_prompt()` |

---

## Part 2: Assignment Generation Agent

The Assignment Generation system is a **LangGraph Reflexion Loop** that runs entirely in Python (`py_backend/agents/assignment_agent.py`) and is exposed as an SSE stream via Flask.

### Architecture Overview

```
Faculty Request (free-text)
        │
        ▼
  parse_faculty_request()   ← LLM extracts topic, type, quantity
        │
        ▼
  Hybrid Retriever          ← Fetches branch context (Vector + BM25)
        │
        ▼
  ┌─────────────────────────────────────┐
  │  LangGraph StateGraph               │
  │                                     │
  │  draft_assignment  ──►  critic_node │
  │         ▲                   │       │
  │         │         ┌─────────┘       │
  │     revise_node ◄─┘  overall_pass?  │
  │                          │          │
  │                      END (if pass   │
  │                    or 3 revisions)  │
  └─────────────────────────────────────┘
        │
        ▼
  Flask streams SSE events to Node.js
        │
        ▼
  Node proxies stream to React frontend
```

---

### Assignment Types

Three types are fully supported, each with its own Pydantic schema and prompt template:

| Type | Schema | Draft Prompt | Revise Prompt | Key Fields |
|------|--------|-------------|--------------|------------|
| `mcq` | `MCQAssignment` | `MCQ_DRAFT_PROMPT` | `REVISE_MCQ_PROMPT` | `options`, `correct_answer` |
| `written` | `WrittenAssignment` | `WRITTEN_DRAFT_PROMPT` | `REVISE_WRITTEN_PROMPT` | `model_answer` |
| `coding` | `CodingAssignment` | `CODING_DRAFT_PROMPT` | `REVISE_CODING_PROMPT` | `starter_code`, `model_code` |

---

### Data Flow: Python → Node.js → MongoDB

When the agent finishes, it yields a final SSE event with this shape:

```json
{
  "status": "complete",
  "assignment": { "topic": "...", "questions": [...] },
  "sources": ["file1.pdf", "file2.pdf"],
  "metadata": { "type": "coding", "revisions": 2 }
}
```

Node.js (`routes/assignmentRoutes.js`) maps this onto the `Assignment` Mongoose schema:

| Python field | Mongoose field | Notes |
|---|---|---|
| `q.question_text` | `question_text` | All types |
| `q.options` | `options` | MCQ only |
| `q.correct_answer` | `correct_answer` | MCQ only |
| `q.model_answer` or `q.model_code` | `model_answer` | Written / Coding (faculty-only) |
| `q.starter_code` | `starter_code` | Coding only (student-visible) |
| `metadata.type` | `assignment_type` | `"mcq"`, `"written"`, or `"coding"` |

> ⚠️ **Critical Rule:** `model_code` (the full solution) must **never** be stored in `starter_code`. It always goes to `model_answer`. The student dashboard reads only `starter_code`.

---

### Adding a New Assignment Type

1. **Define a new Pydantic schema** in `assignment_agent.py`:
    ```python
    class DebateQuestion(BaseModel):
        question_text: str
        position_a: str
        position_b: str
        citations: List[str]

    class DebateAssignment(BaseModel):
        topic: str
        questions: List[DebateQuestion]
    ```

2. **Add a new enum value** to `AssignType`:
    ```python
    class AssignType(StrEnum):
        MCQ = auto()
        WRITTEN = auto()
        CODING = auto()
        DEBATE = auto()   # ← new
    ```

3. **Add prompt templates** in `prompts/assignment_prompts.py`:
    ```python
    DEBATE_DRAFT_PROMPT = ChatPromptTemplate.from_messages([...])
    REVISE_DEBATE_PROMPT = ChatPromptTemplate.from_messages([...])
    ```

4. **Register in `draft_assignment` and `revise_node`**:
    ```python
    elif state["assignment_type"] == AssignType.DEBATE:
        schema = DebateAssignment
        prompt = DEBATE_DRAFT_PROMPT
    ```

5. **Map in Node.js** (`routes/assignmentRoutes.js`): Add the new fields to the `questions.map(...)` block in both `/generate` and `/save` routes.

6. **Update `HandIn.jsx`** to render the new question format on the student side.

---

### Submission System

Submissions are stored in the `Submission` Mongoose model and managed via `routes/submissionRoutes.js`.

**Deadline Enforcement** is applied **server-side** on both:
- `POST /api/submission/submit` — blocks new submissions after deadline
- `PATCH /api/submission/:id/link` — blocks link updates after deadline

MCQ submissions are **auto-graded** at submission time by comparing `student_selected_option` against `correct_answer` for each question.

Written and Coding submissions store a `submission_file_url` (Drive / GitHub link) and await manual grading via `PATCH /api/submission/:id/grade`.

---

### Checklist for any new RAG component

- [ ] Check `config.yaml` first — you might not need any code
- [ ] Create a new `.py` file in the appropriate directory
- [ ] Inherit from the right ABC in `interfaces/`
- [ ] Implement every `@abstractmethod`
- [ ] Store constructor args as `self._attr` — do **not** call `super().__init__()` with kwargs
- [ ] Add type hints and docstrings
- [ ] Register it in `query_engine.py` or pass it as a constructor argument
