"""ChromaDB persistent vector store for retrieval (RAG)."""
from __future__ import annotations

import os

# Disable Chroma/posthog telemetry before chromadb import (posthog API mismatch
# otherwise logs "capture() takes 1 positional argument but 3 were given" on every query).
os.environ.setdefault("ANONYMIZED_TELEMETRY", "False")
os.environ.setdefault("CHROMA_TELEMETRY", "False")

# chromadb 0.6.x calls posthog.capture(event, props) but posthog 6.x changed the API.
try:
    import posthog

    posthog.capture = lambda *args, **kwargs: None  # type: ignore[assignment]
    if hasattr(posthog, "Posthog"):
        posthog.Posthog.capture = lambda self, *args, **kwargs: None  # type: ignore[method-assign]
except Exception:
    pass

import shutil
import stat
import time
import uuid
from functools import lru_cache
from typing import Any

from app.config import settings
from app.services.embeddings import embed_texts
from app.services.retrieval import expand_queries

try:
    import chromadb
    from chromadb.api.shared_system_client import SharedSystemClient
    from chromadb.config import Settings as ChromaSettings
    from chromadb.errors import InvalidCollectionException
except Exception:  # pragma: no cover - missing until deps installed
    chromadb = None  # type: ignore[assignment]
    SharedSystemClient = None  # type: ignore[assignment,misc]
    ChromaSettings = None  # type: ignore[assignment,misc]
    InvalidCollectionException = None  # type: ignore[assignment,misc]

COLLECTION_NAME = "voice2law_legal"
# Chroma on Windows crashes (0xC0000005) on HNSW query when a collection has >100
# vectors unless batch_size is raised — see chroma-core/chroma#3058.
COLLECTION_METADATA = {"hnsw:batch_size": 10000}
_WINDOWS_HNSW_BATCH_KEY = "hnsw:batch_size"
_WINDOWS_HNSW_BATCH_MIN = 10000
_CHROMA_RESET_RETRIES = 5
# Smaller batches avoid stale-collection / Windows persist issues on very large adds.
ADD_BATCH_SIZE = 150
_STALE_COLLECTION_RETRIES = 2


def _is_chroma_corruption(exc: BaseException) -> bool:
    """True when persisted Chroma metadata is unreadable (e.g. failed prior ingest)."""
    if isinstance(exc, KeyError) and exc.args:
        return exc.args[0] in ("_type", "type", "name")
    msg = str(exc).lower()
    return "_type" in msg or "config migration" in msg or "could not connect to tenant" in msg


def _is_stale_collection_error(exc: BaseException) -> bool:
    """True when a cached Collection handle points at a dropped or recreated UUID."""
    if InvalidCollectionException is not None and isinstance(exc, InvalidCollectionException):
        return True
    msg = str(exc).lower()
    return "collection" in msg and "does not exist" in msg


def _clear_collection_cache() -> None:
    _get_collection.cache_clear()
    if SharedSystemClient is not None:
        try:
            SharedSystemClient.clear_system_cache()
        except Exception:
            pass


def _chroma_client_settings() -> Any:
    return ChromaSettings(allow_reset=True, anonymized_telemetry=False)


def _make_chroma_client():
    return chromadb.PersistentClient(
        path=settings.chroma_dir,
        settings=_chroma_client_settings(),
    )


def _reset_via_chroma_api() -> bool:
    """Drop all Chroma tables in-process (works when the DB was locked for rmtree)."""
    if chromadb is None or ChromaSettings is None or not os.path.isdir(settings.chroma_dir):
        return False
    try:
        _clear_collection_cache()
        client = _make_chroma_client()
        client.reset()
        _clear_collection_cache()
        return True
    except Exception:
        return False


def _handle_rmtree_error(func, path: str, exc_info) -> None:
    """Clear read-only flags on Windows and retry delete (WinError 32 file in use)."""
    exc = exc_info[1]
    if isinstance(exc, (PermissionError, OSError)):
        try:
            os.chmod(path, stat.S_IWRITE)
            func(path)
            return
        except Exception:
            pass
    raise exc


def _delete_collection_via_client() -> bool:
    """Drop the collection through Chroma API (no directory delete). Returns True if dropped."""
    if chromadb is None or not os.path.isdir(settings.chroma_dir):
        return False
    try:
        client = _make_chroma_client()
        client.delete_collection(COLLECTION_NAME)
        return True
    except Exception:
        return False


