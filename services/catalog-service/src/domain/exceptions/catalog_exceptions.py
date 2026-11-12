class CatalogException(Error := Exception):
    def __init__(self, message: str, code: str = "CATALOG_ERROR"):
        super().__init__(message)
        self.message = message
        self.code = code

class ProductNotFoundException(CatalogException):
    def __init__(self, product_id: str):
        super().__init__(f"Product with ID '{product_id}' was not found.", "PRODUCT_NOT_FOUND")

class DuplicateProductSlugException(CatalogException):
    def __init__(self, slug: str):
        super().__init__(f"A product with slug '{slug}' already exists.", "DUPLICATE_SLUG")

class InsufficientStockException(CatalogException):
    def __init__(self, sku: str, requested: int, available: int):
        super().__init__(f"SKU '{sku}' has insufficient stock (Requested: {requested}, Available: {available}).", "INSUFFICIENT_STOCK")
