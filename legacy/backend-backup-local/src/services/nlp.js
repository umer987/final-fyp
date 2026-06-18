/**
 * Client for the Voice2Law NLP microservice (FastAPI on port 8001 by default).
 * POST {base}/ask  body: { question, language }  -> { answer, sources, language }
 */

const DEFAULT_NLP_BASE = 'http://localhost:8001';
// Extractive-only /ask is local Chroma + embeddings (~2–15s). Full HF LLM can need minutes.
const NLP_TIMEOUT_MS = Number(process.env.NLP_TIMEOUT_MS) || 45_000;
// HF mms-tts-urd cold start on first request can exceed 60s; ElevenLabs is usually faster.
const TTS_TIMEOUT_MS = Number(process.env.TTS_TIMEOUT_MS) || 120_000;

function normalizeNlpBaseUrl(raw) {
  const trimmed = (raw || '').trim();
  if (!trimmed) return null;
  const withoutTrailing = trimmed.replace(/\/+$/, '');
  if (/\/ask$/i.test(withoutTrailing)) {
    return withoutTrailing.replace(/\/ask$/i, '');
  }
  return withoutTrailing;
}

function getNlpAskUrl() {
  const base = normalizeNlpBaseUrl(process.env.NLP_SERVICE_URL) || DEFAULT_NLP_BASE;
  return `${base}/ask`;
}

function getNlpTtsUrl() {
  const base = normalizeNlpBaseUrl(process.env.NLP_SERVICE_URL) || DEFAULT_NLP_BASE;
  return `${base}/tts`;
}

function isNlpConfigured() {
  return Boolean(normalizeNlpBaseUrl(process.env.NLP_SERVICE_URL) || process.env.NLP_SERVICE_URL === undefined);
}

function fallbackAnswer(language) {
  if (language === 'english') {
    return (
      'The legal answer service is temporarily unavailable. Please try again in a few minutes, ' +
      'or consult a verified lawyer from our directory for urgent matters.'
    );
  }
  return (
    'قانونی جواب کی سروس عارضی طور پر دستیاب نہیں ہے۔ براہ کرم چند منٹ بعد دوبارہ کوشش کریں، ' +
    'یا فوری معاملات کے لیے ہماری فہرست سے کسی تصدیق شدہ وکیل سے رابطہ کریں۔'
  );
}

/** True when `answer` is the graceful NLP-down fallback (not a real legal answer). */
function isFallbackAnswer(answer, language = 'urdu') {
  const text = (answer || '').trim();
  if (!text) return false;
  if (text === fallbackAnswer(language)) return true;
  // English variant of the same service-unavailable message (legacy rows).
  if (language !== 'english' && text === fallbackAnswer('english')) return true;
  return false;
}

/** True when NLP returned a bracket placeholder (config/LLM/index error), not a legal answer. */
function isNlpPlaceholderAnswer(answer) {
  const text = (answer || '').trim();
  if (!text.startsWith('[') || !text.endsWith(']')) return false;
  return (
    /LLM not configured|No legal documents|ask_pipeline|huggingface_hub not installed|LLM request failed/i.test(
      text,
    )
  );
}

/**
 * @param {string} question
 * @param {'urdu'|'english'} language
 * @returns {Promise<{ answer: string, fromNlp: boolean, sources: object[] }>}
 */
