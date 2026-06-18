import React, { useState, useEffect } from 'react';
import { Scale, Users, Home, FileText, ShieldCheck, ChevronRight, Loader } from 'lucide-react';
import { Footer } from '../components/Footer';
import { api, type UrduDocument } from '../lib/api';

export function LegalTopicsPage() {
  const [selectedTopic, setSelectedTopic] = useState<number | null>(null);
  const [uploadedDocuments, setUploadedDocuments] = useState<UrduDocument[]>([]);
  const [isLoadingKb, setIsLoadingKb] = useState(true);

  useEffect(() => {
    let active = true;
    api.getUrduDocuments(true)
      .then(({ documents }) => {
        if (active) setUploadedDocuments(documents);
      })
      .catch(() => {
        if (active) setUploadedDocuments([]);
      })
      .finally(() => {
        if (active) setIsLoadingKb(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const topics = [
    {
      icon: Users,
      title: 'Family Law',
      titleUrdu: 'خاندانی قانون',
      color: 'from-[#1FAA59] to-[#0B3D2E]',
      subtopics: [
        { title: 'Marriage & Nikah', urdu: 'نکاح اور شادی', description: 'Requirements, registration, and legal rights' },
        { title: 'Divorce & Talaq', urdu: 'طلاق', description: 'Procedures, notice requirements, and reconciliation period' },
        { title: 'Child Custody', urdu: 'بچوں کی تحویل', description: 'Guardianship rights and custody laws' },
        { title: 'Maintenance & Nafaqa', urdu: 'نفقہ', description: 'Financial support obligations' }
      ]
    },
    {
      icon: Home,
      title: 'Property Law',
      titleUrdu: 'جائیداد کا قانون',
      color: 'from-[#C5A253] to-[#D4B76E]',
      subtopics: [
        { title: 'Property Transfer', urdu: 'جائیداد کی منتقلی', description: 'Sale deeds, registration, and documentation' },
        { title: 'Inheritance & Wirasat', urdu: 'وراثت', description: 'Islamic inheritance laws and distribution' },
        { title: 'Rent & Tenancy', urdu: 'کرایہ داری', description: 'Tenant and landlord rights' },
        { title: 'Property Disputes', urdu: 'جائیداد کے تنازعات', description: 'Resolution of property conflicts' }
      ]
    },
    {
      icon: ShieldCheck,
      title: 'Criminal Law',
      titleUrdu: 'فوجداری قانون',
      color: 'from-[#1FAA59] to-[#0B3D2E]',
      subtopics: [
        { title: 'FIR & Complaints', urdu: 'ایف آئی آر', description: 'Filing police complaints' },
        { title: 'Bail Procedures', urdu: 'ضمانت', description: 'Types of bail and procedures' },
        { title: 'Criminal Trials', urdu: 'فوجداری مقدمات', description: 'Court proceedings and rights' },
        { title: 'Victim Rights', urdu: 'متاثرین کے حقوق', description: 'Protection and compensation' }
      ]
    }
  ];

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-[#E8F5ED] to-white pt-32 pb-20">
        <div className="container mx-auto px-6">
          {/* Header */}
          <div className="text-center mb-16 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#1FAA59]/10 rounded-full mb-6">
              <Scale className="w-5 h-5 text-[#1FAA59]" />
              <span className="text-[#0B3D2E]">Comprehensive Legal Knowledge</span>
            </div>
            <h1 className="text-5xl md:text-6xl text-[#0B3D2E] mb-6">
              Legal Topics
            </h1>
            <p className="text-xl text-[#0B3D2E]/70 mb-4 urdu-text">
              قانونی موضوعات
            </p>
            <p className="text-lg text-[#0B3D2E]/60 max-w-3xl mx-auto">
              Explore different areas of Pakistani law. Click on any topic to learn more about specific legal subjects.
            </p>
          </div>

          {/* Topics Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto mb-16">
            {topics.map((topic, index) => {
              const Icon = topic.icon;
              const isExpanded = selectedTopic === index;

              return (
                <div
                  key={index}
                  className="animate-fade-in-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div
                    className={`bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden cursor-pointer ${isExpanded ? 'ring-2 ring-[#1FAA59]' : ''
                      }`}
                    onClick={() => setSelectedTopic(isExpanded ? null : index)}
                  >
                    {/* Topic Header */}
                    <div className={`bg-gradient-to-br ${topic.color} p-6`}>
                      <Icon className="w-12 h-12 text-white mb-4" />
                      <h3 className="text-2xl text-white mb-2">{topic.title}</h3>
                      <p className="text-white/90 urdu-text" style={{ fontSize: '1.1rem' }}>
                        {topic.titleUrdu}
                      </p>
                    </div>

                    {/* Subtopics */}
                    <div className={`transition-all duration-500 ${isExpanded ? 'max-h-[600px]' : 'max-h-0'}`}>
                      <div className="p-6 space-y-4">
                        {topic.subtopics.map((subtopic, subIndex) => (
                          <div
                            key={subIndex}
                            className="flex items-start gap-3 p-4 rounded-lg bg-[#F8F9FA] hover:bg-[#E8F5ED] transition-all duration-300 group"
                          >
                            <ChevronRight className="w-5 h-5 text-[#1FAA59] flex-shrink-0 mt-1 group-hover:translate-x-1 transition-transform" />
                            <div>
                              <h4 className="text-[#0B3D2E] mb-1">{subtopic.title}</h4>
                              <p className="text-sm text-[#0B3D2E]/70 mb-2 urdu-text">{subtopic.urdu}</p>
                              <p className="text-xs text-[#0B3D2E]/50">{subtopic.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Click Indicator */}
                    {!isExpanded && (
                      <div className="px-6 py-4 bg-[#F8F9FA] border-t border-[#0B3D2E]/10">
                        <p className="text-sm text-[#0B3D2E]/60 text-center">Click to explore subtopics</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Knowledge Base Section (approved entries from the backend) */}
          <div className="max-w-7xl mx-auto mb-16">
            <div className="text-center mb-8">
              <h2 className="text-3xl text-[#0B3D2E] mb-2">Legal Knowledge Base</h2>
              <p className="text-[#0B3D2E]/70 urdu-text">قانونی معلومات کا ذخیرہ</p>
            </div>

            {isLoadingKb ? (
              <div className="flex items-center justify-center py-12">
                <Loader className="w-8 h-8 text-[#1FAA59] animate-spin" />
                <span className="ml-3 text-[#0B3D2E]/70">Loading knowledge base...</span>
              </div>
            ) : uploadedDocuments.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {uploadedDocuments.map((entry, index) => (
                  <div
                    key={entry.id}
                    className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden animate-fade-in-up"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="bg-gradient-to-br from-[#0B3D2E] to-[#1FAA59] p-6">
                      <div className="flex items-start justify-between mb-3">
                        <span className="px-3 py-1 bg-white/20 text-white text-xs rounded-full">
                          {entry.category}
                        </span>
                        <FileText className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-xl text-white mb-2">{entry.title}</h3>
                      <p className="text-white/90 urdu-text">{entry.titleUrdu}</p>
                    </div>

                    <div className="p-6">
                      {entry.descriptionUrdu && (
                        <p className="text-[#0B3D2E]/70 urdu-text text-sm mb-3 text-right" style={{ lineHeight: '1.8' }}>
                          {entry.descriptionUrdu}
                        </p>
                      )}
                      <p className="text-[#0B3D2E]/80 text-sm">
                        {entry.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                <FileText className="w-14 h-14 text-[#0B3D2E]/20 mx-auto mb-4" />
                <p className="text-[#0B3D2E]/60">No knowledge base entries published yet.</p>
              </div>
            )}
          </div>

          {/* CTA Section */}
          <div className="mt-16 text-center bg-white rounded-3xl p-12 shadow-xl max-w-4xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
            <h2 className="text-3xl text-[#0B3D2E] mb-4">Can't Find What You're Looking For?</h2>
            <p className="text-[#0B3D2E]/70 mb-8">Ask our AI assistant directly for personalized legal information.</p>
            <button className="px-8 py-4 bg-gradient-to-r from-[#1FAA59] to-[#0B3D2E] text-white rounded-xl hover:shadow-xl transition-all duration-300 hover:scale-105">
              Ask a Question Now
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}