import os
import requests
from pathlib import Path
from dotenv import load_dotenv


class UrduTTS:
    """
    Text-to-Speech for Urdu using ElevenLabs API.
    Free tier available.
    """

    API_BASE_URL = 'https://api.elevenlabs.io/v1'

    def __init__(self, api_key: str = None, voice_id: str = None):
        """
        Initialize ElevenLabs TTS.

        Args:
            api_key: ElevenLabs API key (or set ELEVENLABS_API_KEY env var)
            voice_id: ElevenLabs voice ID (or set ELEVENLABS_VOICE_ID env var)
        """
        # Load .env file if it exists
        load_dotenv()

        self.api_key = api_key or os.getenv('ELEVENLABS_API_KEY')
        self.voice_id = voice_id or os.getenv('ELEVENLABS_VOICE_ID')

        if not self.api_key:
            raise ValueError(
                "ElevenLabs API key not found. "
                "Set ELEVENLABS_API_KEY environment variable or pass api_key parameter."
            )

        if not self.voice_id:
            raise ValueError(
                "ElevenLabs voice ID not found. "
                "Set ELEVENLABS_VOICE_ID environment variable or pass voice_id parameter."
            )

        self.headers = {
            'xi-api-key': self.api_key,
            'Content-Type': 'application/json'
        }

        print(f"✓ ElevenLabs TTS initialized")
        print(f"  Voice ID: {self.voice_id}")

    def speak(self, text: str) -> bytes:
        """
        Convert Urdu text to speech.

        Args:
            text: Urdu text to convert

        Returns:
            Raw audio bytes (MP3 format)
        """
        if not text or not text.strip():
            raise ValueError("Text cannot be empty")

        url = f"{self.API_BASE_URL}/text-to-speech/{self.voice_id}"

        payload = {
            "text": text,
            "model_id": "eleven_multilingual_v2",
        }

        print(f"Converting to speech: {text[:50]}...")
        response = requests.post(url, json=payload, headers=self.headers)

        if response.status_code != 200:
            error_msg = f"ElevenLabs API error: {response.status_code}"
            try:
                error_detail = response.json()
                error_msg += f" - {error_detail}"
            except:
                error_msg += f" - {response.text}"
            raise Exception(error_msg)

        audio_bytes = response.content
        print(f"✓ Generated {len(audio_bytes)} bytes of audio")
        return audio_bytes

    def speak_to_file(self, text: str, output_path: str) -> str:
        """
        Convert text to speech and save to file.

        Args:
            text: Urdu text to convert
            output_path: Path to save MP3 file

        Returns:
            Path to saved file
        """
        output_file = Path(output_path)
        output_file.parent.mkdir(parents=True, exist_ok=True)

        audio_bytes = self.speak(text)

        with open(output_file, 'wb') as f:
            f.write(audio_bytes)

        print(f"✓ Saved to: {output_file}")
        return str(output_file)

    def get_available_voices(self) -> list:
        """
        Get list of available voices (requires separate API call).

        Returns:
            List of available voice objects
        """
        try:
            url = f"{self.API_BASE_URL}/voices"
            response = requests.get(url, headers=self.headers)
            response.raise_for_status()
            voices = response.json()['voices']
            print(f"Available voices: {len(voices)}")
            return voices
        except Exception as e:
            print(f"Could not fetch voices: {e}")
            return []

    def get_config(self) -> dict:
        """Get current configuration."""
        return {
            'api_base_url': self.API_BASE_URL,
            'voice_id': self.voice_id,
            'model': 'eleven_multilingual_v2',
            'language': 'ur (Urdu)',
            'format': 'mp3'
        }

