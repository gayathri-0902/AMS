"""
faculty_engine.py
=================
Configures and builds the faculty-specific RAG query engine.
"""

from llama_index.core import Settings, get_response_synthesizer
from llama_index.llms.ollama import Ollama
from llama_index.core.query_engine import RetrieverQueryEngine

from faculty_config import faculty_cfg
from ingestion.faculty_vector_index import build_faculty_index, get_faculty_global_index
from retrieval.hybrid_retriever import HybridRRFRetrieverBuilder
from prompts.faculty_prompts import get_faculty_prompt

def setup_faculty_engine(subject_codes: list[str] | str, streaming: bool = True):
    """
    Builds a global RAG engine for faculty using isolated config, filtered by subject(s).
    """
    if isinstance(subject_codes, str):
        subject_codes = [subject_codes]
    # 1. Setup Ollama LLM
    llm = Ollama(
        model=faculty_cfg.ollama_llm.model,
        request_timeout=faculty_cfg.ollama_llm.request_timeout,
        context_window=faculty_cfg.ollama_llm.context_window,
        temperature=faculty_cfg.ollama_llm.temperature,
        additional_kwargs={"num_gpu": 1} # Force layer offloading to the GPU
    )
    Settings.llm = llm

    # 2. Build/Sync Index
    for sc in subject_codes:
        build_faculty_index(sc)
    
    index = get_faculty_global_index()

    # 3. Hybrid Retriever with subject filters
    builder = HybridRRFRetrieverBuilder(
        vector_top_k=faculty_cfg.retrieval.vector_top_k,
        bm25_top_k=faculty_cfg.retrieval.bm25_top_k,
        fusion_top_k=faculty_cfg.retrieval.fusion_top_k,
        cache_dir=faculty_cfg.paths.db_dir,
        cache_prefix="faculty_global",
        subject_filters=subject_codes
    )
    retriever = builder.build(index)

    # 4. Response Synthesizer with Professor Prompt
    qa_prompt = get_faculty_prompt()
    response_synthesizer = get_response_synthesizer(
        llm=llm,
        text_qa_template=qa_prompt,
        streaming=streaming,
    )

    # 5. Engine
    engine = RetrieverQueryEngine(
        retriever=retriever,
        response_synthesizer=response_synthesizer,
    )
    
    return engine
