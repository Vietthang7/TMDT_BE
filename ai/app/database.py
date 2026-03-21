import asyncpg
from pgvector.asyncpg import register_vector
from contextlib import asynccontextmanager
from typing import Optional

from .config import get_settings

settings = get_settings()

pool: Optional[asyncpg.Pool] = None


async def init_db():
    """Initialize database connection pool and pgvector extension."""
    global pool
    pool = await asyncpg.create_pool(
        settings.database_url,
        min_size=2,
        max_size=10,
        init=register_vector,
    )

    # Enable pgvector extension
    async with pool.acquire() as conn:
        await conn.execute("CREATE EXTENSION IF NOT EXISTS vector")

        # Create embeddings table if not exists
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS product_embeddings (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                product_id UUID NOT NULL UNIQUE,
                embedding vector(384),
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        """)

        # Create index for faster similarity search
        await conn.execute("""
            CREATE INDEX IF NOT EXISTS product_embeddings_idx
            ON product_embeddings
            USING ivfflat (embedding vector_cosine_ops)
            WITH (lists = 100)
        """)


async def close_db():
    """Close database connection pool."""
    global pool
    if pool:
        await pool.close()


def get_pool() -> asyncpg.Pool:
    """Get database connection pool."""
    if not pool:
        raise RuntimeError("Database pool not initialized")
    return pool


@asynccontextmanager
async def get_connection():
    """Get a database connection from pool."""
    async with get_pool().acquire() as conn:
        yield conn
