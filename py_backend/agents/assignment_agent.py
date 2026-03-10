from typing import TypedDict, Dict, Any, List
from langchain_ollama import ChatOllama
from langchain_core.prompts import ChatPromptTemplate

class AssignState(TypedDict):
    """
    The state dictionary that LangGraph passes between every Node.
    """
    # 1. Inputs
    faculty_instructions: str   # E.g., "Create 5 MCQ questions about Memory Management"
    retrieved_context: str      # The raw text fetched from ChromaDB

    # 2. Working Memory
    current_draft: Dict[str, Any]  # The JSON structure of the assignment
    critique_notes: str            # Feedback from the Critic Node
    
    # 3. Control Mechanisms
    revision_count: int            # Prevents infinite loops

llm = ChatOllama(
    model = "qwen3:8b",
    temperature=0.5,
    format="json",
    keep_alive=-1,
)

def draft_assignment(state: AssignState) -> AssignState:
    """
    Drafts an assignment based on the faculty instructions and retrieved context.
    """
    context = state["retrieved_context"]
    instructions = state["faculty_instructions"]
    prompt  = ChatPromptTemplate.from_messages([
        ("system", "You are a helpful assistant that drafts assignments based on faculty instructions and retrieved context."),
        ("user", "Context: {context}\nInstructions: {instructions}"),
    ])
    