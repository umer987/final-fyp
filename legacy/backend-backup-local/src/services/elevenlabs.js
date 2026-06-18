const fs = require('fs');
const path = require('path');

const ELEVENLABS_STT_URL = 'https://api.elevenlabs.io/v1/speech-to-text';

/** ISO 639-3 hints for Scribe v2 (auto-detect still works if omitted). */
const LANGUAGE_CODES = {
  urdu: 'urd',
  english: 'eng',
};

/**
 * Transcribe an audio file with ElevenLabs Scribe v2.
 *
 * @param {string} filePath       Absolute path to the uploaded audio file.
 * @param {object} options
 * @param {'urdu'|'english'} options.language
 * @param {string} [options.mimeType]
 * @param {string} [options.originalName]
 * @returns {Promise<string>} Transcript text.
 */
async function transcribeAudioFile(filePath, { language = 'urdu', mimeType, originalName } = {}) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    const err = new Error('ElevenLabs API key is not configured on the server (ELEVENLABS_API_KEY).');
    err.statusCode = 503;
    throw err;
  }

  const buffer = fs.readFileSync(filePath);
  const blob = new Blob([buffer], { type: mimeType || 'application/octet-stream' });

  const form = new FormData();
  form.append('file', blob, originalName || path.basename(filePath));
  form.append('model_id', 'scribe_v2');
  form.append('tag_audio_events', 'false');

  const languageCode = LANGUAGE_CODES[language];
  if (languageCode) {
    form.append('language_code', languageCode);
  }

  const response = await fetch(ELEVENLABS_STT_URL, {
    method: 'POST',
    headers: { 'xi-api-key': apiKey },
    body: form,
  });

  const rawBody = await response.text();
  let data;
  try {
    data = rawBody ? JSON.parse(rawBody) : null;
  } catch {
    data = null;
  }

  if (!response.ok) {
    let detail = rawBody || response.statusText;
    if (data) {
      detail =
        data?.detail?.message ||
        data?.detail ||
        data?.message ||
        (typeof data === 'string' ? data : JSON.stringify(data));
      if (typeof detail === 'object') {
        detail = detail.message || JSON.stringify(detail);
      }
    }
    const err = new Error(String(detail));
    err.statusCode = /speech_to_text|permission/i.test(String(detail)) ? 403 : 502;
    throw err;
  }

  const text = typeof data?.text === 'string' ? data.text.trim() : '';
  if (!text) {
    const err = new Error('ElevenLabs returned an empty transcript.');
    err.statusCode = 502;
    throw err;
  }

  return text;
}

module.exports = { transcribeAudioFile };
