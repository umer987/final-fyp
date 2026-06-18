"""Extract text from legal PDFs — text-layer fast path, then OCR for scans.

Fastest path: pypdf direct text extraction when the PDF has a selectable text
layer (official gazette / Pakistan Code exports). No Azure or Tesseract needed.

Scan path: rasterize with pdf2image (Poppler), preprocess with OpenCV, OCR with
Tesseract (slow, local, free).

Cloud OCR: set OCR_ENGINE=azure to send image-only PDFs to Azure Document
Intelligence (prebuilt-read). Very large PDFs are split into page batches.
"""
from __future__ import annotations

import io
import logging
import time
from typing import Callable, TypeVar

import numpy as np

from app.config import settings

logger = logging.getLogger(__name__)

# Azure OCR tuning for large scanned law books (150–250 MB PDFs).
# Smaller batches reduce upload size and connection resets on image-heavy scans.
AZURE_PAGES_PER_BATCH = 25
AZURE_LARGE_FILE_MB = 50
AZURE_LARGE_PAGE_COUNT = 100
AZURE_MAX_RETRIES = 3
AZURE_CONNECTION_TIMEOUT_SEC = 120
AZURE_READ_TIMEOUT_SEC = 600
AZURE_POLLER_TIMEOUT_SEC = 600

# Text-layer PDF detection: require ~500 chars per 10 pages (50 chars/page avg).
TEXT_PDF_CHARS_PER_10_PAGES = 500
TEXT_PDF_MIN_CHARS = 200

try:  # Heavy / system-dependent imports are guarded so the module stays importable.
    import cv2
except Exception:  # pragma: no cover - cv2 missing until deps installed
    cv2 = None  # type: ignore[assignment]

try:
    import pytesseract
except Exception:  # pragma: no cover
    pytesseract = None  # type: ignore[assignment]

try:
    from pdf2image import convert_from_path
except Exception:  # pragma: no cover
    convert_from_path = None  # type: ignore[assignment]

try:
    from pypdf import PdfReader, PdfWriter
except Exception:  # pragma: no cover
    PdfReader = None  # type: ignore[assignment,misc]
    PdfWriter = None  # type: ignore[assignment,misc]

T = TypeVar("T")


def _ensure_tesseract() -> None:
    if pytesseract is None:
        raise RuntimeError("pytesseract is not installed. Run: pip install -r requirements.txt")
    if settings.tesseract_cmd:
        pytesseract.pytesseract.tesseract_cmd = settings.tesseract_cmd


def _ensure_azure_credentials() -> None:
    missing: list[str] = []
    if not settings.azure_document_intelligence_endpoint.strip():
        missing.append("AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT")
    if not settings.azure_document_intelligence_key.strip():
        missing.append("AZURE_DOCUMENT_INTELLIGENCE_KEY")
    if missing:
        raise RuntimeError(
            "OCR_ENGINE=azure but the following are not set in .env: "
            + ", ".join(missing)
        )


def _ensure_pypdf() -> None:
    if PdfReader is None or PdfWriter is None:
        raise RuntimeError("pypdf is not installed. Run: pip install -r requirements.txt")


