/**
 * Browser Web Speech API (free, no API key). Best in Chrome/Edge.
 */

export function isWebSpeechSupported(): boolean {
  const w = window as Window & {
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
  };
  return Boolean(w.SpeechRecognition || w.webkitSpeechRecognition);
}

/** True when the browser exposes the SpeechSynthesis (text-to-speech) API. */
export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

/** Voices load asynchronously in some browsers; wait briefly for them. */
function getVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    const existing = window.speechSynthesis.getVoices();
    if (existing.length > 0) {
      resolve(existing);
      return;
    }
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      resolve(window.speechSynthesis.getVoices());
    };
    window.speechSynthesis.onvoiceschanged = finish;
    // Fallback in case onvoiceschanged never fires.
    setTimeout(finish, 500);
  });
}

/**
 * Speak `text` using the browser's built-in SpeechSynthesis (free, offline).
 * Resolves when playback ends; rejects if synthesis is unsupported or errors.
 * Used as a fallback when server TTS (ElevenLabs / HF) is unavailable.
 */
export async function speakWithBrowser(
  text: string,
  language: 'urdu' | 'english' = 'urdu',
): Promise<void> {
  if (!isSpeechSynthesisSupported()) {
    throw new Error('Browser text-to-speech is not supported here.');
  }

  // Cancel anything already queued/playing before starting fresh.
  window.speechSynthesis.cancel();

  const voices = await getVoices();
  const langPrefix = language === 'urdu' ? 'ur' : 'en';
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = language === 'urdu' ? 'ur-PK' : 'en-US';
  utterance.rate = 0.95;

  const match =
    voices.find((v) => v.lang?.toLowerCase().startsWith(langPrefix)) ||
    // Many systems lack an Urdu voice; Hindi (hi) renders Urdu phonetics best.
    (language === 'urdu' ? voices.find((v) => v.lang?.toLowerCase().startsWith('hi')) : undefined);
  if (match) {
    utterance.voice = match;
  }

  await new Promise<void>((resolve, reject) => {
    utterance.onend = () => resolve();
    utterance.onerror = (event) => {
      // "interrupted"/"canceled" happens when the user stops playback — treat as success.
      if (event.error === 'interrupted' || event.error === 'canceled') {
        resolve();
        return;
      }
      reject(new Error(`Browser speech synthesis failed (${event.error}).`));
    };
    window.speechSynthesis.speak(utterance);
  });
}

/** Stop any in-progress browser speech synthesis. */
export function cancelBrowserSpeech(): void {
  if (isSpeechSynthesisSupported()) {
    window.speechSynthesis.cancel();
  }
}

export interface RecognitionSession {
  /** Stop listening and return the best transcript collected, or null if none / failed. */
  stop(): Promise<string | null>;
  abort(): void;
  /** Last non-abort error from the browser engine (e.g. network, not-allowed). */
  lastError: string | null;
}

/**
 * Continuous browser recognition while the user speaks (parallel with MediaRecorder).
 * On Windows, network errors are swallowed — caller should fall back to server Whisper.
 */
export function startRecognitionSession(
  language: 'urdu' | 'english' = 'urdu',
): RecognitionSession | null {
  const w = window as Window & {
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
  };
  const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
  if (!Ctor) return null;

  const recognition = new Ctor();
  recognition.lang = language === 'urdu' ? 'ur-PK' : 'en-US';
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;

  let finalText = '';
  let stopped = false;
  let lastError: string | null = null;
  let stopResolve: ((value: string | null) => void) | null = null;

  recognition.onresult = (event: SpeechRecognitionEvent) => {
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const chunk = event.results[i]?.[0]?.transcript?.trim();
      if (!chunk) continue;
      if (event.results[i].isFinal) {
        finalText = `${finalText} ${chunk}`.trim();
      }
    }
  };

  recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
    if (event.error !== 'no-speech' && event.error !== 'aborted') {
      lastError = event.error;
      console.warn('[webspeech] recognition error:', event.error);
    }
    if (stopped && stopResolve) {
      stopResolve(finalText.trim() || null);
      stopResolve = null;
    }
  };

  recognition.onend = () => {
    if (stopped && stopResolve) {
      stopResolve(finalText.trim() || null);
      stopResolve = null;
    }
  };

  try {
    recognition.start();
  } catch (err) {
    console.warn('[webspeech] could not start recognition session:', err);
    return null;
  }

  return {
    get lastError() {
      return lastError;
    },
    stop() {
      if (stopped) {
        return Promise.resolve(finalText.trim() || null);
      }
      stopped = true;
      return new Promise<string | null>((resolve) => {
        stopResolve = resolve;
        try {
          recognition.stop();
        } catch {
          resolve(finalText.trim() || null);
        }
        setTimeout(() => {
          if (stopResolve) {
            stopResolve(finalText.trim() || null);
            stopResolve = null;
          }
        }, 1500);
      });
    },
    abort() {
      stopped = true;
      stopResolve = null;
      try {
        recognition.abort();
      } catch {
        /* ignore */
      }
    },
  };
}

/**
 * Listen once and return the recognized transcript.
 */
export function recognizeOnce(language: 'urdu' | 'english' = 'urdu'): Promise<string> {
  return new Promise((resolve, reject) => {
    const w = window as Window & {
      SpeechRecognition?: new () => SpeechRecognition;
      webkitSpeechRecognition?: new () => SpeechRecognition;
    };
    const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Ctor) {
      reject(
        new Error(
          'Browser speech recognition is not supported here. Use Chrome or set STT to whisper on the server.',
        ),
      );
      return;
    }

    const recognition = new Ctor();
    recognition.lang = language === 'urdu' ? 'ur-PK' : 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const text = event.results[0]?.[0]?.transcript?.trim() || '';
      if (!text) {
        reject(new Error('No speech was detected. Please try again.'));
        return;
      }
      resolve(text);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'no-speech') {
        reject(new Error('No speech heard. Hold the mic button and speak clearly.'));
        return;
      }
      if (event.error === 'not-allowed') {
        reject(
          new Error('Microphone permission was denied. Allow mic access in your browser settings.'),
        );
        return;
      }
      if (event.error === 'network') {
        reject(
          new Error(
            'Browser speech needs internet (Chrome uses Google servers). Your recording can still be transcribed on the server if you tap stop after speaking.',
          ),
        );
        return;
      }
      if (event.error === 'service-not-allowed' || event.error === 'service-not-available') {
        reject(
          new Error(
            'Browser speech service is unavailable. Use Chrome or Edge with internet, or server STT will transcribe your recording.',
          ),
        );
        return;
      }
      const err = new Error(`Speech recognition failed (${event.error}).`);
      (err as Error & { webSpeechError?: string }).webSpeechError = event.error;
      reject(err);
    };

    recognition.onend = () => {
      // If onresult never fired, avoid hanging (some browsers fire onend after error).
    };

    try {
      recognition.start();
    } catch (err) {
      reject(err instanceof Error ? err : new Error('Could not start speech recognition.'));
    }
  });
}
