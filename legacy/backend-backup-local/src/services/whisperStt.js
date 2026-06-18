const fs = require('fs');

const DEFAULT_STT_URL = 'http://localhost:8001/transcribe';
const STT_TIMEOUT_MS = Number(process.env.STT_TIMEOUT_MS) || 120_000;

/**
 * Transcribe audio via a Whisper HTTP service (nlp-service /transcribe or voice2law).
 *
 * @param {string} filePath
 * @param {object} options
 * @param {'urdu'|'english'} options.language
 * @param {string} [options.mimeType]
 * @param {string} [options.originalName]
 * @returns {Promise<string>}
 */
async function transcribeViaWhisperService(
  filePath,
  { language = 'urdu', mimeType, originalName } = {},
) {
  const url = (process.env.STT_SERVICE_URL || DEFAULT_STT_URL).replace(/\/$/, '');
  const buffer = fs.readFileSync(filePath);
  const name = originalName || 'recording.webm';
  const resolvedMime =
    mimeType && mimeType !== 'application/octet-stream'
      ? mimeType
      : name.endsWith('.wav')
        ? 'audio/wav'
        : name.endsWith('.mp3')
          ? 'audio/mpeg'
          : name.endsWith('.ogg')
            ? 'audio/ogg'
            : name.endsWith('.flac')
              ? 'audio/flac'
              : 'audio/webm';
  const blob = new Blob([buffer], { type: resolvedMime });

  const form = new FormData();
  form.append('audio', blob, name);
  form.append('language', language);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), STT_TIMEOUT_MS);

  let response;
  try {
    response = await fetch(url, { method: 'POST', body: form, signal: controller.signal });
  } catch (err) {
    const message =
      err.name === 'AbortError'
        ? `Whisper transcription timed out after ${STT_TIMEOUT_MS}ms`
        : `Whisper service unreachable at ${url}: ${err.message}`;
    const error = new Error(message);
    error.statusCode = err.name === 'AbortError' ? 504 : 503;
    error.cause = err;
    throw error;
  } finally {
    clearTimeout(timeout);
  }

  const rawBody = await response.text();
  let body;
  try {
    body = rawBody ? JSON.parse(rawBody) : null;
  } catch {
    body = { detail: rawBody || response.statusText };
  }

  if (!response.ok) {
    const detail =
      body?.error ||
      body?.detail ||
      body?.message ||
      (typeof body === 'string' ? body : response.statusText);
    const message =
      typeof detail === 'string' ? detail : JSON.stringify(detail);
    const error = new Error(message);
    error.statusCode = response.status === 503 ? 503 : 502;
    error.rawDetail = message;
    throw error;
  }

  const text = (body?.text || body?.transcript || '').trim();
  if (!text) {
    const error = new Error('Whisper returned an empty transcript.');
    error.statusCode = 502;
    throw error;
  }

  return text;
}

module.exports = { transcribeViaWhisperService, DEFAULT_STT_URL };
