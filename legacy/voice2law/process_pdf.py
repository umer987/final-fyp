#!/usr/bin/env python3
"""
Process PDF: Extract text using EasyOCR with blur detection and chunking.
Usage: python process_pdf.py <pdf_path> [output_dir]
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from src.ocr.pdf_extractor import PDFExtractor


def main():
    if len(sys.argv) < 2:
        print("Usage: python process_pdf.py <pdf_path> [output_dir]")
        print("Example: python process_pdf.py data/raw/criminal_law.pdf data/processed")
        sys.exit(1)

    pdf_path = sys.argv[1]
    output_dir = sys.argv[2] if len(sys.argv) > 2 else 'data/processed'

    if not Path(pdf_path).exists():
        print(f"❌ PDF not found: {pdf_path}")
        sys.exit(1)

    print(f"Processing PDF: {pdf_path}")
    print(f"Output directory: {output_dir}")
    print()

    try:
        # Extract text
        extractor = PDFExtractor(pdf_path, languages=['ur', 'en'], blur_threshold=80)
        pages = extractor.extract_text()

        # Create chunks
        chunks = extractor.create_chunks(chunk_size=400, overlap=50, category='criminal_law')

        # Save chunks
        chunks_file = extractor.save_chunks(f'{output_dir}/criminal_law_chunks.json')

        # Save report
        report_file = extractor.save_extraction_report(f'{output_dir}/extraction_report.json')

        # Print summary
        print()
        print("=" * 60)
        print("EXTRACTION SUMMARY")
        print("=" * 60)
        print(f"Total pages:        {len(pages)}")
        print(f"Pages extracted:    {len([p for p in pages if p['status'] == 'extracted'])}")
        print(f"Pages skipped:      {len([p for p in pages if p['status'] == 'skipped_blurry'])}")
        print(f"Pages with errors:  {len([p for p in pages if p['status'] == 'error'])}")
        print(f"Total chunks:       {len(chunks)}")
        if chunks:
            avg_words = sum(c['metadata']['word_count'] for c in chunks) / len(chunks)
            total_words = sum(c['metadata']['word_count'] for c in chunks)
            print(f"Total words:        {total_words}")
            print(f"Avg words/chunk:    {avg_words:.0f}")
        print()
        print(f"✓ Chunks saved to: {chunks_file}")
        print(f"✓ Report saved to: {report_file}")

    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    main()
