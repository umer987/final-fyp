import React, { useState, useEffect, useMemo } from 'react';
import { Search, MessageSquare, Star, Eye, Trash2, Check, AlertCircle, X, Loader } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { api, type QueryRecord } from '../../lib/api';

export function UserQueriesFeedback() {
  const [queries, setQueries] = useState<QueryRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedQuery, setSelectedQuery] = useState<QueryRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.getQueries()
      .then(({ queries: data }) => setQueries(data))
      .catch((err) => {
        const message = err instanceof Error ? err.message : 'Failed to load queries';
        toast.error(`Could not load queries: ${message}`);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleStatusChange = async (id: string, status: QueryRecord['status']) => {
    const current = queries.find((query) => query.id === id);
    if (!current) return;

    try {
      const { query } = await api.updateQuery(id, { ...current, status });
      setQueries((prev) => prev.map((item) => (item.id === id ? query : item)));
      toast.success(`Query status updated to ${status}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update query';
      toast.error(message);
    }
  };

  const handleDeleteQuery = async (id: string) => {
    if (!confirm('Are you sure you want to delete this query?')) return;
    try {
      await api.deleteQuery(id);
      setQueries((prev) => prev.filter((query) => query.id !== id));
      toast.success('Query deleted successfully');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete query';
      toast.error(message);
    }
  };

  const filteredQueries = queries.filter((query) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      query.question.toLowerCase().includes(q) ||
      query.userName.toLowerCase().includes(q) ||
      query.category.toLowerCase().includes(q);
    const matchesType = filterType === 'all' || query.queryType === filterType;
    const matchesStatus = filterStatus === 'all' || query.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const stats = useMemo(
    () => ({
      total: queries.length,
      pending: queries.filter((q) => q.status === 'pending').length,
      resolved: queries.filter((q) => q.status === 'resolved').length,
      flagged: queries.filter((q) => q.status === 'flagged').length,
      avgRating:
        queries.length > 0
          ? (queries.reduce((sum, q) => sum + q.rating, 0) / queries.length).toFixed(1)
          : '0.0',
      voiceQueries: queries.filter((q) => q.queryType === 'voice').length,
      textQueries: queries.filter((q) => q.queryType === 'text').length,
    }),
    [queries],
  );

  const getStatusBadge = (status: QueryRecord['status']) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-700',
      resolved: 'bg-green-100 text-green-700',
      flagged: 'bg-red-100 text-red-700',
    };
    return styles[status] || styles.pending;
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 85) return 'text-green-600';
    if (confidence >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-8 h-8 text-[#1FAA59] animate-spin" />
        <span className="ml-3 text-[#0B3D2E]/70">Loading queries...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl text-[#0B3D2E] mb-2">User Queries & Feedback</h2>
        <p className="text-[#0B3D2E]/60 urdu-text">صارفین کے سوالات اور رائے</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h4 className="text-[#0B3D2E]/70 text-sm mb-2">Total Queries</h4>
          <p className="text-3xl text-[#0B3D2E]">{stats.total}</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h4 className="text-[#0B3D2E]/70 text-sm mb-2">Pending</h4>
          <p className="text-3xl text-yellow-600">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h4 className="text-[#0B3D2E]/70 text-sm mb-2">Voice</h4>
          <p className="text-3xl text-[#0B3D2E]">{stats.voiceQueries}</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h4 className="text-[#0B3D2E]/70 text-sm mb-2">Text</h4>
          <p className="text-3xl text-[#0B3D2E]">{stats.textQueries}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#0B3D2E]/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search queries..."
              className="w-full pl-12 pr-4 py-3 bg-[#F8F9FA] rounded-xl outline-none focus:ring-2 focus:ring-[#1FAA59]"
            />
          </div>
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

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#0B3D2E]/10">
                <th className="text-left px-4 py-3 text-[#0B3D2E]/70 text-sm">User</th>
                <th className="text-left px-4 py-3 text-[#0B3D2E]/70 text-sm">Question</th>
                <th className="text-left px-4 py-3 text-[#0B3D2E]/70 text-sm">Type</th>
                <th className="text-left px-4 py-3 text-[#0B3D2E]/70 text-sm">Status</th>
                <th className="text-left px-4 py-3 text-[#0B3D2E]/70 text-sm">Confidence</th>
                <th className="text-left px-4 py-3 text-[#0B3D2E]/70 text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredQueries.map((query) => (
                <tr key={query.id} className="border-b border-[#0B3D2E]/5 hover:bg-[#F8F9FA]">
                  <td className="px-4 py-4">
                    <p className="text-[#0B3D2E] text-sm font-medium">{query.userName}</p>
                    <p className="text-[#0B3D2E]/50 text-xs">{query.userEmail}</p>
                  </td>
                  <td className="px-4 py-4 text-sm text-[#0B3D2E] max-w-xs truncate">{query.question}</td>
                  <td className="px-4 py-4 text-sm capitalize">{query.queryType}</td>
                  <td className="px-4 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs ${getStatusBadge(query.status)}`}>
                      {query.status}
                    </span>
                  </td>
                  <td className={`px-4 py-4 text-sm font-medium ${getConfidenceColor(query.confidence)}`}>
                    {query.confidence}%
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedQuery(query)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="View details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleStatusChange(query.id, 'resolved')}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                        title="Mark resolved"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteQuery(query.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedQuery && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl text-[#0B3D2E]">Query Details</h3>
              <button onClick={() => setSelectedQuery(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4 text-sm">
              <p><strong>User:</strong> {selectedQuery.userName} ({selectedQuery.userEmail})</p>
              <p><strong>Category:</strong> {selectedQuery.category}</p>
              <p><strong>Question:</strong> {selectedQuery.question}</p>
              <p><strong>AI Response:</strong> {selectedQuery.aiResponse}</p>
              <p><strong>Confidence:</strong> {selectedQuery.confidence}%</p>
              <p><strong>Timestamp:</strong> {new Date(selectedQuery.timestamp).toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
