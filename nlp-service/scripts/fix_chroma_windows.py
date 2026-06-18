#!/usr/bin/env python3
"""One-time Windows Chroma HNSW fix + smoke test (run from nlp-service with venv active)."""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from dotenv import load_dotenv

load_dotenv(ROOT / ".env", override=True)

from app.services import vectorstore


def main() -> None:
    print("Checking Windows Chroma index...")
    migrated = vectorstore.ensure_windows_safe_index()
    print("migration_ran:", migrated)
    print("indexed_chunks:", vectorstore.count())
    chunks = vectorstore.query("theft punishment")
    print("query_hits:", len(chunks))
    if chunks:
        print("sample:", (chunks[0].get("text") or "")[:120])


if __name__ == "__main__":
    main()
