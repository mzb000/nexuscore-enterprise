import numpy as np
from typing import List
from src.config import get_settings

class EmbeddingService:
    def __init__(self):
        self.settings = get_settings()
        self.dim = self.settings.VECTOR_DIMENSION
        self._model = None

    def _get_model(self):
        if self._model is None:
            try:
                from sentence_transformers import SentenceTransformer
                self._model = SentenceTransformer(self.settings.MODEL_NAME)
            except Exception:
                self._model = None
        return self._model

    def encode(self, texts: List[str]) -> List[List[float]]:
        model = self._get_model()
        if model is not None:
            embeddings = model.encode(texts, normalize_embeddings=True)
            return embeddings.tolist()
        
        # Deterministic fallback embedding for hermetic tests/offline builds
        vectors = []
        for text in texts:
            seed = sum(ord(c) for c in text) % 10000
            np.random.seed(seed)
            vec = np.random.randn(self.dim).astype(np.float32)
            vec /= np.linalg.norm(vec)
            vectors.append(vec.tolist())
        return vectors

    def encode_one(self, text: str) -> List[float]:
        return self.encode([text])[0]
