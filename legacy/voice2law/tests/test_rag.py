import sys
from pathlib import Path
import json
import tempfile

sys.path.insert(0, str(Path(__file__).parent.parent))

from src.nlp.embedder import UrduEmbedder
from src.nlp.vectorstore import VectorStore
from src.nlp.rag_pipeline import LegalRAG


def create_sample_chunks(tmpdir):
    """Create sample chunks for testing."""
    mock_chunks = {
        "source_file": "criminal_law.pdf",
        "total_pages": 300,
        "pages_extracted": 298,
        "total_chunks": 6,
        "chunks": [
            {
                "text": "طلاق مسلم فیملی لاء آرڈیننس 1961 کے تحت دی جا سکتی ہے۔ طلاق ایک قانونی عمل ہے جس کے ذریعے شوہر اپنی بیوی سے رشتہ توڑ سکتا ہے۔",
                "metadata": {
                    "page_number": 10,
                    "chunk_index": 0,
                    "global_chunk_index": 0,
                    "source_file": "criminal_law.pdf",
                    "category": "criminal_law",
                    "word_count": 30
                }
            },
            {
                "text": "شاہ رہے عدالت میں جانے سے پہلے اپنے وکیل سے مشورہ کریں۔ ہمیشہ تجربہ کار وکیل کو منتخب کریں جو آپ کے حقوق کی حفاظت کر سکے۔",
                "metadata": {
                    "page_number": 20,
                    "chunk_index": 0,
                    "global_chunk_index": 1,
                    "source_file": "criminal_law.pdf",
                    "category": "criminal_law",
                    "word_count": 28
                }
            },
            {
                "text": "عورت کو طلاق سے بچاؤ کے لیے قانونی حقوق ہیں۔ وہ عدالت سے رجوع کر سکتی ہے اور اپنے حقوق کا دفاع کر سکتی ہے۔",
                "metadata": {
                    "page_number": 30,
                    "chunk_index": 0,
                    "global_chunk_index": 2,
                    "source_file": "criminal_law.pdf",
                    "category": "marriage_law",
                    "word_count": 25
                }
            },
            {
                "text": "مہر کا حق: خاتون کو نکاح کے وقت جو مہر طے کیا جاتا ہے وہ اس کا حق ہے۔ طلاق کی صورت میں بھی مہر ملنا لازمی ہے۔",
                "metadata": {
                    "page_number": 35,
                    "chunk_index": 0,
                    "global_chunk_index": 3,
                    "source_file": "criminal_law.pdf",
                    "category": "marriage_law",
                    "word_count": 26
                }
            },
            {
                "text": "متعہ کا حق: خاتون کو طلاق کے بعد متعہ ملتا ہے جو مسلم قانون میں فرض ہے۔ اگر شوہر متعہ سے انکار کرے تو خاتون عدالت میں شکایت کر سکتی ہے۔",
                "metadata": {
                    "page_number": 40,
                    "chunk_index": 0,
                    "global_chunk_index": 4,
                    "source_file": "criminal_law.pdf",
                    "category": "criminal_law",
                    "word_count": 30
                }
            },
            {
                "text": "بچوں کی کسٹڈی: طلاق کے بعد بچوں کی کسٹڈی کا معاملہ بہت اہم ہے۔ عام طور پر ننھے بچے ماں کے ساتھ رہتے ہیں اور بڑے بیٹے باپ کے ساتھ۔",
                "metadata": {
                    "page_number": 50,
                    "chunk_index": 0,
                    "global_chunk_index": 5,
                    "source_file": "criminal_law.pdf",
                    "category": "criminal_law",
                    "word_count": 28
                }
            }
        ]
    }

    chunks_file = Path(tmpdir) / "chunks.json"
    with open(chunks_file, 'w', encoding='utf-8') as f:
        json.dump(mock_chunks, f, ensure_ascii=False)

    return chunks_file


def test_format_context():
    """Test context formatting."""
    print("\n=== Testing format_context ===")

    rag = LegalRAG()

    chunks = [
        {'text': 'پہلی معلومات'},
        {'text': 'دوسری معلومات'},
        {'text': 'تیسری معلومات'}
    ]

    context = rag.format_context(chunks)
    print("Context:")
    print(context)

    assert 'قانونی معلومات:' in context
    assert '---' in context
    assert 'پہلی معلومات' in context
    assert 'دوسری معلومات' in context

    print("✓ format_context test passed")


