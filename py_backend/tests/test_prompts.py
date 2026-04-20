"""
tests/test_prompts.py
=====================
Unit tests for all prompt files — student, faculty, and assignment prompts.

These tests do NOT load any models — they only inspect the prompt
template strings and structural correctness.

Run with:
    python -m pytest tests/test_prompts.py -v
"""

import sys
import os
import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from llama_index.core import PromptTemplate
from prompts.base import CustomPromptProvider
from prompts.faculty_prompts import FacultyPromptProvider, get_faculty_prompt
from prompts.assignment_prompts import (
    MCQ_DRAFT_PROMPT, WRITTEN_DRAFT_PROMPT, CODING_DRAFT_PROMPT,
    REVISE_MCQ_PROMPT, REVISE_WRITTEN_PROMPT, REVISE_CODING_PROMPT,
    CRITIC_PROMPT
)


# ---------------------------------------------------------------------------
# Student RAG prompt (base.py)
# ---------------------------------------------------------------------------

class TestStudentPrompt:
    def test_returns_prompt_template_instance(self):
        provider = CustomPromptProvider()
        prompt = provider.get_prompt()
        assert isinstance(prompt, PromptTemplate)

    def test_has_context_str_placeholder(self):
        provider = CustomPromptProvider()
        assert "{context_str}" in provider.get_prompt().template

    def test_has_query_str_placeholder(self):
        provider = CustomPromptProvider()
        assert "{query_str}" in provider.get_prompt().template

    def test_is_grounded_no_outside_knowledge(self):
        """Student prompt must contain instructions to not use external knowledge."""
        provider = CustomPromptProvider()
        template_lower = provider.get_prompt().template.lower()
        # At least one of these phrases must be present
        assert any(phrase in template_lower for phrase in [
            "only", "do not", "strictly", "provided", "context"
        ])


# ---------------------------------------------------------------------------
# Faculty RAG prompt (faculty_prompts.py)
# ---------------------------------------------------------------------------

class TestFacultyPrompt:
    def test_convenience_function_returns_template(self):
        prompt = get_faculty_prompt()
        assert isinstance(prompt, PromptTemplate)

    def test_provider_class_returns_template(self):
        provider = FacultyPromptProvider()
        assert isinstance(provider.get_prompt(), PromptTemplate)

    def test_has_context_str_placeholder(self):
        prompt = get_faculty_prompt()
        assert "{context_str}" in prompt.template

    def test_has_query_str_placeholder(self):
        prompt = get_faculty_prompt()
        assert "{query_str}" in prompt.template

    def test_contains_overview_section(self):
        """Faculty prompt must enforce Overview section."""
        prompt = get_faculty_prompt()
        assert "Overview" in prompt.template

    def test_contains_key_concepts_section(self):
        prompt = get_faculty_prompt()
        assert "Key Concepts" in prompt.template

    def test_contains_references_section(self):
        prompt = get_faculty_prompt()
        assert "References" in prompt.template

    def test_enforces_no_hallucination_rule(self):
        """Faculty prompt must explicitly forbid hallucination."""
        prompt = get_faculty_prompt()
        template_lower = prompt.template.lower()
        assert any(phrase in template_lower for phrase in [
            "hallucinate", "do not invent", "outside knowledge", "must not use"
        ])

    def test_professor_persona_present(self):
        prompt = get_faculty_prompt()
        template_lower = prompt.template.lower()
        assert any(phrase in template_lower for phrase in [
            "professor", "information gatherer", "lecture notes"
        ])


# ---------------------------------------------------------------------------
# Assignment prompts (assignment_prompts.py)
# ---------------------------------------------------------------------------

class TestAssignmentPrompts:
    """
    Assignment prompts are LangChain ChatPromptTemplates — we verify
    they have the required input variables.
    """

    def _get_input_vars(self, prompt) -> set:
        """Extract input variable names from a LangChain prompt."""
        return set(prompt.input_variables)

    def test_mcq_draft_prompt_has_required_vars(self):
        vars_ = self._get_input_vars(MCQ_DRAFT_PROMPT)
        assert "context" in vars_
        assert "instructions" in vars_

    def test_written_draft_prompt_has_required_vars(self):
        vars_ = self._get_input_vars(WRITTEN_DRAFT_PROMPT)
        assert "context" in vars_
        assert "instructions" in vars_

    def test_coding_draft_prompt_has_required_vars(self):
        vars_ = self._get_input_vars(CODING_DRAFT_PROMPT)
        assert "context" in vars_
        assert "instructions" in vars_

    def test_critic_prompt_has_required_vars(self):
        vars_ = self._get_input_vars(CRITIC_PROMPT)
        assert "draft" in vars_
        assert "instructions" in vars_
        assert "context" in vars_

    def test_revise_mcq_prompt_has_critic_notes(self):
        vars_ = self._get_input_vars(REVISE_MCQ_PROMPT)
        assert "critic_notes" in vars_
        assert "draft" in vars_

    def test_revise_written_prompt_has_critic_notes(self):
        vars_ = self._get_input_vars(REVISE_WRITTEN_PROMPT)
        assert "critic_notes" in vars_

    def test_revise_coding_prompt_has_critic_notes(self):
        vars_ = self._get_input_vars(REVISE_CODING_PROMPT)
        assert "critic_notes" in vars_

    def test_all_three_draft_prompts_are_distinct(self):
        """Each assignment type must have a unique prompt — not accidentally the same."""
        mcq_msgs = str(MCQ_DRAFT_PROMPT.messages)
        written_msgs = str(WRITTEN_DRAFT_PROMPT.messages)
        coding_msgs = str(CODING_DRAFT_PROMPT.messages)
        assert mcq_msgs != written_msgs
        assert written_msgs != coding_msgs
        assert mcq_msgs != coding_msgs
