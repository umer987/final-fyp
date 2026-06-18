/** Shared NLP fallback detection for text and voice assistants. */

export type NlpLanguage = 'urdu' | 'english';

/** Markers for graceful NLP-down fallback answers (must match backend nlp.js). */
const NLP_FALLBACK_MARKERS: Record<NlpLanguage, string[]> = {
  urdu: ['قانونی جواب', 'عارضی طور پر دستیاب نہیں'],
  english: ['legal answer service is temporarily unavailable'],
};

/** True when the answer text is the NLP-unavailable fallback (skip auto-TTS). */
export function isNlpFallbackAnswer(text: string, language: NlpLanguage = 'urdu'): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  const markers = NLP_FALLBACK_MARKERS[language];
  const haystack = language === 'english' ? trimmed.toLowerCase() : trimmed;
  return markers.some((marker) => {
    const needle = language === 'english' ? marker.toLowerCase() : marker;
    return haystack.includes(needle);
  });
}

/** True when NLP explicitly reported the answer as a fallback (preferred over text heuristics). */
export function isNlpServiceFallback(
  fromNlp: boolean | undefined | null,
  answer: string,
  language: NlpLanguage = 'urdu',
): boolean {
  return fromNlp === false || isNlpFallbackAnswer(answer, language);
}
