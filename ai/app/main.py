from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from typing import List
from pydantic import BaseModel

from .database import init_db, close_db
from .services import find_similar_products, ensure_product_embedding, generate_all_embeddings
from .config import get_settings

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    await init_db()
    yield
    await close_db()


app = FastAPI(
    title="Product Recommendation API",
    description="AI-powered product similarity using pgvector",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ────────────────────────────────────────────────────────────
# Schemas
# ────────────────────────────────────────────────────────────

class SimilarProductsResponse(BaseModel):
    success: bool
    product_id: str
    similar_ids: List[str]
    count: int


class GenerateEmbeddingsResponse(BaseModel):
    success: bool
    generated: int
    message: str


# ────────────────────────────────────────────────────────────
# Endpoints
# ────────────────────────────────────────────────────────────

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}


@app.get("/similar/{product_id}", response_model=SimilarProductsResponse)
async def get_similar_products(
    product_id: str,
    limit: int = Query(default=10, ge=1, le=50, description="Number of similar products to return"),
):
    """
    Get similar products for a given product ID.

    Returns a list of product IDs sorted by similarity (most similar first).
    """
    try:
        similar_ids = await find_similar_products(product_id, limit=limit)

        return SimilarProductsResponse(
            success=True,
            product_id=product_id,
            similar_ids=similar_ids,
            count=len(similar_ids),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/embeddings/generate", response_model=GenerateEmbeddingsResponse)
async def generate_embeddings():
    """
    Generate embeddings for all products that don't have one.

    This should be called:
    - Initially to populate embeddings for existing products
    - Periodically via cron to catch new products
    """
    try:
        result = await generate_all_embeddings()

        return GenerateEmbeddingsResponse(
            success=True,
            generated=result["generated"],
            message=f"Generated embeddings for {result['generated']} products",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/embeddings/{product_id}")
async def generate_single_embedding(product_id: str):
    """Generate or update embedding for a single product."""
    try:
        embedding = await ensure_product_embedding(product_id)

        if not embedding:
            raise HTTPException(status_code=404, detail="Product not found")

        return {
            "success": True,
            "product_id": product_id,
            "message": "Embedding generated successfully",
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=True,
    )
