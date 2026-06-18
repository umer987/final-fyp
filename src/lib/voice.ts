// Voice helpers: browser Web Speech API for STT, backend OpenAI for answers.

import { api, type RecommendedLawyer } from './api';
import { isWebSpeechSupported, recognizeOnce } from './webSpeech';

export type VoiceLanguage = 'urdu' | 'english';
export type ClientSttMode = 'whisper' | 'elevenlabs' | 'webspeech' | 'auto';

export type SttProgressPhase =
  | 'server-transcribe'
  | 'server-retry'
  | 'backup-webspeech'
  | 'backup-provider';

export interface SttProgressUpdate {
  phase: SttProgressPhase;
  message: string;
}

export type SttProgressCallback = (update: SttProgressUpdate) => void;

export interface VoiceTranscriptionResult {
  transcript: string;
  answer: string;
  language: VoiceLanguage;
  confidence?: number;
  category?: string;
  sttSource?: string;
  recommendedLawyers?: RecommendedLawyer[];
  detectedTopic?: string | null;
}

/** Ratio of Arabic-script chars — used to pick TTS language and speakable text. */
export function urduScriptRatio(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  const arabic = (trimmed.match(/[\u0600-\u06FF]/g) || []).length;
  return arabic / trimmed.length;
}

/** Text safe for Urdu TTS — skips long English blocks in mixed answers. */
export function textForUrduSpeech(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return trimmed;

  if (urduScriptRatio(trimmed) >= 0.2) {
    return trimmed;
  }

  const urduLines = trimmed
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && /[\u0600-\u06FF]/.test(line));

  if (urduLines.length >= 2) {
    return urduLines.join('\n');
  }

  return (
    'معذرت، جواب انگریزی قانونی ماخذ سے ہے۔ ' +
    'مکمل تفصیل اسکرین پر دیکھیں یا کچھ دیر بعد دوبارہ کوشش کریں۔'
  );
}

/** Preferred TTS language from answer script (not just user locale). */
export function detectAnswerSpeechLanguage(
  text: string,
  fallback: VoiceLanguage = 'urdu',
): VoiceLanguage {
  return urduScriptRatio(text) >= 0.15 ? 'urdu' : fallback === 'urdu' ? 'english' : fallback;
}

/** Client preference from VITE_STT_ENGINE (legacy; browser speech is primary now). */
export function getClientSttMode(): ClientSttMode {
  const raw = (import.meta.env.VITE_STT_ENGINE as string | undefined)?.toLowerCase().trim();
  if (raw === 'webspeech' || raw === 'whisper' || raw === 'elevenlabs' || raw === 'auto') {
    return raw;
  }
  return 'webspeech';
}

export function usesServerRecording(): boolean {
  const mode = getClientSttMode();
  return mode === 'whisper' || mode === 'elevenlabs' || mode === 'auto';
}

export function usesBrowserSpeechPrimary(): boolean {
  return getClientSttMode() !== 'whisper' && getClientSttMode() !== 'elevenlabs';
}

export function getSttUiHint(): string {
  const mode = getClientSttMode();
  if (mode === 'whisper' || mode === 'elevenlabs') {
    return 'Tap the mic, speak your question, then tap stop (server transcription → legal answer)';
  }
  return 'Tap the mic, speak in Urdu or English, then tap stop. Browser speech needs Chrome/Edge + internet; recording falls back to server STT if needed.';
}

const DEFAULT_NLP_TRANSCRIBE = 'http://localhost:8001/transcribe';

/** Hide SSL/network stack traces from user-facing toasts. */
export function sanitizeSttError(message: string): string {
  const lower = message.toLowerCase();
  if (
    lower.includes('ssl') ||
    lower.includes('unexpected_eof') ||
    lower.includes('eof occurred') ||
    lower.includes('_ssl.c')
  ) {
    return 'Speech recognition hit a temporary network issue. Retrying with a backup…';
  }
  if (lower.includes('temporarily unavailable') || lower.includes('network issue')) {
    return message;
  }
  if (lower.includes('cannot reach the transcription service')) {
    return 'Transcription service is offline. Start nlp-service on port 8001, or use browser speech in Chrome/Edge.';
  }
  if (lower.includes('all speech-to-text providers failed')) {
    return 'Speech recognition is unavailable right now. Please try again or speak more clearly.';
  }
  return message.length > 200 ? `${message.slice(0, 197)}…` : message;
}

