from typing import TypedDict, List, Dict, Any
from langgraph.graph import StateGraph, END
from src.agents.tools import tool_search_catalog, tool_track_order
from src.guardrails import AIGuardrails

class AgentState(TypedDict):
    query: str
    intent: str
    context: List[str]
    response: str
    is_safe: bool

def node_guardrail_check(state: AgentState) -> Dict[str, Any]:
    is_valid, msg = AIGuardrails.inspect_input(state["query"])
    if not is_valid:
        return {"is_safe": False, "response": msg}
    return {"is_safe": True}

def node_classify_intent(state: AgentState) -> Dict[str, Any]:
    if not state.get("is_safe", True):
        return {}
    q = state["query"].lower()
    if "order" in q or "track" in q:
        intent = "order_tracking"
    elif "policy" in q or "refund" in q or "return" in q:
        intent = "policy_inquiry"
    else:
        intent = "catalog_search"
    return {"intent": intent}

def node_retrieve_knowledge(state: AgentState) -> Dict[str, Any]:
    if not state.get("is_safe", True):
        return {}
    intent = state.get("intent", "catalog_search")
    
    if intent == "order_tracking":
        # Extract potential order ID
        details = tool_track_order("ORD-78901")
        ctx = [f"Order {details['order_id']} is {details['status']} via {details['carrier']}."]
    else:
        hits = tool_search_catalog(state["query"])
        ctx = [h["text"] for h in hits]
    
    return {"context": ctx}

def node_generate_answer(state: AgentState) -> Dict[str, Any]:
    if not state.get("is_safe", True):
        return {}
    
    ctx_text = "\n".join(state.get("context", []))
    raw_answer = (
        f"Thank you for contacting NexusCore Concierge.\n\n"
        f"Based on our catalog & records:\n{ctx_text}\n\n"
        f"Is there anything else regarding our products or orders I can help you with?"
    )
    sanitized = AIGuardrails.sanitize_output(raw_answer)
    return {"response": sanitized}

# Build LangGraph Workflow
def create_concierge_graph():
    workflow = StateGraph(AgentState)
    
    workflow.add_node("guardrails", node_guardrail_check)
    workflow.add_node("classify", node_classify_intent)
    workflow.add_node("retrieve", node_retrieve_knowledge)
    workflow.add_node("generate", node_generate_answer)
    
    workflow.set_entry_point("guardrails")
    
    def route_after_guardrails(state: AgentState):
        return "classify" if state.get("is_safe", True) else END
        
    workflow.add_conditional_edges("guardrails", route_after_guardrails, {
        "classify": "classify",
        END: END
    })
    
    workflow.add_edge("classify", "retrieve")
    workflow.add_edge("retrieve", "generate")
    workflow.add_edge("generate", END)
    
    return workflow.compile()

concierge_graph = create_concierge_graph()
