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

    # Enable pgvector extension BEFORE creating the pool with register_vector,
    # because register_vector (used as pool init hook) requires the type to exist.
    temp_conn = await asyncpg.connect(settings.database_url)
    try:
        await temp_conn.execute("CREATE EXTENSION IF NOT EXISTS vector")
    finally:
        await temp_conn.close()

    pool = await asyncpg.create_pool(
        settings.database_url,
        min_size=2,
        max_size=10,
        init=register_vector,
    )

    async with pool.acquire() as conn:

        # Check if table exists and has correct dimension
        dim_check = await conn.fetchval("""
            SELECT atttypmod FROM pg_attribute a
            JOIN pg_class c ON a.attrelid = c.oid
            WHERE c.relname = 'product_embeddings'
            AND a.attname = 'embedding'
        """)

        expected_dim = settings.EMBEDDING_DIMENSION

        if dim_check is not None and dim_check != expected_dim:
            # Dimension changed, need to recreate table
            await conn.execute("DROP TABLE IF EXISTS product_embeddings")
            dim_check = None

        if dim_check is None:
            # Create table with correct dimension
            await conn.execute(f"""
                CREATE TABLE IF NOT EXISTS product_embeddings (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    product_id UUID NOT NULL UNIQUE,
                    embedding vector({expected_dim}),
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