function mapServerSttSource(raw: string | undefined): string {
  const source = (raw || '').toLowerCase();
  if (source === 'elevenlabs') return 'elevenlabs';
  if (source === 'groq') return 'groq';
  if (source === 'huggingface') return 'whisper';
  return source || 'whisper';
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getNlpTranscribeUrl(): string {
  const base = (import.meta.env.VITE_NLP_SERVICE_URL as string | undefined)?.trim();
  if (base) {
    const normalized = base.replace(/\/+$/, '');
    return normalized.endsWith('/transcribe') ? normalized : `${normalized}/transcribe`;
  }
  return DEFAULT_NLP_TRANSCRIBE;
}

/** POST recorded audio to nlp-service /transcribe (Whisper / ElevenLabs / Groq STT). */
async function transcribeViaNlp(
  audio: Blob,
  language: VoiceLanguage,
  onProgress?: SttProgressCallback,
): Promise<{ transcript: string; sttSource: string }> {
  const url = getNlpTranscribeUrl();
  const filename = audio.type.includes('wav')
    ? 'recording.wav'
    : audio.type.includes('mpeg') || audio.type.includes('mp3')
      ? 'recording.mp3'
      : 'recording.webm';

  onProgress?.({
    phase: 'server-transcribe',
    message: 'Transcribing your recording…',
  });

  const maxAttempts = 2;
  let lastError = 'Transcription failed. Please try again.';

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    if (attempt > 1) {
      onProgress?.({
        phase: 'server-retry',
        message: 'Retrying speech recognition…',
      });
      await sleep(800 * attempt);
    }

    const attemptForm = new FormData();
    attemptForm.append('audio', audio, filename);
    attemptForm.append('language', language);

    let response: Response;
    try {
      response = await fetch(url, { method: 'POST', body: attemptForm });
    } catch {
      lastError =
        'Cannot reach the transcription service. Start nlp-service (port 8001) or use browser speech.';
      continue;
    }

    const data = (await response.json().catch(() => ({}))) as {
      text?: string;
      success?: boolean;
      error?: string;
      stt_source?: string;
    };

    if (!response.ok || data.success === false) {
      lastError = sanitizeSttError(data.error || `Transcription failed (HTTP ${response.status}).`);
      const retryable =
        response.status >= 500 ||
        /network|ssl|timeout|temporarily|503|502|504/i.test(data.error || '');
      if (retryable && attempt < maxAttempts) continue;
      throw new Error(lastError);
    }

    const text = (data.text || '').trim();
    if (!text) {
      throw new Error('No speech detected in the recording. Speak clearly and try again.');
    }

    const sttSource = mapServerSttSource(data.stt_source);
    if (sttSource !== 'elevenlabs' && sttSource !== 'whisper') {
      onProgress?.({
        phase: 'backup-provider',
        message: 'Using backup speech recognition…',
      });
    }

    return { transcript: text, sttSource };
  }

  throw new Error(lastError);
}

/** True when OpenAI is not configured on the backend (low-confidence fallback answer). */
export function isAiServiceFallback(answer: string, confidence?: number): boolean {
  if (confidence !== undefined && confidence < 70) return true;
  return answer.includes('AI service is not configured yet');
}

/**
 * After recording stops: browser transcript when available, else server STT on audio,
 * else a one-shot browser recognition attempt. Never blocks on a single provider failure.
 */
