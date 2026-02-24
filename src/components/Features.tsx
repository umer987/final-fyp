import React, { useEffect, useRef, useState } from 'react';
import { Mic, Database, Brain, Scale, Users, Cloud } from 'lucide-react';

export function Features() {
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

  const features = [
    {
      icon: Mic,
      title: 'Urdu Voice Recognition',
      titleUrdu: 'اردو آواز کی شناخت',
      description: 'Advanced speech-to-text powered by Whisper AI, optimized for Urdu language with high accuracy.',
      gradient: 'from-[#1FAA59] to-[#0B3D2E]'
    },
    {
      icon: Database,
      title: 'Legal Knowledge Base',
      titleUrdu: 'قانونی علم کا ذخیرہ',
      description: 'Comprehensive database covering Pakistani laws, regulations, and legal procedures.',
      gradient: 'from-[#0B3D2E] to-[#1FAA59]'
    },
    {
      icon: Brain,
      title: 'NLP Understanding',
      titleUrdu: 'زبان کی سمجھ',
      description: 'Natural language processing to understand context and intent behind your legal questions.',
      gradient: 'from-[#C5A253] to-[#D4B76E]'
    },
    {
      icon: Scale,
      title: 'Family Law',
      titleUrdu: 'خاندانی قانون',
      description: 'Expert guidance on marriage, divorce, inheritance, custody, and family-related legal matters.',
      gradient: 'from-[#1FAA59] to-[#C5A253]'
    },
    {
      icon: Users,
      title: 'Rent & Property Law',
      titleUrdu: 'کرایہ اور جائیداد',
      description: 'Information on rental agreements, property rights, tenant laws, and real estate regulations.',
      gradient: 'from-[#0B3D2E] to-[#C5A253]'
    },
    {
      icon: Cloud,
      title: 'Cloud Hosted',
      titleUrdu: 'کلاؤڈ پر محفوظ',
      description: 'Deployed on Render and Firebase for reliable, scalable, and fast access anytime, anywhere.',
      gradient: 'from-[#C5A253] to-[#1FAA59]'
    }
  ];

  return (
    <section ref={sectionRef} className="py-24 gradient-green relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-10 right-10 w-64 h-64 border-2 border-white/10 rounded-full"></div>
      <div className="absolute bottom-10 left-10 w-80 h-80 border-2 border-white/10 rounded-full"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 border border-white/5 rounded-full"></div>

      <div className="container mx-auto px-6 relative z-10">
        {/* Section Header */}
        <div className={`text-center mb-16 ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
          <h2 className="text-4xl lg:text-5xl mb-4 text-white">
            Powerful Features
          </h2>
          <p className="text-lg mb-2 text-[#C5A253] urdu-text">
            طاقتور خصوصیات
          </p>
          <p className="text-xl text-white/80 max-w-3xl mx-auto">
            Everything you need to access legal information in Urdu
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {features.map((feature, index) => (
            <div
              key={index}
              className={`group relative bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl ${
                isVisible ? 'animate-fade-in-up' : 'opacity-0'
              }`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Icon with Gradient Background */}
              <div className={`w-16 h-16 mb-6 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className="w-8 h-8 text-white" />
              </div>

              {/* Title */}
              <h3 className="text-xl mb-2 text-white">
                {feature.title}
              </h3>
              <p className="text-lg mb-4 text-[#C5A253] urdu-text">
                {feature.titleUrdu}
              </p>

              {/* Description */}
              <p className="text-white/80 leading-relaxed">
                {feature.description}
              </p>

              {/* Hover Accent Line */}
              <div className={`absolute bottom-0 left-0 w-0 h-1 bg-gradient-to-r ${feature.gradient} transition-all duration-500 group-hover:w-full rounded-b-2xl`}></div>
            </div>
          ))}
        </div>

        {/* Additional Info */}
        <div className={`mt-16 text-center ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '0.8s' }}>
          <div className="inline-block bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-8 py-6">
            <p className="text-white/90 text-lg">
              <span className="text-[#C5A253]">Criminal Law Basics</span> also covered • Designed for Pakistani Legal System
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}