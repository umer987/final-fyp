import React, { useEffect, useRef, useState } from 'react';
import { Mic, FileText, Database, MessageSquare, ArrowRight } from 'lucide-react';

export function HowItWorks() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const steps = [
    {
      icon: Mic,
      number: '01',
      title: 'Speak in Urdu',
      titleUrdu: 'اردو میں بولیں',
      description: 'Use your voice to ask legal questions in natural Urdu language',
      color: '#1FAA59'
    },
    {
      icon: FileText,
      number: '02',
      title: 'AI Speech-to-Text',
      titleUrdu: 'تقریر سے متن',
      description: 'Whisper AI converts your voice to text with high accuracy',
      color: '#0B3D2E'
    },
    {
      icon: Database,
      number: '03',
      title: 'NLP & Legal Database',
      titleUrdu: 'قانونی ڈیٹابیس',
      description: 'Advanced NLP searches comprehensive legal knowledge base',
      color: '#C5A253'
    },
    {
      icon: MessageSquare,
      number: '04',
      title: 'Clear Urdu Answers',
      titleUrdu: 'واضح جوابات',
      description: 'Get simplified legal information in easy-to-understand Urdu',
      color: '#1FAA59'
    }
  ];

  return (
    <section ref={sectionRef} className="py-24 bg-white relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#E8F5ED] rounded-full blur-3xl opacity-30 -z-10"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#C5A253]/10 rounded-full blur-3xl opacity-30 -z-10"></div>

      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div className={`text-center mb-20 ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
          <h2 className="text-4xl lg:text-5xl mb-4 text-[#0B3D2E]">
            How It Works
          </h2>
          <p className="text-lg mb-2 text-[#C5A253] urdu-text">
            یہ کیسے کام کرتا ہے
          </p>
          <p className="text-xl text-[#0B3D2E]/70 max-w-3xl mx-auto">
            Four simple steps to access legal information in Urdu
          </p>
        </div>

        {/* Steps */}
        <div className="relative max-w-6xl mx-auto">
          {/* Connection Lines - Desktop */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-[#1FAA59] via-[#0B3D2E] to-[#C5A253] opacity-20 transform -translate-y-1/2"></div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
            {steps.map((step, index) => (
              <div
                key={index}
                className={`relative ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                {/* Arrow - Desktop Only */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-24 -right-8 z-10">
                    <ArrowRight className="w-12 h-12 text-[#1FAA59]/30" />
                  </div>
                )}

                {/* Step Card */}
                <div className="relative bg-white rounded-2xl p-8 border-2 border-[#0B3D2E]/10 hover:border-[#1FAA59]/50 transition-all duration-300 hover:shadow-xl group">
                  {/* Step Number */}
                  <div className="absolute -top-6 -left-6 w-16 h-16 rounded-full bg-gradient-to-br from-[#1FAA59] to-[#0B3D2E] flex items-center justify-center shadow-lg">
                    <span className="text-white text-xl">{step.number}</span>
                  </div>

                  {/* Icon */}
                  <div 
                    className="w-20 h-20 mb-6 rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300 mt-4"
                    style={{ backgroundColor: `${step.color}15` }}
                  >
                    <step.icon className="w-10 h-10" style={{ color: step.color }} />
                  </div>

                  {/* Title */}
                  <h3 className="text-xl mb-2 text-[#0B3D2E]">
                    {step.title}
                  </h3>
                  <p className="text-lg mb-4 text-[#C5A253] urdu-text">
                    {step.titleUrdu}
                  </p>

                  {/* Description */}
                  <p className="text-[#0B3D2E]/70 leading-relaxed">
                    {step.description}
                  </p>

                  {/* Bottom Border Accent */}
                  <div 
                    className="absolute bottom-0 left-0 right-0 h-1 rounded-b-2xl transition-all duration-300 group-hover:h-2"
                    style={{ backgroundColor: step.color }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className={`text-center mt-16 ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '0.6s' }}>
          <button className="px-10 py-5 gradient-green text-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105">
            Try Voice2Law Now
          </button>
        </div>
      </div>
    </section>
  );
}