def _is_retryable_error(exc: BaseException) -> bool:
    """Return True for transient network / rate-limit failures."""
    retryable_types = (
        ConnectionResetError,
        ConnectionAbortedError,
        ConnectionError,
        TimeoutError,
        OSError,
    )
    if isinstance(exc, retryable_types):
        return True

    try:
        from azure.core.exceptions import HttpResponseError, ServiceRequestError
    except ImportError:
        HttpResponseError = ServiceRequestError = ()  # type: ignore[assignment,misc]

    if isinstance(exc, ServiceRequestError):
        return True
    if isinstance(exc, HttpResponseError) and exc.status_code in (429, 503):
        return True

    try:
        import requests

        if isinstance(
            exc,
            (
                requests.exceptions.ConnectionError,
                requests.exceptions.Timeout,
                requests.exceptions.ChunkedEncodingError,
            ),
        ):
            return True
    except ImportError:
        pass

    # requests / urllib3 often wrap ConnectionResetError in a tuple message.
    if isinstance(exc, tuple) and len(exc) == 2 and isinstance(exc[1], ConnectionResetError):
        return True

    cause = getattr(exc, "__cause__", None)
    if cause is not None and _is_retryable_error(cause):
        return True

    # e.g. requests.exceptions.ConnectionError("...", ConnectionResetError(...))
    if hasattr(exc, "args") and exc.args:
        for arg in exc.args:
            if isinstance(arg, retryable_types):
                return True
            if isinstance(arg, tuple):
                for item in arg:
                    if isinstance(item, retryable_types):
                        return True

    return False


def _retry_with_backoff(
    operation: Callable[[], T],
    *,
    label: str,
    max_attempts: int = AZURE_MAX_RETRIES,
) -> T:
    last_exc: BaseException | None = None
    for attempt in range(1, max_attempts + 1):
        try:
            return operation()
        except Exception as exc:
            last_exc = exc
            if not _is_retryable_error(exc) or attempt >= max_attempts:
                raise
            wait = 2 ** (attempt - 1)
            logger.warning(
                "%s failed (attempt %d/%d): %s — retrying in %ds",
                label,
                attempt,
                max_attempts,
                exc,
                wait,
            )
            print(f"  [azure-ocr] {label}: transient error, retry {attempt}/{max_attempts} in {wait}s…")
            time.sleep(wait)
    raise last_exc  # pragma: no cover


def _create_azure_client():
    from azure.ai.documentintelligence import DocumentIntelligenceClient
    from azure.core.credentials import AzureKeyCredential
    from azure.core.pipeline.transport import RequestsTransport

    endpoint = settings.azure_document_intelligence_endpoint.strip().rstrip("/")
    transport = RequestsTransport(
        connection_timeout=AZURE_CONNECTION_TIMEOUT_SEC,
        read_timeout=AZURE_READ_TIMEOUT_SEC,
    )
    return DocumentIntelligenceClient(
        endpoint=endpoint,
        credential=AzureKeyCredential(settings.azure_document_intelligence_key.strip()),
        transport=transport,
    )


def _analyze_pdf_bytes(client, pdf_bytes: bytes) -> str:
    def _call() -> str:
        poller = client.begin_analyze_document("prebuilt-read", body=pdf_bytes)
        result = poller.result(timeout=AZURE_POLLER_TIMEOUT_SEC)
        return (result.content or "").strip()

    return _retry_with_backoff(_call, label="analyze batch")


def _pdf_page_count(pdf_path: str) -> int:
    _ensure_pypdf()
    with open(pdf_path, "rb") as pdf_file:
        return len(PdfReader(pdf_file).pages)


def _text_pdf_char_threshold(page_count: int) -> int:
    """Minimum extracted chars to treat a PDF as text-based (not a scan)."""
    if page_count <= 0:
        return TEXT_PDF_MIN_CHARS
    scaled = int((page_count / 10) * TEXT_PDF_CHARS_PER_10_PAGES)
    return max(TEXT_PDF_MIN_CHARS, scaled)


def pypdf_extract_text(pdf_path: str) -> tuple[str, int]:
    """Extract embedded text with pypdf. Returns (text, page_count)."""
    _ensure_pypdf()
    with open(pdf_path, "rb") as pdf_file:
        reader = PdfReader(pdf_file)
        page_count = len(reader.pages)
        parts: list[str] = []
        for page in reader.pages:
            page_text = page.extract_text() or ""
            if page_text.strip():
                parts.append(page_text.strip())
    return "\n\n".join(parts).strip(), page_count


