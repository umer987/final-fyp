import easyocr
import json
import re
from pathlib import Path
from pdf2image import convert_from_path
from collections import defaultdict
from .blur_detector import BlurDetector


class PDFExtractor:
    """
    Extract text from scanned PDFs using EasyOCR.
    Includes blur detection, text cleaning, and chunking.
    """

    def __init__(self, pdf_path: str, languages: list = None, blur_threshold: float = 80):
        """
        Initialize PDF extractor.

        Args:
            pdf_path: Path to PDF file
            languages: OCR languages (default: ['ur', 'en'])
            blur_threshold: Blur detection threshold (default: 80)
        """
        self.pdf_path = Path(pdf_path)
        self.languages = languages or ['ur', 'en']
        self.blur_threshold = blur_threshold
        self.blur_detector = BlurDetector(threshold=blur_threshold)

        self.reader = None
        self.pages_data = []
        self.skipped_pages = []
        self.chunks = []

    def _init_ocr_reader(self):
        """Lazy load EasyOCR reader."""
        if self.reader is None:
            print(f"Loading EasyOCR for languages: {self.languages}")
            self.reader = easyocr.Reader(self.languages, gpu=False)

    def _remove_page_numbers(self, text: str) -> str:
        """Remove lines that are just page numbers."""
        lines = text.split('\n')
        filtered = []
        for line in lines:
            stripped = line.strip()
            if stripped and not re.match(r'^\d+$', stripped):
                filtered.append(line)
        return '\n'.join(filtered)

    def _remove_repeated_headers_footers(self, text: str) -> str:
        """
        Remove common repeated headers/footers.
        Looks for patterns that repeat every few lines.
        """
        lines = text.split('\n')
        if len(lines) < 10:
            return text

        # Count line occurrences
        line_counts = defaultdict(int)
        for line in lines:
            stripped = line.strip()
            if stripped and len(stripped) < 100:
                line_counts[stripped] += 1

        # Identify lines that appear very frequently (likely headers/footers)
        threshold = max(len(lines) // 10, 2)
        repeated_lines = {line for line, count in line_counts.items() if count > threshold}

        # Filter out repeated lines
        filtered = [line for line in lines if line.strip() not in repeated_lines]
        return '\n'.join(filtered)

    def _clean_text(self, text: str) -> str:
        """
        Clean extracted text.
        - Remove extra whitespace and blank lines
        - Remove page numbers
        - Remove headers/footers
        - Preserve Urdu text
        """
        # Remove extra whitespace
        text = re.sub(r'\n\s*\n', '\n', text)
        text = re.sub(r'[ \t]+', ' ', text)
        text = text.strip()

        # Remove page numbers
        text = self._remove_page_numbers(text)

        # Remove headers/footers
        text = self._remove_repeated_headers_footers(text)

        # Final cleanup
        text = re.sub(r'\n\s*\n', '\n', text)
        text = text.strip()

        return text

    def extract_text(self) -> list[dict]:
        """
        Extract text from all pages using EasyOCR.
        Skips blurry pages.

        Returns:
            List of dicts with page_number, text, blur_score, status
        """
        self._init_ocr_reader()

        if not self.pdf_path.exists():
            raise FileNotFoundError(f"PDF not found: {self.pdf_path}")

        print(f"Converting PDF to images: {self.pdf_path}")
        images = convert_from_path(str(self.pdf_path))
        print(f"Processing {len(images)} pages...")

        extracted_pages = []

        for page_num, image in enumerate(images, 1):
            # Check if page is blurry
            is_blurry, blur_score = self.blur_detector.detect_blur_in_image(image)

            if is_blurry:
                print(f"  Page {page_num}: SKIPPED (blurry, score={blur_score:.2f})")
                self.skipped_pages.append(page_num)
                extracted_pages.append({
                    'page_number': page_num,
                    'text': '',
                    'blur_score': blur_score,
                    'status': 'skipped_blurry'
                })
                continue

            # Run OCR on clear page
            try:
                print(f"  Page {page_num}: Running OCR (blur_score={blur_score:.2f})...")
                ocr_result = self.reader.readtext(image, detail=0)
                text = '\n'.join(ocr_result)

                # Clean text
                text = self._clean_text(text)

                extracted_pages.append({
                    'page_number': page_num,
                    'text': text,
                    'blur_score': blur_score,
                    'status': 'extracted'
                })
                print(f"       ✓ Extracted {len(text)} characters")

            except Exception as e:
                print(f"  Page {page_num}: ERROR - {e}")
                extracted_pages.append({
                    'page_number': page_num,
                    'text': '',
                    'blur_score': blur_score,
                    'status': 'error',
                    'error': str(e)
                })

        self.pages_data = extracted_pages
        print(f"\nExtraction complete: {len([p for p in extracted_pages if p['status'] == 'extracted'])} pages extracted, {len(self.skipped_pages)} skipped")
        return extracted_pages

    def _chunk_text(self, text: str, chunk_size: int = 400, overlap: int = 50) -> list[str]:
        """
        Split text into overlapping chunks.

        Args:
            text: Full text to chunk
            chunk_size: Target words per chunk (300-500)
            overlap: Overlap in words between chunks

        Returns:
            List of text chunks
        """
        words = text.split()
        chunks = []

        i = 0
        while i < len(words):
            chunk = ' '.join(words[i:i + chunk_size])
            chunks.append(chunk)
            i += chunk_size - overlap

        return chunks

    def create_chunks(self, chunk_size: int = 400, overlap: int = 50, category: str = "criminal_law") -> list[dict]:
        """
        Create overlapping chunks from extracted pages.
        Each chunk includes metadata.

        Args:
            chunk_size: Target words per chunk
            overlap: Overlap in words
            category: Category for metadata (e.g., 'criminal_law')

        Returns:
            List of chunk dicts with text and metadata
        """
        if not self.pages_data:
            raise ValueError("No pages extracted yet. Call extract_text() first.")

        self.chunks = []
        global_chunk_index = 0

        for page_data in self.pages_data:
            if page_data['status'] != 'extracted':
                continue

            page_num = page_data['page_number']
            text = page_data['text']

            if not text.strip():
                continue

            # Split page into chunks
            page_chunks = self._chunk_text(text, chunk_size, overlap)

            for chunk_idx, chunk_text in enumerate(page_chunks):
                self.chunks.append({
                    'text': chunk_text,
                    'metadata': {
                        'page_number': page_num,
                        'chunk_index': chunk_idx,
                        'global_chunk_index': global_chunk_index,
                        'source_file': self.pdf_path.name,
                        'category': category,
                        'word_count': len(chunk_text.split())
                    }
                })
                global_chunk_index += 1

        print(f"Created {len(self.chunks)} chunks from {len([p for p in self.pages_data if p['status'] == 'extracted'])} pages")
        return self.chunks

    def save_chunks(self, output_path: str = None) -> str:
        """
        Save chunks to JSON file.

        Args:
            output_path: Output file path (default: data/processed/criminal_law_chunks.json)

        Returns:
            Path to saved file
        """
        if not self.chunks:
            raise ValueError("No chunks created. Call create_chunks() first.")

        if output_path is None:
            output_path = 'data/processed/criminal_law_chunks.json'

        output_file = Path(output_path)
        output_file.parent.mkdir(parents=True, exist_ok=True)

        # Prepare output data
        output_data = {
            'source_file': self.pdf_path.name,
            'total_pages': len(self.pages_data),
            'pages_extracted': len([p for p in self.pages_data if p['status'] == 'extracted']),
            'pages_skipped': len(self.skipped_pages),
            'total_chunks': len(self.chunks),
            'chunks': self.chunks,
            'statistics': {
                'avg_chunk_words': sum(c['metadata']['word_count'] for c in self.chunks) / len(self.chunks) if self.chunks else 0,
                'total_words': sum(c['metadata']['word_count'] for c in self.chunks),
                'skipped_pages': self.skipped_pages
            }
        }

        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(output_data, f, ensure_ascii=False, indent=2)

        print(f"✓ Chunks saved to {output_file}")
        return str(output_file)

    def save_extraction_report(self, output_path: str = None) -> str:
        """
        Save extraction report with page-by-page details.

        Args:
            output_path: Output file path

        Returns:
            Path to saved file
        """
        if output_path is None:
            output_path = 'data/processed/extraction_report.json'

        output_file = Path(output_path)
        output_file.parent.mkdir(parents=True, exist_ok=True)

        report = {
            'source_file': self.pdf_path.name,
            'total_pages': len(self.pages_data),
            'extraction_summary': {
                'extracted': len([p for p in self.pages_data if p['status'] == 'extracted']),
                'skipped_blurry': len([p for p in self.pages_data if p['status'] == 'skipped_blurry']),
                'errors': len([p for p in self.pages_data if p['status'] == 'error'])
            },
            'pages': self.pages_data
        }

        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(report, f, ensure_ascii=False, indent=2)

        print(f"✓ Report saved to {output_file}")
        return str(output_file)

