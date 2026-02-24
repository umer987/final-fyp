import React, { useState } from 'react';
import { Search, TrendingUp, BookOpen, FileText, Clock } from 'lucide-react';
import { Footer } from '../components/Footer';

export function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const trendingSearches = [
    'طلاق کا طریقہ کار',
    'وراثت کی تقسیم',
    'کرایہ دار کے حقوق',
    'نکاح نامہ',
    'FIR کیسے درج کروائیں',
    'جائیداد کی رجسٹری'
  ];

  const recentSearches = [
    'Divorce procedure in Pakistan',
    'Property inheritance laws',
    'Tenant rights and eviction',
    'Child custody rules'
  ];

  const handleSearch = () => {
    if (searchQuery.trim() === '') return;
    
    setIsSearching(true);
    
    // Simulate search
    setTimeout(() => {
      const mockResults = [
        {
          title: 'Muslim Family Law Ordinance 1961 - Divorce',
          titleUrdu: 'مسلم فیملی لاء آرڈیننس 1961 - طلاق',
          description: 'Complete guide to divorce procedures under Pakistani law including notice requirements, reconciliation period, and legal documentation.',
          category: 'Family Law'
        },
        {
          title: 'Divorce Notice to Union Council',
          titleUrdu: 'یونین کونسل کو طلاق کا نوٹس',
          description: 'Learn about the mandatory 90-day notice period and reconciliation procedures as required by law.',
          category: 'Family Law'
        },
        {
          title: 'Rights After Divorce - Maintenance and Mehr',
          titleUrdu: 'طلاق کے بعد حقوق - نفقہ اور مہر',
          description: 'Understanding financial rights including maintenance, dower (mehr), and child support after divorce.',
          category: 'Family Law'
        }
      ];
      setSearchResults(mockResults);
      setIsSearching(false);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-[#E8F5ED] to-white pt-32 pb-20">
        <div className="container mx-auto px-6">
          {/* Header */}
          <div className="text-center mb-12 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#1FAA59]/10 rounded-full mb-6">
              <Search className="w-5 h-5 text-[#1FAA59]" />
              <span className="text-[#0B3D2E]">Find Legal Information</span>
            </div>
            <h1 className="text-5xl md:text-6xl text-[#0B3D2E] mb-6">
              Search Legal Database
            </h1>
            <p className="text-xl text-[#0B3D2E]/70 mb-4 urdu-text">
              قانونی معلومات تلاش کریں
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-4xl mx-auto mb-12 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <div className="bg-white rounded-2xl shadow-xl p-4">
              <div className="flex gap-4">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Search for legal topics, laws, or procedures... (اردو میں بھی تلاش کر سکتے ہیں)"
                  className="flex-1 px-6 py-4 bg-[#F8F9FA] rounded-xl outline-none focus:ring-2 focus:ring-[#1FAA59] transition-all duration-300 urdu-text"
                />
                <button
                  onClick={handleSearch}
                  disabled={isSearching}
                  className="px-8 py-4 bg-gradient-to-r from-[#1FAA59] to-[#0B3D2E] text-white rounded-xl hover:shadow-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 flex items-center gap-2"
                >
                  <Search className="w-5 h-5" />
                  <span>Search</span>
                </button>
              </div>
            </div>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="max-w-4xl mx-auto mb-12 animate-fade-in-up">
              <div className="mb-6">
                <h2 className="text-2xl text-[#0B3D2E]">
                  Found {searchResults.length} results for "{searchQuery}"
                </h2>
              </div>
              <div className="space-y-4">
                {searchResults.map((result, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-[1.02] animate-fade-in-up"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-xl text-[#0B3D2E] mb-2">{result.title}</h3>
                        <p className="text-[#0B3D2E]/70 urdu-text mb-3">{result.titleUrdu}</p>
                        <p className="text-[#0B3D2E]/60 mb-3">{result.description}</p>
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 bg-[#1FAA59]/10 text-[#1FAA59] rounded-full text-sm">
                            {result.category}
                          </span>
                        </div>
                      </div>
                      <FileText className="w-8 h-8 text-[#1FAA59]/30 flex-shrink-0 ml-4" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Trending & Recent Searches */}
          {searchResults.length === 0 && (
            <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
              {/* Trending Searches */}
              <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                <div className="bg-white rounded-2xl p-8 shadow-lg">
                  <div className="flex items-center gap-3 mb-6">
                    <TrendingUp className="w-6 h-6 text-[#1FAA59]" />
                    <h3 className="text-2xl text-[#0B3D2E]">Trending Searches</h3>
                  </div>
                  <div className="space-y-3">
                    {trendingSearches.map((search, index) => (
                      <button
                        key={index}
                        onClick={() => setSearchQuery(search)}
                        className="w-full text-left px-4 py-3 bg-[#F8F9FA] hover:bg-[#E8F5ED] rounded-lg transition-all duration-300 text-[#0B3D2E] urdu-text group flex items-center justify-between"
                      >
                        <span>{search}</span>
                        <Search className="w-4 h-4 text-[#1FAA59] opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recent Searches */}
              <div className="animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                <div className="bg-white rounded-2xl p-8 shadow-lg">
                  <div className="flex items-center gap-3 mb-6">
                    <Clock className="w-6 h-6 text-[#C5A253]" />
                    <h3 className="text-2xl text-[#0B3D2E]">Recent Searches</h3>
                  </div>
                  <div className="space-y-3">
                    {recentSearches.map((search, index) => (
                      <button
                        key={index}
                        onClick={() => setSearchQuery(search)}
                        className="w-full text-left px-4 py-3 bg-[#F8F9FA] hover:bg-[#E8F5ED] rounded-lg transition-all duration-300 text-[#0B3D2E] group flex items-center justify-between"
                      >
                        <span>{search}</span>
                        <Search className="w-4 h-4 text-[#C5A253] opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Browse Categories */}
          <div className="max-w-4xl mx-auto mt-12 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="flex items-center gap-3 mb-6">
                <BookOpen className="w-6 h-6 text-[#1FAA59]" />
                <h3 className="text-2xl text-[#0B3D2E]">Browse by Category</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {['Family Law', 'Property Law', 'Civil Law', 'Criminal Law', 'Business Law', 'Traffic Law'].map((category, index) => (
                  <button
                    key={index}
                    className="px-4 py-3 bg-gradient-to-r from-[#1FAA59]/10 to-[#0B3D2E]/10 hover:from-[#1FAA59]/20 hover:to-[#0B3D2E]/20 text-[#0B3D2E] rounded-xl transition-all duration-300 hover:scale-105"
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
