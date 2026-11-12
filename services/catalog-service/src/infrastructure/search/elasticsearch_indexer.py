from elasticsearch import AsyncElasticsearch
from typing import Dict, Any
from src.core.config import get_settings
from src.core.logging import setup_logger
from src.domain.interfaces.search_indexer import ISearchIndexer
from src.domain.models.product import Product

logger = setup_logger(__name__)

class ElasticsearchIndexer(ISearchIndexer):
    def __init__(self):
        settings = get_settings()
        self.index_name = settings.ELASTICSEARCH_INDEX
        self.client = AsyncElasticsearch(
            settings.ELASTICSEARCH_URL,
            basic_auth=(settings.ELASTICSEARCH_USERNAME, settings.ELASTICSEARCH_PASSWORD)
            if settings.ELASTICSEARCH_USERNAME else None,
            verify_certs=False,
            request_timeout=5,
        )

    async def init_index(self):
        try:
            exists = await self.client.indices.exists(index=self.index_name)
            if not exists:
                logger.info(f"Creating Elasticsearch index: {self.index_name}")
                mapping = {
                    "settings": {
                        "analysis": {
                            "tokenizer": {
                                "edge_ngram_tokenizer": {
                                    "type": "edge_ngram",
                                    "min_gram": 2,
                                    "max_gram": 15,
                                    "token_chars": ["letter", "digit"]
                                }
                            },
                            "analyzer": {
                                "autocomplete_analyzer": {
                                    "type": "custom",
                                    "tokenizer": "edge_ngram_tokenizer",
                                    "filter": ["lowercase"]
                                }
                            }
                        }
                    },
                    "mappings": {
                        "properties": {
                            "id": {"type": "keyword"},
                            "title": {
                                "type": "text",
                                "analyzer": "standard",
                                "fields": {
                                    "autocomplete": {
                                        "type": "text",
                                        "analyzer": "autocomplete_analyzer",
                                        "search_analyzer": "standard"
                                    }
                                }
                            },
                            "description": {"type": "text"},
                            "category": {"type": "keyword"},
                            "tags": {"type": "keyword"},
                            "base_price": {"type": "float"},
                            "is_active": {"type": "boolean"},
                        }
                    }
                }
                await self.client.indices.create(index=self.index_name, body=mapping)
                logger.info("Elasticsearch index created successfully.")
        except Exception as e:
            logger.warn(f"Elasticsearch index init notice (non-fatal for offline dev): {e}")

    async def index_product(self, product: Product) -> None:
        try:
            body = {
                "id": product.id,
                "title": product.title,
                "slug": product.slug,
                "description": product.description,
                "category": product.category,
                "tags": product.tags,
                "base_price": product.base_price,
                "is_active": product.is_active,
            }
            await self.client.index(index=self.index_name, id=product.id, document=body)
        except Exception as e:
            logger.error(f"Failed to index product in Elasticsearch: {e}")

    async def delete_product(self, product_id: str) -> None:
        try:
            await self.client.delete(index=self.index_name, id=product_id, ignore=[404])
        except Exception as e:
            logger.error(f"Failed to delete product from Elasticsearch: {e}")

    async def search(
        self,
        query: str,
        category: str | None = None,
        min_price: float | None = None,
        max_price: float | None = None,
        skip: int = 0,
        limit: int = 20,
    ) -> Dict[str, Any]:
        try:
            must_clauses = [
                {
                    "multi_match": {
                        "query": query,
                        "fields": ["title^3", "title.autocomplete^2", "tags^2", "description"],
                        "fuzziness": "AUTO",
                    }
                }
            ]

            filter_clauses = [{"term": {"is_active": True}}]
            if category:
                filter_clauses.append({"term": {"category": category}})
            if min_price is not None or max_price is not None:
                price_range: Dict[str, Any] = {}
                if min_price is not None:
                    price_range["gte"] = min_price
                if max_price is not None:
                    price_range["lte"] = max_price
                filter_clauses.append({"range": {"base_price": price_range}})

            search_body = {
                "query": {
                    "bool": {
                        "must": must_clauses,
                        "filter": filter_clauses,
                    }
                },
                "from": skip,
                "size": limit,
            }

            resp = await self.client.search(index=self.index_name, body=search_body)
            total = resp["hits"]["total"]["value"]
            items = [hit["_source"] for hit in resp["hits"]["hits"]]

            return {"total": total, "items": items}
        except Exception as e:
            logger.error(f"Elasticsearch search error: {e}")
            return {"total": 0, "items": []}

    async def close(self):
        await self.client.close()