def is_text_layer_pdf(pdf_path: str) -> bool:
    """True when pypdf extracts enough text to skip OCR (selectable-text PDF)."""
    text, page_count = pypdf_extract_text(pdf_path)
    threshold = _text_pdf_char_threshold(page_count)
    return len(text) >= threshold


def try_pypdf_text(pdf_path: str) -> str | None:
    """Return pypdf text when the PDF passes the text-layer threshold, else None."""
    text, page_count = pypdf_extract_text(pdf_path)
    threshold = _text_pdf_char_threshold(page_count)
    if len(text) >= threshold:
        print(
            f"  [text-pdf] Using embedded text ({len(text):,} chars, "
            f"{page_count} pages; threshold {threshold:,}) — skipping OCR."
        )
        return text
    print(
        f"  [text-pdf] Only {len(text):,} chars from {page_count} pages "
        f"(need {threshold:,}) — treating as scanned PDF, using OCR."
    )
    return None


def _extract_pdf_page_range(pdf_path: str, start_page: int, end_page: int) -> bytes:
    """Extract pages [start_page, end_page) (0-based, end exclusive) as a new PDF."""
    _ensure_pypdf()
    reader = PdfReader(pdf_path)
    writer = PdfWriter()
    for page_index in range(start_page, end_page):
        writer.add_page(reader.pages[page_index])
    buffer = io.BytesIO()
    writer.write(buffer)
    return buffer.getvalue()


def _should_batch_azure(pdf_path: str, page_count: int) -> bool:
    import os

    size_mb = os.path.getsize(pdf_path) / (1024 * 1024)
    return size_mb > AZURE_LARGE_FILE_MB or page_count > AZURE_LARGE_PAGE_COUNT


def azure_pdf_to_text(pdf_path: str) -> str:
    """OCR a PDF with Azure Document Intelligence (prebuilt-read).

    Large PDFs are split into page batches to avoid connection resets on long uploads.
    Each batch is retried with exponential backoff on transient failures.
    """
    _ensure_azure_credentials()
    try:
        from azure.ai.documentintelligence import DocumentIntelligenceClient  # noqa: F401
    except ImportError as exc:
        raise RuntimeError(
            "azure-ai-documentintelligence is not installed. Run: pip install -r requirements.txt"
        ) from exc

    page_count = _pdf_page_count(pdf_path)
    client = _create_azure_client()

    if not _should_batch_azure(pdf_path, page_count):
        print(f"  [azure-ocr] Sending whole PDF ({page_count} pages)…")
        with open(pdf_path, "rb") as pdf_file:
            return _analyze_pdf_bytes(client, pdf_file.read())

    batch_count = (page_count + AZURE_PAGES_PER_BATCH - 1) // AZURE_PAGES_PER_BATCH
    print(
        f"  [azure-ocr] Large PDF ({page_count} pages) — "
        f"processing in {batch_count} batch(es) of up to {AZURE_PAGES_PER_BATCH} pages…"
    )

    batch_texts: list[str] = []
    for batch_index, start_page in enumerate(range(0, page_count, AZURE_PAGES_PER_BATCH), start=1):
        end_page = min(start_page + AZURE_PAGES_PER_BATCH, page_count)
        print(
            f"  [azure-ocr] Batch {batch_index}/{batch_count}: "
            f"pages {start_page + 1}–{end_page} of {page_count}…"
        )
        batch_bytes = _extract_pdf_page_range(pdf_path, start_page, end_page)
        text = _analyze_pdf_bytes(client, batch_bytes)
        batch_texts.append(text)
        print(f"  [azure-ocr] Batch {batch_index}/{batch_count} done ({len(text):,} chars).")

    return "\n\n".join(t for t in batch_texts if t).strip()


