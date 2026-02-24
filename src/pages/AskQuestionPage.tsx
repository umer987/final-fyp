import React, { useState } from 'react';
import { Mic, FileText, MessageSquare, Sparkles } from 'lucide-react';
import { VoiceBot } from '../components/VoiceBot';
import { TextBot } from '../components/TextBot';
import { Footer } from '../components/Footer';

export function AskQuestionPage() {
  const [showVoiceBot, setShowVoiceBot] = useState(false);
  const [showTextBot, setShowTextBot] = useState(false);

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-[#E8F5ED] to-white pt-32 pb-20">
        <div className="container mx-auto px-6">
          {/* Header */}
          <div className="text-center mb-16 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#1FAA59]/10 rounded-full mb-6">
              <Sparkles className="w-5 h-5 text-[#1FAA59]" />
              <span className="text-[#0B3D2E]">AI-Powered Legal Assistant</span>
            </div>
            <h1 className="text-5xl md:text-6xl text-[#0B3D2E] mb-6">
              Ask Your Legal Question
            </h1>
            <p className="text-xl text-[#0B3D2E]/70 mb-4 urdu-text">
              اپنا قانونی سوال پوچھیں
            </p>
            <p className="text-lg text-[#0B3D2E]/60 max-w-3xl mx-auto">
              Choose your preferred method to ask questions about Pakistani law. Get instant answers in Urdu or English.
            </p>
          </div>

          {/* Question Methods */}
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-16">
            {/* Voice Input */}
            <div className="group animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              <div className="bg-white rounded-3xl p-8 shadow-xl border-2 border-transparent hover:border-[#1FAA59] transition-all duration-500 hover:shadow-2xl hover:scale-105">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#1FAA59] to-[#0B3D2E] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                  <Mic className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl text-[#0B3D2E] mb-4">Voice Input</h3>
                <p className="text-[#0B3D2E]/70 mb-6 urdu-text" style={{ fontSize: '1.1rem', lineHeight: '1.8' }}>
                  آواز میں اپنا سوال پوچھیں
                </p>
                <p className="text-[#0B3D2E]/60 mb-6">
                  Simply speak your question in Urdu or English. Our AI will transcribe and provide accurate legal information instantly.
                </p>
                <button
                  onClick={() => setShowVoiceBot(true)}
                  className="w-full px-8 py-4 bg-gradient-to-r from-[#1FAA59] to-[#0B3D2E] hover:from-[#0B3D2E] hover:to-[#1FAA59] text-white rounded-xl transition-all duration-300 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
                >
                  <Mic className="w-5 h-5" />
                  <span>Start Voice Assistant</span>
                </button>
              </div>
            </div>

            {/* Text Input */}
            <div className="group animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <div className="bg-white rounded-3xl p-8 shadow-xl border-2 border-transparent hover:border-[#C5A253] transition-all duration-500 hover:shadow-2xl hover:scale-105">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#C5A253] to-[#D4B76E] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                  <FileText className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl text-[#0B3D2E] mb-4">Text Input</h3>
                <p className="text-[#0B3D2E]/70 mb-6 urdu-text" style={{ fontSize: '1.1rem', lineHeight: '1.8' }}>
                  متن میں اپنا سوال لکھیں
                </p>
                <p className="text-[#0B3D2E]/60 mb-6">
                  Type your legal question in your preferred language. Get detailed responses with references to Pakistani law.
                </p>
                <button
                  onClick={() => setShowTextBot(true)}
                  className="w-full px-8 py-4 bg-gradient-to-r from-[#C5A253] to-[#D4B76E] hover:from-[#D4B76E] hover:to-[#C5A253] text-white rounded-xl transition-all duration-300 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
                >
                  <FileText className="w-5 h-5" />
                  <span>Start Text Assistant</span>
                </button>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl max-w-5xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center gap-3 mb-8">
              <MessageSquare className="w-8 h-8 text-[#1FAA59]" />
              <h2 className="text-3xl text-[#0B3D2E]">How It Helps You</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-[#1FAA59]/10 flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-[#1FAA59]">✓</span>
                </div>
                <div>
                  <h4 className="text-lg text-[#0B3D2E] mb-2">Instant Responses</h4>
                  <p className="text-[#0B3D2E]/60">Get immediate answers to your legal questions without waiting.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-[#1FAA59]/10 flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-[#1FAA59]">✓</span>
                </div>
                <div>
                  <h4 className="text-lg text-[#0B3D2E] mb-2">Bilingual Support</h4>
                  <p className="text-[#0B3D2E]/60">Ask questions in Urdu or English, get answers in your language.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-[#1FAA59]/10 flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-[#1FAA59]">✓</span>
                </div>
                <div>
                  <h4 className="text-lg text-[#0B3D2E] mb-2">Accurate Information</h4>
                  <p className="text-[#0B3D2E]/60">Based on Pakistani law and legal precedents.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-[#1FAA59]/10 flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-[#1FAA59]">✓</span>
                </div>
                <div>
                  <h4 className="text-lg text-[#0B3D2E] mb-2">24/7 Available</h4>
                  <p className="text-[#0B3D2E]/60">Access legal information anytime, anywhere.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="mt-12 text-center max-w-3xl mx-auto">
            <p className="text-sm text-[#0B3D2E]/50 bg-[#F8F9FA] px-6 py-4 rounded-xl">
              <strong>Important:</strong> This service provides general legal information, not legal advice. 
              For specific legal matters, please consult a qualified lawyer.
            </p>
          </div>
        </div>
      </div>

      {showVoiceBot && <VoiceBot onClose={() => setShowVoiceBot(false)} />}
      {showTextBot && <TextBot onClose={() => setShowTextBot(false)} />}
      <Footer />
    </>
  );
}
