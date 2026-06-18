/**
 * Map raw STT/provider errors to short, user-facing messages.
 */

function friendlySttMessage(rawMessage, engine) {
  const msg = String(rawMessage || '');
  const lower = msg.toLowerCase();

  if (
    lower.includes('internal server error') ||
    lower.includes('has no attribute') ||
    lower.includes('speech transcription failed')
  ) {
    return (
      'Speech transcription failed on the NLP service. Restart the NLP service on port 8001, ' +
      'or set STT_ENGINE=webspeech in backend/.env for browser-based dictation.'
    );
  }

  if (lower.includes('speech_to_text') || lower.includes('missing the permission')) {
    return (
      'ElevenLabs speech-to-text is not enabled on your API key. ' +
      'Use free transcription instead: set STT_ENGINE=whisper in backend/.env and run the NLP service, ' +
      'or set STT_ENGINE=webspeech and use Chrome for browser-based dictation.'
    );
  }

  if (
    lower.includes('econnrefused') ||
    lower.includes('fetch failed') ||
    lower.includes('enotfound') ||
    lower.includes('whisper service')
  ) {
    return (
      'The speech-to-text service is not reachable. Start the NLP service (port 8001) or voice2law Whisper, ' +
      'or set STT_ENGINE=webspeech to use your browser microphone without a server.'
    );
  }

  if (
    lower.includes('hf_token') ||
    lower.includes('hf speech-to-text') ||
    lower.includes('unauthorized') ||
    lower.includes('401') ||
    lower.includes('403')
  ) {
    return (
      'Whisper transcription needs a free Hugging Face token in nlp-service/.env (HF_TOKEN), ' +
      'or point STT_SERVICE_URL at a local voice2law /transcribe endpoint.'
    );
  }

  if (lower.includes('ffmpeg') || lower.includes('decode audio') || lower.includes('could not decode')) {
    return (
      'Could not decode the browser recording. Install FFmpeg (winget install Gyan.FFmpeg), ' +
      'restart the NLP service, or set STT_ENGINE=webspeech for browser speech.'
    );
  }

  if (
    lower.includes('too short') ||
    lower.includes('empty transcript') ||
    lower.includes('empty audio')
  ) {
    return 'No speech detected. Hold the mic longer, speak clearly, then try again.';
  }

  if (
    lower.includes('unexpected keyword argument') &&
    lower.includes('language')
  ) {
    return 'Whisper STT misconfiguration (language parameter). Restart the NLP service to load the latest fix.';
  }

  if (lower.includes('rate-limited') || lower.includes('cold') || lower.includes('503')) {
    return 'Whisper is warming up or busy. Wait 20 seconds and try again.';
  }

  if (lower.includes('timed out') || lower.includes('timeout')) {
    return (
      'Speech transcription took too long (Hugging Face Whisper cold start). ' +
      'Wait 30 seconds and try again, or set STT_ENGINE=webspeech in backend/.env for instant browser speech.'
    );
  }

  if (lower.includes('body has already been read')) {
    return (
      'Transcription service returned an invalid response. Restart the NLP service on port 8001 and try again.'
    );
  }

  if (engine === 'elevenlabs' && (lower.includes('api key') || lower.includes('not configured'))) {
    return 'ElevenLabs is not configured. Add ELEVENLABS_API_KEY or switch STT_ENGINE to whisper (free).';
  }

  if (engine === 'webspeech') {
    return 'Browser speech mode: speak in Chrome/Edge and send the transcript, or upload audio with another STT_ENGINE.';
  }

  // Keep actionable HF/router errors visible instead of hiding behind a generic message.
  if (msg.length > 220) {
    const firstSentence = msg.split(/[.!?\n]/)[0]?.trim();
    if (firstSentence && firstSentence.length <= 220) {
      return `${firstSentence}. Try again or set STT_ENGINE=webspeech.`;
    }
    return 'Could not transcribe your recording. Try again or switch to browser speech (STT_ENGINE=webspeech).';
  }

  return msg || 'Could not transcribe your recording. Please try again.';
}

module.exports = { friendlySttMessage };
