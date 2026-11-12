from typing import Optional, List
from src.domain.interfaces.product_repository import IProductRepository
from src.domain.interfaces.search_indexer import ISearchIndexer
from src.domain.models.product import Product, ProductVariant
from src.domain.exceptions.catalog_exceptions import ProductNotFoundException, DuplicateProductSlugException
from src.application.dto.product_dto import CreateProductDTO, ProductResponseDTO, ProductVariantDTO

class ManageProductsUseCase:
    def __init__(self, repository: IProductRepository, indexer: ISearchIndexer):
        self.repo = repository
        self.indexer = indexer

    async def create_product(self, dto: CreateProductDTO) -> ProductResponseDTO:
        # Check slug uniqueness
        existing = await self.repo.get_by_slug(dto.slug)
        if existing:
            raise DuplicateProductSlugException(dto.slug)

        variants = [
            ProductVariant(
                sku=v.sku,
                name=v.name,
                price=v.price,
                stock_quantity=v.stock_quantity,
                attributes=v.attributes,
            )
            for v in dto.variants
        ]

        product = Product.create(
            title=dto.title,
            slug=dto.slug,
            description=dto.description,
            category=dto.category,
            tags=dto.tags,
            base_price=dto.base_price,
            variants=variants,
            metadata=dto.metadata,
        )

        saved = await self.repo.create(product)
        # Asynchronously sync to Elasticsearch
        await self.indexer.index_product(saved)

        return self._to_dto(saved)

    async def get_product(self, product_id: str) -> ProductResponseDTO:
        product = await self.repo.get_by_id(product_id)
        if not product:
            raise ProductNotFoundException(product_id)
        return self._to_dto(product)

    async def list_products(self, skip: int = 0, limit: int = 20) -> List[ProductResponseDTO]:
        products = await self.repo.list_products(skip, limit)
        return [self._to_dto(p) for p in products]

    def _to_dto(self, p: Product) -> ProductResponseDTO:
        return ProductResponseDTO(
            id=p.id,
            title=p.title,
            slug=p.slug,
            description=p.description,
            category=p.category,
            tags=p.tags,
            base_price=p.base_price,
            variants=[
                ProductVariantDTO(
                    sku=v.sku,
                    name=v.name,
                    price=v.price,
                    stock_quantity=v.stock_quantity,
                    attributes=v.attributes,
                )
                for v in p.variants
            ],
            is_active=p.is_active,
            total_stock=p.total_stock(),
            created_at=p.created_at,
            updated_at=p.updated_at,
            metadata=p.metadata,
        )
