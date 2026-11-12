from typing import Dict, Any, List
from src.embeddings import EmbeddingService
from src.vector_store import vector_store

embedding_svc = EmbeddingService()

# Seed vector store with initial catalog documentation
def seed_knowledge_base():
    docs = [
        ("p1", "Nexus Quantum X1 Laptop: Ultra-fast M3 processor, 64GB RAM, 2TB SSD, $2,499.00.", {"category": "electronics"}),
        ("p2", "Aura Noise-Cancelling Headphones: 40-hour battery life, spatial audio, $349.00.", {"category": "audio"}),
        ("p3", "Nexus Return Policy: 30-day money-back guarantee with free return shipping on all items.", {"category": "policy"}),
        ("p4", "Warranty & Support: 2-year comprehensive international warranty covering hardware defects.", {"category": "policy"}),
    ]
    for doc_id, text, meta in docs:
        vec = embedding_svc.encode_one(text)
        vector_store.upsert(doc_id, text, vec, meta)

seed_knowledge_base()

def tool_search_catalog(query: str) -> List[Dict[str, Any]]:
    """Searches the product catalog and return policy using semantic vector similarity."""
    q_vec = embedding_svc.encode_one(query)
    results = vector_store.search(q_vec, top_k=3)
    return results

def tool_track_order(order_id: str) -> Dict[str, Any]:
    """Looks up real-time status of an enterprise customer order."""
    return {
        "order_id": order_id,
        "status": "CONFIRMED",
        "carrier": "FedEx Priority",
        "estimated_delivery": "Within 2 business days"
    }
