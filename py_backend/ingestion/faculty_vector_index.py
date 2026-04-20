"""
ingestion/faculty_vector_index.py
================================
Building and syncing vector indices for subject-specific collections.
"""

import json
import os
import chromadb
from llama_index.core import StorageContext, VectorStoreIndex
from llama_index.core.node_parser import SemanticSplitterNodeParser
from llama_index.vector_stores.chroma import ChromaVectorStore

from faculty_config import faculty_cfg
from ingestion.build_vector_index import HuggingFaceEmbedder
from ingestion.faculty_loader import FacultyDocumentLoader

class FacultyVectorIndexBuilder:
    def __init__(self, db_dir: str | None = None):
        self._embedder = HuggingFaceEmbedder()
        self._db_dir = db_dir or faculty_cfg.paths.db_dir
        self._loader = FacultyDocumentLoader()

    def _get_storage_context(self) -> StorageContext:
        collection_name = "faculty_global"
        db = chromadb.PersistentClient(path=self._db_dir)
        chromadb_collection = db.get_or_create_collection(collection_name)
        vector_store = ChromaVectorStore(chroma_collection=chromadb_collection)
        return StorageContext.from_defaults(vector_store=vector_store)

    def build(self, subject_code: str) -> VectorStoreIndex:
        needs_update, changed_docs, deleted_files, current_hashes, state_log = \
            self._loader.get_subject_updates(subject_code, self._db_dir)

        embedding_model = self._embedder.get_model()
        storage_context = self._get_storage_context()

        index = VectorStoreIndex.from_vector_store(
            vector_store=storage_context.vector_store,
            embed_model=embedding_model,
        )

        if needs_update:
            bm25_cache = os.path.join(
                self._db_dir, "faculty_global_bm25_cache.pkl"
            )
            if os.path.exists(bm25_cache):
                os.remove(bm25_cache)

            splitter = SemanticSplitterNodeParser(
                embed_model=embedding_model,
                buffer_size=3,
                breakpoint_percentile_threshold=95,
            )

            if changed_docs:
                nodes = splitter.get_nodes_from_documents(changed_docs)
                for node in nodes:
                    node.metadata["subject_code"] = subject_code
                index.insert_nodes(nodes)

            for fp in deleted_files:
                index.delete_ref_doc(fp, delete_from_docstore=True)

            with open(state_log, "w") as f:
                json.dump(current_hashes, f)

            print(f"Updated faculty index [{subject_code}]: {len(changed_docs)} doc(s) added.")
        else:
            print(f"Faculty index [{subject_code}] is up-to-date.")

        return index

def build_faculty_index(subject_code: str) -> VectorStoreIndex:
    return FacultyVectorIndexBuilder().build(subject_code)

def get_faculty_global_index(db_dir: str | None = None) -> VectorStoreIndex:
    builder = FacultyVectorIndexBuilder(db_dir)
    storage_context = builder._get_storage_context()
    embedding_model = builder._embedder.get_model()
    return VectorStoreIndex.from_vector_store(
        vector_store=storage_context.vector_store,
        embed_model=embedding_model,
    )
