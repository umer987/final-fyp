import cv2
import numpy as np
from pathlib import Path


def is_blurry(image_path: str, threshold: float = 80) -> tuple[bool, float]:
    """
    Detect if an image is blurry using Laplacian variance.

    Args:
        image_path: Path to image file
        threshold: Laplacian variance threshold. Below this = blurry.

    Returns:
        Tuple of (is_blurry: bool, score: float)
    """
    if not Path(image_path).exists():
        raise FileNotFoundError(f"Image not found: {image_path}")

    image = cv2.imread(str(image_path))
    if image is None:
        raise ValueError(f"Could not load image: {image_path}")

    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()

    return laplacian_var < threshold, float(laplacian_var)


class BlurDetector:
    """Detect blurry pages in PDFs to skip low-quality content."""

    def __init__(self, threshold: float = 80):
        """
        Initialize blur detector.

        Args:
            threshold: Laplacian variance threshold (default 80)
        """
        self.threshold = threshold
        self.blur_scores = []

    def detect_blur_in_image(self, image) -> tuple[bool, float]:
        """
        Analyze a PIL image for blur.

        Args:
            image: PIL Image object

        Returns:
            Tuple of (is_blurry: bool, score: float)
        """
        try:
            cv_image = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
            gray = cv2.cvtColor(cv_image, cv2.COLOR_BGR2GRAY)
            laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
            is_blurry = laplacian_var < self.threshold
            return is_blurry, float(laplacian_var)
        except Exception as e:
            print(f"Error analyzing image: {e}")
            return None, None
