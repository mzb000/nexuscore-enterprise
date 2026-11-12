from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
import uuid

@dataclass
class ProductVariant:
    sku: str
    name: str
    price: float
    stock_quantity: int
    attributes: Dict[str, str] = field(default_factory=dict)

@dataclass
class Product:
    id: str
    title: str
    slug: str
    description: str
    category: str
    tags: List[str]
    base_price: float
    variants: List[ProductVariant]
    is_active: bool
    created_at: datetime
    updated_at: datetime
    metadata: Dict[str, Any] = field(default_factory=dict)

    @classmethod
    def create(
        cls,
        title: str,
        slug: str,
        description: str,
        category: str,
        tags: List[str],
        base_price: float,
        variants: Optional[List[ProductVariant]] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> "Product":
        now = datetime.now(timezone.utc)
        return cls(
            id=str(uuid.uuid4()),
            title=title,
            slug=slug,
            description=description,
            category=category,
            tags=tags or [],
            base_price=base_price,
            variants=variants or [],
            is_active=True,
            created_at=now,
            updated_at=now,
            metadata=metadata or {},
        )

    def total_stock(self) -> int:
        return sum(v.stock_quantity for v in self.variants)
