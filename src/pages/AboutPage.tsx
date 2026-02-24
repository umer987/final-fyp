import React from 'react';
import { Target, Eye, Heart, Award, Users, Zap } from 'lucide-react';
import { About } from '../components/About';
import { Team } from '../components/Team';
import { Footer } from '../components/Footer';

export function AboutPage() {
  const values = [
    {
      icon: Heart,
      title: 'Accessibility',
      titleUrdu: 'رسائی',
      description: 'Making legal information accessible to every Pakistani in their native language.',
      color: 'from-[#1FAA59] to-[#0B3D2E]'
    },
    {
      icon: Award,
      title: 'Accuracy',
      titleUrdu: 'درستگی',
      description: 'Providing accurate legal information based on Pakistani law and regulations.',
      color: 'from-[#C5A253] to-[#D4B76E]'
    },
    {
      icon: Users,
      title: 'Empowerment',
      titleUrdu: 'بااختیار بنانا',
      description: 'Empowering citizens with knowledge of their legal rights and obligations.',
      color: 'from-[#1FAA59] to-[#0B3D2E]'
    },
    {
      icon: Zap,
      title: 'Innovation',
      titleUrdu: 'جدت',
      description: 'Using cutting-edge AI technology to bridge the legal information gap.',
      color: 'from-[#C5A253] to-[#D4B76E]'
    }
  ];

  const stats = [
    { number: '10,000+', label: 'Legal Topics Covered', labelUrdu: 'قانونی موضوعات' },
    { number: '24/7', label: 'Always Available', labelUrdu: 'ہمیشہ دستیاب' },
    { number: '2', label: 'Languages Supported', labelUrdu: 'زبانیں' },
    { number: '99%', label: 'Accuracy Rate', labelUrdu: 'درستگی کی شرح' }
  ];

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-[#E8F5ED] to-white pt-32 pb-20">
        <div className="container mx-auto px-6">
          {/* Hero Section */}
          <div className="text-center mb-16 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#1FAA59]/10 rounded-full mb-6">
              <Target className="w-5 h-5 text-[#1FAA59]" />
              <span className="text-[#0B3D2E]">About Voice2Law</span>
            </div>
            <h1 className="text-5xl md:text-6xl text-[#0B3D2E] mb-6">
              Bridging the Legal Knowledge Gap
            </h1>
            <p className="text-xl text-[#0B3D2E]/70 mb-4 urdu-text">
              قانونی معلومات کو سب تک پہنچانا
            </p>
            <p className="text-lg text-[#0B3D2E]/60 max-w-3xl mx-auto">
              Voice2Law is Pakistan's first AI-powered legal information assistant that provides instant access 
              to legal knowledge in Urdu, making justice accessible to everyone.
            </p>
          </div>

          {/* Mission & Vision */}
          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto mb-20">
            {/* Mission */}
            <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              <div className="bg-white rounded-3xl p-8 shadow-xl h-full">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1FAA59] to-[#0B3D2E] flex items-center justify-center mb-6">
                  <Target className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl text-[#0B3D2E] mb-4">Our Mission</h2>
                <p className="text-xl text-[#0B3D2E]/70 mb-4 urdu-text">ہمارا مقصد</p>
                <p className="text-[#0B3D2E]/60 leading-relaxed">
                  To democratize access to legal information in Pakistan by providing instant, accurate, 
                  and easy-to-understand legal guidance in Urdu. We believe that every citizen has the 
                  right to understand their legal rights and obligations without language or accessibility barriers.
                </p>
              </div>
            </div>

            {/* Vision */}
            <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <div className="bg-white rounded-3xl p-8 shadow-xl h-full">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#C5A253] to-[#D4B76E] flex items-center justify-center mb-6">
                  <Eye className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl text-[#0B3D2E] mb-4">Our Vision</h2>
                <p className="text-xl text-[#0B3D2E]/70 mb-4 urdu-text">ہماری نظر</p>
                <p className="text-[#0B3D2E]/60 leading-relaxed">
                  To become Pakistan's most trusted legal information platform, empowering millions of 
                  citizens with knowledge of their rights. We envision a future where legal literacy 
                  is universal and justice is truly accessible to all, regardless of socioeconomic status.
                </p>
              </div>
            </div>
          </div>

          {/* Core Values */}
          <div className="mb-20">
            <div className="text-center mb-12 animate-fade-in-up">
              <h2 className="text-4xl text-[#0B3D2E] mb-4">Our Core Values</h2>
              <p className="text-[#0B3D2E]/70 urdu-text text-xl">ہماری بنیادی اقدار</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
              {values.map((value, index) => {
                const Icon = value.icon;
                return (
                  <div
                    key={index}
                    className="animate-fade-in-up"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-105 h-full">
                      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${value.color} flex items-center justify-center mb-4`}>
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                      <h3 className="text-xl text-[#0B3D2E] mb-2">{value.title}</h3>
                      <p className="text-[#0B3D2E]/70 urdu-text mb-3">{value.titleUrdu}</p>
                      <p className="text-[#0B3D2E]/60 text-sm">{value.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Statistics */}
          <div className="bg-gradient-to-br from-[#0B3D2E] to-[#1FAA59] rounded-3xl p-12 mb-20 animate-fade-in-up">
            <div className="text-center mb-12">
              <h2 className="text-4xl text-white mb-4">Voice2Law in Numbers</h2>
              <p className="text-white/80 urdu-text text-xl">اعداد و شمار میں Voice2Law</p>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <div
                  key={index}
                  className="text-center animate-fade-in-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="text-5xl md:text-6xl text-[#C5A253] mb-3">{stat.number}</div>
                  <div className="text-white text-lg mb-2">{stat.label}</div>
                  <div className="text-white/70 urdu-text">{stat.labelUrdu}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Why Voice2Law */}
          <div className="bg-white rounded-3xl p-12 shadow-xl max-w-5xl mx-auto mb-20 animate-fade-in-up">
            <h2 className="text-4xl text-[#0B3D2E] mb-8 text-center">Why Voice2Law?</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                {
                  title: 'Language Barrier',
                  description: 'Most legal resources in Pakistan are in English, creating a barrier for Urdu speakers. Voice2Law breaks this barrier.'
                },
                {
                  title: 'Cost of Legal Advice',
                  description: 'Professional legal consultation is expensive. Voice2Law provides free, instant legal information.'
                },
                {
                  title: 'Complex Legal Terminology',
                  description: 'Legal jargon is difficult to understand. We simplify it in plain Urdu and English.'
                },
                {
                  title: 'Instant Accessibility',
                  description: 'Get answers immediately without waiting for office hours or appointments.'
                }
              ].map((item, index) => (
                <div key={index} className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-[#1FAA59]/10 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-[#1FAA59]">✓</span>
                  </div>
                  <div>
                    <h4 className="text-xl text-[#0B3D2E] mb-2">{item.title}</h4>
                    <p className="text-[#0B3D2E]/60">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Team Section */}
      <Team />
      
      <Footer />
    </>
  );
}