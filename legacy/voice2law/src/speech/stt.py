import whisper
import tempfile
from pathlib import Path


class UrduSTT:
    """
    Speech-to-Text for Urdu using OpenAI Whisper.
    Local model (free), supports Urdu natively.
    """

    def __init__(self, model_size: str = "base"):
        """
        Initialize Whisper STT model.

        Args:
            model_size: Model size ('tiny', 'base', 'small', 'medium', 'large')
                       'base' is recommended for Urdu (good speed/accuracy balance)
        """
        self.model_size = model_size
        print(f"Loading Whisper model: {model_size}")
        self.model = whisper.load_model(model_size)
        print(f"✓ Whisper {model_size} loaded")

    def transcribe_file(self, audio_path: str, language: str = "ur") -> str:
        """
        Transcribe audio file to Urdu text.

        Args:
            audio_path: Path to audio file (wav, mp3, m4a, webm, etc.)
            language: Language code ('ur' for Urdu)

        Returns:
            Transcribed text in Urdu
        """
        audio_file = Path(audio_path)
        if not audio_file.exists():
            raise FileNotFoundError(f"Audio file not found: {audio_path}")

        print(f"Transcribing: {audio_file.name}")
        result = self.model.transcribe(str(audio_path), language=language)

        text = result['text'].strip()
        print(f"✓ Transcribed: {text[:80]}...")
        return text

    def transcribe_bytes(self, audio_bytes: bytes, format: str = "webm") -> str:
        """
        Transcribe raw audio bytes to Urdu text.

        Args:
            audio_bytes: Raw audio data from microphone
            format: Audio format ('webm', 'wav', 'mp3', 'm4a', etc.)

        Returns:
            Transcribed text in Urdu
        """
        # Create temporary file
        with tempfile.NamedTemporaryFile(suffix=f'.{format}', delete=False) as tmp:
            tmp.write(audio_bytes)
            tmp_path = tmp.name

        try:
            print(f"Transcribing {len(audio_bytes)} bytes of {format} audio")
            text = self.transcribe_file(tmp_path, language="ur")
            return text
        finally:
            # Clean up temp file
            Path(tmp_path).unlink(missing_ok=True)

    def get_model_info(self) -> dict:
        """Get information about the loaded model."""
        return {
            'model_size': self.model_size,
            'language': 'ur (Urdu)',
            'supported_formats': ['wav', 'mp3', 'm4a', 'webm', 'flac']
        }

