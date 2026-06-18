#!/usr/bin/env python
"""Quick setup - create sample data and start API"""

import json
from pathlib import Path

# Create sample chunks
chunks_data = {
    "source_file": "criminal_law.pdf",
    "total_pages": 300,
    "pages_extracted": 298,
    "total_chunks": 6,
    "chunks": [
        {
            "text": "چوری کی سزا: پاکستان میں چوری کو سنگین جرم سمجھا جاتا ہے۔ دستور کے تحت چور کو سزا دی جا سکتی ہے۔",
            "metadata": {"page_number": 10, "chunk_index": 0, "global_chunk_index": 0, "source_file": "criminal_law.pdf", "category": "criminal_law", "word_count": 20}
        },
        {
            "text": "قتل کی سزا: قتل ایک انتہائی سنگین جرم ہے۔ ہر شخص کی جان محفوظ ہے۔",
            "metadata": {"page_number": 20, "chunk_index": 0, "global_chunk_index": 1, "source_file": "criminal_law.pdf", "category": "criminal_law", "word_count": 15}
        },
        {
            "text": "ڈکیتی کی سزا: ڈکیتی میں ہتھیاروں کا استعمال شامل ہے۔",
            "metadata": {"page_number": 30, "chunk_index": 0, "global_chunk_index": 2, "source_file": "criminal_law.pdf", "category": "criminal_law", "word_count": 12}
        },
        {
            "text": "جھوٹی گواہی: کسی کے خلاف جھوٹی گواہی دینا سنگین جرم ہے۔",
            "metadata": {"page_number": 40, "chunk_index": 0, "global_chunk_index": 3, "source_file": "criminal_law.pdf", "category": "criminal_law", "word_count": 12}
        },
        {
            "text": "رشوت خوری: حکومتی ملازمین سے رشوت لینا منع ہے۔",
            "metadata": {"page_number": 50, "chunk_index": 0, "global_chunk_index": 4, "source_file": "criminal_law.pdf", "category": "criminal_law", "word_count": 11}
        },
        {
            "text": "ملزم کے حقوق: ہر ملزم کو منصفانہ سماعت کا حق ہے۔",
            "metadata": {"page_number": 60, "chunk_index": 0, "global_chunk_index": 5, "source_file": "criminal_law.pdf", "category": "criminal_law", "word_count": 12}
        }
    ],
    "statistics": {"avg_chunk_words": 14, "total_words": 82}
}

# Save chunks
processed_dir = Path("data/processed")
processed_dir.mkdir(parents=True, exist_ok=True)

chunks_file = processed_dir / "criminal_law_chunks.json"
with open(chunks_file, 'w', encoding='utf-8') as f:
    json.dump(chunks_data, f, ensure_ascii=False, indent=2)

print(f"✓ Sample chunks created at: {chunks_file}")
print("✓ Now ingest chunks into vectorstore...")

# Ingest chunks
try:
    from src.nlp.embedder import UrduEmbedder
    from src.nlp.vectorstore import VectorStore
    
    print("Loading embedder...")
    embedder = UrduEmbedder()
    
    print("Loading vectorstore...")
    vectorstore = VectorStore()
    vectorstore.get_or_create_collection()
    
    print("Ingesting chunks...")
    stats = vectorstore.ingest_chunks(str(chunks_file))
    
    print(f"\n✓ Setup complete!")
    print(f"  Chunks indexed: {stats['total_ingested']}")
    print(f"\nNow run:")
    print("  uvicorn src.api.main:app --host 0.0.0.0 --port 8000 --reload")
    
except Exception as e:
    print(f"Error during ingestion: {e}")
    print("Make sure dependencies are installed: pip install -r requirements.txt")
