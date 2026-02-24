import React, { useState, useEffect } from 'react';
import { Search, MessageSquare, Star, Filter, Eye, Trash2, Reply, Check, AlertCircle, ThumbsUp, ThumbsDown } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface Query {
  id: string;
  userName: string;
  userEmail: string;
  queryType: 'voice' | 'text';
  category: string;
  question: string;
  questionUrdu?: string;
  aiResponse: string;
  aiResponseUrdu?: string;
  rating: number;
  feedback?: string;
  status: 'pending' | 'resolved' | 'flagged';
  timestamp: string;
  confidence: number;
}

export function UserQueriesFeedback() {
  const [queries, setQueries] = useState<Query[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedQuery, setSelectedQuery] = useState<Query | null>(null);

  // Load queries from localStorage
  useEffect(() => {
    const storedQueries = localStorage.getItem('user_queries');
    if (storedQueries) {
      setQueries(JSON.parse(storedQueries));
    } else {
      // Sample data
      const sampleQueries: Query[] = [
        {
          id: '1',
          userName: 'Ahmed Khan',
          userEmail: 'ahmed@example.com',
          queryType: 'voice',
          category: 'Family Law',
          question: 'What is the procedure for divorce in Pakistan?',
          questionUrdu: 'پاکستان میں طلاق کا طریقہ کار کیا ہے؟',
          aiResponse: 'Under the Muslim Family Laws Ordinance 1961, the husband must send a written notice to the Chairman of the Union Council...',
          aiResponseUrdu: 'مسلم عائلی قوانین آرڈیننس 1961 کے تحت، شوہر کو یونین کونسل کے چیئرمن کو تحریری نوٹس بھیجنا ہوگا...',
          rating: 5,
          feedback: 'Very helpful and clear explanation',
          status: 'resolved',
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          confidence: 92
        },
        {
          id: '2',
          userName: 'Fatima Noor',
          userEmail: 'fatima@example.com',
          queryType: 'text',
          category: 'Property Law',
          question: 'How do I transfer property to my son?',
          questionUrdu: 'میں اپنے بیٹے کو جائیداد کیسے منتقل کروں؟',
          aiResponse: 'Property transfer can be done through a gift deed (Hiba) or sale deed. You need to prepare proper documentation...',
          aiResponseUrdu: 'جائیداد کی منتقلی ہبہ کی دید یا بیع نامہ کے ذریعے کی جا سکتی ہے۔ آپ کو مناسب دستاویزات تیار کرنی ہوں گی...',
          rating: 4,
          status: 'resolved',
          timestamp: new Date(Date.now() - 172800000).toISOString(),
          confidence: 88
        },
        {
          id: '3',
          userName: 'Ali Hassan',
          userEmail: 'ali@example.com',
          queryType: 'voice',
          category: 'Criminal Law',
          question: 'Can I file FIR online?',
          questionUrdu: 'کیا میں آن لائن ایف آئی آر درج کرا سکتا ہوں؟',
          aiResponse: 'Some provinces in Pakistan now allow online FIR registration. You can visit the respective police website...',
          aiResponseUrdu: 'پاکستان کے کچھ صوبے اب آن لائن ایف آئی آر رجسٹریشن کی اجازت دیتے ہیں۔ آپ متعلقہ پولیس ویب سائٹ دیکھ سکتے ہیں...',
          rating: 3,
          feedback: 'Information was okay but not specific to my location',
          status: 'pending',
          timestamp: new Date(Date.now() - 259200000).toISOString(),
          confidence: 75
        },
        {
          id: '4',
          userName: 'Sara Ahmad',
          userEmail: 'sara@example.com',
          queryType: 'text',
          category: 'Business Law',
          question: 'What are the requirements for company registration?',
          questionUrdu: 'کمپنی رجسٹریشن کے لیے کیا ضروریات ہیں؟',
          aiResponse: 'To register a company in Pakistan, you need to file incorporation documents with SECP...',
          aiResponseUrdu: 'پاکستان میں کمپنی رجسٹر کرنے کے لیے، آپ کو SECP کے ساتھ انکارپوریشن دستاویزات جمع کرانی ہوں گی...',
          rating: 5,
          feedback: 'Excellent detailed response',
          status: 'resolved',
          timestamp: new Date(Date.now() - 345600000).toISOString(),
          confidence: 95
        },
        {
          id: '5',
          userName: 'Usman Malik',
          userEmail: 'usman@example.com',
          queryType: 'voice',
          category: 'Traffic Law',
          question: 'What is the fine for overspeeding?',
          questionUrdu: 'تیز رفتاری کا جرمانہ کیا ہے؟',
          aiResponse: 'The fine for overspeeding varies by province and the extent of violation...',
          aiResponseUrdu: 'تیز رفتاری کا جرمانہ صوبے اور خلاف ورزی کی حد کے لحاظ سے مختلف ہوتا ہے...',
          rating: 2,
          feedback: 'Response was too vague',
          status: 'flagged',
          timestamp: new Date(Date.now() - 432000000).toISOString(),
          confidence: 68
        }
      ];
      setQueries(sampleQueries);
      localStorage.setItem('user_queries', JSON.stringify(sampleQueries));
    }
  }, []);

  // Save to localStorage whenever queries change
  useEffect(() => {
    if (queries.length > 0) {
      localStorage.setItem('user_queries', JSON.stringify(queries));
    }
  }, [queries]);

  const handleStatusChange = (id: string, status: 'pending' | 'resolved' | 'flagged') => {
    const updatedQueries = queries.map(query =>
      query.id === id ? { ...query, status } : query
    );
    setQueries(updatedQueries);
    toast.success(`Query status updated to ${status}`);
  };

  const handleDeleteQuery = (id: string) => {
    if (confirm('Are you sure you want to delete this query?')) {
      setQueries(queries.filter(query => query.id !== id));
      toast.success('Query deleted successfully');
    }
  };

  const filteredQueries = queries.filter(query => {
    const matchesSearch = query.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         query.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         query.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || query.queryType === filterType;
    const matchesStatus = filterStatus === 'all' || query.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-700',
      resolved: 'bg-green-100 text-green-700',
      flagged: 'bg-red-100 text-red-700'
    };
    return styles[status as keyof typeof styles] || styles.pending;
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 85) return 'text-green-600';
    if (confidence >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const stats = {
    total: queries.length,
    pending: queries.filter(q => q.status === 'pending').length,
    resolved: queries.filter(q => q.status === 'resolved').length,
    flagged: queries.filter(q => q.status === 'flagged').length,
    avgRating: (queries.reduce((sum, q) => sum + q.rating, 0) / queries.length).toFixed(1),
    voiceQueries: queries.filter(q => q.queryType === 'voice').length,
    textQueries: queries.filter(q => q.queryType === 'text').length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl text-[#0B3D2E] mb-2">User Queries & Feedback</h2>
        <p className="text-[#0B3D2E]/60 urdu-text">صارفین کے سوالات اور رائے</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-lg">
          <p className="text-sm text-[#0B3D2E]/60 mb-1">Total Queries</p>
          <p className="text-2xl text-[#0B3D2E]">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-lg">
          <p className="text-sm text-[#0B3D2E]/60 mb-1">Pending</p>
          <p className="text-2xl text-yellow-600">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-lg">
          <p className="text-sm text-[#0B3D2E]/60 mb-1">Resolved</p>
          <p className="text-2xl text-green-600">{stats.resolved}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-lg">
          <p className="text-sm text-[#0B3D2E]/60 mb-1">Flagged</p>
          <p className="text-2xl text-red-600">{stats.flagged}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-lg">
          <p className="text-sm text-[#0B3D2E]/60 mb-1">Avg Rating</p>
          <p className="text-2xl text-[#0B3D2E] flex items-center gap-1">
            {stats.avgRating} <Star className="w-4 h-4 fill-[#C5A253] text-[#C5A253]" />
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-lg">
          <p className="text-sm text-[#0B3D2E]/60 mb-1">Voice</p>
          <p className="text-2xl text-[#0B3D2E]">{stats.voiceQueries}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-lg">
          <p className="text-sm text-[#0B3D2E]/60 mb-1">Text</p>
          <p className="text-2xl text-[#0B3D2E]">{stats.textQueries}</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#0B3D2E]/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by question, user, or category..."
              className="w-full pl-12 pr-4 py-3 bg-[#F8F9FA] rounded-xl outline-none focus:ring-2 focus:ring-[#1FAA59] transition-all"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-3 bg-[#F8F9FA] rounded-xl outline-none focus:ring-2 focus:ring-[#1FAA59]"
            >
              <option value="all">All Types</option>
              <option value="voice">Voice</option>
              <option value="text">Text</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-3 bg-[#F8F9FA] rounded-xl outline-none focus:ring-2 focus:ring-[#1FAA59]"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="resolved">Resolved</option>
              <option value="flagged">Flagged</option>
            </select>
          </div>
        </div>
        <div className="mt-4 text-sm text-[#0B3D2E]/60">
          Showing {filteredQueries.length} of {queries.length} queries
        </div>
      </div>

      {/* Queries List */}
      <div className="space-y-4">
        {filteredQueries.map((query, index) => (
          <div
            key={query.id}
            className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 animate-fade-in-up"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <div className="p-6">
              {/* Query Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#1FAA59] to-[#0B3D2E] rounded-full flex items-center justify-center text-white">
                      {query.userName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-lg text-[#0B3D2E]">{query.userName}</h3>
                      <p className="text-xs text-[#0B3D2E]/50">{query.userEmail}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs ${getStatusBadge(query.status)}`}>
                    {query.status.charAt(0).toUpperCase() + query.status.slice(1)}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs ${
                    query.queryType === 'voice' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {query.queryType === 'voice' ? '🎤 Voice' : '📝 Text'}
                  </span>
                </div>
              </div>

              {/* Category and Meta */}
              <div className="flex items-center gap-4 text-sm text-[#0B3D2E]/60 mb-4">
                <span className="px-3 py-1 bg-[#E8F5ED] text-[#0B3D2E] rounded-lg">
                  {query.category}
                </span>
                <span>{new Date(query.timestamp).toLocaleString()}</span>
                <span className={getConfidenceColor(query.confidence)}>
                  {query.confidence}% confidence
                </span>
              </div>

              {/* Question */}
              <div className="mb-4 p-4 bg-[#F8F9FA] rounded-xl">
                <p className="text-sm text-[#0B3D2E]/50 mb-1">Question:</p>
                <p className="text-[#0B3D2E] mb-2">{query.question}</p>
                {query.questionUrdu && (
                  <p className="text-[#0B3D2E]/70 urdu-text text-right">{query.questionUrdu}</p>
                )}
              </div>

              {/* AI Response Preview */}
              <div className="mb-4 p-4 bg-blue-50 rounded-xl">
                <p className="text-sm text-[#0B3D2E]/50 mb-1">AI Response:</p>
                <p className="text-[#0B3D2E] line-clamp-2">{query.aiResponse}</p>
              </div>

              {/* Rating and Feedback */}
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1">
                  <span className="text-sm text-[#0B3D2E]/60">Rating:</span>
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < query.rating ? 'fill-[#C5A253] text-[#C5A253]' : 'text-gray-300'
                      }`}
                    />
                  ))}
                  <span className="text-[#0B3D2E] ml-1">{query.rating}/5</span>
                </div>
                {query.feedback && (
                  <div className="flex-1 text-sm text-[#0B3D2E]/70">
                    💬 {query.feedback}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedQuery(query)}
                  className="flex-1 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  <span className="text-sm">View Details</span>
                </button>
                
                {query.status === 'pending' && (
                  <button
                    onClick={() => handleStatusChange(query.id, 'resolved')}
                    className="flex-1 px-4 py-2 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg transition-all flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    <span className="text-sm">Mark Resolved</span>
                  </button>
                )}
                
                {query.status !== 'flagged' && (
                  <button
                    onClick={() => handleStatusChange(query.id, 'flagged')}
                    className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-all flex items-center justify-center gap-2"
                  >
                    <AlertCircle className="w-4 h-4" />
                  </button>
                )}

                <button
                  onClick={() => handleDeleteQuery(query.id)}
                  className="px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredQueries.length === 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-16 text-center">
          <MessageSquare className="w-16 h-16 text-[#0B3D2E]/20 mx-auto mb-4" />
          <h3 className="text-2xl text-[#0B3D2E] mb-2">No Queries Found</h3>
          <p className="text-[#0B3D2E]/60">Try adjusting your search or filters</p>
        </div>
      )}

      {/* Detail Modal */}
      {selectedQuery && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-[#0B3D2E] to-[#1FAA59] p-6 flex items-center justify-between">
              <h3 className="text-2xl text-white">Query Details</h3>
              <button
                onClick={() => setSelectedQuery(null)}
                className="text-white hover:bg-white/20 p-2 rounded-lg transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* User Info */}
              <div>
                <h4 className="text-lg text-[#0B3D2E] mb-3">User Information</h4>
                <div className="bg-[#F8F9FA] rounded-xl p-4 space-y-2">
                  <p><span className="text-[#0B3D2E]/60">Name:</span> {selectedQuery.userName}</p>
                  <p><span className="text-[#0B3D2E]/60">Email:</span> {selectedQuery.userEmail}</p>
                  <p><span className="text-[#0B3D2E]/60">Type:</span> {selectedQuery.queryType}</p>
                  <p><span className="text-[#0B3D2E]/60">Category:</span> {selectedQuery.category}</p>
                  <p><span className="text-[#0B3D2E]/60">Time:</span> {new Date(selectedQuery.timestamp).toLocaleString()}</p>
                </div>
              </div>

              {/* Question */}
              <div>
                <h4 className="text-lg text-[#0B3D2E] mb-3">Question</h4>
                <div className="bg-[#F8F9FA] rounded-xl p-4">
                  <p className="text-[#0B3D2E] mb-3">{selectedQuery.question}</p>
                  {selectedQuery.questionUrdu && (
                    <p className="text-[#0B3D2E] urdu-text text-right pt-3 border-t border-[#0B3D2E]/10">
                      {selectedQuery.questionUrdu}
                    </p>
                  )}
                </div>
              </div>

              {/* AI Response */}
              <div>
                <h4 className="text-lg text-[#0B3D2E] mb-3">AI Response</h4>
                <div className="bg-blue-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`px-3 py-1 rounded-full text-xs ${getConfidenceColor(selectedQuery.confidence)} bg-white`}>
                      {selectedQuery.confidence}% Confidence
                    </span>
                  </div>
                  <p className="text-[#0B3D2E] mb-3">{selectedQuery.aiResponse}</p>
                  {selectedQuery.aiResponseUrdu && (
                    <p className="text-[#0B3D2E] urdu-text text-right pt-3 border-t border-[#0B3D2E]/10">
                      {selectedQuery.aiResponseUrdu}
                    </p>
                  )}
                </div>
              </div>

              {/* Feedback */}
              <div>
                <h4 className="text-lg text-[#0B3D2E] mb-3">User Feedback</h4>
                <div className="bg-[#F8F9FA] rounded-xl p-4">
                  <div className="flex items-center gap-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${
                          i < selectedQuery.rating ? 'fill-[#C5A253] text-[#C5A253]' : 'text-gray-300'
                        }`}
                      />
                    ))}
                    <span className="text-[#0B3D2E] ml-2">{selectedQuery.rating}/5</span>
                  </div>
                  {selectedQuery.feedback && (
                    <p className="text-[#0B3D2E]/70">{selectedQuery.feedback}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
