import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Mic, FileText, Scale, BookOpen } from 'lucide-react';

const VoiceBot = lazy(() => import('./VoiceBot').then((m) => ({ default: m.VoiceBot })));
const TextBot = lazy(() => import('./TextBot').then((m) => ({ default: m.TextBot })));

export function Hero() {
  const [isAnimated, setIsAnimated] = useState(false);
  const [showVoiceBot, setShowVoiceBot] = useState(false);
  const [showTextBot, setShowTextBot] = useState(false);

  useEffect(() => {
    setIsAnimated(true);
  }, []);

  return (
    <>
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Background — subtle brand wash (compiled CSS lacks inset-y-0, so the old split-half div rendered 0px tall) */}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(135deg, rgba(31, 170, 89, 0.10) 0%, rgba(197, 162, 83, 0.05) 45%, #ffffff 75%)' }}
        ></div>

        {/* Floating Legal Elements - Left Side */}
        <div className="absolute left-[10%] top-[20%] opacity-10">
          <Scale className="w-32 h-32 text-[#0B3D2E] animate-float" style={{ animationDelay: '0s' }} />
        </div>
        <div className="absolute left-[15%] bottom-[25%] opacity-10">
          <BookOpen className="w-24 h-24 text-[#0B3D2E] animate-float" style={{ animationDelay: '1s' }} />
        </div>

        {/* Floating Legal Elements - Right Side */}
        <div className="absolute right-[10%] top-[30%] opacity-5">
          <Scale className="w-40 h-40 text-[#0B3D2E] animate-float" style={{ animationDelay: '0.5s' }} />
        </div>
        <div className="absolute right-[15%] bottom-[20%] opacity-5">
          <BookOpen className="w-28 h-28 text-[#0B3D2E] animate-float" style={{ animationDelay: '1.5s' }} />
        </div>

        {/* Decorative Lines */}
        <div
          className="absolute top-0 left-1/2 w-px h-full"
          style={{ background: 'linear-gradient(to bottom, transparent, rgba(11, 61, 46, 0.12), transparent)' }}
        ></div>

        {/* Main Content */}
        <div className="container mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className={`text-black ${isAnimated ? 'animate-slide-in-left' : 'opacity-0'}`}>
              <div className="mb-4 inline-block">
                <span className="px-4 py-2 bg-[#1FAA59]/10 rounded-full border border-[#1FAA59]/30 text-[#0B3D2E]">
                  AI-Powered Legal Assistant
                </span>
              </div>
              <h1 className="text-5xl lg:text-7xl mb-6 leading-tight">
                Voice2Law
              </h1>
              <div className="text-2xl lg:text-3xl mb-4 font-[400] opacity-90 urdu-text">
                قانونی معلومات کا اردو اسسٹنٹ
              </div>
              <p className="text-xl mb-8 opacity-80 max-w-xl">
                Get instant legal information in Urdu using voice or text. Simplifying Pakistani law for everyone.
              </p>

              {/* Voice Waveform Animation */}
              <div className="mb-8 flex items-center gap-1 h-16">
                {[...Array(20)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1.5 rounded-full"
                    style={{
                      animation: 'wave 1.5s ease-in-out infinite',
                      animationDelay: `${i * 0.1}s`,
                      height: '40%',
                      backgroundColor: i % 4 === 0 ? 'rgba(197, 162, 83, 0.8)' : 'rgba(31, 170, 89, 0.7)'
                    }}
                  ></div>
                ))}
              </div>

              <div className="flex flex-wrap gap-4">
                <button 
                  onClick={() => setShowVoiceBot(true)}
                  className="px-8 py-4 bg-[#C5A253] hover:bg-[#D4B76E] text-white rounded-lg transition-all duration-300 flex items-center gap-3 shadow-lg hover:shadow-xl hover:scale-105"
                >
                  <Mic className="w-5 h-5" />
                  <span>Ask by Voice</span>
                </button>
                <button 
                  onClick={() => setShowTextBot(true)}
                  className="px-8 py-4 bg-white hover:bg-gray-50 text-[#0B3D2E] rounded-lg transition-all duration-300 flex items-center gap-3 shadow-lg hover:shadow-xl hover:scale-105"
                >
                  <FileText className="w-5 h-5" />
                  <span>Ask by Text</span>
                </button>
              </div>
            </div>

            {/* Right Content - Floating Urdu Characters */}
            <div className={`relative ${isAnimated ? 'animate-slide-in-right' : 'opacity-0'}`}>
              {/* h-[500px] is the only fixed-height utility present in the pre-compiled index.css */}
              <div className="relative h-[500px] flex items-center justify-center">
                {/* Center Icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-48 h-48 rounded-full gradient-green shadow-2xl flex items-center justify-center animate-pulse-slow">
                    <Scale className="w-24 h-24 text-white" />
                  </div>
                </div>

                {/* Floating Urdu Text Elements - Symmetric Circle Layout */}
                {/* Top - قانون */}
                <div className="absolute top-[8%] left-1/2 -translate-x-1/2 animate-float" style={{ animationDelay: '0s' }}>
                  <div className="bg-white/90 backdrop-blur-sm px-6 py-3 rounded-lg shadow-lg border-2 border-[#1FAA59]">
                    <span className="text-2xl text-[#0B3D2E] urdu-text">قانون</span>
                  </div>
                </div>

                {/* Top Right - انصاف */}
                <div className="absolute top-[20%] right-[8%] animate-float" style={{ animationDelay: '0.3s' }}>
                  <div className="bg-white/90 backdrop-blur-sm px-6 py-3 rounded-lg shadow-lg border-2 border-[#C5A253]">
                    <span className="text-2xl text-[#0B3D2E] urdu-text">انصاف</span>
                  </div>
                </div>

                {/* Right - معلومات (right-[8%] keeps the chip clear of the viewport edge at lg widths) */}
                <div className="absolute top-1/2 -translate-y-1/2 right-[8%] animate-float" style={{ animationDelay: '0.6s' }}>
                  <div className="bg-white/90 backdrop-blur-sm px-6 py-3 rounded-lg shadow-lg border-2 border-[#1FAA59]">
                    <span className="text-2xl text-[#0B3D2E] urdu-text">معلومات</span>
                  </div>
                </div>

                {/* Bottom Right - مدد */}
                <div className="absolute bottom-[20%] right-[8%] animate-float" style={{ animationDelay: '0.9s' }}>
                  <div className="bg-white/90 backdrop-blur-sm px-6 py-3 rounded-lg shadow-lg border-2 border-[#C5A253]">
                    <span className="text-2xl text-[#0B3D2E] urdu-text">مدد</span>
                  </div>
                </div>

                {/* Bottom Left - حقوق */}
                <div className="absolute bottom-[20%] left-[8%] animate-float" style={{ animationDelay: '1.2s' }}>
                  <div className="bg-white/90 backdrop-blur-sm px-6 py-3 rounded-lg shadow-lg border-2 border-[#1FAA59]">
                    <span className="text-2xl text-[#0B3D2E] urdu-text">حقوق</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 rounded-full flex justify-center" style={{ borderColor: 'rgba(11, 61, 46, 0.35)' }}>
            <div className="w-1 h-3 rounded-full mt-2 animate-pulse" style={{ backgroundColor: 'rgba(11, 61, 46, 0.35)' }}></div>
          </div>
        </div>
      </section>

      {/* Bot modals — loaded only when opened (faster home page) */}
      {showVoiceBot && (
        <Suspense fallback={null}>
          <VoiceBot onClose={() => setShowVoiceBot(false)} />
        </Suspense>
      )}
      {showTextBot && (
        <Suspense fallback={null}>
          <TextBot onClose={() => setShowTextBot(false)} />
        </Suspense>
      )}
    </>
  );
}