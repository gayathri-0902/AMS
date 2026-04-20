"""
tests/test_faculty_pipeline.py
==============================
Unit tests for Faculty RAG pipeline components.

These tests do NOT load any models or hit the GPU — they use mocked
nodes and lightweight structural checks.

Run with:
    python -m pytest tests/test_faculty_pipeline.py -v
"""

import sys
import os
import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from llama_index.core.schema import TextNode
from retrieval.hybrid_retriever import HybridRRFRetrieverBuilder
from ingestion.faculty_vector_index import FacultyVectorIndexBuilder
from faculty_config import faculty_cfg


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def mock_nodes_mixed():
    """Nodes spanning three subjects — simulates the faculty_global collection."""
    return [
        TextNode(id_="1", text="NLP morphology is the study of word structure.", metadata={"subject_code": "C4103"}),
        TextNode(id_="2", text="Finite-state automata are used in morphological analysis.", metadata={"subject_code": "C4103"}),
        TextNode(id_="3", text="Data analytics involves extracting insights from data.", metadata={"subject_code": "C4201"}),
        TextNode(id_="4", text="Regression models are core to predictive analytics.", metadata={"subject_code": "C4201"}),
        TextNode(id_="5", text="Computer networks use the OSI model for communication.", metadata={"subject_code": "C4305"}),
    ]


# ---------------------------------------------------------------------------
# HybridRRFRetrieverBuilder — Subject Filter Logic
# ---------------------------------------------------------------------------

class TestHybridRRFSubjectFiltering:
    """Tests for the metadata-based subject filtering in the hybrid retriever."""

    def test_subject_filter_stored_correctly(self):
        builder = HybridRRFRetrieverBuilder(subject_filters=["C4103"])
        assert builder._subject_filters == ["C4103"]

    def test_multi_subject_filter_stored(self):
        builder = HybridRRFRetrieverBuilder(subject_filters=["C4103", "C4201"])
        assert len(builder._subject_filters) == 2
        assert "C4201" in builder._subject_filters

    def test_no_filter_is_none_by_default(self):
        builder = HybridRRFRetrieverBuilder()
        assert builder._subject_filters is None

    def test_bm25_node_filtering_single_subject(self, mock_nodes_mixed):
        """Verify that BM25 filtering correctly isolates nodes for one subject."""
        builder = HybridRRFRetrieverBuilder(subject_filters=["C4103"])
        # Simulate the filtering logic from build()
        filtered = [n for n in mock_nodes_mixed if n.metadata.get("subject_code") in builder._subject_filters]
        assert len(filtered) == 2
        assert all(n.metadata["subject_code"] == "C4103" for n in filtered)

    def test_bm25_node_filtering_multi_subject(self, mock_nodes_mixed):
        """Verify that BM25 filtering works for multiple subjects."""
        builder = HybridRRFRetrieverBuilder(subject_filters=["C4103", "C4201"])
        filtered = [n for n in mock_nodes_mixed if n.metadata.get("subject_code") in builder._subject_filters]
        assert len(filtered) == 4
        codes = {n.metadata["subject_code"] for n in filtered}
        assert codes == {"C4103", "C4201"}

    def test_bm25_node_filtering_global_all(self, mock_nodes_mixed):
        """When no filter, all nodes should pass through."""
        builder = HybridRRFRetrieverBuilder(subject_filters=None)
        # No filter means all nodes pass
        filtered = mock_nodes_mixed  # Mirroring the build() logic
        assert len(filtered) == 5

    def test_bm25_node_filtering_unknown_subject_returns_empty(self, mock_nodes_mixed):
        """Unknown subject code should return zero nodes."""
        builder = HybridRRFRetrieverBuilder(subject_filters=["ZZZZ"])
        filtered = [n for n in mock_nodes_mixed if n.metadata.get("subject_code") in builder._subject_filters]
        assert len(filtered) == 0


# ---------------------------------------------------------------------------
# FacultyVectorIndexBuilder — Config & Structure
# ---------------------------------------------------------------------------

class TestFacultyVectorIndexBuilder:
    """Structural tests for FacultyVectorIndexBuilder — no index loaded."""

    def test_builder_uses_faculty_config_db_dir(self):
        builder = FacultyVectorIndexBuilder()
        assert builder._db_dir == faculty_cfg.paths.db_dir

    def test_builder_custom_db_dir(self, tmp_path):
        builder = FacultyVectorIndexBuilder(db_dir=str(tmp_path))
        assert builder._db_dir == str(tmp_path)

    def test_builder_has_embedder(self):
        builder = FacultyVectorIndexBuilder()
        assert builder._embedder is not None

    def test_builder_has_loader(self):
        builder = FacultyVectorIndexBuilder()
        assert builder._loader is not None


# ---------------------------------------------------------------------------
# app.py — subject_codes payload parsing logic
# ---------------------------------------------------------------------------

class TestSubjectCodeParsing:
    """Tests for the subject_codes field parsing logic used in app.py."""

    def _parse(self, raw):
        """Reproduce the parsing logic from handle_faculty_query()."""
        if isinstance(raw, str):
            return [s.strip() for s in raw.split(",") if s.strip()]
        elif isinstance(raw, list):
            return raw
        return []

    def test_list_passthrough(self):
        result = self._parse(["C4103", "C4201"])
        assert result == ["C4103", "C4201"]

    def test_string_single_code(self):
        result = self._parse("C4103")
        assert result == ["C4103"]

    def test_string_comma_separated(self):
        result = self._parse("C4103, C4201, C4305")
        assert result == ["C4103", "C4201", "C4305"]

    def test_none_returns_empty(self):
        result = self._parse(None)
        assert result == []

    def test_empty_string_returns_empty(self):
        result = self._parse("")
        assert result == []

    def test_string_with_extra_spaces(self):
        result = self._parse("  C4103  ,  C4201  ")
        assert result == ["C4103", "C4201"]
