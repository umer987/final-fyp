import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from src.ocr.pdf_extractor import PDFExtractor
from src.ocr.blur_detector import BlurDetector
from src.nlp.embedder import Embedder
from src.nlp.vectorstore import VectorStore
from src.nlp.rag_pipeline import RAGPipeline


def test_embedder():
    """Test embedder with Urdu text."""
    print("\n=== Testing Embedder ===")
    embedder = Embedder()

    urdu_text1 = "طلاق کے بارے میں قانون کیا ہے؟"
    urdu_text2 = "شاہ رہے عدالت میں کیا کریں؟"

    emb1 = embedder.embed_text(urdu_text1)
    emb2 = embedder.embed_text(urdu_text2)

    similarity = embedder.similarity(urdu_text1, urdu_text2)
    print(f"Text 1: {urdu_text1}")
    print(f"Text 2: {urdu_text2}")
    print(f"Similarity: {similarity:.4f}")
    print(f"Embedding dimension: {embedder.get_embedding_dim()}")


def test_vectorstore():
    """Test vectorstore creation and querying."""
    print("\n=== Testing VectorStore ===")
    vectorstore = VectorStore()
    vectorstore.get_or_create_collection("test_collection")

    # Sample legal text
    sample_texts = [
        "طلاق مسلم فیملی لاء آرڈیننس 1961 کے تحت دی جا سکتی ہے",
        "شاہ کرنے سے پہلے تین دن کی نوٹس دینی لازمی ہے",
        "عورت کو طلاق سے بچاؤ کے لیے قانونی حقوق ہیں"
    ]

    vectorstore.add_documents(
        texts=sample_texts,
        ids=["doc_1", "doc_2", "doc_3"],
        metadatas=[
            {"source": "criminal_law", "page": 10},
            {"source": "criminal_law", "page": 11},
            {"source": "marriage_law", "page": 5}
        ]
    )

    stats = vectorstore.get_collection_stats()
    print(f"Collection stats: {stats}")

    # Query
    query_result = vectorstore.query("طلاق کے بارے میں", n_results=2)
    print(f"Query: طلاق کے بارے میں")
    print(f"Retrieved documents: {len(query_result['documents'])}")
    for doc in query_result['documents']:
        print(f"  - {doc[:80]}...")


def test_rag_pipeline():
    """Test RAG pipeline."""
    print("\n=== Testing RAG Pipeline ===")

    embedder = Embedder()
    vectorstore = VectorStore()
    vectorstore.get_or_create_collection("rag_test")

    # Add sample documents
    sample_texts = [
        "طلاق مسلم فیملی لاء آرڈیننس 1961 کے تحت دی جا سکتی ہے اور یہ قانونی طریقے سے درخواست دے کر کی جا سکتی ہے",
        "شاہ رہے عدالت میں جانے سے پہلے اپنے وکیل سے مشورہ کریں اور تمام دستاویزات تیار کریں"
    ]

    vectorstore.add_documents(
        texts=sample_texts,
        ids=["legal_1", "legal_2"]
    )

    rag = RAGPipeline(vectorstore, embedder)

    # Test answer
    query = "طلاق کے بارے میں کیا جاننا چاہیے؟"
    result = rag.answer(query, n_docs=2)

    print(f"Query: {query}")
    print(f"Answer: {result['answer'][:200]}...")
    print(f"Retrieved {len(result['retrieved_documents'])} documents")


if __name__ == "__main__":
    print("Running Voice2Law Pipeline Tests...")

    try:
        test_embedder()
    except Exception as e:
        print(f"❌ Embedder test failed: {e}")

    try:
        test_vectorstore()
    except Exception as e:
        print(f"❌ VectorStore test failed: {e}")

    try:
        test_rag_pipeline()
    except Exception as e:
        print(f"❌ RAG Pipeline test failed: {e}")

    print("\n✅ Tests completed!")
