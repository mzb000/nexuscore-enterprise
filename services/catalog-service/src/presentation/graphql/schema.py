import strawberry
from typing import List, Optional
from src.infrastructure.db.mongo_product_repository import MongoProductRepository

@strawberry.type
class GQLProductVariant:
    sku: str
    name: str
    price: float
    stock_quantity: int

@strawberry.type
class GQLProduct:
    id: str
    title: str
    slug: str
    description: str
    category: str
    tags: List[str]
    base_price: float
    is_active: bool
    variants: List[GQLProductVariant]

    @strawberry.field
    def total_stock(self) -> int:
        return sum(v.stock_quantity for v in self.variants)

@strawberry.type
class Query:
    @strawberry.field
    async def product(self, id: str) -> Optional[GQLProduct]:
        repo = MongoProductRepository()
        p = await repo.get_by_id(id)
        if not p:
            return None
        return GQLProduct(
            id=p.id,
            title=p.title,
            slug=p.slug,
            description=p.description,
            category=p.category,
            tags=p.tags,
            base_price=p.base_price,
            is_active=p.is_active,
            variants=[
                GQLProductVariant(
                    sku=v.sku,
                    name=v.name,
                    price=v.price,
                    stock_quantity=v.stock_quantity,
                )
                for v in p.variants
            ],
        )

    @strawberry.field
    async def products(self, skip: int = 0, limit: int = 20) -> List[GQLProduct]:
        repo = MongoProductRepository()
        items = await repo.list_products(skip=skip, limit=limit)
        return [
            GQLProduct(
                id=p.id,
                title=p.title,
                slug=p.slug,
                description=p.description,
                category=p.category,
                tags=p.tags,
                base_price=p.base_price,
                is_active=p.is_active,
                variants=[
                    GQLProductVariant(
                        sku=v.sku,
                        name=v.name,
                        price=v.price,
                        stock_quantity=v.stock_quantity,
                    )
                    for v in p.variants
                ],
            )
            for p in items
        ]

schema = strawberry.Schema(query=Query)
