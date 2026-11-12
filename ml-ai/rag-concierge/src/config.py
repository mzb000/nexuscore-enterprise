from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field
from functools import lru_cache

class Settings(BaseSettings):
    PORT: int = Field(default=8001)
    ENVIRONMENT: str = Field(default="development")
    MODEL_NAME: str = Field(default="sentence-transformers/all-MiniLM-L6-v2")
    
    QDRANT_HOST: str = Field(default="localhost")
    QDRANT_PORT: int = Field(default=6333)
    QDRANT_COLLECTION: str = Field(default="nexus_product_embeddings")
    VECTOR_DIMENSION: int = Field(default=384)

    OPENAI_API_KEY: str = Field(default="mock-key-for-local-development")
    LLM_TEMPERATURE: float = Field(default=0.2)
    MAX_TOKENS: int = Field(default=1024)

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

@lru_cache
def get_settings() -> Settings:
    return Settings()
