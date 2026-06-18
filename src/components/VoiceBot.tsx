import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, Square, ArrowLeft, Loader } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import {
  getSttUiHint,
  isAiServiceFallback,
  processRecordedVoiceInput,
  sanitizeSttError,
  textForUrduSpeech,
  detectAnswerSpeechLanguage,
  speakWithServerTts,
  cancelServerSpeech,
  type SttProgressUpdate,
} from '../lib/voice';
import type { RecommendedLawyer } from '../lib/api';
import { RecommendedLawyers } from './RecommendedLawyers';
import {
  cancelBrowserSpeech,
  isSpeechSynthesisSupported,
  isWebSpeechSupported,
  speakWithBrowser,
  startRecognitionSession,
  type RecognitionSession,
} from '../lib/webSpeech';

type TtsStatus = 'idle' | 'loading' | 'playing';

interface VoiceBotProps {
  onClose: () => void;
}

export function VoiceBot({ onClose }: VoiceBotProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [recommendedLawyers, setRecommendedLawyers] = useState<RecommendedLawyer[]>([]);
  const [answerConfidence, setAnswerConfidence] = useState<number | undefined>(undefined);
  const [audioLevel, setAudioLevel] = useState<number[]>([]);
  const [ttsStatus, setTtsStatus] = useState<TtsStatus>('idle');

  const recognitionSessionRef = useRef<RecognitionSession | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const ttsManualStopRef = useRef(false);
  const lastAutoSpokenRef = useRef('');

  useEffect(() => {
    if (isRecording) {
      const interval = setInterval(() => {
        const newLevels = Array.from({ length: 30 }, () => Math.random() * 100);
        setAudioLevel(newLevels);
      }, 100);
      return () => clearInterval(interval);
    }
    setAudioLevel(Array(30).fill(20));
  }, [isRecording]);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
      mediaRecorderRef.current?.stream?.getTracks().forEach((track) => track.stop());
      recognitionSessionRef.current?.abort();
      recognitionSessionRef.current = null;
      stopSpeaking();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopSpeaking = () => {
    ttsManualStopRef.current = true;
    cancelBrowserSpeech();
    cancelServerSpeech();
    setTtsStatus('idle');
  };

  const startSpeaking = async (manual = false) => {
    if (!response) return;

    ttsManualStopRef.current = false;
    setTtsStatus('loading');

    const speechLang = detectAnswerSpeechLanguage(response, 'urdu');
    const speakText = speechLang === 'urdu' ? textForUrduSpeech(response) : response;

    try {
      setTtsStatus('playing');
      try {
        await speakWithServerTts(speakText, speechLang);
      } catch (serverErr) {
        if (!isSpeechSynthesisSupported()) {
          throw serverErr;
        }
        await speakWithBrowser(speakText, speechLang);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Text-to-speech failed.';
      if (manual) toast.error(message);
    } finally {
      setTtsStatus('idle');
    }
  };

  const handleToggleSpeak = async () => {
    if (ttsStatus !== 'idle') {
      stopSpeaking();
      return;
    }
    await startSpeaking(true);
  };

  useEffect(() => {
    if (!response || isProcessing) return;
    if (lastAutoSpokenRef.current === response) return;
    lastAutoSpokenRef.current = response;
    void startSpeaking(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [response, isProcessing]);

  const stopRecorderAndGetBlob = (): Promise<Blob | null> =>
    new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder || recorder.state === 'inactive') {
        resolve(null);
        return;
      }

      const stream = recorder.stream;
      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || 'audio/webm',
        });
        stream.getTracks().forEach((track) => track.stop());
        mediaRecorderRef.current = null;
        resolve(audioBlob.size > 0 ? audioBlob : null);
      };
      recorder.stop();
    });

  const applyVoiceResult = (result: Awaited<ReturnType<typeof processRecordedVoiceInput>>) => {
    setTranscript(result.transcript);
    setResponse(result.answer);
    setRecommendedLawyers(result.recommendedLawyers || []);
    setAnswerConfidence(result.confidence);

    if (result.sttSource && result.sttSource !== 'webspeech') {
      const label =
        result.sttSource === 'elevenlabs'
          ? 'server (ElevenLabs)'
          : result.sttSource === 'groq'
            ? 'server (Groq Whisper)'
            : 'server (Whisper)';
      toast.info(`Browser speech unavailable — used ${label} transcription.`, { duration: 4000 });
    }

    if (isAiServiceFallback(result.answer, result.confidence)) {
      toast.warning(
        'قانونی جواب کی سروس عارضی طور پر دستیاب نہیں — براہ کرم بعد میں دوبارہ کوشش کریں۔',
        { duration: 5000 }
      );
    }
  };

  const handleSttProgress = (update: SttProgressUpdate) => {
    setProcessingStatus(update.message);
    if (update.phase === 'server-retry' || update.phase === 'backup-provider') {
      toast.info(update.message, { duration: 2500 });
    }
  };

  const runVoicePipeline = async (
    audioBlob: Blob | null,
    browserTranscript?: string | null,
  ) => {
    setIsProcessing(true);
    setProcessingStatus('Transcribing and analyzing your question…');
    try {
      const result = await processRecordedVoiceInput(
        audioBlob,
        'urdu',
        browserTranscript,
        handleSttProgress,
      );
      applyVoiceResult(result);
    } catch (error) {
      const message = sanitizeSttError(
        error instanceof Error ? error.message : 'Something went wrong',
      );
      toast.error(message);
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
      setIsRecording(false);
    }
  };

  const handleStartRecording = async () => {
    stopSpeaking();
    lastAutoSpokenRef.current = '';
    setTranscript('');
    setResponse('');
    setRecommendedLawyers([]);
    setAnswerConfidence(undefined);
    recognitionSessionRef.current?.abort();
    recognitionSessionRef.current = null;

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      if (!isWebSpeechSupported()) {
        toast.error('Browser speech is not supported here. Use Chrome or Edge.');
        return;
      }
      setIsRecording(true);
      recognitionSessionRef.current = startRecognitionSession('urdu');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        mediaRecorderRef.current = null;
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      if (isWebSpeechSupported()) {
        recognitionSessionRef.current = startRecognitionSession('urdu');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Microphone access denied';
      toast.error(`Microphone error: ${message}`);
    }
  };

  const handleStopRecording = () => {
    if (!isRecording && !mediaRecorderRef.current && !recognitionSessionRef.current) return;
    setIsRecording(false);
    void (async () => {
      let browserTranscript: string | null = null;
      if (recognitionSessionRef.current) {
        browserTranscript = await recognitionSessionRef.current.stop();
        recognitionSessionRef.current = null;
      }
      const audioBlob = await stopRecorderAndGetBlob();
      await runVoicePipeline(audioBlob, browserTranscript);
    })();
  };

  return (
    <div className="fixed inset-0 bg-[#0B3D2E]/95 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 animate-fade-in overflow-hidden">
      <div className="assistant-modal-panel max-w-4xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl animate-scale-in">
        <div className="bg-gradient-to-r from-[#0B3D2E] to-[#1FAA59] px-4 sm:px-8 py-4 sm:py-6 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all duration-300"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div>
              <h2 className="text-xl sm:text-2xl text-white">Voice Assistant</h2>
              <p className="text-white/80 text-sm urdu-text">آواز سے سوال پوچھیں</p>
            </div>
          </div>
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
            <Mic className="w-6 h-6 text-white" />
          </div>
        </div>

        <div className="assistant-modal-body p-4 sm:p-8 pb-10">
          <div className="mb-8">
            <div className="bg-gradient-to-br from-[#E8F5ED] to-[#F8F9FA] rounded-2xl p-8 border-2 border-[#1FAA59]/20">
              <div className="flex items-center justify-center gap-1 h-32 mb-6">
                {audioLevel.map((level, i) => (
                  <div
                    key={i}
                    className="w-2 rounded-full transition-all duration-100"
                    style={{
                      height: `${isRecording ? level : 20}%`,
                      backgroundColor: isRecording ? '#1FAA59' : '#0B3D2E',
                      opacity: isRecording ? 0.8 : 0.3
                    }}
                  ></div>
                ))}
              </div>

              <div className="flex justify-center">
                {!isRecording ? (
                  <button
                    onClick={handleStartRecording}
                    disabled={isProcessing}
                    className="group relative w-24 h-24 rounded-full bg-gradient-to-br from-[#1FAA59] to-[#0B3D2E] flex items-center justify-center shadow-2xl hover:shadow-[#1FAA59]/50 transition-all duration-300 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Mic className="w-10 h-10 text-white" />
                  </button>
                ) : (
                  <button
                    onClick={handleStopRecording}
                    className="relative w-24 h-24 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-2xl hover:shadow-red-500/50 transition-all duration-300 hover:scale-110 animate-pulse"
                  >
                    <MicOff className="w-10 h-10 text-white" />
                  </button>
                )}
              </div>

              <p className="text-center mt-6 text-[#0B3D2E]/70">
                {isRecording
                  ? 'Recording… speak your question, then tap stop'
                  : isProcessing
                    ? processingStatus || 'Transcribing and analyzing your question…'
                    : getSttUiHint()}
              </p>
            </div>
          </div>

          {transcript && (
            <div className="mb-6 animate-fade-in-up">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-[#0B3D2E] flex items-center justify-center">
                  <Mic className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-lg text-[#0B3D2E]">Your Question</h3>
              </div>
              <div className="bg-[#F8F9FA] rounded-xl p-6 border-l-4 border-[#1FAA59]">
                <p className="text-[#0B3D2E] urdu-text" style={{ fontSize: '1.1rem', lineHeight: '1.8' }}>
                  {transcript}
                </p>
              </div>
            </div>
          )}

          {isProcessing && (
            <div className="flex items-center justify-center gap-3 mb-6 animate-fade-in">
              <Loader className="w-6 h-6 text-[#1FAA59] animate-spin" />
              <p className="text-[#0B3D2E]/70">
                {processingStatus || 'Analyzing your question...'}
              </p>
            </div>
          )}

          {response && (
            <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <div className="flex items-center gap-2 mb-3">
                <button
                  type="button"
                  onClick={handleToggleSpeak}
                  disabled={!response}
                  className="group w-8 h-8 rounded-full bg-gradient-to-br from-[#1FAA59] to-[#0B3D2E] flex items-center justify-center transition-all duration-300 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {ttsStatus === 'loading' ? (
                    <Loader className="w-4 h-4 text-white animate-spin" />
                  ) : ttsStatus === 'playing' ? (
                    <Square className="w-3.5 h-3.5 text-white fill-white" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-white" />
                  )}
                </button>
                <h3 className="text-lg text-[#0B3D2E]">Legal Information</h3>
                {isAiServiceFallback(response, answerConfidence) && (
                  <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
                    Service unavailable
                  </span>
                )}
              </div>
              <div
                className={`rounded-xl p-6 shadow-lg ${
                  isAiServiceFallback(response, answerConfidence)
                    ? 'bg-amber-50 border-2 border-amber-300'
                    : 'bg-gradient-to-br from-[#0B3D2E] to-[#1FAA59]'
                }`}
              >
                <p
                  className={`urdu-text ${
                    isAiServiceFallback(response, answerConfidence) ? 'text-[#0B3D2E]' : 'text-white'
                  }`}
                  style={{ fontSize: '1.1rem', lineHeight: '1.8' }}
                >
                  {response}
                </p>
                <div
                  className={`mt-4 pt-4 border-t ${
                    isAiServiceFallback(response, answerConfidence) ? 'border-amber-200' : 'border-white/20'
                  }`}
                >
                  <p
                    className={`text-sm ${
                      isAiServiceFallback(response, answerConfidence) ? 'text-[#0B3D2E]/70' : 'text-white/70'
                    }`}
                  >
                    This is general legal information, not legal advice. Please consult a lawyer for your specific situation.
                  </p>
                </div>
              </div>
              {recommendedLawyers.length > 0 && (
                <RecommendedLawyers lawyers={recommendedLawyers} />
              )}
            </div>
          )}
        </div>

        <div className="bg-[#F8F9FA] px-4 sm:px-8 py-3 sm:py-4 border-t border-[#0B3D2E]/10 flex-shrink-0">
          <div className="flex items-center justify-between text-xs sm:text-sm text-[#0B3D2E]/60 gap-2">
            <p className="hidden sm:block">{getSttUiHint()}</p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#1FAA59] animate-pulse"></div>
              <span>Ready</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
