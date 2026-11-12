from typing import Optional, List
from src.domain.interfaces.product_repository import IProductRepository
from src.domain.models.product import Product, ProductVariant
from src.infrastructure.db.mongodb import mongodb_manager

class MongoProductRepository(IProductRepository):
    @property
    def collection(self):
        return mongodb_manager.db["products"]

    async def get_by_id(self, product_id: str) -> Optional[Product]:
        doc = await self.collection.find_one({"id": product_id})
        return self._to_entity(doc) if doc else None

    async def get_by_slug(self, slug: str) -> Optional[Product]:
        doc = await self.collection.find_one({"slug": slug})
        return self._to_entity(doc) if doc else None

    async def create(self, product: Product) -> Product:
        doc = self._to_doc(product)
        await self.collection.insert_one(doc)
        return product

    async def update(self, product: Product) -> Product:
        doc = self._to_doc(product)
        await self.collection.replace_one({"id": product.id}, doc)
        return product

    async def delete(self, product_id: str) -> bool:
        res = await self.collection.delete_one({"id": product_id})
        return res.deleted_count > 0

    async def list_products(self, skip: int = 0, limit: int = 20) -> List[Product]:
        cursor = self.collection.find().skip(skip).limit(limit)
        docs = await cursor.to_list(length=limit)
        return [self._to_entity(d) for d in docs]

    def _to_doc(self, p: Product) -> dict:
        return {
            "id": p.id,
            "title": p.title,
            "slug": p.slug,
            "description": p.description,
            "category": p.category,
            "tags": p.tags,
            "base_price": p.base_price,
            "variants": [
                {
                    "sku": v.sku,
                    "name": v.name,
                    "price": v.price,
                    "stock_quantity": v.stock_quantity,
                    "attributes": v.attributes,
                }
                for v in p.variants
            ],
            "is_active": p.is_active,
            "created_at": p.created_at,
            "updated_at": p.updated_at,
            "metadata": p.metadata,
        }

    def _to_entity(self, d: dict) -> Product:
        return Product(
            id=d["id"],
            title=d["title"],
            slug=d["slug"],
            description=d["description"],
            category=d["category"],
            tags=d.get("tags", []),
            base_price=d["base_price"],
            variants=[
                ProductVariant(
                    sku=v["sku"],
                    name=v["name"],
                    price=v["price"],
                    stock_quantity=v["stock_quantity"],
                    attributes=v.get("attributes", {}),
                )
                for v in d.get("variants", [])
            ],
            is_active=d.get("is_active", True),
            created_at=d["created_at"],
            updated_at=d["updated_at"],
            metadata=d.get("metadata", {}),
        )
