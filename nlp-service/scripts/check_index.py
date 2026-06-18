"""Print Chroma index stats (chunk count + categories). Run from nlp-service/."""
from __future__ import annotations

import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from app.services import vectorstore  # noqa: E402


def main() -> None:
    collection = vectorstore._get_collection()
    total = collection.count()
    print(f"Total chunks: {total}")
    if total == 0:
        print("Index is empty. Run: python ingest.py --input .\\legal_data --save-text")
        return

    got = collection.get(limit=min(total, 10_000), include=["metadatas"])
    metas = got.get("metadatas") or []
    cats = Counter((m or {}).get("category", "?") for m in metas)
    sources = Counter((m or {}).get("source", "?") for m in metas)

    print("\nCategories:")
    for cat, n in cats.most_common():
        print(f"  {cat}: {n}")

    print("\nSources:")
    for src, n in sources.most_common():
        print(f"  {src}: {n}")


if __name__ == "__main__":
    main()
