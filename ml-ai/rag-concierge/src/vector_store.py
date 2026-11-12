from typing import List, Dict, Any
import numpy as np

class InMemoryVectorStore:
    def __init__(self):
        self.documents: List[Dict[str, Any]] = []
        self.embeddings: List[np.ndarray] = []

    def upsert(self, doc_id: str, text: str, vector: List[float], metadata: Dict[str, Any] = None):
        vec = np.array(vector, dtype=np.float32)
        norm = np.linalg.norm(vec)
        if norm > 0:
            vec = vec / norm
        
        self.documents.append({
            "id": doc_id,
            "text": text,
            "metadata": metadata or {}
        })
        self.embeddings.append(vec)

    def search(self, query_vector: List[float], top_k: int = 5) -> List[Dict[str, Any]]:
        if not self.embeddings:
            return []
        
        q_vec = np.array(query_vector, dtype=np.float32)
        q_norm = np.linalg.norm(q_vec)
        if q_norm > 0:
            q_vec = q_vec / q_norm

        matrix = np.vstack(self.embeddings)
        scores = np.dot(matrix, q_vec)
        top_indices = np.argsort(scores)[::-1][:top_k]

        results = []
        for idx in top_indices:
            results.append({
                "id": self.documents[idx]["id"],
                "text": self.documents[idx]["text"],
                "score": float(scores[idx]),
                "metadata": self.documents[idx]["metadata"],
            })
        return results

# Global singleton
vector_store = InMemoryVectorStore()
