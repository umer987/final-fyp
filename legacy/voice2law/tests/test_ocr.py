import sys
from pathlib import Path
import tempfile
from PIL import Image, ImageDraw, ImageFilter
import numpy as np

sys.path.insert(0, str(Path(__file__).parent.parent))

from src.ocr.blur_detector import is_blurry, BlurDetector
from src.ocr.pdf_extractor import PDFExtractor


def create_test_image(filename, blur=False):
    """Create a test image."""
    img = Image.new('RGB', (500, 500), color='white')
    draw = ImageDraw.Draw(img)

    # Draw some text-like content
    draw.rectangle([50, 50, 450, 450], outline='black', width=2)
    draw.text((100, 100), "Test Document", fill='black')

    if blur:
        img = img.filter(ImageFilter.GaussianBlur(radius=5))

    img.save(filename)
    return filename


def test_blur_detector():
    """Test blur detection function."""
    print("\n=== Testing Blur Detector ===")

    with tempfile.TemporaryDirectory() as tmpdir:
        # Create clear image
        clear_path = Path(tmpdir) / "clear.png"
        blurry_path = Path(tmpdir) / "blurry.png"

        create_test_image(clear_path, blur=False)
        create_test_image(blurry_path, blur=True)

        # Test clear image
        is_blurry_clear, score_clear = is_blurry(str(clear_path), threshold=80)
        print(f"Clear image: is_blurry={is_blurry_clear}, score={score_clear:.2f}")
        assert not is_blurry_clear, "Clear image should not be blurry"

        # Test blurry image
        is_blurry_blurry, score_blurry = is_blurry(str(blurry_path), threshold=80)
        print(f"Blurry image: is_blurry={is_blurry_blurry}, score={score_blurry:.2f}")
        assert is_blurry_blurry, "Blurry image should be detected as blurry"

        print("✓ Blur detector test passed")


def test_text_cleaning():
    """Test text cleaning functions."""
    print("\n=== Testing Text Cleaning ===")

    extractor = PDFExtractor("dummy.pdf")

    # Test page number removal
    text_with_numbers = "Some content\n123\nMore content\n456\nEnd"
    cleaned = extractor._remove_page_numbers(text_with_numbers)
    print(f"Page removal: removed {text_with_numbers.count(chr(10)) - cleaned.count(chr(10))} lines")
    assert "123" not in cleaned
    assert "More content" in cleaned

    # Test whitespace removal
    text_with_whitespace = "Content   with\n\n\nmultiple  spaces"
    cleaned = extractor._clean_text(text_with_whitespace)
    assert "   " not in cleaned
    assert "\n\n" not in cleaned
    print("✓ Text cleaning test passed")


def test_chunking():
    """Test text chunking with overlap."""
    print("\n=== Testing Text Chunking ===")

    extractor = PDFExtractor("dummy.pdf")

    # Create sample text
    words = ["word"] * 1000
    text = " ".join(words)

    chunks = extractor._chunk_text(text, chunk_size=400, overlap=50)
    print(f"Text with 1000 words -> {len(chunks)} chunks")

    for i, chunk in enumerate(chunks):
        chunk_words = len(chunk.split())
        print(f"  Chunk {i}: {chunk_words} words")

    # Verify overlap
    if len(chunks) > 1:
        chunk1_words = chunks[0].split()
        chunk2_words = chunks[1].split()
        last_words_chunk1 = set(chunk1_words[-100:])
        first_words_chunk2 = set(chunk2_words[:100])
        overlap = len(last_words_chunk1 & first_words_chunk2)
        print(f"Overlap check: ~{overlap} words overlap between chunks")

    print("✓ Chunking test passed")


def test_chunk_metadata():
    """Test chunk metadata generation."""
    print("\n=== Testing Chunk Metadata ===")

    extractor = PDFExtractor("dummy.pdf")

    # Mock extracted pages
    extractor.pages_data = [
        {
            'page_number': 1,
            'text': ' '.join(['word'] * 500),
            'blur_score': 120,
            'status': 'extracted'
        },
        {
            'page_number': 2,
            'text': ' '.join(['word'] * 300),
            'blur_score': 120,
            'status': 'extracted'
        }
    ]

    chunks = extractor.create_chunks(chunk_size=300, overlap=50, category='criminal_law')

    print(f"Created {len(chunks)} chunks with metadata")
    for chunk in chunks[:3]:
        meta = chunk['metadata']
        print(f"  Chunk: page={meta['page_number']}, index={meta['chunk_index']}, words={meta['word_count']}")
        assert 'global_chunk_index' in meta
        assert 'category' in meta
        assert meta['category'] == 'criminal_law'

    print("✓ Metadata test passed")


if __name__ == "__main__":
    print("Running OCR Pipeline Tests...")

    try:
        test_blur_detector()
    except Exception as e:
        print(f"❌ Blur detector test failed: {e}")
        import traceback
        traceback.print_exc()

    try:
        test_text_cleaning()
    except Exception as e:
        print(f"❌ Text cleaning test failed: {e}")
        import traceback
        traceback.print_exc()

    try:
        test_chunking()
    except Exception as e:
        print(f"❌ Chunking test failed: {e}")
        import traceback
        traceback.print_exc()

    try:
        test_chunk_metadata()
    except Exception as e:
        print(f"❌ Metadata test failed: {e}")
        import traceback
        traceback.print_exc()

    print("\n✅ All OCR tests completed!")
