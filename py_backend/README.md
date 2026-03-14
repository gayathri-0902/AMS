# Academic Management System (AMS) - Python Backend

This backend powers the RAG (Retrieval-Augmented Generation) engine and the Assignment Reflexion Agent for the Academic Management System.

## Features

- **Modular RAG Pipeline**: Hybrid retrieval combining dense vector search (ChromaDB + BGE-M3) and sparse keyword matching (BM25).
- **Assignment Reflexion Agent**: Built with LangGraph, this agent parses faculty requests, retrieves context, drafts questions, critiques them, and refines the final assignment.
- **Local LLM Integration**: Supports running models locally via Ollama or quantized HuggingFace models.
- **Citation Enforcement**: Strictly maps retrieved filenames to source labels (`[Source X: filename]`) to prevent LLM hallucinations.

## Setup

### 1. Prerequisites
- Python 3.11+
- [Ollama](https://ollama.ai/) (for running models like Llama or Qwen locally)

### 2. Installation
```bash
# Navigate to the backend directory
cd py_backend

# Create and activate a virtual environment
python -m venv .venv
# Windows:
.\.venv\Scripts\activate
# Unix/MacOS:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Configuration
Edit `config.yaml` to specify:
- Path to your local embedding model.
- LLM backend (Ollama or Local).
- Retrieval parameters (top-k, fusion settings).

### 4. Running the Engine
- **Build/Sync Index**: Handled automatically during query/agent execution.
- **Run API Server**: `python app.py`
- **Test Agent**: `python agents/test_agent.py`

## Directory Structure
- `agents/`: LangGraph agent definitions and state management.
- `ingestion/`: Logic for loading documents and building the vector index.
- `prompts/`: System and human prompt templates for the LLM.
- `retrieval/`: Simple and Hybrid (RRF) retriever implementations.
- `llm_loaders/`: Adapters for different LLM inference backends.
