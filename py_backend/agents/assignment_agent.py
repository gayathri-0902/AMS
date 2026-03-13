import json
from typing import TypedDict, Dict, Any, List, Optional
from langgraph.graph import StateGraph, END
from langchain_ollama import ChatOllama
from langchain_core.prompts import ChatPromptTemplate
from enum import auto, StrEnum
from pydantic import BaseModel, Field
from prompts.assignment_prompts import (
    MCQ_DRAFT_PROMPT, WRITTEN_DRAFT_PROMPT,
    REVISE_MCQ_PROMPT, REVISE_WRITTEN_PROMPT,
    CRITIC_PROMPT
)

class AssignType(StrEnum):
    MCQ = auto()
    WRITTEN = auto()
    CODING = auto()

class MCQQuestion(BaseModel):
    """
    Represents a single Multiple Choice Question.
    """
    question_text : str
    options : List[str]
    correct_answer : str
    explanation : str

class WrittenQuestion(BaseModel):
    """
    Represents a single Written Question.
    """
    question_text : str
    model_answer : str
    explanation  : str

class CodingQuestion(BaseModel):
    """
    Represents a single coding question
    """
    question_text : str
    model_code : str
    algorithm : str
    explanation : str

class MCQAssignment(BaseModel):
    """
    Represents a collection of MCQ Questions.
    """
    topic : str
    questions : List[MCQQuestion]

class WrittenAssignment(BaseModel):
    """
    Represents a collection of Written Questions.
    """
    topic : str
    questions : List[WrittenQuestion]

class CodingAssignment(BaseModel):
    """
    Represents a collection of coding questions.
    """
    topic : str
    questions : List[CodingQuestion]

class AssignState(TypedDict):
    """
    The state dictionary that LangGraph passes between every Node.
    """
    faculty_instructions: str   
    retrieved_context: str
    assignment_type : AssignType  
    current_draft: Dict[str, Any]
    critique_notes: str            
    final: str
    revision_count: int

class QuestionFeedback(BaseModel):
    question_index: int
    passed: bool
    issue: str

class CriticFeedback(BaseModel):
    """
    Represents the feedback from the critic.
    """
    overall_pass: bool
    question_feedback: List[QuestionFeedback]
    summary: str


llm = ChatOllama(
    model = "qwen3:8b",
    temperature=0.5,
    format="json",
    keep_alive=-1,
)

# ---------------------------------------------------------------------------
# Faculty Request Parser
# ---------------------------------------------------------------------------
class AssignmentRequest(BaseModel):
    """Structured representation of a faculty's free-form assignment request."""
    topic: str = Field(description="The core subject matter, e.g., 'Data Analytics'")
    assignment_type: str = Field(description="The format: 'mcq', 'written', or 'coding'")
    quantity: Optional[int] = Field(default=5, description="Number of questions requested")
    additional_instructions: Optional[str] = Field(default=None, description="Any extra constraints or style guides")

_request_parser = llm.with_structured_output(AssignmentRequest)

def parse_faculty_request(free_text: str) -> AssignmentRequest:
    """
    Parses a free-form faculty instruction string into a structured
    AssignmentRequest using the LLM.

    Example:
        parse_faculty_request("Give me 5 MCQs on Neural Networks, medium difficulty")
        → AssignmentRequest(topic='Neural Networks', assignment_type='mcq',
                            quantity=5, additional_instructions='medium difficulty')
    """
    system_msg = (
        "You are a parser. Extract the assignment details from the faculty's request. "
        "assignment_type must be one of: 'mcq', 'written', 'coding'. "
        "Return a valid JSON object only."
    )
    return _request_parser.invoke(f"{system_msg}\n\nFaculty Request: {free_text}")

def draft_assignment(state: AssignState) -> AssignState:
    """
    Drafts an assignment based on the faculty instructions and retrieved context.
    """
    context = state["retrieved_context"]
    instructions = state["faculty_instructions"]
    if state["assignment_type"] == AssignType.MCQ:
        schema = MCQAssignment
        # Define prompt without .invoke yet, so we can pipe it into the chain
        prompt = MCQ_DRAFT_PROMPT
    else:
        # Fallback for Written assignments
        schema = WrittenAssignment
        prompt = WRITTEN_DRAFT_PROMPT

    # 1. Bind Pydantic schema to force structured JSON output
    structured_llm = llm.with_structured_output(schema)

    # 2. Chain prompt and LLM together
    chain = prompt | structured_llm

    # 3. Invoke the chain
    # The dictionary passed here fills in {context} and {instructions} in the prompt
    result = chain.invoke({"context": context, "instructions": instructions})

    # 4. Update the state with the generated Pydantic model (convert to dict)
    return {
        "current_draft": result.model_dump(),
        "revision_count": state.get("revision_count", 0) + 1
    }

def critic_node(state: AssignState) -> AssignState:
    draft = state["current_draft"]
    instructions = state["faculty_instructions"]
    context = state["retrieved_context"]

    structured_critic = llm.with_structured_output(CriticFeedback)
    chain = CRITIC_PROMPT | structured_critic

    feedback = chain.invoke({
        "draft": json.dumps(draft,indent=2),
        "instructions": instructions,
        "context": context
    })

    return {
        "critique_notes": feedback.model_dump_json()
    }

def revise_node(state: AssignState)-> AssignState:
    draft = state["current_draft"]
    critic_notes = state["critique_notes"]
    context = state["retrieved_context"]
    instructions = state["faculty_instructions"]
    if state["assignment_type"] == AssignType.MCQ:
        schema = MCQAssignment
        prompt = REVISE_MCQ_PROMPT
    else:
        schema = WrittenAssignment
        prompt = REVISE_WRITTEN_PROMPT

    structured_llm = llm.with_structured_output(schema)
    chain = prompt | structured_llm

    result = chain.invoke({
        "draft": json.dumps(draft,indent=2),
        "critic_notes": critic_notes,
        "context": context,
        "instructions": instructions
    })
    return {
        "current_draft":result.model_dump(),
        "revision_count":state.get("revision_count",0)+1
    }

def should_continue(state: AssignState) -> str:
    import json
    feedback = json.loads(state["critique_notes"])
    if feedback["overall_pass"] or state["revision_count"] >= 3:
        return "end"
    return "revise"

graph = StateGraph(AssignState)
graph.add_node("draft",draft_assignment)
graph.add_node("critic",critic_node)
graph.add_node("revise",revise_node)
graph.add_edge("draft","critic")
graph.add_edge("revise","critic")
graph.add_conditional_edges(
    "critic",
    should_continue,
    {
        "revise":"revise",
        "end": END
    }
)
graph.set_entry_point("draft")
assignment_agent = graph.compile()
