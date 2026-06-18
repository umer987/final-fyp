// Re-export voice helpers (legacy path — prefer importing from ./voice).
export {
  transcribeAndAsk,
  processVoiceInput,
  transcribeWithWebSpeechAndAsk,
  getClientSttMode,
  getSttUiHint,
  usesBrowserSpeechPrimary,
  usesServerRecording,
  type VoiceLanguage,
  type VoiceTranscriptionResult,
  type ClientSttMode,
} from './voice';
