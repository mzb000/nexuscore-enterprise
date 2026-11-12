from pydantic import BaseModel, Field, ConfigDict
from typing import List, Dict, Any, Optional
from datetime import datetime

class ProductVariantDTO(BaseModel):
    sku: str = Field(..., min_length=3, max_length=50)
    name: str = Field(..., min_length=2, max_length=100)
    price: float = Field(..., ge=0.0)
    stock_quantity: int = Field(..., ge=0)
    attributes: Dict[str, str] = Field(default_factory=dict)

    model_config = ConfigDict(from_attributes=True)

class CreateProductDTO(BaseModel):
    title: str = Field(..., min_length=3, max_length=255)
    slug: str = Field(..., min_length=3, max_length=255, pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    description: str = Field(..., min_length=10)
    category: str = Field(..., min_length=2, max_length=100)
    tags: List[str] = Field(default_factory=list)
    base_price: float = Field(..., ge=0.0)
    variants: List[ProductVariantDTO] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)

class ProductResponseDTO(BaseModel):
    id: str
    title: str
    slug: str
    description: str
    category: str
    tags: List[str]
    base_price: float
    variants: List[ProductVariantDTO]
    is_active: bool
    total_stock: int
    created_at: datetime
    updated_at: datetime
    metadata: Dict[str, Any]

    model_config = ConfigDict(from_attributes=True)

class SearchQueryDTO(BaseModel):
    q: str = Field(..., min_length=1, max_length=200)
    category: Optional[str] = None
    min_price: Optional[float] = Field(default=None, ge=0.0)
    max_price: Optional[float] = Field(default=None, ge=0.0)
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)
