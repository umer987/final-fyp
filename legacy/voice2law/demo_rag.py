#!/usr/bin/env python3
"""
LegalRAG Demo - Test the Question Answering Pipeline
Shows both extractive and Claude API approaches.
"""

import sys
from pathlib import Path
import json
import tempfile
import os

sys.path.insert(0, str(Path(__file__).parent))

from src.nlp.embedder import UrduEmbedder
from src.nlp.vectorstore import VectorStore
from src.nlp.rag_pipeline import LegalRAG


def create_demo_chunks(tmpdir):
    """Create sample chunks for demo."""
    mock_chunks = {
        "source_file": "criminal_law.pdf",
        "total_pages": 300,
        "pages_extracted": 298,
        "total_chunks": 10,
        "chunks": [
            {
                "text": "طلاق مسلم فیملی لاء آرڈیننس 1961 کے تحت دی جا سکتی ہے۔ طلاق ایک قانونی عمل ہے جس کے ذریعے شوہر اپنی بیوی سے رشتہ توڑ سکتا ہے۔ یہ قانون پاکستان میں بہت اہم ہے اور شریعت کے مطابق ہے۔",
                "metadata": {
                    "page_number": 10,
                    "chunk_index": 0,
                    "global_chunk_index": 0,
                    "source_file": "criminal_law.pdf",
                    "category": "criminal_law",
                    "word_count": 35
                }
            },
            {
                "text": "شاہ رہے عدالت میں جانے سے پہلے اپنے وکیل سے مشورہ کریں۔ ہمیشہ تجربہ کار وکیل کو منتخب کریں جو آپ کے حقوق کی حفاظت کر سکے۔ ایک اچھے وکیل کا ہونا بہت ضروری ہے۔",
                "metadata": {
                    "page_number": 20,
                    "chunk_index": 0,
                    "global_chunk_index": 1,
                    "source_file": "criminal_law.pdf",
                    "category": "criminal_law",
                    "word_count": 32
                }
            },
            {
                "text": "عورت کو طلاق سے بچاؤ کے لیے قانونی حقوق ہیں۔ وہ عدالت سے رجوع کر سکتی ہے اور اپنے حقوق کا دفاع کر سکتی ہے۔ عدالت خاتون کے حقوق کی حفاظت کرتی ہے۔",
                "metadata": {
                    "page_number": 30,
                    "chunk_index": 0,
                    "global_chunk_index": 2,
                    "source_file": "criminal_law.pdf",
                    "category": "marriage_law",
                    "word_count": 32
                }
            },
            {
                "text": "مہر کا حق: خاتون کو نکاح کے وقت جو مہر طے کیا جاتا ہے وہ اس کا حق ہے۔ طلاق کی صورت میں بھی مہر ملنا لازمی ہے۔ یہ قانونی حق ہر خاتون کو محفوظ ہے۔",
                "metadata": {
                    "page_number": 35,
                    "chunk_index": 0,
                    "global_chunk_index": 3,
                    "source_file": "criminal_law.pdf",
                    "category": "marriage_law",
                    "word_count": 32
                }
            },
            {
                "text": "متعہ کا حق: خاتون کو طلاق کے بعد متعہ ملتا ہے جو مسلم قانون میں فرض ہے۔ اگر شوہر متعہ سے انکار کرے تو خاتون عدالت میں شکایت کر سکتی ہے۔ متعہ کی رقم قانونی حیثیت رکھتی ہے۔",
                "metadata": {
                    "page_number": 40,
                    "chunk_index": 0,
                    "global_chunk_index": 4,
                    "source_file": "criminal_law.pdf",
                    "category": "criminal_law",
                    "word_count": 34
                }
            },
            {
                "text": "بچوں کی کسٹڈی: طلاق کے بعد بچوں کی کسٹڈی کا معاملہ بہت اہم ہے۔ عام طور پر ننھے بچے ماں کے ساتھ رہتے ہیں اور بڑے بیٹے باپ کے ساتھ رہ سکتے ہیں۔ عدالت ہر معاملے میں بچے کی بہتری کو سامنے رکھ کر فیصلہ کرتی ہے۔",
                "metadata": {
                    "page_number": 45,
                    "chunk_index": 0,
                    "global_chunk_index": 5,
                    "source_file": "criminal_law.pdf",
                    "category": "criminal_law",
                    "word_count": 40
                }
            },
            {
                "text": "عدالت میں درخواست: اگر کوئی شخص اپنے حقوق کے لیے عدالت میں درخواست دینا چاہے تو اسے متعلقہ دستاویزات کی ضرورت ہے۔ شناختی کارڈ، شاہادتیں، اور نکاح کے دستاویزات ضروری ہیں۔",
                "metadata": {
                    "page_number": 50,
                    "chunk_index": 0,
                    "global_chunk_index": 6,
                    "source_file": "criminal_law.pdf",
                    "category": "criminal_law",
                    "word_count": 32
                }
            },
            {
                "text": "عام غلطیاں: بہت سے لوگ قانون سے ناواقفیت کی وجہ سے غلطیاں کرتے ہیں۔ غیر قانونی طریقے سے طلاق دینا، یا دستاویزات کو درست طریقے سے محفوظ نہ رکھنا۔ ہمیشہ قانون کی رہنمائی میں کام کریں۔",
                "metadata": {
                    "page_number": 55,
                    "chunk_index": 0,
                    "global_chunk_index": 7,
                    "source_file": "criminal_law.pdf",
                    "category": "criminal_law",
                    "word_count": 31
                }
            },
            {
                "text": "خاتون کی شکایت: اگر خاتون کو ظلم کا سامنا ہو تو وہ پولیس میں رپورٹ درج کروا سکتی ہے۔ پولیس کو خاتون کی شکایت پر غور کرنا لازمی ہے۔ شکایت درج کرنے میں کوئی فیس نہیں ہوتی۔",
                "metadata": {
                    "page_number": 60,
                    "chunk_index": 0,
                    "global_chunk_index": 8,
                    "source_file": "criminal_law.pdf",
                    "category": "criminal_law",
                    "word_count": 28
                }
            },
            {
                "text": "وصیت اور وراثت: ہر انسان کو وصیت لکھنے کا حق ہے۔ وصیت میں آپ اپنی جائیداد کے بارے میں ہدایات دے سکتے ہیں۔ وصیت تمام اسلامی قوانین کے مطابق ہونی چاہیے اور دستخط شدہ ہونی چاہیے۔",
                "metadata": {
                    "page_number": 65,
                    "chunk_index": 0,
                    "global_chunk_index": 9,
                    "source_file": "criminal_law.pdf",
                    "category": "criminal_law",
                    "word_count": 32
                }
            }
        ]
    }

    chunks_file = Path(tmpdir) / "chunks.json"
    with open(chunks_file, 'w', encoding='utf-8') as f:
        json.dump(mock_chunks, f, ensure_ascii=False, indent=2)

    return chunks_file


