"""
Multi-Modal Visual Search Engine using PyTorch & TorchVision.
Extracts 512-dimensional semantic visual embeddings from product images for reverse image search.
"""

import torch
import torch.nn as nn
from torchvision import models, transforms
from typing import List, Tuple
import numpy as np

class VisualEmbeddingExtractor:
    def __init__(self, device: str = None):
        self.device = device or ("cuda" if torch.cuda.is_available() else "cpu")
        print(f"Initializing PyTorch Visual Search Engine on device: {self.device}")
        
        # Load pre-trained ResNet-18/50 backbone
        weights = models.ResNet18_Weights.DEFAULT
        base_model = models.resnet18(weights=weights)
        
        # Strip final classification FC layer to extract 512-dim feature embedding vector
        self.feature_extractor = nn.Sequential(*list(base_model.children())[:-1])
        self.feature_extractor.to(self.device)
        self.feature_extractor.eval()

        self.transform = transforms.Compose([
            transforms.Resize(256),
            transforms.CenterCrop(224),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ])

    @torch.no_grad()
    def extract_embedding_tensor(self, img_tensor: torch.Tensor) -> np.ndarray:
        """Extracts and L2-normalizes visual feature vectors."""
        if len(img_tensor.shape) == 3:
            img_tensor = img_tensor.unsqueeze(0)
            
        img_tensor = img_tensor.to(self.device)
        features = self.feature_extractor(img_tensor)
        flattened = features.squeeze().cpu().numpy()
        
        # L2-normalization for cosine distance
        norm = np.linalg.norm(flattened)
        if norm > 0:
            flattened = flattened / norm
        return flattened

    def search_similar(
        self,
        query_vector: np.ndarray,
        catalog_vectors: np.ndarray,
        top_k: int = 5
    ) -> List[Tuple[int, float]]:
        """Cosine similarity visual ranking."""
        scores = np.dot(catalog_vectors, query_vector)
        top_indices = np.argsort(scores)[::-1][:top_k]
        return [(int(idx), float(scores[idx])) for idx in top_indices]

if __name__ == "__main__":
    extractor = VisualEmbeddingExtractor()
    # Simulate RGB synthetic test image (3 channels, 224x224)
    dummy_image = torch.rand(3, 224, 224)
    embedding = extractor.extract_embedding_tensor(dummy_image)
    print(f"Extracted Visual Vector Dimension: {embedding.shape} (Expected: 512)")
    print(f"L2 Norm check: {np.linalg.norm(embedding):.4f}")
