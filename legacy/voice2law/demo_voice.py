#!/usr/bin/env python3
"""
Speech Pipeline Demo - End-to-End Voice Interaction
Shows: Audio → STT (Whisper) → RAG → TTS (ElevenLabs) → Audio
"""

import sys
from pathlib import Path
import json
import tempfile
import os

sys.path.insert(0, str(Path(__file__).parent))

from src.speech.stt import UrduSTT
from src.nlp.embedder import UrduEmbedder
from src.nlp.vectorstore import VectorStore
from src.nlp.rag_pipeline import LegalRAG


def create_demo_chunks(tmpdir):
    """Create sample chunks for demo."""
    mock_chunks = {
        "source_file": "criminal_law.pdf",
        "total_pages": 300,
        "pages_extracted": 298,
        "total_chunks": 5,
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
                    "word_count": 32
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
            }
        ]
    }

    chunks_file = Path(tmpdir) / "chunks.json"
    with open(chunks_file, 'w', encoding='utf-8') as f:
        json.dump(mock_chunks, f, ensure_ascii=False, indent=2)

    return chunks_file


def demo():
    """Run end-to-end voice interaction demo."""
    print("=" * 70)
    print("VOICE2LAW - End-to-End Voice Interaction Demo")
    print("=" * 70)

    with tempfile.TemporaryDirectory() as tmpdir:
        tmpdir = Path(tmpdir)

        # Setup components
        print("\n[Setup] Initializing components...")

        # 1. Initialize STT
        print("  - Loading Whisper (STT)...")
        stt = UrduSTT(model_size="base")

        # 2. Initialize RAG
        print("  - Loading embedder and vectorstore...")
        chunks_file = create_demo_chunks(tmpdir)
        embedder = UrduEmbedder()
        vectorstore = VectorStore(persist_dir=str(tmpdir / "vectorstore"), embedder=embedder)
        vectorstore.get_or_create_collection()
        vectorstore.ingest_chunks(str(chunks_file))

        print("  - Initializing RAG pipeline...")
        rag = LegalRAG(vectorstore=vectorstore, embedder=embedder)

        # 3. Initialize TTS
        print("  - Loading ElevenLabs TTS...")
        api_key = os.getenv('ELEVENLABS_API_KEY')
        voice_id = os.getenv('ELEVENLABS_VOICE_ID')
        tts_available = api_key and api_key != 'your_api_key_here' and voice_id and voice_id != 'your_voice_id_here'

        if tts_available:
            try:
                from src.speech.tts import UrduTTS
                tts = UrduTTS()
                print("  ✓ TTS ready")
            except Exception as e:
                print(f"  ⚠ TTS not available: {e}")
                tts = None
        else:
            print("  ⚠ TTS API keys not configured")
            tts = None

        print("\n✓ All components ready!")

        # Demo interaction
        print("\n" + "=" * 70)
        print("DEMO: Voice Question Answering")
        print("=" * 70)

        # Simulate different scenarios
        scenarios = [
            {
                "description": "Simple text query (no voice)",
                "query_text": "طلاق کے بارے میں کیا ہے؟"
            },
            {
                "description": "Another text query",
                "query_text": "مہر کی تعریف کریں۔"
            }
        ]

        for i, scenario in enumerate(scenarios, 1):
            print(f"\n--- Scenario {i}: {scenario['description']} ---")

            query = scenario['query_text']
            print(f"\n[Step 1] Input Query: {query}")

            # Step 2: RAG Processing
            print(f"\n[Step 2] Processing with RAG...")
            result = rag.answer(query, use_llm=False)
            answer_text = result['answer']
            confidence = result['confidence']
            pages = result['source_pages']

            print(f"  Answer: {answer_text[:150]}...")
            print(f"  Confidence: {confidence:.4f}")
            print(f"  Source pages: {pages}")

            # Step 3: TTS (if available)
            if tts:
                print(f"\n[Step 3] Converting answer to speech...")
                try:
                    audio_bytes = tts.speak(answer_text)
                    print(f"  ✓ Generated {len(audio_bytes)} bytes of audio")

                    # Save to file for demo
                    output_file = tmpdir / f"answer_{i}.mp3"
                    with open(output_file, 'wb') as f:
                        f.write(audio_bytes)
                    print(f"  ✓ Saved to: {output_file}")
                except Exception as e:
                    print(f"  ⚠ TTS failed: {e}")
            else:
                print(f"\n[Step 3] TTS not available (no API keys configured)")
                print(f"  Set ELEVENLABS_API_KEY and ELEVENLABS_VOICE_ID in .env to enable")

        # Statistics
        print("\n" + "=" * 70)
        print("PIPELINE STATISTICS")
        print("=" * 70)

        stt_info = stt.get_model_info()
        print(f"\nSpeech-to-Text (Whisper):")
        print(f"  Model size: {stt_info['model_size']}")
        print(f"  Language: {stt_info['language']}")
        print(f"  Input formats: {', '.join(stt_info['supported_formats'])}")

        rag_stats = vectorstore.get_stats()
        print(f"\nRetrieval-Augmented Generation:")
        print(f"  Collection: {rag_stats['collection_name']}")
        print(f"  Documents: {rag_stats['total_documents']}")
        print(f"  Embedding dim: {rag_stats['embedding_dim']}")

        if tts:
            tts_config = tts.get_config()
            print(f"\nText-to-Speech (ElevenLabs):")
            print(f"  Model: {tts_config['model']}")
            print(f"  Language: {tts_config['language']}")
            print(f"  Format: {tts_config['format']}")
        else:
            print(f"\nText-to-Speech (ElevenLabs):")
            print(f"  Status: Not available (API keys not configured)")

        print("\n" + "=" * 70)
        print("✅ Demo completed successfully!")
        print("=" * 70)

        print("\nNext steps:")
        print("1. Configure ElevenLabs API keys in .env for full speech synthesis")
        print("2. Test with real audio files from your microphone")
        print("3. Integrate with the React frontend for live voice interaction")


if __name__ == '__main__':
    try:
        demo()
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
