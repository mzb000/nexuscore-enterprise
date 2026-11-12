from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field
from functools import lru_cache
from typing import List

class Settings(BaseSettings):
    ENVIRONMENT: str = Field(default="development")
    PORT: int = Field(default=8000)
    DEBUG: bool = Field(default=False)
    ALLOWED_ORIGINS: List[str] = Field(default=["*"])

    # MongoDB Settings
    MONGODB_URI: str = Field(default="mongodb://nexus_user:nexus_secret@localhost:27017/nexus_catalog?authSource=admin")
    MONGODB_DB_NAME: str = Field(default="nexus_catalog")
    MONGODB_MAX_POOL_SIZE: int = Field(default=50)
    MONGODB_MIN_POOL_SIZE: int = Field(default=10)

    # Elasticsearch Settings
    ELASTICSEARCH_URL: str = Field(default="http://localhost:9200")
    ELASTICSEARCH_INDEX: str = Field(default="nexus_products_v1")
    ELASTICSEARCH_USERNAME: str = Field(default="elastic")
    ELASTICSEARCH_PASSWORD: str = Field(default="changeme")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

@lru_cache
def get_settings() -> Settings:
    return Settings()