def reset_index() -> None:
    """Wipe the Chroma persist directory and in-process collection cache.

    Uses API delete_collection when the data folder is locked (common on Windows),
    then retries ``shutil.rmtree`` with chmod. Raises ``RuntimeError`` with guidance
    if a full wipe is not possible.
    """
    _clear_collection_cache()
    chroma_path = settings.chroma_dir
    if not os.path.isdir(chroma_path):
        return

    reset_via_api = _reset_via_chroma_api()
    deleted_via_api = reset_via_api or _delete_collection_via_client()
    _clear_collection_cache()

    last_err: BaseException | None = None
    for attempt in range(1, _CHROMA_RESET_RETRIES + 1):
        try:
            shutil.rmtree(chroma_path, onerror=_handle_rmtree_error)
            _clear_collection_cache()
            return
        except PermissionError as exc:
            last_err = exc
            if attempt < _CHROMA_RESET_RETRIES:
                time.sleep(0.5 * attempt)

    if deleted_via_api:
        print(
            f"Warning: could not remove folder {chroma_path} (files in use). "
            f"Reset Chroma database via API instead - "
            "close other Python processes and use --reset again for a full folder wipe."
        )
        _clear_collection_cache()
        return

    raise RuntimeError(
        f"Cannot reset Chroma index at {chroma_path}: {last_err}\n"
        "Another process is using the database (running ingest, uvicorn/API, or another Python).\n"
        "  - Stop other Python/ingest/API processes, then retry with --reset\n"
        "  - Or ingest without --reset to append to the existing index:\n"
        "      python ingest.py --input .\\legal_data --save-text"
    )


def _collection_batch_size(metadata: dict[str, Any] | None) -> int:
    """Return hnsw:batch_size from collection metadata, or 0 if unset."""
    if not metadata:
        return 0
    raw = metadata.get(_WINDOWS_HNSW_BATCH_KEY, 0)
    try:
        return int(raw)
    except (TypeError, ValueError):
        return 0


def _needs_windows_hnsw_migration(metadata: dict[str, Any] | None) -> bool:
    """True when the index may hit the Windows HNSW access-violation on query."""
    import sys

    if sys.platform != "win32":
        return False
    return _collection_batch_size(metadata) < _WINDOWS_HNSW_BATCH_MIN


def _open_collection():
    """Open (or create) the persistent Chroma collection at CHROMA_DIR."""
    if chromadb is None:
        raise RuntimeError("chromadb is not installed. Run: pip install -r requirements.txt")
    os.makedirs(settings.chroma_dir, exist_ok=True)
    client = _make_chroma_client()
    # We supply our own embeddings, so no embedding_function is set on the collection.
    return client.get_or_create_collection(
        name=COLLECTION_NAME,
        metadata=COLLECTION_METADATA,
    )


def _get_collection_with_recovery():
    """Open collection; wipe and recreate the index if persisted data is corrupt."""
    try:
        return _open_collection()
    except Exception as exc:
        if not _is_chroma_corruption(exc):
            raise
        print(
            f"Warning: corrupt or incompatible Chroma data at {settings.chroma_dir} "
            f"({exc!r}). Resetting index and retrying."
        )
        _clear_collection_cache()
        reset_index()
        return _open_collection()


@lru_cache
def _get_collection():
    return _get_collection_with_recovery()


def _collection_add_batch(
    *,
    ids: list[str],
    documents: list[str],
    embeddings: list[list[float]],
    metadatas: list[dict[str, Any]],
) -> None:
    """Add one batch; refresh collection handle and retry on stale UUID / corruption."""
    last_exc: BaseException | None = None
    for attempt in range(_STALE_COLLECTION_RETRIES + 1):
        try:
            collection = _get_collection()
            collection.add(
                ids=ids,
                documents=documents,
                embeddings=embeddings,
                metadatas=metadatas,
            )
            return
        except Exception as exc:
            last_exc = exc
            if _is_stale_collection_error(exc):
                if attempt < _STALE_COLLECTION_RETRIES:
                    print(
                        f"Warning: Chroma collection handle stale ({exc!r}). "
                        "Refreshing client and retrying batch."
                    )
                    _clear_collection_cache()
                    continue
                raise
            if _is_chroma_corruption(exc) and attempt < _STALE_COLLECTION_RETRIES:
                print(
                    f"Warning: Chroma write failed due to corrupt store ({exc!r}). "
                    "Resetting index and retrying batch."
                )
                _clear_collection_cache()
                reset_index()
                continue
            raise
    if last_exc is not None:
        raise last_exc


def _export_documents_paginated(batch_size: int = 500) -> tuple[list[str], list[dict[str, Any]]]:
    """Read all indexed documents + metadata without touching HNSW query/embeddings."""
    collection = _get_collection()
    total = collection.count()
    if total == 0:
        return [], []

    all_docs: list[str] = []
    all_metas: list[dict[str, Any]] = []
    offset = 0
    while offset < total:
        page = collection.get(
            limit=min(batch_size, total - offset),
            offset=offset,
            include=["documents", "metadatas"],
        )
        docs = page.get("documents") or []
        metas = page.get("metadatas") or []
        if not docs:
            break
        all_docs.extend(docs)
        all_metas.extend(metas or [{} for _ in docs])
        offset += len(docs)
    return all_docs, all_metas