export async function processRecordedVoiceInput(
  audio: Blob | null,
  language: VoiceLanguage = 'urdu',
  browserTranscript: string | null | undefined,
  onProgress?: SttProgressCallback,
): Promise<VoiceTranscriptionResult> {
  const trimmedBrowser = browserTranscript?.trim();
  if (trimmedBrowser) {
    return askWithTranscript(trimmedBrowser, 'webspeech');
  }

  const mode = getClientSttMode();
  const hasAudio = Boolean(audio && audio.size > 0);
  const serverPreferred = mode === 'whisper' || mode === 'elevenlabs';
  const serverFallback = mode === 'auto' || mode === 'webspeech';

  if (hasAudio && (serverPreferred || serverFallback)) {
    try {
      const { transcript, sttSource } = await transcribeViaNlp(audio!, language, onProgress);
      return askWithTranscript(transcript, sttSource);
    } catch (serverErr) {
      console.warn('[voice] server STT failed, trying browser fallback:', serverErr);
      if (isWebSpeechSupported()) {
        onProgress?.({
          phase: 'backup-webspeech',
          message: 'Using backup speech recognition…',
        });
        try {
          const recognized = await recognizeOnce(language);
          return askWithTranscript(recognized, 'webspeech');
        } catch (browserErr) {
          console.warn('[voice] browser STT fallback failed:', browserErr);
        }
      }
      const message =
        serverErr instanceof Error
          ? sanitizeSttError(serverErr.message)
          : 'Speech recognition failed. Please try again.';
      throw new Error(message);
    }
  }

  if (!isWebSpeechSupported()) {
    throw new Error('Browser speech is not supported. Use Chrome or Edge, or set VITE_STT_ENGINE=whisper.');
  }

  onProgress?.({
    phase: 'backup-webspeech',
    message: 'Listening with browser speech…',
  });
  const recognized = await recognizeOnce(language);
  return askWithTranscript(recognized, 'webspeech');
}

async function askWithTranscript(
  transcript: string,
  sttSource: string,
): Promise<VoiceTranscriptionResult> {
  const result = await api.askVoice({ transcript });
  return {
    transcript: result.transcript,
    answer: result.answer,
    language: urduScriptRatio(result.answer) >= 0.15 ? 'urdu' : 'english',
    confidence: result.confidence,
    category: result.category,
    sttSource,
    recommendedLawyers: result.recommendedLawyers,
    detectedTopic: result.detectedTopic,
  };
}

/** Primary voice flow: browser speech → JSON transcript → backend OpenAI. */
export async function processVoiceInput(
  audio: Blob | null,
  language: VoiceLanguage = 'urdu',
): Promise<VoiceTranscriptionResult> {
  return processRecordedVoiceInput(audio, language, null);
}

/** Legacy alias — record audio, transcribe on server, then ask. */
export async function transcribeAndAsk(
  audio: Blob | null,
  language: VoiceLanguage = 'urdu',
): Promise<VoiceTranscriptionResult> {
  return processRecordedVoiceInput(audio, language, null);
}

/** Legacy alias — browser-only recognition then ask. */
export async function transcribeWithWebSpeechAndAsk(
  language: VoiceLanguage = 'urdu',
): Promise<VoiceTranscriptionResult> {
  return processRecordedVoiceInput(null, language, null);
}

let currentServerAudio: HTMLAudioElement | null = null;
let currentServerAudioUrl: string | null = null;

/** Stop any in-progress server TTS playback (ElevenLabs via /api/tts). */
export function cancelServerSpeech(): void {
  if (currentServerAudio) {
    currentServerAudio.pause();
    currentServerAudio.src = '';
    currentServerAudio = null;
  }
  if (currentServerAudioUrl) {
    URL.revokeObjectURL(currentServerAudioUrl);
    currentServerAudioUrl = null;
  }
}

/**
 * Speak via backend /api/tts (ElevenLabs when nlp-service TTS_PROVIDER=elevenlabs).
 * Throws on failure so callers can fall back to browser SpeechSynthesis.
 */
export async function speakWithServerTts(
  text: string,
  language: VoiceLanguage = 'urdu',
): Promise<void> {
  const blob = await api.tts({ text, language });
  cancelServerSpeech();

  const url = URL.createObjectURL(blob);
  currentServerAudioUrl = url;
  const audio = new Audio(url);
  currentServerAudio = audio;

  try {
    await new Promise<void>((resolve, reject) => {
      audio.onended = () => resolve();
      audio.onerror = () => reject(new Error('Audio playback failed.'));
      void audio.play().catch(reject);
    });
  } finally {
    cancelServerSpeech();
  }
}
