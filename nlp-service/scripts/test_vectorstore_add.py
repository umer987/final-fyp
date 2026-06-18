"""Smoke test: batched add + stale-collection retry path (no PDF/OCR)."""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from app.services.vectorstore import (  # noqa: E402
    ADD_BATCH_SIZE,
    _clear_collection_cache,
    _collection_add_batch,
    _get_collection,
    _is_stale_collection_error,
    add_documents,
    count,
)


def main() -> None:
    chunks = [f"test chunk {i} for voice2law ingest smoke test." for i in range(5)]
    metas = [{"category": "test", "source": "smoke", "chunk_index": i} for i in range(5)]
    n = add_documents(chunks, metas)
    assert n == 5, n
    assert count() >= 5
    print(f"add_documents OK ({n} chunks, batch_size={ADD_BATCH_SIZE})")

    # Simulate stale cached collection handle (same failure mode as large ingest).
    collection = _get_collection()
    _clear_collection_cache()
    from app.services.embeddings import embed_texts

    embeddings = embed_texts(["retry after stale handle"])
    try:
        collection.add(
            ids=["stale-test-id"],
            documents=["retry after stale handle"],
            embeddings=embeddings,
            metadatas=[{"category": "test", "source": "stale", "chunk_index": 0}],
        )
        print("direct add unexpectedly succeeded (no stale error)")
    except Exception as exc:
        assert _is_stale_collection_error(exc), exc
        _collection_add_batch(
            ids=["stale-test-id-2"],
            documents=["retry after stale handle"],
            embeddings=embeddings,
            metadatas=[{"category": "test", "source": "stale", "chunk_index": 1}],
        )
        print(f"stale-handle recovery OK ({type(exc).__name__})")

    print("All smoke checks passed.")


if __name__ == "__main__":
    main()
