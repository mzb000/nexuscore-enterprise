from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional
import time

from src.config import get_settings
from src.agents.graph import concierge_graph
from src.agents.tools import tool_search_catalog

settings = get_settings()

app = FastAPI(
    title="NexusCore AI Concierge & Hybrid RAG Engine",
    description="Stateful LangGraph multi-agent customer support, vector search, and AI security guardrails",
    version="1.0.0",
)

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatCompletionRequest(BaseModel):
    messages: List[ChatMessage]
    temperature: Optional[float] = 0.2
    max_tokens: Optional[int] = 1024

class VectorSearchRequest(BaseModel):
    query: str = Field(..., min_length=1)
    top_k: int = Field(default=3, ge=1, le=10)

@app.post("/v1/chat/completions")
async def chat_completions(req: ChatCompletionRequest):
    if not req.messages:
        raise HTTPException(status_code=400, detail="At least one message is required.")
    
    last_user_msg = next((m.content for m in reversed(req.messages) if m.role == "user"), None)
    if not last_user_msg:
        raise HTTPException(status_code=400, detail="No user message found in history.")

    initial_state = {
        "query": last_user_msg,
        "intent": "",
        "context": [],
        "response": "",
        "is_safe": True,
    }

    # Execute LangGraph Cyclical Pipeline
    final_state = await concierge_graph.ainvoke(initial_state)

    return {
        "id": f"chatcmpl-{int(time.time())}",
        "object": "chat.completion",
        "created": int(time.time()),
        "model": "nexuscore-agent-v1",
        "choices": [
            {
                "index": 0,
                "message": {
                    "role": "assistant",
                    "content": final_state.get("response", "No response generated."),
                },
                "finish_reason": "stop"
            }
        ],
        "metadata": {
            "intent": final_state.get("intent"),
            "retrieved_chunks": len(final_state.get("context", [])),
            "guardrail_status": "PASSED" if final_state.get("is_safe") else "BLOCKED",
        }
    }

@app.post("/v1/vector/search")
async def vector_search(req: VectorSearchRequest):
    results = tool_search_catalog(req.query)
    return {"query": req.query, "results": results[:req.top_k]}

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "service": "rag-concierge",
        "version": "1.0.0",
        "model": settings.MODEL_NAME,
    }
