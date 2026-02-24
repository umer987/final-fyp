import React, { useState } from 'react';
import { Brain, AlertTriangle, Check, X, TrendingUp, TrendingDown, Shield, Activity } from 'lucide-react';

interface AIResponse {
  id: number;
  query: string;
  queryUrdu: string;
  response: string;
  responseUrdu: string;
  confidence: number;
  urduNLPScore: number;
  timestamp: string;
  status: 'approved' | 'flagged' | 'review';
  category: string;
}

export function AIMonitoring() {
  const [filterStatus, setFilterStatus] = useState('all');

  const aiResponses: AIResponse[] = [
    {
      id: 1,
      query: 'What is the procedure for divorce in Pakistan?',
      queryUrdu: 'پاکستان میں طلاق کا طریقہ کار کیا ہے؟',
      response: 'In Pakistan, divorce procedures are governed by Muslim Family Laws Ordinance 1961...',
      responseUrdu: 'پاکستان میں طلاق کے طریقہ کار مسلم فیملی لاز آرڈیننس 1961 کے تحت...',
      confidence: 94,
      urduNLPScore: 92,
      timestamp: '2024-01-07 10:30:00',
      status: 'approved',
      category: 'Family Law'
    },
    {
      id: 2,
      query: 'How to register a property in Islamabad?',
      queryUrdu: 'اسلام آباد میں جائیداد کی رجسٹریشن کیسے کریں؟',
      response: 'Property registration in Islamabad requires documents including sale deed...',
      responseUrdu: 'اسلام آباد میں جائیداد کی رجسٹریشن کے لیے فروخت نامہ کی ضرورت...',
      confidence: 56,
      urduNLPScore: 58,
      timestamp: '2024-01-07 09:15:00',
      status: 'flagged',
      category: 'Property Law'
    },
    {
      id: 3,
      query: 'What are employee rights under labour law?',
      queryUrdu: 'مزدور قانون کے تحت ملازم کے حقوق کیا ہیں؟',
      response: 'Under the Industrial Relations Act 2012, employees have rights to...',
      responseUrdu: 'صنعتی تعلقات ایکٹ 2012 کے تحت ملازمین کو حق حاصل ہے...',
      confidence: 88,
      urduNLPScore: 85,
      timestamp: '2024-01-07 08:45:00',
      status: 'approved',
      category: 'Labour Law'
    },
    {
      id: 4,
      query: 'Company registration process in Pakistan?',
      queryUrdu: 'پاکستان میں کمپنی کی رجسٹریشن کا عمل؟',
      response: 'Companies Act 2017 outlines the registration process which requires...',
      responseUrdu: 'کمپنیز ایکٹ 2017 رجسٹریشن کا عمل بیان کرتا ہے...',
      confidence: 72,
      urduNLPScore: 68,
      timestamp: '2024-01-07 08:00:00',
      status: 'review',
      category: 'Business Law'
    },
    {
      id: 5,
      query: 'What is the punishment for theft in Pakistan?',
      queryUrdu: 'پاکستان میں چوری کی سزا کیا ہے؟',
      response: 'According to Pakistan Penal Code Section 379, theft is punishable...',
      responseUrdu: 'پاکستان پینل کوڈ سیکشن 379 کے مطابق چوری کی سزا...',
      confidence: 91,
      urduNLPScore: 89,
      timestamp: '2024-01-07 07:30:00',
      status: 'approved',
      category: 'Criminal Law'
    },
    {
      id: 6,
      query: 'Inheritance law for daughters in Pakistan?',
      queryUrdu: 'پاکستان میں بیٹیوں کے لیے وراثت کا قانون؟',
      response: 'Under Islamic inheritance law, daughters are entitled to half the share...',
      responseUrdu: 'اسلامی وراثت کے قانون کے تحت بیٹیوں کو آدھا حصہ...',
      confidence: 48,
      urduNLPScore: 52,
      timestamp: '2024-01-07 06:45:00',
      status: 'flagged',
      category: 'Family Law'
    }
  ];

  const filteredResponses = aiResponses.filter(response => {
    if (filterStatus === 'all') return true;
    return response.status === filterStatus;
  });

  const getStatusBadge = (status: string) => {
    const styles = {
      approved: 'bg-green-100 text-green-700',
      flagged: 'bg-red-100 text-red-700',
      review: 'bg-orange-100 text-orange-700'
    };
    const icons = {
      approved: Check,
      flagged: AlertTriangle,
      review: Activity
    };
    const Icon = icons[status as keyof typeof icons];
    
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs ${styles[status as keyof typeof styles]}`}>
        <Icon className="w-3 h-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const getConfidenceBg = (score: number) => {
    if (score >= 80) return 'bg-green-600';
    if (score >= 60) return 'bg-orange-600';
    return 'bg-red-600';
  };

  const avgConfidence = Math.round(aiResponses.reduce((sum, r) => sum + r.confidence, 0) / aiResponses.length);
  const avgUrduScore = Math.round(aiResponses.reduce((sum, r) => sum + r.urduNLPScore, 0) / aiResponses.length);
  const flaggedCount = aiResponses.filter(r => r.status === 'flagged').length;
  const approvedCount = aiResponses.filter(r => r.status === 'approved').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl text-[#0B3D2E] mb-2">AI Response Review & Monitoring</h2>
        <p className="text-[#0B3D2E]/60 urdu-text">AI کا جائزہ اور نگرانی</p>
      </div>

      {/* AI Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Brain className="w-6 h-6 text-blue-600" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <h4 className="text-[#0B3D2E]/70 text-sm mb-2">Avg AI Confidence</h4>
          <p className="text-3xl text-[#0B3D2E]">{avgConfidence}%</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Activity className="w-6 h-6 text-purple-600" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <h4 className="text-[#0B3D2E]/70 text-sm mb-2">Urdu NLP Score</h4>
          <p className="text-3xl text-[#0B3D2E]">{avgUrduScore}%</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <Check className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <h4 className="text-[#0B3D2E]/70 text-sm mb-2">Approved</h4>
          <p className="text-3xl text-[#0B3D2E]">{approvedCount}</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <h4 className="text-[#0B3D2E]/70 text-sm mb-2">Flagged</h4>
          <p className="text-3xl text-[#0B3D2E]">{flaggedCount}</p>
        </div>
      </div>

      {/* Confidence Threshold Alert */}
      <div className="bg-orange-50 border-l-4 border-orange-500 p-6 rounded-xl">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
          <div>
            <h4 className="text-lg text-[#0B3D2E] mb-2">Low Confidence Alert</h4>
            <p className="text-[#0B3D2E]/70 text-sm">
              Responses with confidence below 60% are automatically flagged for manual review. 
              These require expert verification before being shown to users.
            </p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-2xl shadow-lg p-2 inline-flex gap-2">
        <button
          onClick={() => setFilterStatus('all')}
          className={`px-6 py-3 rounded-xl transition-all duration-300 ${
            filterStatus === 'all'
              ? 'bg-gradient-to-r from-[#1FAA59] to-[#0B3D2E] text-white'
              : 'text-[#0B3D2E] hover:bg-gray-100'
          }`}
        >
          All ({aiResponses.length})
        </button>
        <button
          onClick={() => setFilterStatus('approved')}
          className={`px-6 py-3 rounded-xl transition-all duration-300 ${
            filterStatus === 'approved'
              ? 'bg-green-100 text-green-700'
              : 'text-[#0B3D2E] hover:bg-gray-100'
          }`}
        >
          Approved ({approvedCount})
        </button>
        <button
          onClick={() => setFilterStatus('flagged')}
          className={`px-6 py-3 rounded-xl transition-all duration-300 ${
            filterStatus === 'flagged'
              ? 'bg-red-100 text-red-700'
              : 'text-[#0B3D2E] hover:bg-gray-100'
          }`}
        >
          Flagged ({flaggedCount})
        </button>
        <button
          onClick={() => setFilterStatus('review')}
          className={`px-6 py-3 rounded-xl transition-all duration-300 ${
            filterStatus === 'review'
              ? 'bg-orange-100 text-orange-700'
              : 'text-[#0B3D2E] hover:bg-gray-100'
          }`}
        >
          Under Review ({aiResponses.filter(r => r.status === 'review').length})
        </button>
      </div>

      {/* AI Responses List */}
      <div className="space-y-4">
        {filteredResponses.map((response, index) => (
          <div
            key={response.id}
            className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 animate-fade-in-up"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-3 py-1 bg-[#1FAA59]/10 text-[#0B3D2E] rounded-lg text-sm">
                    {response.category}
                  </span>
                  {getStatusBadge(response.status)}
                  <span className="text-xs text-[#0B3D2E]/50">#{response.id}</span>
                </div>
                <p className="text-xs text-[#0B3D2E]/50">{response.timestamp}</p>
              </div>
            </div>

            {/* Query */}
            <div className="mb-4 p-4 bg-[#E8F5ED] rounded-xl">
              <h4 className="text-sm text-[#0B3D2E]/70 mb-2">User Query:</h4>
              <p className="text-[#0B3D2E] mb-2">{response.query}</p>
              <p className="text-[#0B3D2E] urdu-text text-right">{response.queryUrdu}</p>
            </div>

            {/* Response */}
            <div className="mb-4 p-4 bg-gray-50 rounded-xl">
              <h4 className="text-sm text-[#0B3D2E]/70 mb-2">AI Response:</h4>
              <p className="text-[#0B3D2E] mb-2">{response.response}</p>
              <p className="text-[#0B3D2E] urdu-text text-right">{response.responseUrdu}</p>
            </div>

            {/* Confidence Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-[#0B3D2E]/70">AI Confidence Level</span>
                  <span className={`text-lg ${getConfidenceColor(response.confidence)}`}>
                    {response.confidence}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full ${getConfidenceBg(response.confidence)}`}
                    style={{ width: `${response.confidence}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-[#0B3D2E]/70">Urdu NLP Match Score</span>
                  <span className={`text-lg ${getConfidenceColor(response.urduNLPScore)}`}>
                    {response.urduNLPScore}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full ${getConfidenceBg(response.urduNLPScore)}`}
                    style={{ width: `${response.urduNLPScore}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Manual Override Actions */}
            <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
              <span className="text-sm text-[#0B3D2E]/70 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Manual Override:
              </span>
              <button className="px-4 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors flex items-center gap-2">
                <Check className="w-4 h-4" />
                Approve
              </button>
              <button className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors flex items-center gap-2">
                <X className="w-4 h-4" />
                Reject
              </button>
              <button className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Request Review
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* No Results */}
      {filteredResponses.length === 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <Brain className="w-16 h-16 text-[#0B3D2E]/20 mx-auto mb-4" />
          <h3 className="text-xl text-[#0B3D2E] mb-2">No responses in this category</h3>
          <p className="text-[#0B3D2E]/60">Try selecting a different filter</p>
        </div>
      )}
    </div>
  );
}
