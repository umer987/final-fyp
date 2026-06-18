# Voice2Law - Speech Pipeline Guide

Complete guide for Speech-to-Text and Text-to-Speech components.

## Overview

The Voice2Law speech pipeline enables full voice-based interaction:

1. **Speech-to-Text (STT)** → Convert user's voice to Urdu text
2. **RAG Pipeline** → Find answer in legal documents
3. **Text-to-Speech (TTS)** → Convert answer back to Urdu voice

## Components

### Speech-to-Text (UrduSTT)

**Uses:** OpenAI Whisper (local model, FREE)

```python
from src.speech.stt import UrduSTT

# Initialize
stt = UrduSTT(model_size="base")

# Transcribe file
text = stt.transcribe_file("user_question.wav")
print(text)  # Output: "طلاق کے بارے میں کیا ہے؟"

# Transcribe from microphone bytes
audio_bytes = microphone.record()  # from frontend
text = stt.transcribe_bytes(audio_bytes, format="webm")
```

### Text-to-Speech (UrduTTS)

**Uses:** ElevenLabs API (free tier available)

Requires:
- ELEVENLABS_API_KEY (set in .env)
- ELEVENLABS_VOICE_ID (set in .env)

```python
from src.speech.tts import UrduTTS

# Initialize
tts = UrduTTS()

# Convert text to speech
audio_bytes = tts.speak("طلاق مسلم فیملی لاء آرڈیننس 1961 کے تحت...")

# Save to file
tts.speak_to_file("جواب", "answer.mp3")
```

## Setup

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

Includes:
- `openai-whisper` (STT)
- `requests` (API calls)
- `python-dotenv` (environment variables)

### 2. Configure ElevenLabs (Optional, for Voice Output)

Get free API key:
1. Sign up at https://elevenlabs.io
2. Create/copy a voice ID
3. Add to `.env`:

```env
ELEVENLABS_API_KEY=sk_abc123...
ELEVENLABS_VOICE_ID=your_voice_id
ANTHROPIC_API_KEY=sk_ant_...
```

## API Reference

### UrduSTT

```python
from src.speech.stt import UrduSTT

stt = UrduSTT(model_size="base")
```

**Methods:**

#### `transcribe_file(audio_path, language="ur") -> str`

Transcribe audio file to Urdu text.

**Args:**
- `audio_path` (str): Path to audio file (wav, mp3, m4a, webm, etc.)
- `language` (str): Language code (default: "ur" for Urdu)

**Returns:** Transcribed text (str)

**Example:**
```python
text = stt.transcribe_file("question.wav")
print(text)  # "طلاق کے بارے میں کیا ہے؟"
```

#### `transcribe_bytes(audio_bytes, format="webm") -> str`

Transcribe raw audio bytes to Urdu text.

**Args:**
- `audio_bytes` (bytes): Raw audio from microphone
- `format` (str): Audio format (default: "webm")

**Returns:** Transcribed text (str)

**Example:**
```python
# From browser microphone recording
audio_bytes = await fetch_audio_from_mic()
text = stt.transcribe_bytes(audio_bytes, format="webm")
```

#### `get_model_info() -> dict`

Get model information.

**Returns:**
```python
{
    'model_size': 'base',
    'language': 'ur (Urdu)',
    'supported_formats': ['wav', 'mp3', 'm4a', 'webm', 'flac']
}
```

### UrduTTS

```python
from src.speech.tts import UrduTTS

tts = UrduTTS()
# or with custom keys:
tts = UrduTTS(api_key="your_key", voice_id="your_id")
```

**Methods:**

#### `speak(text) -> bytes`

Convert Urdu text to speech.

**Args:**
- `text` (str): Urdu text to convert

**Returns:** Audio bytes (MP3 format)

**Example:**
```python
answer = "طلاق مسلم فیملی لاء..."
audio_bytes = tts.speak(answer)

# Send to frontend or save to file
with open("answer.mp3", "wb") as f:
    f.write(audio_bytes)
```

#### `speak_to_file(text, output_path) -> str`

Convert text to speech and save to MP3 file.

**Args:**
- `text` (str): Urdu text
- `output_path` (str): Path to save MP3

**Returns:** Path to saved file

**Example:**
```python
output_file = tts.speak_to_file("جواب", "answer.mp3")
print(f"Saved to: {output_file}")
```

#### `get_available_voices() -> list`

Get list of available voices (requires API call).

#### `get_config() -> dict`

Get current configuration.

**Returns:**
```python
{
    'api_base_url': 'https://api.elevenlabs.io/v1',
    'voice_id': 'your_voice_id',
    'model': 'eleven_multilingual_v2',
    'language': 'ur (Urdu)',
    'format': 'mp3'
}
```

## Full Workflow Example

### End-to-End Voice Question Answering

