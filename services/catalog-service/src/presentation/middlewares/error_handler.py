from fastapi import Request
from fastapi.responses import JSONResponse
from src.domain.exceptions.catalog_exceptions import CatalogException, ProductNotFoundException, DuplicateProductSlugException

async def catalog_exception_handler(request: Request, exc: CatalogException) -> JSONResponse:
    status_code = 400
    if isinstance(exc, ProductNotFoundException):
        status_code = 404
    elif isinstance(exc, DuplicateProductSlugException):
        status_code = 409

    return JSONResponse(
        status_code=status_code,
        content={
            "type": f"https://nexuscore.io/errors/{exc.code.lower()}",
            "title": exc.code,
            "status": status_code,
            "detail": exc.message,
            "instance": str(request.url.path),
        },
    )
