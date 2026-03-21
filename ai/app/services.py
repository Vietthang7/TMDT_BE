from typing import List, Optional
import numpy as np

from .database import get_connection
from .embedding import generate_embedding, generate_product_text
from .config import get_settings

settings = get_settings()


async def get_product_by_id(product_id: str) -> Optional[dict]:
    """Get product details from database."""
    async with get_connection() as conn:
        row = await conn.fetchrow(
            """
            SELECT
                p.id, p.name, p.description, p.tags,
                ARRAY_AGG(c.name) FILTER (WHERE c.name IS NOT NULL) as category_names
            FROM products p
            LEFT JOIN product_categories pc ON p.id = pc.product_id
            LEFT JOIN categories c ON pc.category_id = c.id
            WHERE p.id = $1
            GROUP BY p.id
            """,
            product_id,
        )
        if row:
            return dict(row)
        return None


async def get_product_embedding(product_id: str) -> Optional[list]:
    """Get existing embedding for a product."""
    async with get_connection() as conn:
        row = await conn.fetchrow(
            "SELECT embedding FROM product_embeddings WHERE product_id = $1",
            product_id,
        )
        if row and row["embedding"]:
            return row["embedding"]
        return None


async def save_product_embedding(product_id: str, embedding: list):
    """Save or update product embedding."""
    async with get_connection() as conn:
        await conn.execute(
            """
            INSERT INTO product_embeddings (product_id, embedding, updated_at)
            VALUES ($1, $2, NOW())
            ON CONFLICT (product_id)
            DO UPDATE SET embedding = $2, updated_at = NOW()
            """,
            product_id,
            embedding,
        )


async def ensure_product_embedding(product_id: str) -> Optional[list]:
    """Ensure product has embedding, generate if missing."""
    # Check existing
    embedding = await get_product_embedding(product_id)
    if embedding:
        return embedding

    # Get product details
    product = await get_product_by_id(product_id)
    if not product:
        return None

    # Generate embedding
    text = generate_product_text(product)
    embedding = generate_embedding(text)

    # Save embedding
    await save_product_embedding(product_id, embedding)

    return embedding


async def find_similar_products(
    product_id: str,
    limit: int = 10,
    exclude_self: bool = True,
) -> List[str]:
    """Find similar products using vector similarity."""
    # Ensure source product has embedding
    source_embedding = await ensure_product_embedding(product_id)
    if not source_embedding:
        return []

    async with get_connection() as conn:
        # Query similar products using cosine distance
        if exclude_self:
            rows = await conn.fetch(
                """
                SELECT pe.product_id::text as id
                FROM product_embeddings pe
                JOIN products p ON pe.product_id = p.id
                WHERE pe.product_id != $1
                  AND p."deletedAt" IS NULL
                ORDER BY pe.embedding <=> $2
                LIMIT $3
                """,
                product_id,
                source_embedding,
                limit,
            )
        else:
            rows = await conn.fetch(
                """
                SELECT pe.product_id::text as id
                FROM product_embeddings pe
                JOIN products p ON pe.product_id = p.id
                WHERE p."deletedAt" IS NULL
                ORDER BY pe.embedding <=> $2
                LIMIT $3
                """,
                product_id,
                source_embedding,
                limit,
            )

        return [row["id"] for row in rows]


async def generate_all_embeddings() -> dict:
    """Generate embeddings for all products that don't have one."""
    async with get_connection() as conn:
        # Get products without embeddings
        rows = await conn.fetch(
            """
            SELECT
                p.id, p.name, p.description, p.tags,
                ARRAY_AGG(c.name) FILTER (WHERE c.name IS NOT NULL) as category_names
            FROM products p
            LEFT JOIN product_categories pc ON p.id = pc.product_id
            LEFT JOIN categories c ON pc.category_id = c.id
            LEFT JOIN product_embeddings pe ON p.id = pe.product_id
            WHERE pe.id IS NULL AND p."deletedAt" IS NULL
            GROUP BY p.id
            """
        )

        generated = 0
        for row in rows:
            product = dict(row)
            text = generate_product_text(product)
            embedding = generate_embedding(text)
            await save_product_embedding(str(product["id"]), embedding)
            generated += 1

        return {"generated": generated, "total_products": len(rows)}
