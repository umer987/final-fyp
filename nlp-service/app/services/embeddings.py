"""Sentence-Transformers embeddings (multilingual, runs locally)."""
from __future__ import annotations

from functools import lru_cache

from app.config import settings

try:
    from sentence_transformers import SentenceTransformer
except Exception as _st_import_err:  # pragma: no cover - missing until deps installed
    SentenceTransformer = None  # type: ignore[assignment]
    _SENTENCE_TRANSFORMERS_IMPORT_ERROR: BaseException | None = _st_import_err
else:
    _SENTENCE_TRANSFORMERS_IMPORT_ERROR = None


def embeddings_available() -> bool:
    """True when sentence-transformers can be imported (required for /ask RAG)."""
    return SentenceTransformer is not None


def embeddings_import_error() -> str | None:
    """Human-readable import failure, or None when embeddings are ready."""
    if SentenceTransformer is not None:
        return None
    detail = str(_SENTENCE_TRANSFORMERS_IMPORT_ERROR or "unknown import error")
    if "tf_keras" in detail or "tf-keras" in detail:
        return (
            "sentence-transformers failed to import (missing tf-keras). "
            "Run: pip install -r requirements.txt"
        )
    return f"sentence-transformers failed to import: {detail}"


@lru_cache
def _get_model() -> "SentenceTransformer":
    """Load (and cache) the embedding model. First call downloads weights."""
    if SentenceTransformer is None:
        hint = embeddings_import_error() or "Run: pip install -r requirements.txt"
        raise RuntimeError(hint)
    return SentenceTransformer(settings.embedding_model)


def embed_texts(texts: list[str]) -> list[list[float]]:
    """Embed a list of strings into a list of float vectors."""
    if not texts:
        return []
    model = _get_model()
    vectors = model.encode(texts, convert_to_numpy=True, show_progress_bar=False)
    return vectors.tolist()


def embed_query(text: str) -> list[float]:
    """Embed a single query string into one vector."""
    return embed_texts([text])[0]
