"""
retrieval/simple_retriever.py
==============================
A lightweight retriever for the Assignment Agent.
Embeds the query using the same local BGE-M3 model, then queries
ChromaDB using raw embedding vectors (avoids embedding-function
metadata conflicts with the LlamaIndex-built collections).
"""
import os
import pickle

from llama_index.core import VectorStoreIndex
from llama_index.core.retrievers import BaseRetriever, VectorIndexRetriever
from interfaces import BaseRetrieverBuilder

class SimpleRetieverBuilder(BaseRetrieverBuilder):
    """
    Constucts a simple vector retriever that queries ChromaDB using raw
    embedding vectors.
    """
    def __init__(self, vector_top_k: int = 8) -> None:
        self._vector_top_k = vector_top_k

    def build(self, index: VectorStoreIndex) -> BaseRetriever:
        """
        Construct and return a simple vector retriever.

        Args:
            index: A fully populated ``VectorStoreIndex`` to retrieve from.

        Returns:
            A ``VectorIndexRetriever`` that queries ChromaDB using raw
            embedding vectors.
        """
        return VectorIndexRetriever(
            index=index,
            similarity_top_k=self._vector_top_k,
        )

def get_simple_retriever(index: VectorStoreIndex) -> BaseRetriever:
    """
    Convenience wrapper: builds and returns a simple vector retriever.
    """
    return SimpleRetieverBuilder().build(index)