#!/usr/bin/env python3
"""
Ingest chunks into vector database.
Usage: python ingest_chunks.py <chunks_json_path> [vectorstore_path]
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from src.nlp.embedder import UrduEmbedder
from src.nlp.vectorstore import VectorStore


def main():
    if len(sys.argv) < 2:
        print("Usage: python ingest_chunks.py <chunks_json_path> [vectorstore_path]")
        print("Example: python ingest_chunks.py data/processed/criminal_law_chunks.json data/vectorstore")
        sys.exit(1)

    chunks_path = sys.argv[1]
    vectorstore_path = sys.argv[2] if len(sys.argv) > 2 else 'data/vectorstore'

    if not Path(chunks_path).exists():
        print(f"❌ Chunks file not found: {chunks_path}")
        sys.exit(1)

    print(f"Chunks file: {chunks_path}")
    print(f"Vectorstore path: {vectorstore_path}")
    print()

    try:
        # Initialize embedder and vectorstore
        embedder = UrduEmbedder()
        vectorstore = VectorStore(persist_dir=vectorstore_path, embedder=embedder)

        # Get or create collection
        vectorstore.get_or_create_collection()

        # Ingest chunks
        stats = vectorstore.ingest_chunks(chunks_path)

        # Print summary
        print()
        print("=" * 60)
        print("INGESTION SUMMARY")
        print("=" * 60)
        print(f"Status:              {stats.get('status')}")
        print(f"Total chunks:        {stats.get('total_chunks')}")
        print(f"Ingested:            {stats.get('total_ingested')}")
        print(f"Embedding dim:       {stats.get('embedding_dim')}")
        print(f"Model:               {stats.get('embedding_model', 'unknown')}")
        print()

        # Test search
        print("Testing search functionality...")
        test_query = "طلاق کے بارے میں قانون"
        results = vectorstore.search(test_query, n_results=3)
        print(f"\nTest query: {test_query}")
        print(f"Found {len(results)} results:")
        for i, result in enumerate(results, 1):
            print(f"\n  Result {i}:")
            print(f"    Score: {result['score']:.4f}")
            print(f"    Page: {result['page_number']}")
            print(f"    Text: {result['text'][:100]}...")

        print()
        print("✓ Ingestion complete and vectorstore ready for queries!")

    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    main()