def demo():
    """Run demo of LegalRAG pipeline."""
    print("=" * 70)
    print("VOICE2LAW - LegalRAG Question Answering Demo")
    print("=" * 70)

    with tempfile.TemporaryDirectory() as tmpdir:
        tmpdir = Path(tmpdir)

        # Setup
        print("\n[Setup] Creating sample chunks and vectorstore...")
        chunks_file = create_demo_chunks(tmpdir)

        embedder = UrduEmbedder()
        vectorstore = VectorStore(persist_dir=str(tmpdir / "vectorstore"), embedder=embedder)
        vectorstore.get_or_create_collection()
        vectorstore.ingest_chunks(str(chunks_file))

        rag = LegalRAG(vectorstore=vectorstore, embedder=embedder)

        # Test queries
        print("\n[Testing] Running queries with extractive approach...")
        print("-" * 70)

        test_queries = [
            "طلاق کے بارے میں کیا جاننا چاہیے؟",
            "عدالت میں شکایت کیسے درج کریں؟",
            "مہر کیا ہے اور اس کا کیا حق ہے؟",
            "بچوں کی کسٹڈی کا قانون کیا ہے؟",
            "خاتون کو طلاق کے بعد کیا حقوق ہیں؟"
        ]

        for i, query in enumerate(test_queries, 1):
            print(f"\n[Query {i}] {query}")
            print("-" * 70)

            # Extractive approach
            result = rag.answer(query, use_llm=False, n_results=3)

            print(f"Approach:        {result['approach']}")
            print(f"Confidence:      {result['confidence']:.4f}")
            print(f"Category:        {result['category']}")
            print(f"Source Pages:    {result['source_pages']}")
            print(f"Chunks Used:     {result['retrieved_chunks']}")
            print()
            print("Answer:")
            print(result['answer'])

            # Check for Claude API
            if rag.use_claude:
                print()
                print("-" * 70)
                print("[Trying Claude API version...]")
                try:
                    result_claude = rag.answer(query, use_llm=True, n_results=3)
                    print(f"Model:     {result_claude.get('model', 'N/A')}")
                    print(f"Tokens:    {result_claude.get('tokens_used', 'N/A')}")
                    print()
                    print("Claude Answer:")
                    print(result_claude['answer'])
                except Exception as e:
                    print(f"Claude API not available or error: {e}")

        # Stats
        print()
        print("=" * 70)
        print("Vector Store Statistics:")
        stats = vectorstore.get_stats()
        print(f"  Collection:      {stats['collection_name']}")
        print(f"  Documents:       {stats['total_documents']}")
        print(f"  Embedding Dim:   {stats['embedding_dim']}")
        print(f"  Model:           {stats['model']}")

        # Format context demo
        print()
        print("=" * 70)
        print("Context Formatting Demo:")
        sample_chunks = [
            {'text': 'یہ پہلی معلومات ہے۔'},
            {'text': 'یہ دوسری معلومات ہے۔'},
            {'text': 'یہ تیسری معلومات ہے۔'}
        ]
        formatted = rag.format_context(sample_chunks)
        print(formatted)

        print()
        print("=" * 70)
        print("✅ Demo completed successfully!")
        print("=" * 70)


if __name__ == '__main__':
    try:
        demo()
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
