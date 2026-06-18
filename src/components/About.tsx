import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, Target, Lightbulb, Network } from 'lucide-react';

export function About() {
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

  const cards = [
    {
      icon: AlertCircle,
      title: 'Problem Statement',
      titleUrdu: 'مسئلہ',
      description: 'Limited access to legal information in Urdu creates barriers for millions. Legal jargon and language complexity prevent ordinary citizens from understanding their rights.',
      gradient: 'from-[#0B3D2E] to-[#1FAA59]'
    },
    {
      icon: Lightbulb,
      title: 'Proposed Solution',
      titleUrdu: 'حل',
      description: 'Voice2Law provides an AI-powered assistant that converts voice queries in Urdu to simple, understandable legal information, making law accessible to everyone.',
      gradient: 'from-[#1FAA59] to-[#0B3D2E]'
    },
    {
      icon: Target,
      title: 'Scope',
      titleUrdu: 'دائرہ کار',
      description: 'Focused on Family Law, Rent/Property Law, and Criminal Law basics. Designed specifically for Pakistani legal system with Urdu language support.',
      gradient: 'from-[#C5A253] to-[#D4B76E]'
    },
    {
      icon: Network,
      title: 'Technologies',
      titleUrdu: 'ٹیکنالوجی',
      description: 'Built with React, Node.js, MongoDB, Whisper AI for speech recognition, and advanced NLP models for understanding Urdu legal queries.',
      gradient: 'from-[#0B3D2E] to-[#C5A253]'
    }
  ];

  return (
    <section ref={sectionRef} className="py-24 bg-[#F8F9FA]">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div className={`text-center mb-16 ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
          <h2 className="text-4xl lg:text-5xl mb-4 text-[#0B3D2E]">
            About Voice2Law
          </h2>
          <p className="text-xl text-[#0B3D2E]/70 max-w-3xl mx-auto">
            Bridging the gap between legal knowledge and Urdu-speaking citizens through AI innovation
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {cards.map((card, index) => (
            <div
              key={index}
              className={`group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-[#0B3D2E]/10 ${
                isVisible ? 'animate-fade-in-up' : 'opacity-0'
              }`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Gradient Top Border */}
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${card.gradient} rounded-t-2xl`}></div>

              {/* Icon */}
              <div className={`w-16 h-16 mb-6 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                <card.icon className="w-8 h-8 text-white" />
              </div>

              {/* Title */}
              <h3 className="text-xl mb-2 text-[#0B3D2E]">
                {card.title}
              </h3>
              <p className="text-lg mb-4 text-[#C5A253] urdu-text">
                {card.titleUrdu}
              </p>

              {/* Description */}
              <p className="text-[#0B3D2E]/70 leading-relaxed">
                {card.description}
              </p>

              {/* Hover Effect Overlay */}
              <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-300`}></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}