import os
import yaml
from dataclasses import dataclass

# Locate faculty_config.yaml in the same folder as this script
_CONFIG_PATH = os.path.join(os.path.dirname(__file__), "faculty_config.yaml")

with open(_CONFIG_PATH, "r") as f:
    _raw = yaml.safe_load(f)

@dataclass(frozen=True)
class PathsConfig:
    base_dir: str
    db_dir: str
    embedding_model: str
    subjects_dir: str

@dataclass(frozen=True)
class RetrievalConfig:
    vector_top_k: int
    bm25_top_k: int
    fusion_top_k: int
    num_queries: int

@dataclass(frozen=True)
class LocalLLMConfig:
    model: str
    max_new_tokens: int
    context_window: int
    temperature: float

@dataclass(frozen=True)
class OllamaLLMConfig:
    model: str
    request_timeout: float
    context_window: int
    temperature: float

@dataclass(frozen=True)
class PipelineConfig:
    llm_backend: str
    streaming: bool

@dataclass(frozen=True)
class FacultyConfig:
    paths: PathsConfig
    retrieval: RetrievalConfig
    local_llm: LocalLLMConfig
    ollama_llm: OllamaLLMConfig
    pipeline: PipelineConfig

def _resolve(base: str, path: str) -> str:
    """Return path as-is if absolute, otherwise join with base."""
    return path if os.path.isabs(path) else os.path.normpath(os.path.join(base, path))

def _load() -> FacultyConfig:
    p = _raw["paths"]
    # Resolve project root
    base = p["base_dir"]
    if base == ".":
        base = os.path.dirname(__file__)

    # Paths
    paths = PathsConfig(
        base_dir=base,
        db_dir=_resolve(base, p["db_dir"]),
        embedding_model=_resolve(base, p["embedding_model"]),
        subjects_dir=_resolve(base, p["subjects_dir"]),
    )

    # Retrieval
    r = _raw["retrieval"]
    retrieval = RetrievalConfig(
        vector_top_k=int(r["vector_top_k"]),
        bm25_top_k=int(r["bm25_top_k"]),
        fusion_top_k=int(r["fusion_top_k"]),
        num_queries=int(r["num_queries"]),
    )

    # Local LLM
    l = _raw["local_llm"]
    local_llm = LocalLLMConfig(
        model=str(l["model"]),
        max_new_tokens=int(l["max_new_tokens"]),
        context_window=int(l["context_window"]),
        temperature=float(l["temperature"]),
    )

    # Ollama LLM
    o = _raw["ollama_llm"]
    ollama_llm = OllamaLLMConfig(
        model=str(o["model"]),
        request_timeout=float(o["request_timeout"]),
        context_window=int(o["context_window"]),
        temperature=float(o["temperature"]),
    )

    # Pipeline
    pl = _raw["pipeline"]
    pipeline = PipelineConfig(
        llm_backend=str(pl["llm_backend"]),
        streaming=bool(pl["streaming"]),
    )

    return FacultyConfig(
        paths=paths,
        retrieval=retrieval,
        local_llm=local_llm,
        ollama_llm=ollama_llm,
        pipeline=pipeline,
    )

# Singleton config object for the faculty application
faculty_cfg: FacultyConfig = _load()
