import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Check, X, AlertTriangle, Filter, Loader, Trash2 } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import {
  api,
  type LegalEntry,
} from '../../lib/api';

const emptyForm = {
  category: '',
  section: '',
  urduSummary: '',
  englishSummary: '',
  status: 'pending' as LegalEntry['status'],
};

export function LegalKnowledgeBase() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | LegalEntry['status']>('all');
  const [entries, setEntries] = useState<LegalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });

  const loadEntries = () => {
    setIsLoading(true);
    api.getKnowledgeBase()
      .then(({ entries: data }) => setEntries(data))
      .catch(err => {
        const message = err instanceof Error ? err.message : 'Failed to load entries';
        toast.error(`Could not load knowledge base: ${message}`);
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadEntries();
  }, []);

  const openAdd = () => {
    setEditingId(null);
    setForm({ ...emptyForm });
    setShowModal(true);
  };

  const openEdit = (entry: LegalEntry) => {
    setEditingId(entry.id);
    setForm({
      category: entry.category,
      section: entry.section,
      urduSummary: entry.urduSummary,
      englishSummary: entry.englishSummary,
      status: entry.status,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setForm({ ...emptyForm });
  };

  const handleSave = async () => {
    if (!form.category || !form.section || !form.urduSummary || !form.englishSummary) {
      toast.error('Category, section, and both summaries are required');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        ...form,
        lastUpdated: new Date().toISOString().slice(0, 10),
      };
      if (editingId) {
        const { entry: updated } = await api.updateKnowledgeEntry(editingId, payload);
        setEntries(prev => prev.map(e => (e.id === editingId ? updated : e)));
        toast.success('Entry updated successfully');
      } else {
        const { entry: created } = await api.createKnowledgeEntry(payload);
        setEntries(prev => [created, ...prev]);
        toast.success('Entry created (pending approval)');
      }
      closeModal();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save entry';
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleApprove = async (id: string) => {
    const current = entries.find((entry) => entry.id === id);
    if (!current) return;
    try {
      const { entry: updated } = await api.updateKnowledgeEntry(id, {
        ...current,
        status: 'approved',
        lastUpdated: new Date().toISOString().slice(0, 10),
      });
      setEntries(prev => prev.map(e => (e.id === id ? updated : e)));
      toast.success('Entry approved');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to approve entry';
      toast.error(message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this entry?')) return;
    try {
      await api.deleteKnowledgeEntry(id);
      setEntries(prev => prev.filter(e => e.id !== id));
      toast.success('Entry deleted');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete entry';
      toast.error(message);
    }
  };

  const filteredEntries = entries.filter(entry => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      entry.section.toLowerCase().includes(q) ||
      entry.englishSummary.toLowerCase().includes(q) ||
      entry.urduSummary.includes(searchQuery) ||
      entry.category.toLowerCase().includes(q);
    const matchesStatus = filterStatus === 'all' || entry.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: LegalEntry['status']) => {
    const styles: Record<LegalEntry['status'], string> = {
      approved: 'bg-green-100 text-green-700',
      pending: 'bg-yellow-100 text-yellow-700',
      review: 'bg-orange-100 text-orange-700',
    };
    const Icon = status === 'approved' ? Check : AlertTriangle;
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs ${styles[status]}`}>
        <Icon className="w-3 h-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl text-[#0B3D2E] mb-2">Legal Knowledge Base</h2>
          <p className="text-[#0B3D2E]/60 urdu-text">قانونی معلومات کا ذخیرہ</p>
        </div>
        <button
          onClick={openAdd}
          className="px-6 py-3 bg-gradient-to-r from-[#1FAA59] to-[#0B3D2E] text-white rounded-xl hover:shadow-lg transition-all duration-300 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          <span>Add New Entry</span>
        </button>
      </div>

      {/* Legal Disclaimer */}
      <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6 rounded-xl">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
          <div>
            <h4 className="text-lg text-[#0B3D2E] mb-2">Legal Disclaimer</h4>
            <p className="text-[#0B3D2E]/70 text-sm mb-2">
              All legal content must be verified by qualified legal professionals. Only approved entries appear in the public knowledge base.
            </p>
            <p className="text-[#0B3D2E]/70 text-sm urdu-text">
              تمام قانونی مواد تصدیق شدہ قانونی ماہرین کی جانب سے جانچا جانا ضروری ہے۔
            </p>
          </div>
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
              placeholder="Search by title, category, or content..."
              className="w-full pl-12 pr-4 py-3 bg-[#F8F9FA] rounded-xl outline-none focus:ring-2 focus:ring-[#1FAA59] transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-[#0B3D2E]/60" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as 'all' | LegalEntry['status'])}
              className="px-4 py-3 bg-[#F8F9FA] rounded-xl outline-none focus:ring-2 focus:ring-[#1FAA59] transition-all"
            >
              <option value="all">All Status</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>

        <div className="mt-4 text-sm text-[#0B3D2E]/60">
          Showing {filteredEntries.length} of {entries.length} entries
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader className="w-8 h-8 text-[#1FAA59] animate-spin" />
          <span className="ml-3 text-[#0B3D2E]/70">Loading knowledge base...</span>
        </div>
      )}

      {/* Entries Table */}
      {!isLoading && (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-[#0B3D2E] to-[#1FAA59]">
                <tr>
                  <th className="px-6 py-4 text-left text-white text-sm">Category</th>
                  <th className="px-6 py-4 text-left text-white text-sm">English Title</th>
                  <th className="px-6 py-4 text-left text-white text-sm">Urdu Title</th>
                  <th className="px-6 py-4 text-left text-white text-sm">Urdu Summary</th>
                  <th className="px-6 py-4 text-left text-white text-sm">Status</th>
                  <th className="px-6 py-4 text-left text-white text-sm">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredEntries.map((entry, index) => (
                  <tr
                    key={entry.id}
                    className="hover:bg-[#E8F5ED] transition-colors animate-fade-in-up"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <td className="px-6 py-4">
                      <span className="inline-flex px-3 py-1 bg-[#1FAA59]/10 text-[#0B3D2E] rounded-lg text-sm capitalize">
                        {entry.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[#0B3D2E] text-sm max-w-xs">{entry.section}</td>
                    <td className="px-6 py-4 text-[#0B3D2E]/70 text-sm max-w-xs urdu-text text-right">{entry.urduSummary}</td>
                    <td className="px-6 py-4 text-[#0B3D2E]/70 text-sm max-w-xs">{entry.englishSummary}</td>
                    <td className="px-6 py-4">{getStatusBadge(entry.status)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(entry)}
                          className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
                          title="Edit entry"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleApprove(entry.id)}
                          className="p-2 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          title="Approve entry"
                          disabled={entry.status === 'approved'}
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(entry.id)}
                          className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                          title="Delete entry"
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

          {filteredEntries.length === 0 && (
            <div className="p-12 text-center text-[#0B3D2E]/60">No entries found.</div>
          )}
        </div>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-[#0B3D2E]/70">Total Entries</h4>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Check className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <p className="text-3xl text-[#0B3D2E]">{entries.length}</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-[#0B3D2E]/70">Approved</h4>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Check className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <p className="text-3xl text-[#0B3D2E]">{entries.filter(e => e.status === 'approved').length}</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-[#0B3D2E]/70">Pending Review</h4>
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
          <p className="text-3xl text-[#0B3D2E]">{entries.filter(e => e.status === 'pending').length}</p>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-[#0B3D2E] to-[#1FAA59] p-6 flex items-center justify-between">
              <h3 className="text-2xl text-white">{editingId ? 'Edit Entry' : 'Add New Entry'}</h3>
              <button onClick={closeModal} className="text-white hover:bg-white/20 p-2 rounded-lg transition-all">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[#0B3D2E] mb-2">Category *</label>
                <input
                  type="text"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  placeholder="e.g., Family Law"
                  className="w-full px-4 py-3 bg-[#F8F9FA] border border-[#0B3D2E]/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1FAA59]"
                />
              </div>

              <div>
                <label className="block text-[#0B3D2E] mb-2">Section / Title *</label>
                <input
                  type="text"
                  value={form.section}
                  onChange={(e) => setForm({ ...form, section: e.target.value })}
                  placeholder="e.g., Divorce procedure under the Muslim Family Laws Ordinance"
                  className="w-full px-4 py-3 bg-[#F8F9FA] border border-[#0B3D2E]/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1FAA59]"
                />
              </div>

              <div>
                <label className="block text-[#0B3D2E] mb-2">English Summary *</label>
                <textarea
                  value={form.englishSummary}
                  onChange={(e) => setForm({ ...form, englishSummary: e.target.value })}
                  rows={3}
                  placeholder="English summary of the legal information"
                  className="w-full px-4 py-3 bg-[#F8F9FA] border border-[#0B3D2E]/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1FAA59]"
                />
              </div>

              <div>
                <label className="block text-[#0B3D2E] mb-2 urdu-text">اردو خلاصہ *</label>
                <textarea
                  value={form.urduSummary}
                  onChange={(e) => setForm({ ...form, urduSummary: e.target.value })}
                  rows={3}
                  placeholder="اردو میں قانونی معلومات کا خلاصہ"
                  className="w-full px-4 py-3 bg-[#F8F9FA] border border-[#0B3D2E]/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1FAA59] urdu-text text-right"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={closeModal}
                  className="flex-1 px-6 py-3 bg-gray-100 text-[#0B3D2E] rounded-xl hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-[#1FAA59] to-[#0B3D2E] text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? 'Saving...' : editingId ? 'Update Entry' : 'Create Entry'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
