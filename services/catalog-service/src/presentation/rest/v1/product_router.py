from fastapi import APIRouter, Depends, Query, status
from typing import List, Dict, Any, Optional
from src.application.dto.product_dto import CreateProductDTO, ProductResponseDTO, SearchQueryDTO
from src.application.use_cases.manage_products import ManageProductsUseCase
from src.application.use_cases.search_products import SearchProductsUseCase
from src.infrastructure.db.mongo_product_repository import MongoProductRepository
from src.infrastructure.search.elasticsearch_indexer import ElasticsearchIndexer

router = APIRouter(prefix="/products", tags=["Catalog & Search"])

# Dependencies
def get_manage_use_case() -> ManageProductsUseCase:
    return ManageProductsUseCase(
        repository=MongoProductRepository(),
        indexer=ElasticsearchIndexer(),
    )

def get_search_use_case() -> SearchProductsUseCase:
    return SearchProductsUseCase(indexer=ElasticsearchIndexer())

@router.post("", response_model=ProductResponseDTO, status_code=status.HTTP_201_CREATED)
async def create_product(
    dto: CreateProductDTO,
    use_case: ManageProductsUseCase = Depends(get_manage_use_case),
):
    """Create a new product catalog item and sync to Elasticsearch index."""
    return await use_case.create_product(dto)

@router.get("/search", response_model=Dict[str, Any])
async def search_products(
    q: str = Query(..., min_length=1, description="Search keyword"),
    category: Optional[str] = Query(None),
    min_price: Optional[float] = Query(None, ge=0.0),
    max_price: Optional[float] = Query(None, ge=0.0),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    use_case: SearchProductsUseCase = Depends(get_search_use_case),
):
    """High-throughput fuzzy full-text search with BM25 ranking and facet filters."""
    dto = SearchQueryDTO(
        q=q,
        category=category,
        min_price=min_price,
        max_price=max_price,
        page=page,
        page_size=page_size,
    )
    return await use_case.execute(dto)

@router.get("/{product_id}", response_model=ProductResponseDTO)
async def get_product(
    product_id: str,
    use_case: ManageProductsUseCase = Depends(get_manage_use_case),
):
    """Get single product details with full variant inventory."""
    return await use_case.get_product(product_id)

@router.get("", response_model=List[ProductResponseDTO])
async def list_products(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    use_case: ManageProductsUseCase = Depends(get_manage_use_case),
):
    """Paginated listing of active products."""
    return await use_case.list_products(skip=skip, limit=limit)
