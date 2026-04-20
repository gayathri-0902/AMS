"""
faculty_engine.py
=================
Configures and builds the faculty-specific RAG query engine.
"""

from llama_index.core import Settings
from llama_index.llms.ollama import Ollama
from llama_index.core.query_engine import RetrieverQueryEngine

from config import cfg
from ingestion.faculty_vector_index import build_faculty_index
from retrieval.hybrid_retriever import HybridRRFRetrieverBuilder

def setup_faculty_engine(subject_code: str, streaming: bool = True):
    """
    Builds a subject-specific RAG engine for faculty.
    """
    # 1. LLM Setup
    llm = Ollama(
        model=cfg.ollama_llm.model,
        request_timeout=cfg.ollama_llm.request_timeout,
        context_window=cfg.ollama_llm.context_window,
        temperature=cfg.ollama_llm.temperature,
    )
    Settings.llm = llm

    # 2. Build/Sync Index
    index = build_faculty_index(subject_code)

    # 3. Hybrid Retriever with subject-specific cache isolation
    builder = HybridRRFRetrieverBuilder(
        index=index,
        vector_top_k=cfg.retrieval.vector_top_k,
        bm25_top_k=cfg.retrieval.bm25_top_k,
        cache_prefix=f"subject_{subject_code}" 
    )
    retriever = builder.build()

    # 4. Engine
    engine = RetrieverQueryEngine.from_args(
        retriever=retriever,
        streaming=streaming,
    )
    
    return engine
