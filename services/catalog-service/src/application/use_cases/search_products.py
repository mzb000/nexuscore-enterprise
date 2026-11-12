from typing import Dict, Any
from src.domain.interfaces.search_indexer import ISearchIndexer
from src.application.dto.product_dto import SearchQueryDTO

class SearchProductsUseCase:
    def __init__(self, indexer: ISearchIndexer):
        self.indexer = indexer

    async def execute(self, query: SearchQueryDTO) -> Dict[str, Any]:
        skip = (query.page - 1) * query.page_size
        results = await self.indexer.search(
            query=query.q,
            category=query.category,
            min_price=query.min_price,
            max_price=query.max_price,
            skip=skip,
            limit=query.page_size,
        )

        return {
            "query": query.q,
            "page": query.page,
            "page_size": query.page_size,
            "total_hits": results.get("total", 0),
            "hits": results.get("items", []),
        }
