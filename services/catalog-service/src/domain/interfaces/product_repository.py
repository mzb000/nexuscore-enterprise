from abc import ABC, abstractmethod
from typing import Optional, List
from src.domain.models.product import Product

class IProductRepository(ABC):
    @abstractmethod
    async def get_by_id(self, product_id: str) -> Optional[Product]:
        pass

    @abstractmethod
    async def get_by_slug(self, slug: str) -> Optional[Product]:
        pass

    @abstractmethod
    async def create(self, product: Product) -> Product:
        pass

    @abstractmethod
    async def update(self, product: Product) -> Product:
        pass

    @abstractmethod
    async def delete(self, product_id: str) -> bool:
        pass

    @abstractmethod
    async def list_products(self, skip: int = 0, limit: int = 20) -> List[Product]:
        pass
