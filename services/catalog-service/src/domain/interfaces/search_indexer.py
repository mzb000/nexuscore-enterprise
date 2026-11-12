from abc import ABC, abstractmethod
from typing import List, Dict, Any
from src.domain.models.product import Product

class ISearchIndexer(ABC):
    @abstractmethod
    async def index_product(self, product: Product) -> None:
        pass

    @abstractmethod
    async def delete_product(self, product_id: str) -> None:
        pass

    @abstractmethod
    async def search(
        self,
        query: str,
        category: str | None = None,
        min_price: float | None = None,
        max_price: float | None = None,
        skip: int = 0,
        limit: int = 20,
    ) -> Dict[str, Any]:
        pass