async function askNlp(question, language) {
  const url = getNlpAskUrl();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), NLP_TIMEOUT_MS);
  const startedAt = Date.now();

  try {
    console.info(`[nlp] POST ${url} (language=${language}, timeout=${NLP_TIMEOUT_MS}ms)`);

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, language }),
      signal: controller.signal,
    });

    // Read the raw body once so we can both parse JSON and log it verbatim on error.
    const rawBody = await response.text();
    let data;
    try {
      data = rawBody ? JSON.parse(rawBody) : null;
    } catch {
      data = null;
    }

    if (!response.ok) {
      const detail =
        (typeof data?.detail === 'string' && data.detail) ||
        data?.message ||
        data?.error ||
        rawBody ||
        response.statusText;
      // Log the REAL NLP error (status + body) before we fall back, so cold-start /
      // router / license failures are visible in the backend console.
      console.error(
        `[nlp] /ask HTTP ${response.status} ${response.statusText} after ${Date.now() - startedAt}ms; body: ${
          rawBody ? rawBody.slice(0, 2000) : '<empty>'
        }`,
      );
      throw new Error(`NLP service error (${response.status}): ${detail}`);
    }

    const answer = (data?.answer || '').trim();
    if (!answer) {
      console.error(
        `[nlp] /ask returned 200 but empty answer after ${Date.now() - startedAt}ms; body: ${
          rawBody ? rawBody.slice(0, 2000) : '<empty>'
        }`,
      );
      throw new Error('NLP service returned an empty answer');
    }

    if (isNlpPlaceholderAnswer(answer)) {
      console.error(
        `[nlp] /ask returned placeholder (not grounded legal text) after ${Date.now() - startedAt}ms: ${answer.slice(
          0,
          500,
        )}`,
      );
      throw new Error('NLP service returned a configuration or pipeline error');
    }

    console.info(`[nlp] /ask ok in ${Date.now() - startedAt}ms`);
    return { answer, fromNlp: true, sources: Array.isArray(data?.sources) ? data.sources : [] };
  } catch (err) {
    const elapsed = Date.now() - startedAt;
    const message =
      err.name === 'AbortError'
        ? `NLP request timed out after ${elapsed}ms (timeout=${NLP_TIMEOUT_MS}ms)`
        : err.message;
    // Surface the full error (including connection failures like ECONNREFUSED from a
    // port mismatch) before returning the graceful fallback.
    console.error(`[nlp] ask failed (${url}) after ${elapsed}ms:`, message);
    if (err.cause) console.error('[nlp] cause:', err.cause);
    return { answer: fallbackAnswer(language), fromNlp: false, sources: [] };
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Text -> speech via the NLP /tts endpoint (ElevenLabs multilingual v2 for Urdu when
 * TTS_PROVIDER=elevenlabs in nlp-service/.env, otherwise facebook/mms-tts-urd).
 *
 * The NLP service streams audio on success, or returns a 200 JSON body
 * ({ error, audio_base64: null }) when TTS is unavailable. We surface a thrown
 * error in the unavailable/failed case so callers can fall back to browser TTS.
 *
 * @param {string} text
 * @param {'urdu'|'english'} language
 * @returns {Promise<{ audio: Buffer, contentType: string }>}
 */
async function ttsNlp(text, language) {
  const url = getNlpTtsUrl();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TTS_TIMEOUT_MS);
  const startedAt = Date.now();

  try {
    console.info(`[nlp] POST ${url} (tts, language=${language}, timeout=${TTS_TIMEOUT_MS}ms)`);

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, language }),
      signal: controller.signal,
    });

    const contentType = (response.headers.get('content-type') || '').toLowerCase();

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      console.error(
        `[nlp] /tts HTTP ${response.status} ${response.statusText} after ${Date.now() - startedAt}ms; body: ${
          body ? body.slice(0, 1000) : '<empty>'
        }`,
      );
      throw new Error(`NLP TTS error (${response.status})`);
    }

    // NLP returns JSON (not audio) when the TTS provider is unavailable.
    if (contentType.includes('application/json')) {
      const data = await response.json().catch(() => null);
      const detail = (data && data.error) || 'Text-to-speech is unavailable on the NLP service.';
      console.warn(`[nlp] /tts unavailable after ${Date.now() - startedAt}ms: ${detail}`);
      throw new Error(detail);
    }

    const arrayBuffer = await response.arrayBuffer();
    const audio = Buffer.from(arrayBuffer);
    if (!audio.length) {
      throw new Error('NLP TTS returned empty audio.');
    }

    console.info(`[nlp] /tts ok in ${Date.now() - startedAt}ms (${audio.length} bytes)`);
    return { audio, contentType: contentType || 'audio/mpeg' };
  } catch (err) {
    const elapsed = Date.now() - startedAt;
    const message =
      err.name === 'AbortError'
        ? `NLP TTS timed out after ${elapsed}ms (timeout=${TTS_TIMEOUT_MS}ms)`
        : err.message;
    console.error(`[nlp] tts failed (${url}) after ${elapsed}ms:`, message);
    if (err.cause) console.error('[nlp] cause:', err.cause);
    throw new Error(message);
  } finally {
    clearTimeout(timeout);
  }
}

const NLP_HEALTH_CACHE_MS = Number(process.env.NLP_HEALTH_CACHE_MS) || 45_000;
let nlpHealthCache = { at: 0, data: null };

/**
 * Quick health probe for /api/health (optional).
 * Results are cached briefly to avoid slow NLP probes on every page load.
 * @returns {Promise<{ ok: boolean, indexedChunks?: number }>}
 */
async function checkNlpHealth() {
  const now = Date.now();
  if (nlpHealthCache.data && now - nlpHealthCache.at < NLP_HEALTH_CACHE_MS) {
    return nlpHealthCache.data;
  }

  const base = normalizeNlpBaseUrl(process.env.NLP_SERVICE_URL) || DEFAULT_NLP_BASE;
  try {
    const response = await fetch(`${base}/health`, { signal: AbortSignal.timeout(15000) });
    if (!response.ok) {
      const miss = { ok: false };
      nlpHealthCache = { at: now, data: miss };
      return miss;
    }
    const data = await response.json();
    const result = {
      ok: data?.status === 'ok',
      indexedChunks: data?.indexed_chunks,
      embeddingsReady: data?.embeddings_ready !== false,
      embeddingsError: data?.embeddings_error || null,
      ttsProvider: data?.tts_provider,
      ttsConfigured: data?.tts_configured,
      ttsModel: data?.tts_model,
      ttsVoiceId: data?.tts_voice_id,
      sttProvider: data?.stt_provider,
      llmProvider: data?.llm_provider,
      llmExtractiveOnly: data?.llm_extractive_only,
    };
    nlpHealthCache = { at: now, data: result };
    return result;
  } catch {
    const miss = { ok: false };
    nlpHealthCache = { at: now, data: miss };
    return miss;
  }
}

module.exports = {
  askNlp,
  ttsNlp,
  checkNlpHealth,
  fallbackAnswer,
  isFallbackAnswer,
  isNlpPlaceholderAnswer,
  getNlpAskUrl,
  getNlpTtsUrl,
  isNlpConfigured,
  normalizeNlpBaseUrl,
};
