import sys
from pathlib import Path
import json
import tempfile

sys.path.insert(0, str(Path(__file__).parent.parent))

from src.nlp.embedder import UrduEmbedder
from src.nlp.vectorstore import VectorStore
from src.nlp.rag_pipeline import RAGPipeline


def test_urdu_embedder():
    """Test Urdu text embedding."""
    print("\n=== Testing UrduEmbedder ===")

    embedder = UrduEmbedder()

    # Test single text
    urdu_text = "طلاق کے بارے میں قانون کیا ہے؟"
    embedding = embedder.embed_text(urdu_text)

    print(f"Text: {urdu_text}")
    print(f"Embedding dimension: {len(embedding)}")
    print(f"First 5 values: {embedding[:5]}")
    assert len(embedding) == embedder.get_embedding_dim()
    assert len(embedding) > 0

    # Test batch
    texts = [
        "طلاق کے بارے میں قانون",
        "شاہ رہے عدالت میں کیا کریں",
        "عورت کو طلاق سے بچاؤ کے لیے قانونی حقوق"
    ]
    embeddings = embedder.embed_batch(texts)
    print(f"\nBatch test: {len(texts)} texts -> {len(embeddings)} embeddings")
    assert len(embeddings) == len(texts)

    # Test similarity
    sim1 = embedder.similarity("طلاق کے بارے میں", "طلاق کے بارے میں")
    sim2 = embedder.similarity("طلاق کے بارے میں", "شاہ رہے عدالت میں")
    print(f"Similarity (same text): {sim1:.4f}")
    print(f"Similarity (different text): {sim2:.4f}")
    assert sim1 > sim2

    print("✓ UrduEmbedder test passed")


def test_vectorstore():
    """Test vector store with mock chunks."""
    print("\n=== Testing VectorStore ===")

    with tempfile.TemporaryDirectory() as tmpdir:
        # Create mock chunks JSON
        mock_chunks = {
            "source_file": "criminal_law.pdf",
            "total_pages": 300,
            "pages_extracted": 298,
            "pages_skipped": 2,
            "total_chunks": 5,
            "chunks": [
                {
                    "text": "طلاق مسلم فیملی لاء آرڈیننس 1961 کے تحت دی جا سکتی ہے اور یہ قانونی طریقے سے درخواست دے کر کی جا سکتی ہے",
                    "metadata": {
                        "page_number": 10,
                        "chunk_index": 0,
                        "global_chunk_index": 0,
                        "source_file": "criminal_law.pdf",
                        "category": "criminal_law",
                        "word_count": 20
                    }
                },
                {
                    "text": "شاہ رہے عدالت میں جانے سے پہلے اپنے وکیل سے مشورہ کریں اور تمام دستاویزات تیار کریں",
                    "metadata": {
                        "page_number": 11,
                        "chunk_index": 1,
                        "global_chunk_index": 1,
                        "source_file": "criminal_law.pdf",
                        "category": "criminal_law",
                        "word_count": 20
                    }
                },
                {
                    "text": "عورت کو طلاق سے بچاؤ کے لیے قانونی حقوق ہیں اور وہ عدالت سے رجوع کر سکتی ہے",
                    "metadata": {
                        "page_number": 15,
                        "chunk_index": 0,
                        "global_chunk_index": 2,
                        "source_file": "criminal_law.pdf",
                        "category": "marriage_law",
                        "word_count": 20
                    }
                }
            ],
            "statistics": {
                "avg_chunk_words": 20,
                "total_words": 60,
                "skipped_pages": [50, 100]
            }
        }

        chunks_file = Path(tmpdir) / "chunks.json"
        with open(chunks_file, 'w', encoding='utf-8') as f:
            json.dump(mock_chunks, f, ensure_ascii=False)

        # Initialize vectorstore
        vectorstore_path = Path(tmpdir) / "vectorstore"
        vectorstore = VectorStore(persist_dir=str(vectorstore_path))
        vectorstore.get_or_create_collection()

        print(f"Collection created: {vectorstore.collection_name}")

        # Ingest chunks
        stats = vectorstore.ingest_chunks(str(chunks_file))
        print(f"Ingestion stats: {stats['total_ingested']} chunks")

        # Test search
        query = "طلاق کے بارے میں"
        results = vectorstore.search(query, n_results=2)

        print(f"\nSearch query: {query}")
        print(f"Found {len(results)} results:")
        for i, result in enumerate(results, 1):
            print(f"  {i}. Score: {result['score']:.4f}, Page: {result['page_number']}")

        assert len(results) > 0
        assert results[0]['score'] > 0  # Should have positive similarity

        print("✓ VectorStore test passed")


