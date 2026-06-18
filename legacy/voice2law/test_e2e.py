#!/usr/bin/env python3
"""
End-to-end test: PDF → Chunks → Embeddings → Query
This script demonstrates the complete pipeline.
"""

import sys
from pathlib import Path
import json
import tempfile

sys.path.insert(0, str(Path(__file__).parent))

from src.ocr.pdf_extractor import PDFExtractor
from src.nlp.embedder import UrduEmbedder
from src.nlp.vectorstore import VectorStore
from src.nlp.rag_pipeline import RAGPipeline


def test_end_to_end():
    """Test complete pipeline from PDF to query."""
    print("=" * 70)
    print("VOICE2LAW: End-to-End Pipeline Test")
    print("=" * 70)

    with tempfile.TemporaryDirectory() as tmpdir:
        tmpdir = Path(tmpdir)

        # Step 1: Create mock chunks (simulating PDF extraction)
        print("\n[Step 1] Creating mock chunks (simulating PDF extraction)...")

        mock_chunks = {
            "source_file": "criminal_law.pdf",
            "total_pages": 300,
            "pages_extracted": 298,
            "pages_skipped": 2,
            "total_chunks": 10,
            "chunks": [
                # Criminal Law chunks
                {
                    "text": "مسلم فیملی لاء آرڈیننس 1961 میں طلاق کی تعریف: طلاق ایک قانونی عمل ہے جس کے ذریعے شوہر اپنی بیوی سے رشتہ توڑ سکتا ہے۔ یہ عمل شرعی قانون کے مطابق ہے اور پاکستان میں قانونی طور پر معتبر ہے۔ طلاق سے قبل بہت احتیاط کی ضرورت ہے۔",
                    "metadata": {
                        "page_number": 10,
                        "chunk_index": 0,
                        "global_chunk_index": 0,
                        "source_file": "criminal_law.pdf",
                        "category": "criminal_law",
                        "word_count": 40
                    }
                },
                {
                    "text": "طلاق کے اقسام: نکاح میں تین قسمیں ہیں۔ اول: عام طلاق جو بغیر کسی خاص وجہ کے دی جائے۔ دوم: مشروط طلاق جو کسی شرط کے ساتھ دی جائے۔ سوم: غصب میں طلاق۔ ہر قسم کی اپنی حانونی حیثیت ہے۔",
                    "metadata": {
                        "page_number": 15,
                        "chunk_index": 0,
                        "global_chunk_index": 1,
                        "source_file": "criminal_law.pdf",
                        "category": "criminal_law",
                        "word_count": 35
                    }
                },
                {
                    "text": "طلاق کے بعد حقوق: خاتون کو طلاق کے بعد متعہ ملتا ہے جو مسلم قانون میں فرض ہے۔ اگر شوہر متعہ سے انکار کرے تو خاتون عدالت میں شکایت کر سکتی ہے۔ عدالت خاتون کو اس کے حقوق دلوائے۔",
                    "metadata": {
                        "page_number": 20,
                        "chunk_index": 0,
                        "global_chunk_index": 2,
                        "source_file": "criminal_law.pdf",
                        "category": "criminal_law",
                        "word_count": 35
                    }
                },
                {
                    "text": "عدالت میں درخواست داخل کرنا: اگر کوئی شخص اپنے حقوق کے لیے عدالت میں درخواست دینا چاہے تو اسے درج ذیل دستاویزات کی ضرورت ہے: شناختی کارڈ، شاہادتیں، اور متعلقہ دستاویزات۔",
                    "metadata": {
                        "page_number": 25,
                        "chunk_index": 0,
                        "global_chunk_index": 3,
                        "source_file": "criminal_law.pdf",
                        "category": "criminal_law",
                        "word_count": 32
                    }
                },
                {
                    "text": "وکیل کی ضرورت: عدالت میں اپنا کیس لڑنے کے لیے ایک اچھے وکیل کا ہونا بہت ضروری ہے۔ وکیل آپ کو قانونی مشورہ دے اور آپ کے حقوق کی حفاظت کرے۔ ہمیشہ تجربہ کار وکیل کو منتخب کریں۔",
                    "metadata": {
                        "page_number": 30,
                        "chunk_index": 0,
                        "global_chunk_index": 4,
                        "source_file": "criminal_law.pdf",
                        "category": "criminal_law",
                        "word_count": 35
                    }
                },
                # More chunks
                {
                    "text": "خاتون کی شکایت: اگر خاتون کو ظلم کا سامنا ہو تو وہ پولیس میں رپورٹ درج کروا سکتی ہے۔ پولیس کو خاتون کی شکایت پر غور کرنا لازمی ہے۔ شکایت درج کرنے میں کوئی فیس نہیں ہوتی۔",
                    "metadata": {
                        "page_number": 35,
                        "chunk_index": 0,
                        "global_chunk_index": 5,
                        "source_file": "criminal_law.pdf",
                        "category": "criminal_law",
                        "word_count": 30
                    }
                },
                {
                    "text": "عام غلطیاں: بہت سے لوگ قانون سے ناواقفیت کی وجہ سے غلطیاں کرتے ہیں۔ مثلاً غیر قانونی طریقے سے طلاق دینا، یا دستاویزات کو درست طریقے سے محفوظ نہ رکھنا۔ ہمیشہ قانون کی رہنمائی میں کام کریں۔",
                    "metadata": {
                        "page_number": 40,
                        "chunk_index": 0,
                        "global_chunk_index": 6,
                        "source_file": "criminal_law.pdf",
                        "category": "criminal_law",
                        "word_count": 33
                    }
                },
                {
                    "text": "بچوں کی کسٹڈی: طلاق کے بعد بچوں کی کسٹڈی کا معاملہ بہت اہم ہے۔ عام طور پر ننھے بچے ماں کے ساتھ رہتے ہیں اور بڑے بیٹے باپ کے ساتھ۔ عدالت ہر معاملے میں بچے کی بہتری کو سامنے رکھ کر فیصلہ کرتی ہے۔",
                    "metadata": {
                        "page_number": 45,
                        "chunk_index": 0,
                        "global_chunk_index": 7,
                        "source_file": "criminal_law.pdf",
                        "category": "criminal_law",
                        "word_count": 35
                    }
                },
                {
                    "text": "مہر کا حق: خاتون کو نکاح کے وقت جو مہر طے کیا جاتا ہے وہ اس کا حق ہے۔ طلاق کی صورت میں بھی مہر ملنا لازمی ہے۔ اگر شوہر مہر سے انکار کرے تو عدالت میں شکایت کی جا سکتی ہے۔",
                    "metadata": {
                        "page_number": 50,
                        "chunk_index": 0,
                        "global_chunk_index": 8,
                        "source_file": "criminal_law.pdf",
                        "category": "criminal_law",
                        "word_count": 34
                    }
                },
                {
                    "text": "وصیت اور وراثت: ہر انسان کو وصیت لکھنے کا حق ہے۔ وصیت میں آپ اپنی جائیداد کے بارے میں ہدایات دے سکتے ہیں۔ وصیت تمام اسلامی قوانین کے مطابق ہونی چاہیے اور دستخط شدہ ہونی چاہیے۔",
                    "metadata": {
                        "page_number": 55,
                        "chunk_index": 0,
                        "global_chunk_index": 9,
                        "source_file": "criminal_law.pdf",
                        "category": "criminal_law",
                        "word_count": 32
                    }
                }
            ],
            "statistics": {
                "avg_chunk_words": 34,
                "total_words": 340,
                "skipped_pages": []
            }
        }

        chunks_file = tmpdir / "chunks.json"
        with open(chunks_file, 'w', encoding='utf-8') as f:
            json.dump(mock_chunks, f, ensure_ascii=False, indent=2)

        print(f"✓ Created {len(mock_chunks['chunks'])} chunks")

        # Step 2: Create embeddings and store in vector DB
        print("\n[Step 2] Creating embeddings and storing in ChromaDB...")
        embedder = UrduEmbedder()
        vectorstore = VectorStore(persist_dir=str(tmpdir / "vectorstore"), embedder=embedder)
        vectorstore.get_or_create_collection()

        stats = vectorstore.ingest_chunks(str(chunks_file))
        print(f"✓ Ingested {stats['total_ingested']} chunks")

        # Step 3: Initialize RAG pipeline
        print("\n[Step 3] Initializing RAG pipeline...")
        rag = RAGPipeline(vectorstore=vectorstore, embedder=embedder)
        print("✓ RAG pipeline ready")

        # Step 4: Test with multiple queries
        print("\n[Step 4] Testing queries...")

        test_queries = [
            "طلاق کے بارے میں کیا جاننا چاہیے؟",
            "عدالت میں شکایت داخل کرنے کے لیے کیا دستاویزات چاہیے؟",
            "بچوں کی کسٹڈی کا قانون کیا ہے؟",
            "مہر کی تعریف کریں۔",
        ]

        for i, query in enumerate(test_queries, 1):
            print(f"\n--- Query {i} ---")
            print(f"Q: {query}")

            result = rag.answer(query, n_docs=3)

            print(f"Retrieved {len(result['retrieved_documents'])} documents:")
            for j, (doc, score) in enumerate(zip(result['retrieved_documents'], result['scores']), 1):
                print(f"  [{j}] Score: {score:.4f}")
                print(f"      {doc[:100]}...")

            print(f"\nGenerated Answer (first 200 chars):")
            print(f"  {result['answer'][:200]}...")

        print("\n" + "=" * 70)
        print("✅ End-to-End Test Complete!")
        print("=" * 70)


if __name__ == '__main__':
    try:
        test_end_to_end()
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
