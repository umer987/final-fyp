import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2, ArrowLeft, Send, Loader } from 'lucide-react';

interface VoiceBotProps {
  onClose: () => void;
}

export function VoiceBot({ onClose }: VoiceBotProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [audioLevel, setAudioLevel] = useState<number[]>([]);

  // Generate random audio levels for visualization
  useEffect(() => {
    if (isRecording) {
      const interval = setInterval(() => {
        const newLevels = Array.from({ length: 30 }, () => Math.random() * 100);
        setAudioLevel(newLevels);
      }, 100);
      return () => clearInterval(interval);
    } else {
      setAudioLevel(Array(30).fill(20));
    }
  }, [isRecording]);

  const handleStartRecording = () => {
    setIsRecording(true);
    setTranscript('');
    setResponse('');
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    setIsProcessing(true);
    
    // Simulate processing
    setTimeout(() => {
      setTranscript('میں طلاق کے بارے میں جانکاری حاصل کرنا چاہتا ہوں');
      setIsProcessing(false);
      
      // Simulate response
      setTimeout(() => {
        setResponse('پاکستان میں طلاق کے لیے مسلم فیملی لاء آرڈیننس 1961 کے تحت مخصوص طریقہ کار ہے۔ طلاق دینے کے لیے یونین کونسل کو نوٹس دینا ضروری ہے۔ نوٹس کے بعد 90 دن کی مفاہمتی مدت ہوتی ہے۔');
      }, 1000);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 bg-[#0B3D2E]/95 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0B3D2E] to-[#1FAA59] px-8 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all duration-300"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div>
              <h2 className="text-2xl text-white">Voice Assistant</h2>
              <p className="text-white/80 text-sm urdu-text">آواز سے سوال پوچھیں</p>
            </div>
          </div>
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
            <Mic className="w-6 h-6 text-white" />
          </div>
        </div>

        {/* Main Content */}
        <div className="p-8">
          {/* Voice Visualization */}
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

              {/* Recording Button */}
              <div className="flex justify-center">
                {!isRecording ? (
                  <button
                    onClick={handleStartRecording}
                    disabled={isProcessing}
                    className="group relative w-24 h-24 rounded-full bg-gradient-to-br from-[#1FAA59] to-[#0B3D2E] flex items-center justify-center shadow-2xl hover:shadow-[#1FAA59]/50 transition-all duration-300 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Mic className="w-10 h-10 text-white" />
                    <div className="absolute inset-0 rounded-full bg-[#1FAA59] opacity-0 group-hover:opacity-20 animate-pulse-slow"></div>
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
                {isRecording ? 'Recording... Click to stop' : isProcessing ? 'Processing...' : 'Click the microphone to start recording'}
              </p>
            </div>
          </div>

          {/* Transcript */}
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

          {/* Processing Indicator */}
          {isProcessing && (
            <div className="flex items-center justify-center gap-3 mb-6 animate-fade-in">
              <Loader className="w-6 h-6 text-[#1FAA59] animate-spin" />
              <p className="text-[#0B3D2E]/70">Analyzing your question...</p>
            </div>
          )}

          {/* Response */}
          {response && (
            <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1FAA59] to-[#0B3D2E] flex items-center justify-center">
                  <Volume2 className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-lg text-[#0B3D2E]">Legal Information</h3>
              </div>
              <div className="bg-gradient-to-br from-[#0B3D2E] to-[#1FAA59] rounded-xl p-6 shadow-lg">
                <p className="text-white urdu-text" style={{ fontSize: '1.1rem', lineHeight: '1.8' }}>
                  {response}
                </p>
                <div className="mt-4 pt-4 border-t border-white/20">
                  <p className="text-white/70 text-sm">
                    This is general legal information, not legal advice. Please consult a lawyer for your specific situation.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#F8F9FA] px-8 py-4 border-t border-[#0B3D2E]/10">
          <div className="flex items-center justify-between text-sm text-[#0B3D2E]/60">
            <p>Powered by Whisper AI & Advanced NLP</p>
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