def _tesseract_pdf_to_text(pdf_path: str, lang: str = "eng", dpi: int = 300) -> str:
    """Local Tesseract OCR path (used as fallback when Azure fails)."""
    if convert_from_path is None:
        raise RuntimeError("pdf2image is not installed (and Poppler must be on PATH).")

    pages = convert_from_path(pdf_path, dpi=dpi)
    page_texts: list[str] = []
    for page in pages:
        img = np.array(page)
        processed = preprocess_image(img)
        text = ocr_image(processed, lang)
        page_texts.append(text.strip())

    return "\n\n".join(page_texts).strip()


def preprocess_image(img: np.ndarray) -> np.ndarray:
    """Clean a raw scanned page to improve OCR accuracy on blurry scans.

    Steps:
      1. Grayscale       — OCR works on intensity, not colour.
      2. Denoise         — fastNlMeans removes CamScanner speckle/JPEG noise.
      3. Deskew          — straighten pages tilted during scanning.
      4. Sharpen         — counteract blur via an unsharp-mask kernel.
      5. Adaptive thresh — binarize with local thresholds to handle uneven lighting.
    """
    if cv2 is None:
        raise RuntimeError("opencv-python-headless is not installed.")

    # 1. Grayscale
    if img.ndim == 3:
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    else:
        gray = img

    # 2. Denoise
    gray = cv2.fastNlMeansDenoising(gray, h=10, templateWindowSize=7, searchWindowSize=21)

    # 3. Deskew — estimate text angle from foreground pixels, rotate to level.
    gray = _deskew(gray)

    # 4. Sharpen (unsharp mask) — recover edges lost to blur.
    blurred = cv2.GaussianBlur(gray, (0, 0), sigmaX=3)
    gray = cv2.addWeighted(gray, 1.5, blurred, -0.5, 0)

    # 5. Adaptive threshold — robust to uneven CamScanner lighting/shadows.
    binary = cv2.adaptiveThreshold(
        gray,
        255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        blockSize=31,
        C=15,
    )
    return binary


def _deskew(gray: np.ndarray) -> np.ndarray:
    """Rotate the page so text lines are horizontal (minAreaRect on ink pixels)."""
    if cv2 is None:
        return gray
    inverted = cv2.bitwise_not(gray)
    coords = np.column_stack(np.where(inverted > 0))
    if coords.size == 0:
        return gray

    angle = cv2.minAreaRect(coords)[-1]
    angle = -(90 + angle) if angle < -45 else -angle
    if abs(angle) < 0.1:  # skip negligible rotation
        return gray

    h, w = gray.shape[:2]
    matrix = cv2.getRotationMatrix2D((w / 2, h / 2), angle, 1.0)
    return cv2.warpAffine(
        gray, matrix, (w, h),
        flags=cv2.INTER_CUBIC,
        borderMode=cv2.BORDER_REPLICATE,
    )


def ocr_image(img: np.ndarray, lang: str = "eng") -> str:
    """OCR a single preprocessed page image with Tesseract (English by default)."""
    _ensure_tesseract()
    return pytesseract.image_to_string(img, lang=lang)


def pdf_to_text(pdf_path: str, lang: str = "eng", dpi: int = 300) -> str:
    """Extract text from a PDF.

    Order: pypdf text layer (fast, no cloud) -> Azure OCR -> Tesseract OCR.
    Text-layer PDFs from Pakistan Code / official sources skip OCR entirely.
    """
    direct = try_pypdf_text(pdf_path)
    if direct is not None:
        return direct

    engine = settings.ocr_engine.lower().strip()
    if engine == "azure":
        try:
            return azure_pdf_to_text(pdf_path)
        except Exception as exc:
            print(
                f"  [azure-ocr] Azure OCR failed after retries: {exc}\n"
                "  [azure-ocr] Falling back to local Tesseract (slow)…"
            )
            logger.warning("Azure OCR failed for %s, falling back to Tesseract: %s", pdf_path, exc)
            return _tesseract_pdf_to_text(pdf_path, lang=lang, dpi=dpi)

    return _tesseract_pdf_to_text(pdf_path, lang=lang, dpi=dpi)
