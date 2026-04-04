from typing import Optional, Union, Any
from llama_index.core import Settings
from llama_index.llms.ollama import Ollama
from langchain_ollama import ChatOllama
from config import cfg

# Cache for singletons
_llama_index_llm: Optional[Any] = None
_langchain_llm: Optional[ChatOllama] = None

def get_llama_index_llm(backend: Optional[str] = None):
    """
    Get or create a LlamaIndex-compatible LLM instance (Singleton).
    """
    global _llama_index_llm
    if _llama_index_llm is not None:
        return _llama_index_llm

    backend = backend or cfg.pipeline.llm_backend
    
    if backend == "ollama":
        from llm_loaders.ollama_loader import OllamaLoader
        c = cfg.ollama_llm
        loader = OllamaLoader(
            model_name=c.model,
            request_timeout=c.request_timeout,
            context_window=c.context_window,
            temperature=c.temperature,
        )
        _llama_index_llm = loader.get_llm()
    elif backend == "local":
        from llm_loaders.local_llm_loader import QuantizedLocalLLM
        c = cfg.local_llm
        loader = QuantizedLocalLLM(
            model_name=c.model,
            max_new_tokens=c.max_new_tokens,
            context_window=c.context_window,
            temperature=c.temperature,
        )
        _llama_index_llm = loader.get_llm()
    else:
        raise ValueError(f"Unknown backend: {backend}")

    # Register globally for LlamaIndex
    Settings.llm = _llama_index_llm
    return _llama_index_llm

def get_langchain_llm():
    """
    Get or create a LangChain-compatible ChatOllama instance (Singleton).
    """
    global _langchain_llm
    if _langchain_llm is not None:
        return _langchain_llm

    # Currently, our agent only supports Ollama backend for JSON formatting
    c = cfg.ollama_llm
    _langchain_llm = ChatOllama(
        model=c.model,
        temperature=c.temperature,
        format="json",
        keep_alive=-1,
        num_gpu=1,  # Force GPU inference — prevents CPU offloading on constrained VRAM
    )
    return _langchain_llm
