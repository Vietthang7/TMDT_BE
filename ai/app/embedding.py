from sentence_transformers import SentenceTransformer
from functools import lru_cache
import numpy as np

from .config import get_settings

settings = get_settings()


@lru_cache()
def get_model() -> SentenceTransformer:
    """Load and cache the embedding model."""
    return SentenceTransformer(settings.EMBEDDING_MODEL)


def generate_embedding(text: str) -> list[float]:
    """Generate embedding vector for text."""
    model = get_model()
    embedding = model.encode(text, convert_to_numpy=True)
    return embedding.tolist()


def generate_product_text(product: dict) -> str:
    """Generate text representation of a product for embedding."""
    parts = []

    if product.get("name"):
        parts.append(product["name"])

    if product.get("description"):
        parts.append(product["description"])

    if product.get("category_names"):
        parts.append(f"Categories: {', '.join(product['category_names'])}")

    if product.get("tags"):
        parts.append(f"Tags: {', '.join(product['tags'])}")

    return " | ".join(parts)
