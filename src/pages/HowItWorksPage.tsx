import React from 'react';
import { Mic, Brain, Database, MessageSquare, Zap, Shield } from 'lucide-react';
import { HowItWorks } from '../components/HowItWorks';
import { TechStack } from '../components/TechStack';
import { Footer } from '../components/Footer';

export function HowItWorksPage() {
  const features = [
    {
      icon: Mic,
      title: 'Voice Recognition',
      titleUrdu: 'آواز کی شناخت',
      description: 'Advanced speech-to-text powered by Whisper AI converts your Urdu speech into text with high accuracy.',
      color: 'from-[#1FAA59] to-[#0B3D2E]'
    },
    {
      icon: Brain,
      title: 'Natural Language Processing',
      titleUrdu: 'قدرتی زبان کی پروسیسنگ',
      description: 'AI understands context, intent, and nuances of your legal questions in both Urdu and English.',
      color: 'from-[#C5A253] to-[#D4B76E]'
    },
    {
      icon: Database,
      title: 'Legal Knowledge Base',
      titleUrdu: 'قانونی معلوماتی ذخیرہ',
      description: 'Comprehensive database of Pakistani laws, ordinances, and legal precedents updated regularly.',
      color: 'from-[#1FAA59] to-[#0B3D2E]'
    },
    {
      icon: MessageSquare,
      title: 'Intelligent Responses',
      titleUrdu: 'ذہین جوابات',
      description: 'AI generates clear, accurate responses in simple language with relevant legal references.',
      color: 'from-[#C5A253] to-[#D4B76E]'
    }
  ];

  const securityFeatures = [
    {
      icon: Shield,
      title: 'Privacy Protected',
      description: 'Your questions and conversations are private and not stored permanently.'
    },
    {
      icon: Zap,
      title: 'Fast Processing',
      description: 'Get instant responses within seconds using optimized AI algorithms.'
    },
    {
      icon: Database,
      title: 'Verified Information',
      description: 'All legal information is cross-verified with official sources.'
    }
  ];

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-[#E8F5ED] to-white pt-32 pb-20">
        <div className="container mx-auto px-6">
          {/* Header */}
          <div className="text-center mb-16 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#1FAA59]/10 rounded-full mb-6">
              <Zap className="w-5 h-5 text-[#1FAA59]" />
              <span className="text-[#0B3D2E]">The Technology Behind Voice2Law</span>
            </div>
            <h1 className="text-5xl md:text-6xl text-[#0B3D2E] mb-6">
              How It Works
            </h1>
            <p className="text-xl text-[#0B3D2E]/70 mb-4 urdu-text">
              یہ کیسے کام کرتا ہے
            </p>
            <p className="text-lg text-[#0B3D2E]/60 max-w-3xl mx-auto">
              Voice2Law combines cutting-edge AI technology with comprehensive legal knowledge to deliver 
              instant, accurate legal information in your language.
            </p>
          </div>
        </div>
      </div>

      {/* How It Works Component */}
      <HowItWorks />

      {/* Technology Features */}
      <div className="bg-white py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl text-[#0B3D2E] mb-4">Powerful AI Features</h2>
            <p className="text-[#0B3D2E]/70 urdu-text text-xl">طاقتور AI خصوصیات</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="animate-fade-in-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="bg-gradient-to-br from-[#E8F5ED] to-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-105 h-full border border-[#1FAA59]/10">
                    <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl text-[#0B3D2E] mb-3">{feature.title}</h3>
                    <p className="text-lg text-[#0B3D2E]/70 mb-4 urdu-text">{feature.titleUrdu}</p>
                    <p className="text-[#0B3D2E]/60 leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Technology Stack */}
      <TechStack />

      {/* Security & Trust */}
      <div className="bg-gradient-to-br from-[#0B3D2E] to-[#1FAA59] py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl text-white mb-4">Security & Trust</h2>
            <p className="text-white/80 urdu-text text-xl">سیکیورٹی اور اعتماد</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {securityFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="text-center animate-fade-in-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-6">
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl text-white mb-3">{feature.title}</h3>
                  <p className="text-white/80">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Process Flow Diagram */}
      <div className="bg-white py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl text-[#0B3D2E] mb-4">Simple Process Flow</h2>
            <p className="text-[#0B3D2E]/70 urdu-text text-xl">آسان عمل</p>
          </div>
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-5 gap-4 items-center">
              {[
                { step: '1', label: 'Ask Question', urdu: 'سوال پوچھیں' },
                { arrow: true },
                { step: '2', label: 'AI Processing', urdu: 'AI پروسیسنگ' },
                { arrow: true },
                { step: '3', label: 'Database Search', urdu: 'ڈیٹا بیس تلاش' },
                { arrow: true },
                { step: '4', label: 'Response Generation', urdu: 'جواب تیار کریں' },
                { arrow: true },
                { step: '5', label: 'Get Answer', urdu: 'جواب حاصل کریں' }
              ].map((item, index) => {
                if (item.arrow) {
                  return (
                    <div key={index} className="hidden md:flex justify-center">
                      <div className="w-0 h-0 border-t-[15px] border-t-transparent border-l-[25px] border-l-[#1FAA59] border-b-[15px] border-b-transparent"></div>
                    </div>
                  );
                }
                return (
                  <div key={index} className="text-center">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#1FAA59] to-[#0B3D2E] flex items-center justify-center mx-auto mb-4 text-white text-2xl shadow-lg">
                      {item.step}
                    </div>
                    <p className="text-[#0B3D2E] mb-1">{item.label}</p>
                    <p className="text-[#0B3D2E]/70 text-sm urdu-text">{item.urdu}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="bg-gradient-to-br from-[#E8F5ED] to-white py-20">
        <div className="container mx-auto px-6">
          <div className="bg-white rounded-3xl p-12 shadow-2xl max-w-4xl mx-auto text-center">
            <h2 className="text-4xl text-[#0B3D2E] mb-6">Ready to Try Voice2Law?</h2>
            <p className="text-xl text-[#0B3D2E]/70 mb-8 urdu-text">
              Voice2Law آزمانے کے لیے تیار ہیں؟
            </p>
            <p className="text-[#0B3D2E]/60 mb-8">
              Experience the power of AI-driven legal assistance. Get instant answers to your legal questions now.
            </p>
            <button className="px-8 py-4 bg-gradient-to-r from-[#1FAA59] to-[#0B3D2E] text-white rounded-xl hover:shadow-xl transition-all duration-300 hover:scale-105 text-lg">
              Ask Your First Question
            </button>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}