def test_extractive_qa():
    """Test extractive QA approach."""
    print("\n=== Testing Extractive QA ===")

    with tempfile.TemporaryDirectory() as tmpdir:
        chunks_file = create_sample_chunks(tmpdir)

        # Setup vectorstore
        embedder = UrduEmbedder()
        vectorstore = VectorStore(persist_dir=str(Path(tmpdir) / "vectorstore"), embedder=embedder)
        vectorstore.get_or_create_collection()
        vectorstore.ingest_chunks(str(chunks_file))

        # Initialize LegalRAG
        rag = LegalRAG(vectorstore=vectorstore, embedder=embedder)

        # Test query
        question = "طلاق کے بارے میں کیا جاننا چاہیے؟"
        result = rag.answer(question, use_llm=False, n_results=3)

        print(f"Question: {question}")
        print(f"Approach: {result['approach']}")
        print(f"Confidence: {result['confidence']:.4f}")
        print(f"Category: {result['category']}")
        print(f"Source pages: {result['source_pages']}")
        print(f"Answer: {result['answer'][:100]}...")

        assert result['approach'] == 'extractive'
        assert result['confidence'] > 0
        assert len(result['source_pages']) > 0
        assert result['answer']

        print("✓ Extractive QA test passed")


def test_retrieve():
    """Test retrieval functionality."""
    print("\n=== Testing Retrieval ===")

    with tempfile.TemporaryDirectory() as tmpdir:
        chunks_file = create_sample_chunks(tmpdir)

        # Setup
        embedder = UrduEmbedder()
        vectorstore = VectorStore(persist_dir=str(Path(tmpdir) / "vectorstore"), embedder=embedder)
        vectorstore.get_or_create_collection()
        vectorstore.ingest_chunks(str(chunks_file))

        rag = LegalRAG(vectorstore=vectorstore, embedder=embedder)

        # Retrieve
        question = "وکیل سے مشورہ کریں"
        results = rag.retrieve(question, n_results=2)

        print(f"Question: {question}")
        print(f"Retrieved {len(results)} chunks:")
        for i, result in enumerate(results, 1):
            print(f"  {i}. Score: {result['score']:.4f}, Page: {result['page_number']}")
            print(f"     {result['text'][:80]}...")

        assert len(results) > 0
        assert results[0]['score'] > 0

        print("✓ Retrieval test passed")


def test_multiple_queries():
    """Test multiple different queries."""
    print("\n=== Testing Multiple Queries ===")

    with tempfile.TemporaryDirectory() as tmpdir:
        chunks_file = create_sample_chunks(tmpdir)

        # Setup
        embedder = UrduEmbedder()
        vectorstore = VectorStore(persist_dir=str(Path(tmpdir) / "vectorstore"), embedder=embedder)
        vectorstore.get_or_create_collection()
        vectorstore.ingest_chunks(str(chunks_file))

        rag = LegalRAG(vectorstore=vectorstore, embedder=embedder)

        # Multiple queries
        queries = [
            "طلاق کے بارے میں کیا ہے؟",
            "مہر کیا ہے؟",
            "بچوں کی کسٹڈی کا کیا قانون ہے؟",
            "متعہ کا حق کیا ہے؟"
        ]

        for query in queries:
            result = rag.answer(query, use_llm=False)
            print(f"\nQ: {query}")
            print(f"Score: {result['confidence']:.4f}")
            print(f"Page: {result['source_pages']}")

            assert result['confidence'] > 0
            assert result['answer']

        print("\n✓ Multiple queries test passed")


def test_empty_query():
    """Test handling of edge cases."""
    print("\n=== Testing Edge Cases ===")

    with tempfile.TemporaryDirectory() as tmpdir:
        # Empty vectorstore
        embedder = UrduEmbedder()
        vectorstore = VectorStore(persist_dir=str(Path(tmpdir) / "vectorstore"), embedder=embedder)
        vectorstore.get_or_create_collection()

        rag = LegalRAG(vectorstore=vectorstore, embedder=embedder)

        # Query empty vectorstore
        result = rag.answer("طلاق کے بارے میں", use_llm=False)

        print(f"Empty vectorstore result:")
        print(f"  Confidence: {result['confidence']}")
        print(f"  Answer: {result['answer']}")

        assert result['confidence'] == 0.0
        assert 'دستیاب نہیں' in result['answer']

        print("✓ Edge cases test passed")


if __name__ == "__main__":
    print("Running LegalRAG Tests...")

    try:
        test_format_context()
    except Exception as e:
        print(f"❌ format_context test failed: {e}")
        import traceback
        traceback.print_exc()

    try:
        test_extractive_qa()
    except Exception as e:
        print(f"❌ Extractive QA test failed: {e}")
        import traceback
        traceback.print_exc()

    try:
        test_retrieve()
    except Exception as e:
        print(f"❌ Retrieval test failed: {e}")
        import traceback
        traceback.print_exc()

    try:
        test_multiple_queries()
    except Exception as e:
        print(f"❌ Multiple queries test failed: {e}")
        import traceback
        traceback.print_exc()

    try:
        test_empty_query()
    except Exception as e:
        print(f"❌ Edge cases test failed: {e}")
        import traceback
        traceback.print_exc()

    print("\n✅ All LegalRAG tests completed!")
