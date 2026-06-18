const { ttsNlp } = require('../services/nlp');

// Shorter audio = faster TTS synthesis (full answer still shown in UI).
const MAX_TTS_CHARS = 700;

/** Trim to max length, preferring a sentence/word boundary when possible. */
function truncateForTts(rawText, maxChars = MAX_TTS_CHARS) {
  const trimmed = rawText.trim();
  if (trimmed.length <= maxChars) return trimmed;

  const slice = trimmed.slice(0, maxChars);
  const lastSentence = Math.max(
    slice.lastIndexOf('۔'),
    slice.lastIndexOf('.'),
    slice.lastIndexOf('!'),
    slice.lastIndexOf('?'),
  );
  if (lastSentence > maxChars * 0.4) {
    return slice.slice(0, lastSentence + 1).trim();
  }

  const lastSpace = slice.lastIndexOf(' ');
  if (lastSpace > maxChars * 0.5) {
    return slice.slice(0, lastSpace).trim();
  }

  return slice.trim();
}

/**
 * POST /api/tts (public)
 * Body: { text: string, language?: 'urdu' | 'english' }
 *
 * Proxies to the NLP /tts endpoint (ElevenLabs eleven_multilingual_v2 for Urdu when
 * TTS_PROVIDER=elevenlabs, otherwise HF mms-tts-urd) and streams the synthesized
 * audio back to the browser. When the NLP TTS provider is unavailable/fails,
 * responds 502 so the client can fall back to the browser's SpeechSynthesis API.
 */
async function handleTts(req, res) {
  const rawText = typeof req.body.text === 'string' ? req.body.text.trim() : '';
  const language = req.body.language === 'english' ? 'english' : 'urdu';

  if (!rawText) {
    return res.status(400).json({ message: 'Missing "text" to synthesize.' });
  }

  const text = truncateForTts(rawText);
  if (text.length < rawText.length) {
    console.info(`[tts] truncated ${rawText.length} -> ${text.length} chars for faster synthesis`);
  }

  try {
    const { audio, contentType } = await ttsNlp(text, language);
    res.setHeader('Content-Type', contentType || 'audio/mpeg');
    res.setHeader('Content-Length', audio.length);
    res.setHeader('Cache-Control', 'no-store');
    return res.send(audio);
  } catch (err) {
    // Do not 500: the client gracefully falls back to browser speech synthesis.
    return res.status(502).json({
      message: err.message || 'Text-to-speech is currently unavailable.',
    });
  }
}

module.exports = { handleTts };
