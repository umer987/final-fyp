import React, { useState, useEffect } from 'react';
import { Brain, Activity, MessageSquare, Mic, FileText, Loader, Clock } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { api, type QueryRecord } from '../../lib/api';

export function AIMonitoring() {
  const [filterSource, setFilterSource] = useState<'all' | 'voice' | 'text'>('all');
  const [queries, setQueries] = useState<QueryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api.getQueries()
      .then(({ queries: data }) => {
        if (!active) return;
        setQueries(data);
      })
      .catch((err) => {
        const message = err instanceof Error ? err.message : 'Failed to load monitoring data';
        if (active) toast.error(`Could not load AI monitoring: ${message}`);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const stats = {
    total: queries.length,
    last24h: queries.filter((q) => Date.now() - new Date(q.timestamp).getTime() < 24 * 60 * 60 * 1000).length,
    voice: queries.filter((q) => q.queryType === 'voice').length,
    text: queries.filter((q) => q.queryType === 'text').length,
  };

  const filteredResponses = queries.filter((q) => filterSource === 'all' || q.queryType === filterSource);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl text-[#0B3D2E] mb-2">AI Response Review & Monitoring</h2>
        <p className="text-[#0B3D2E]/60 urdu-text">AI کا جائزہ اور نگرانی</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h4 className="text-[#0B3D2E]/70 text-sm mb-2">Total Queries</h4>
          <p className="text-3xl text-[#0B3D2E]">{stats.total}</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h4 className="text-[#0B3D2E]/70 text-sm mb-2">Last 24 Hours</h4>
          <p className="text-3xl text-[#0B3D2E]">{stats.last24h}</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h4 className="text-[#0B3D2E]/70 text-sm mb-2">Voice Queries</h4>
          <p className="text-3xl text-[#0B3D2E]">{stats.voice}</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h4 className="text-[#0B3D2E]/70 text-sm mb-2">Text Queries</h4>
          <p className="text-3xl text-[#0B3D2E]">{stats.text}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="w-8 h-8 text-[#1FAA59] animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
          <div className="flex gap-2">
            {(['all', 'voice', 'text'] as const).map((source) => (
              <button
                key={source}
                onClick={() => setFilterSource(source)}
                className={`px-6 py-3 rounded-xl transition-all duration-300 capitalize ${
                  filterSource === source
                    ? 'bg-gradient-to-r from-[#1FAA59] to-[#0B3D2E] text-white'
                    : 'bg-[#F8F9FA] text-[#0B3D2E] hover:bg-[#E8F5ED]'
                }`}
              >
                {source}
              </button>
            ))}
          </div>

          {filteredResponses.map((query) => (
            <div key={query.id} className="border border-[#0B3D2E]/10 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                {query.queryType === 'voice' ? <Mic className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                <span className="text-sm text-[#0B3D2E]/60">{query.category}</span>
                <span className="text-sm text-[#1FAA59]">{query.confidence}% confidence</span>
              </div>
              <p className="text-[#0B3D2E] font-medium mb-2">{query.question}</p>
              <p className="text-[#0B3D2E]/70 text-sm">{query.aiResponse}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
