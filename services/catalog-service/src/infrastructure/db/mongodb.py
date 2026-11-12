from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from typing import Optional
from src.core.config import get_settings
from src.core.logging import setup_logger

logger = setup_logger(__name__)

class MongoDBManager:
    client: Optional[AsyncIOMotorClient] = None
    db: Optional[AsyncIOMotorDatabase] = None

mongodb_manager = MongoDBManager()

async def connect_to_mongodb():
    settings = get_settings()
    logger.info("Connecting to MongoDB Replica/Standalone...")
    mongodb_manager.client = AsyncIOMotorClient(
        settings.MONGODB_URI,
        maxPoolSize=settings.MONGODB_MAX_POOL_SIZE,
        minPoolSize=settings.MONGODB_MIN_POOL_SIZE,
    )
    mongodb_manager.db = mongodb_manager.client[settings.MONGODB_DB_NAME]
    
    # Ensure indexes on collection
    products_col = mongodb_manager.db["products"]
    await products_col.create_index("slug", unique=True)
    await products_col.create_index("category")
    await products_col.create_index("tags")
    logger.info("Connected to MongoDB successfully and verified indexes.")

async def close_mongodb_connection():
    if mongodb_manager.client:
        logger.info("Closing MongoDB connection pool...")
        mongodb_manager.client.close()