def test_rag_pipeline():
    """Test RAG pipeline."""
    print("\n=== Testing RAG Pipeline ===")

    with tempfile.TemporaryDirectory() as tmpdir:
        # Create mock chunks
        mock_chunks = {
            "source_file": "criminal_law.pdf",
            "total_pages": 300,
            "pages_extracted": 298,
            "total_chunks": 3,
            "chunks": [
                {
                    "text": "طلاق کا قانون پاکستان میں بہت اہم ہے اور اسے مسلم فیملی لاء میں درج ہے",
                    "metadata": {
                        "page_number": 10,
                        "chunk_index": 0,
                        "global_chunk_index": 0,
                        "source_file": "criminal_law.pdf",
                        "category": "criminal_law",
                        "word_count": 15
                    }
                },
                {
                    "text": "عدالت میں شکایت درج کرنے کے لیے تمام دستاویزات کی ضرورت ہے",
                    "metadata": {
                        "page_number": 20,
                        "chunk_index": 0,
                        "global_chunk_index": 1,
                        "source_file": "criminal_law.pdf",
                        "category": "criminal_law",
                        "word_count": 15
                    }
                },
                {
                    "text": "قانونی پناہ لینے کے لیے ہر شخص کو حق ہے",
                    "metadata": {
                        "page_number": 30,
                        "chunk_index": 0,
                        "global_chunk_index": 2,
                        "source_file": "criminal_law.pdf",
                        "category": "criminal_law",
                        "word_count": 12
                    }
                }
            ],
            "statistics": {"avg_chunk_words": 14, "total_words": 42}
        }

        chunks_file = Path(tmpdir) / "chunks.json"
        with open(chunks_file, 'w', encoding='utf-8') as f:
            json.dump(mock_chunks, f, ensure_ascii=False)

        # Initialize RAG
        vectorstore_path = Path(tmpdir) / "vectorstore"
        embedder = UrduEmbedder()
        vectorstore = VectorStore(persist_dir=str(vectorstore_path), embedder=embedder)
        vectorstore.get_or_create_collection()
        vectorstore.ingest_chunks(str(chunks_file))

        rag = RAGPipeline(vectorstore=vectorstore, embedder=embedder)

        # Test query
        query = "طلاق کے بارے میں کیا جاننا چاہیے؟"
        result = rag.answer(query, n_docs=2)

        print(f"Query: {query}")
        print(f"Retrieved {len(result['retrieved_documents'])} documents")
        print(f"Context length: {len(result['context'])} characters")
        print(f"Answer: {result['answer'][:200]}...")

        assert len(result['retrieved_documents']) > 0
        assert len(result['context']) > 0

        print("✓ RAG Pipeline test passed")


if __name__ == "__main__":
    print("Running Embedding & Vector Store Tests...")

    try:
        test_urdu_embedder()
    except Exception as e:
        print(f"❌ UrduEmbedder test failed: {e}")
        import traceback
        traceback.print_exc()

    try:
        test_vectorstore()
    except Exception as e:
        print(f"❌ VectorStore test failed: {e}")
        import traceback
        traceback.print_exc()

    try:
        test_rag_pipeline()
    except Exception as e:
        print(f"❌ RAG Pipeline test failed: {e}")
        import traceback
        traceback.print_exc()

    print("\n✅ All embedding & vector store tests completed!")