```python
from src.speech.stt import UrduSTT
from src.nlp.rag_pipeline import LegalRAG
from src.speech.tts import UrduTTS

# Step 1: Initialize components
stt = UrduSTT(model_size="base")
rag = LegalRAG()
tts = UrduTTS()

# Step 2: User speaks (from microphone)
audio_bytes = record_from_microphone()  # webm format

# Step 3: Convert speech to text
user_question = stt.transcribe_bytes(audio_bytes, format="webm")
print(f"User asked: {user_question}")

# Step 4: Get answer from knowledge base
result = rag.answer(user_question)
answer_text = result['answer']
print(f"Answer: {answer_text}")

# Step 5: Convert answer back to speech
answer_audio = tts.speak(answer_text)

# Step 6: Send audio back to user
send_to_frontend(answer_audio)
```

## Testing

### Run Tests

```bash
python tests/test_speech.py
```

Tests:
- STT initialization
- STT transcription (with sample audio)
- STT bytes transcription
- TTS initialization
- TTS API calls (requires API keys)
- TTS file saving

### Run Full Demo

```bash
python demo_voice.py
```

Interactive demo showing:
- All components initialization
- Sample voice query processing
- STT transcription
- RAG answer retrieval
- TTS audio generation
- Full pipeline statistics

## Configuration

### .env File

```env
# Required for TTS
ELEVENLABS_API_KEY=sk_abc123...
ELEVENLABS_VOICE_ID=your_voice_id

# Optional for Claude API
ANTHROPIC_API_KEY=sk_ant_...
```

### Model Sizes (Whisper)

| Size   | Speed | Accuracy | Memory | Recommendation |
|--------|-------|----------|--------|-----------------|
| tiny   | ⚡⚡⚡ | ★★★     | 39MB   | Real-time, low resources |
| base   | ⚡⚡  | ★★★★   | 148MB  | **Recommended for testing** |
| small  | ⚡   | ★★★★★  | 466MB  | Better accuracy |
| medium | ⚠     | ★★★★★  | 1.5GB  | High accuracy |
| large  | ⚠     | ★★★★★  | 2.9GB  | Best accuracy, slow |

## Troubleshooting

### Whisper Issues

**Issue: "Couldn't find libcublas"**
- Install CUDA (GPU support optional)
- CPU mode works fine, just slower

**Issue: "No module named whisper"**
- `pip install openai-whisper`
- May take a few minutes to download models

**Issue: Poor transcription quality**
- Use larger model (small, medium)
- Reduce background noise in audio
- Speak clearly in Urdu

### ElevenLabs Issues

**Issue: "API key not found"**
- Set ELEVENLABS_API_KEY in .env
- Or pass to constructor: `UrduTTS(api_key="your_key")`

**Issue: "Invalid voice ID"**
- Set ELEVENLABS_VOICE_ID in .env
- Or pass to constructor: `UrduTTS(voice_id="your_id")`
- Get voice IDs from: https://elevenlabs.io/docs/voices

**Issue: "API rate limit"**
- Free tier has limited quota
- Wait before next request
- Consider upgrading for production

### Audio Format Issues

Supported formats: wav, mp3, m4a, webm, flac

**Browser microphone recording:**
- Usually outputs WebM format
- Pass `format="webm"` to `transcribe_bytes()`

**Audio file quality:**
- 16kHz mono is optimal
- Whisper auto-resamples if needed

## Integration with Frontend

### React Component Example

```jsx
import { useState } from 'react';

export function VoiceAssistant() {
  const [isRecording, setIsRecording] = useState(false);

  async function handleRecord() {
    // Record audio from microphone
    const mediaRecorder = new MediaRecorder();
    const chunks = [];

    mediaRecorder.ondataavailable = e => chunks.push(e.data);
    mediaRecorder.onstop = async () => {
      // Send to backend
      const audioBlob = new Blob(chunks, { type: 'audio/webm' });
      const formData = new FormData();
      formData.append('audio', audioBlob);

      // Call backend endpoint
      const response = await fetch('/api/voice-query', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      // Play answer audio
      playAudio(result.audio);
    };

    mediaRecorder.start();
  }

  return (
    <button onClick={handleRecord}>
      🎤 Ask a Question
    </button>
  );
}
```

### Backend Endpoint

```python
from fastapi import FastAPI, UploadFile, File
from src.speech.stt import UrduSTT
from src.nlp.rag_pipeline import LegalRAG
from src.speech.tts import UrduTTS

app = FastAPI()
stt = UrduSTT()
rag = LegalRAG()
tts = UrduTTS()

@app.post("/api/voice-query")
async def voice_query(audio: UploadFile):
    # Read audio bytes
    audio_bytes = await audio.read()

    # STT
    question = stt.transcribe_bytes(audio_bytes, format="webm")

    # RAG
    result = rag.answer(question)

    # TTS
    answer_audio = tts.speak(result['answer'])

    return {
        'question': question,
        'answer': result['answer'],
        'audio': answer_audio.hex()  # or base64 encode
    }
```

## Performance Tips

1. **Batch processing:** Use larger model on GPU for multiple queries
2. **Cache embeddings:** Load RAG once, reuse for multiple queries
3. **Audio quality:** Clean audio = faster, more accurate transcription
4. **API optimization:** Batch TTS requests when possible

## Next Steps

- [ ] Test STT with real microphone recordings
- [ ] Configure ElevenLabs voice ID
- [ ] Test full voice pipeline
- [ ] Integrate with React frontend
- [ ] Add audio playback controls
- [ ] Fine-tune for domain-specific legal terminology
