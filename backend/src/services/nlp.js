/**
 * Client for the Voice2Law NLP microservice (FastAPI on port 8001 by default).
 *
 * This is the RAG answer engine: Chroma vector retrieval over the indexed
 * Pakistani legal corpus + Gemini (primary) / Groq (fallback) generation.
 *
 *   POST {base}/ask  body: { question, language }  -> { answer, sources, language }
 *   POST {base}/tts  body: { text, language }      -> audio stream | JSON error
 *   GET  {base}/health                             -> config + index snapshot
 *
 * Modeled on legacy/backend-backup-local/src/services/nlp.js. The backend calls
 * THIS service for every legal answer instead of calling OpenAI directly.
 */

const DEFAULT_NLP_BASE = 'http://127.0.0.1:8001';
// RAG /ask is local Chroma + embeddings + Gemini/Groq (~2s uncached, ~20ms cached).
const NLP_TIMEOUT_MS = Number(process.env.NLP_TIMEOUT_MS) || 45_000;
// TTS providers (ElevenLabs / HF) can be slow on cold start.
const TTS_TIMEOUT_MS = Number(process.env.NLP_TTS_TIMEOUT_MS) || 120_000;

function normalizeNlpBaseUrl(raw) {
  const trimmed = (raw || '').trim();
  if (!trimmed) return null;
  const withoutTrailing = trimmed.replace(/\/+$/, '');
  if (/\/ask$/i.test(withoutTrailing)) {
    return withoutTrailing.replace(/\/ask$/i, '');
  }
  return withoutTrailing;
}

function getNlpBaseUrl() {
  return normalizeNlpBaseUrl(process.env.NLP_SERVICE_URL) || DEFAULT_NLP_BASE;
}

function getNlpAskUrl() {
  return `${getNlpBaseUrl()}/ask`;
}

function getNlpTtsUrl() {
  return `${getNlpBaseUrl()}/tts`;
}

/** Graceful, user-facing message shown when the RAG service cannot answer. */
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

/** True when `answer` is the graceful service-unavailable fallback (not a real legal answer). */
function isFallbackAnswer(answer, language = 'urdu') {
  const text = (answer || '').trim();
  if (!text) return false;
  if (text === fallbackAnswer(language)) return true;
  if (language !== 'english' && text === fallbackAnswer('english')) return true;
  return false;
}

/** True when NLP returned a bracket placeholder (config/LLM/index error), not a legal answer. */
function isNlpPlaceholderAnswer(answer) {
  const text = (answer || '').trim();
  if (!text.startsWith('[') || !text.endsWith(']')) return false;
  return /LLM not configured|No legal documents|ask_pipeline|huggingface_hub not installed|LLM request failed|unavailable/i.test(
    text,
  );
}

/**
 * Ask the RAG service for a grounded legal answer.
 *
 * @param {string} question
 * @param {'urdu'|'english'} language
 * @returns {Promise<{ answer: string, fromNlp: boolean, sources: object[], language: string }>}
 */
async function askNlp(question, language = 'urdu') {
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
      console.error(
        `[nlp] /ask HTTP ${response.status} ${response.statusText} after ${Date.now() - startedAt}ms; body: ${
          rawBody ? rawBody.slice(0, 2000) : '<empty>'
        }`,
      );
      throw new Error(`NLP service error (${response.status}): ${detail}`);
    }

    const answer = (data?.answer || '').trim();
    if (!answer) {
      throw new Error('NLP service returned an empty answer');
    }
    if (isNlpPlaceholderAnswer(answer)) {
      console.error(`[nlp] /ask returned placeholder (not grounded legal text): ${answer.slice(0, 500)}`);
      throw new Error('NLP service returned a configuration or pipeline error');
    }

    console.info(`[nlp] /ask ok in ${Date.now() - startedAt}ms`);
    return {
      answer,
      fromNlp: true,
      sources: Array.isArray(data?.sources) ? data.sources : [],
      language: data?.language || language,
    };
  } catch (err) {
    const elapsed = Date.now() - startedAt;
    const message =
      err.name === 'AbortError'
        ? `NLP request timed out after ${elapsed}ms (timeout=${NLP_TIMEOUT_MS}ms)`
        : err.message;
    console.error(`[nlp] ask failed (${url}) after ${elapsed}ms:`, message);
    if (err.cause) console.error('[nlp] cause:', err.cause);
    return { answer: fallbackAnswer(language), fromNlp: false, sources: [], language };
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Text -> speech via the NLP /tts endpoint.
 *
 * @param {string} text
 * @param {'urdu'|'english'} language
 * @returns {Promise<{ audio: Buffer, contentType: string }>}
 */
async function ttsNlp(text, language = 'urdu') {
  const url = getNlpTtsUrl();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TTS_TIMEOUT_MS);
  const startedAt = Date.now();

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, language }),
      signal: controller.signal,
    });

    const contentType = (response.headers.get('content-type') || '').toLowerCase();

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      console.error(`[nlp] /tts HTTP ${response.status} ${response.statusText}; body: ${body.slice(0, 1000)}`);
      throw new Error(`NLP TTS error (${response.status})`);
    }

    // NLP returns JSON (not audio) when the TTS provider is unavailable.
    if (contentType.includes('application/json')) {
      const data = await response.json().catch(() => null);
      throw new Error((data && data.error) || 'Text-to-speech is unavailable on the NLP service.');
    }

    const arrayBuffer = await response.arrayBuffer();
    const audio = Buffer.from(arrayBuffer);
    if (!audio.length) throw new Error('NLP TTS returned empty audio.');

    console.info(`[nlp] /tts ok in ${Date.now() - startedAt}ms (${audio.length} bytes)`);
    return { audio, contentType: contentType || 'audio/mpeg' };
  } catch (err) {
    const elapsed = Date.now() - startedAt;
    const message =
      err.name === 'AbortError' ? `NLP TTS timed out after ${elapsed}ms` : err.message;
    console.error(`[nlp] tts failed (${url}) after ${elapsed}ms:`, message);
    throw new Error(message);
  } finally {
    clearTimeout(timeout);
  }
}

const NLP_HEALTH_CACHE_MS = Number(process.env.NLP_HEALTH_CACHE_MS) || 30_000;
let nlpHealthCache = { at: 0, data: null };

/**
 * Quick health probe for /api/health. Cached briefly to avoid slow probes on every page load.
 * @returns {Promise<{ ok: boolean, indexedChunks?: number, llmProvider?: string }>}
 */
async function checkNlpHealth() {
  const now = Date.now();
  if (nlpHealthCache.data && now - nlpHealthCache.at < NLP_HEALTH_CACHE_MS) {
    return nlpHealthCache.data;
  }

  const base = getNlpBaseUrl();
  try {
    const response = await fetch(`${base}/health`, { signal: AbortSignal.timeout(10_000) });
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
      llmProvider: data?.llm_provider,
      llmConfigured: data?.llm_configured,
      ttsProvider: data?.tts_provider,
      ttsConfigured: data?.tts_configured,
      sttProvider: data?.stt_provider,
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
  getNlpBaseUrl,
  getNlpAskUrl,
  getNlpTtsUrl,
  normalizeNlpBaseUrl,
};