def ensure_windows_safe_index() -> bool:
    """Rebuild the Chroma index with hnsw:batch_size when required on Windows.

    Returns True when a migration ran, False when the index was already safe.
    """
    import sys

    if sys.platform != "win32" or chromadb is None:
        return False

    os.makedirs(settings.chroma_dir, exist_ok=True)
    client = _make_chroma_client()
    try:
        collection = client.get_collection(COLLECTION_NAME)
    except Exception:
        return False

    if not _needs_windows_hnsw_migration(collection.metadata):
        return False

    total = collection.count()
    if total == 0:
        return False

    print(
        f"[Voice2Law NLP] Windows HNSW fix: rebuilding {total} chunks with "
        f"{_WINDOWS_HNSW_BATCH_KEY}={_WINDOWS_HNSW_BATCH_MIN} (one-time, ~2–5 min)...",
        flush=True,
    )
    docs, metas = _export_documents_paginated()
    if not docs:
        return False

    _clear_collection_cache()
    reset_index()
    _clear_collection_cache()
    added = add_documents(docs, metas)
    print(f"[Voice2Law NLP] Windows HNSW fix complete: {added} chunks re-indexed.", flush=True)
    return True


def add_documents(chunks: list[str], metadatas: list[dict[str, Any]]) -> int:
    """Embed and store text chunks with parallel metadata. Returns count added."""
    if not chunks:
        return 0
    if len(chunks) != len(metadatas):
        raise ValueError("chunks and metadatas must be the same length")

    added = 0
    for start in range(0, len(chunks), ADD_BATCH_SIZE):
        batch_chunks = chunks[start : start + ADD_BATCH_SIZE]
        batch_metas = metadatas[start : start + ADD_BATCH_SIZE]
        embeddings = embed_texts(batch_chunks)
        ids = [str(uuid.uuid4()) for _ in batch_chunks]
        _collection_add_batch(
            ids=ids,
            documents=batch_chunks,
            embeddings=embeddings,
            metadatas=batch_metas,
        )
        added += len(batch_chunks)
    return added


def _is_chroma_query_error(exc: BaseException) -> bool:
    """True for Windows Chroma HNSW / stale-handle failures (Errno 22 EINVAL)."""
    if isinstance(exc, OSError) and getattr(exc, "errno", None) == 22:
        return True
    msg = str(exc).lower()
    return "invalid argument" in msg or "access violation" in msg


def _query_single(collection: Any, vector: list[float], k: int) -> list[dict[str, Any]]:
    result = collection.query(query_embeddings=[vector], n_results=k)
    docs = (result.get("documents") or [[]])[0]
    metas = (result.get("metadatas") or [[]])[0]
    dists = (result.get("distances") or [[]])[0]
    return [
        {"text": doc, "metadata": meta or {}, "distance": dist}
        for doc, meta, dist in zip(docs, metas, dists)
        if doc
    ]


def _query_impl(text: str, k: int) -> list[dict[str, Any]]:
    from app.config import settings

    collection = _get_collection()
    if collection.count() == 0:
        return []

    max_variants = max(1, settings.retrieval_max_queries)
    search_strings = expand_queries(text, max_queries=max_variants)
    if not search_strings:
        return []

    per_query = max((k + len(search_strings) - 1) // len(search_strings), 2)
    vectors = embed_texts(search_strings)
    merged: dict[str, dict[str, Any]] = {}
    for vector in vectors:
        for hit in _query_single(collection, vector, per_query):
            key = (hit.get("text") or "")[:200]
            prev = merged.get(key)
            if prev is None or hit["distance"] < prev["distance"]:
                merged[key] = hit

    ranked = sorted(merged.values(), key=lambda h: h["distance"])
    return ranked[:k]


def query(text: str, k: int | None = None) -> list[dict[str, Any]]:
    """Retrieve the top-``k`` chunks most relevant to ``text``.

    Expands Urdu legal questions with English retrieval hints because indexed
    law text is English OCR. Returns {text, metadata, distance}; empty if none.
    """
    from app.config import settings
    from app.services.log_util import debug_log, safe_log

    k = k or settings.retrieval_k
    last_exc: BaseException | None = None
    for attempt in range(2):
        try:
            hits = _query_impl(text, k)
            if attempt > 0:
                debug_log(
                    "vectorstore.py:query",
                    "chroma_query_recovered",
                    {"attempt": attempt + 1, "hits": len(hits)},
                    "H3",
                )
            return hits
        except Exception as exc:
            last_exc = exc
            if attempt == 0 and _is_chroma_query_error(exc):
                safe_log(
                    f"Warning: Chroma query failed ({exc!r}). Refreshing collection cache and retrying."
                )
                debug_log(
                    "vectorstore.py:query",
                    "chroma_query_retry",
                    {"error": str(exc), "attempt": attempt + 1},
                    "H3",
                )
                _clear_collection_cache()
                continue
            raise
    if last_exc is not None:
        raise last_exc
    return []


def count() -> int:
    """Number of chunks currently indexed (used for placeholder messaging)."""
    try:
        return _get_collection().count()
    except Exception:
        return 0
