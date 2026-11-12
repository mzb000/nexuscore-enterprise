from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from strawberry.fastapi import GraphQLRouter

from src.core.config import get_settings
from src.core.logging import setup_logger
from src.infrastructure.db.mongodb import connect_to_mongodb, close_mongodb_connection
from src.infrastructure.search.elasticsearch_indexer import ElasticsearchIndexer
from src.domain.exceptions.catalog_exceptions import CatalogException
from src.presentation.middlewares.error_handler import catalog_exception_handler
from src.presentation.rest.v1.product_router import router as product_router
from src.presentation.graphql.schema import schema as gql_schema

logger = setup_logger("nexuscore-catalog")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing NexusCore Catalog Service...")
    # 1. Connect MongoDB
    await connect_to_mongodb()
    
    # 2. Initialize Elasticsearch Index & Mappings
    indexer = ElasticsearchIndexer()
    await indexer.init_index()
    
    yield
    
    # Graceful Shutdown
    logger.info("Shutting down NexusCore Catalog Service...")
    await close_mongodb_connection()
    await indexer.close()

settings = get_settings()

app = FastAPI(
    title="NexusCore Catalog & Search Service",
    description="High-concurrency async product catalog, full-text Elasticsearch engine, and GraphQL federation subgraph",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception Handlers (RFC 7807)
app.add_exception_handler(CatalogException, catalog_exception_handler)

# REST API v1
app.include_router(product_router, prefix="/api/v1")

# GraphQL Subgraph
graphql_app = GraphQLRouter(gql_schema)
app.include_router(graphql_app, prefix="/graphql")

@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "service": "catalog-service",
        "version": "1.0.0",
        "environment": settings.ENVIRONMENT,
    }
