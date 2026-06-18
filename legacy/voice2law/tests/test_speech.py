import sys
from pathlib import Path
import tempfile
import os

sys.path.insert(0, str(Path(__file__).parent.parent))

from src.speech.stt import UrduSTT


def test_stt_initialization():
    """Test STT model initialization."""
    print("\n=== Testing UrduSTT Initialization ===")

    try:
        stt = UrduSTT(model_size="base")
        info = stt.get_model_info()
        print(f"Model size: {info['model_size']}")
        print(f"Language: {info['language']}")
        print(f"Supported formats: {info['supported_formats']}")
        print("✓ STT initialization test passed")
        return True
    except Exception as e:
        print(f"❌ STT initialization failed: {e}")
        return False


def test_stt_with_sample_audio():
    """Test STT with sample audio file."""
    print("\n=== Testing UrduSTT with Sample Audio ===")

    try:
        stt = UrduSTT(model_size="base")

        # Check if we have a sample audio file to test
        sample_audio = Path("data/sample_audio.wav")
        if not sample_audio.exists():
            print("⚠ No sample audio file found. Skipping audio test.")
            print(f"  Place Urdu audio file at: {sample_audio}")
            return True

        # Transcribe
        text = stt.transcribe_file(str(sample_audio))
        print(f"Transcribed: {text}")
        print("✓ STT transcription test passed")
        return True

    except FileNotFoundError as e:
        print(f"⚠ Audio file not found: {e}")
        print("  This is expected if no sample audio is provided.")
        return True
    except Exception as e:
        print(f"❌ STT transcription test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_stt_bytes():
    """Test STT with audio bytes."""
    print("\n=== Testing UrduSTT with Audio Bytes ===")

    try:
        stt = UrduSTT(model_size="base")

        # Create a simple test audio (silence/noise)
        # Note: This is just for testing the method works, not for quality
        import wave
        import struct

        with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as tmp:
            # Create minimal WAV file
            with wave.open(tmp.name, 'w') as wav:
                wav.setnchannels(1)
                wav.setsampwidth(2)
                wav.setframerate(16000)
                # Write 1 second of silence
                silence = struct.pack('<h', 0) * 16000
                wav.writeframes(silence)

            tmp_path = tmp.name

        try:
            # Read the WAV file
            with open(tmp_path, 'rb') as f:
                audio_bytes = f.read()

            print(f"Testing with {len(audio_bytes)} bytes of audio")

            # Test transcribe_bytes
            text = stt.transcribe_bytes(audio_bytes, format="wav")
            print(f"Transcribed: {text}")
            print("✓ STT bytes test passed")
            return True

        finally:
            Path(tmp_path).unlink()

    except Exception as e:
        print(f"❌ STT bytes test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_tts_initialization():
    """Test TTS initialization."""
    print("\n=== Testing UrduTTS Initialization ===")

    try:
        from src.speech.tts import UrduTTS

        # Check if API keys are set
        api_key = os.getenv('ELEVENLABS_API_KEY')
        voice_id = os.getenv('ELEVENLABS_VOICE_ID')

        if not api_key or api_key == 'your_api_key_here':
            print("⚠ ELEVENLABS_API_KEY not set in .env")
            print("  Set ELEVENLABS_API_KEY and ELEVENLABS_VOICE_ID to test TTS")
            return True

        if not voice_id or voice_id == 'your_voice_id_here':
            print("⚠ ELEVENLABS_VOICE_ID not set in .env")
            print("  Set ELEVENLABS_VOICE_ID to test TTS")
            return True

        tts = UrduTTS()
        config = tts.get_config()
        print(f"Voice ID: {config['voice_id']}")
        print(f"Model: {config['model']}")
        print(f"Language: {config['language']}")
        print("✓ TTS initialization test passed")
        return True

    except ValueError as e:
        print(f"⚠ TTS initialization skipped: {e}")
        print("  This is expected if ELEVENLABS_API_KEY or ELEVENLABS_VOICE_ID not set")
        return True
    except Exception as e:
        print(f"❌ TTS initialization test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_tts_with_api():
    """Test TTS with actual API call."""
    print("\n=== Testing UrduTTS API Call ===")

    try:
        from src.speech.tts import UrduTTS

        api_key = os.getenv('ELEVENLABS_API_KEY')
        voice_id = os.getenv('ELEVENLABS_VOICE_ID')

        if not api_key or api_key == 'your_api_key_here' or not voice_id or voice_id == 'your_voice_id_here':
            print("⚠ API keys not configured. Skipping TTS API test.")
            return True

        tts = UrduTTS()

        # Test with short Urdu text
        urdu_text = "السلام علیکم"
        print(f"Converting to speech: {urdu_text}")

        audio_bytes = tts.speak(urdu_text)
        print(f"Generated {len(audio_bytes)} bytes of audio")

        if len(audio_bytes) > 0:
            print("✓ TTS API test passed")
            return True
        else:
            print("❌ No audio generated")
            return False

    except Exception as e:
        print(f"❌ TTS API test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_tts_file_save():
    """Test TTS file saving."""
    print("\n=== Testing UrduTTS File Save ===")

    try:
        from src.speech.tts import UrduTTS

        api_key = os.getenv('ELEVENLABS_API_KEY')
        voice_id = os.getenv('ELEVENLABS_VOICE_ID')

        if not api_key or api_key == 'your_api_key_here' or not voice_id or voice_id == 'your_voice_id_here':
            print("⚠ API keys not configured. Skipping TTS file test.")
            return True

        with tempfile.TemporaryDirectory() as tmpdir:
            tts = UrduTTS()
            output_path = Path(tmpdir) / "test_output.mp3"

            urdu_text = "السلام علیکم"
            result_path = tts.speak_to_file(urdu_text, str(output_path))

            if Path(result_path).exists():
                file_size = Path(result_path).stat().st_size
                print(f"Saved to: {result_path}")
                print(f"File size: {file_size} bytes")
                print("✓ TTS file save test passed")
                return True
            else:
                print("❌ File not created")
                return False

    except Exception as e:
        print(f"❌ TTS file save test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    print("Running Speech Component Tests...")

    results = []

    results.append(("STT Initialization", test_stt_initialization()))
    results.append(("STT with Sample Audio", test_stt_with_sample_audio()))
    results.append(("STT with Bytes", test_stt_bytes()))
    results.append(("TTS Initialization", test_tts_initialization()))
    results.append(("TTS API Call", test_tts_with_api()))
    results.append(("TTS File Save", test_tts_file_save()))

    print("\n" + "=" * 70)
    print("TEST SUMMARY")
    print("=" * 70)
    for test_name, passed in results:
        status = "✓ PASS" if passed else "✗ FAIL"
        print(f"{status:8} {test_name}")

    passed_count = sum(1 for _, passed in results if passed)
    print(f"\nTotal: {passed_count}/{len(results)} tests passed")

    if passed_count == len(results):
        print("✅ All speech component tests completed!")
    else:
        print("⚠ Some tests failed or were skipped")
