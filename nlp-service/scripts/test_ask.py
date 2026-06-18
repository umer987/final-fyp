#!/usr/bin/env python3
"""Quick /ask pipeline diagnostic (run from nlp-service with venv active)."""
from __future__ import annotations

import json
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from dotenv import load_dotenv

load_dotenv(ROOT / ".env", override=True)


def main() -> None:
    question = sys.argv[1] if len(sys.argv) > 1 else "چوری کی سزا کیا ہے؟"
    language = sys.argv[2] if len(sys.argv) > 2 else "urdu"

    from app.services.embeddings import embeddings_available, embeddings_import_error
    from app.services import vectorstore, llm
    from app.services.retrieval import expand_queries

    print("embeddings_ready:", embeddings_available(), embeddings_import_error())
    print("indexed_chunks:", vectorstore.count())
    print("expand_queries:", expand_queries(question))

    t0 = time.perf_counter()
    chunks = vectorstore.query(question)
    t1 = time.perf_counter()
    print(f"retrieval: {len(chunks)} chunks in {t1 - t0:.2f}s")
    for i, c in enumerate(chunks[:3], 1):
        meta = c.get("metadata") or {}
        print(f"  [{i}] dist={c.get('distance'):.4f} cat={meta.get('category')} src={meta.get('source', '')[:60]}")
        print(f"      { (c.get('text') or '')[:120] }...")

    t2 = time.perf_counter()
    answer = llm.generate_answer(question, chunks, language)
    t3 = time.perf_counter()
    print(f"llm: {t3 - t2:.2f}s")
    print("answer:", answer[:800])


if __name__ == "__main__":
    main()
