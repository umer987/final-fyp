import React, { useState } from 'react';
import { Search, Plus, Edit, Check, X, AlertTriangle, Filter } from 'lucide-react';

interface LegalEntry {
  id: number;
  category: string;
  section: string;
  urduSummary: string;
  englishSummary: string;
  status: 'approved' | 'pending' | 'review';
  lastUpdated: string;
}

export function LegalKnowledgeBase() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const legalEntries: LegalEntry[] = [
    {
      id: 1,
      category: 'Family Law',
      section: 'Muslim Family Laws Ordinance 1961',
      urduSummary: 'خاندانی قوانین کے تحت طلاق کے احکام اور طریقہ کار',
      englishSummary: 'Divorce rules and procedures under family law ordinance',
      status: 'approved',
      lastUpdated: '2024-01-05'
    },
    {
      id: 2,
      category: 'Property Law',
      section: 'Transfer of Property Act 1882 - Section 54',
      urduSummary: 'جائیداد کی منتقلی کے قوانین اور دستاویزات',
      englishSummary: 'Property transfer laws and documentation requirements',
      status: 'approved',
      lastUpdated: '2024-01-04'
    },
    {
      id: 3,
      category: 'Criminal Law',
      section: 'Pakistan Penal Code - Section 302',
      urduSummary: 'قتل کی سزا اور قانونی کارروائی',
      englishSummary: 'Murder punishment and legal proceedings',
      status: 'pending',
      lastUpdated: '2024-01-03'
    },
    {
      id: 4,
      category: 'Business Law',
      section: 'Companies Act 2017 - Registration',
      urduSummary: 'کمپنی کی رجسٹریشن کا طریقہ کار',
      englishSummary: 'Company registration procedures and requirements',
      status: 'review',
      lastUpdated: '2024-01-02'
    },
    {
      id: 5,
      category: 'Civil Law',
      section: 'Contract Act 1872 - Section 10',
      urduSummary: 'معاہدے کی قانونی حیثیت اور شرائط',
      englishSummary: 'Legal validity of contracts and conditions',
      status: 'approved',
      lastUpdated: '2024-01-01'
    },
    {
      id: 6,
      category: 'Labour Law',
      section: 'Industrial Relations Act 2012',
      urduSummary: 'مزدور کے حقوق اور ملازمت کے قوانین',
      englishSummary: 'Worker rights and employment laws',
      status: 'pending',
      lastUpdated: '2023-12-30'
    }
  ];

  const filteredEntries = legalEntries.filter(entry => {
    const matchesSearch = entry.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         entry.section.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         entry.urduSummary.includes(searchQuery) ||
                         entry.englishSummary.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || entry.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const styles = {
      approved: 'bg-green-100 text-green-700',
      pending: 'bg-yellow-100 text-yellow-700',
      review: 'bg-orange-100 text-orange-700'
    };
    const icons = {
      approved: Check,
      pending: AlertTriangle,
      review: Edit
    };
    const Icon = icons[status as keyof typeof icons];
    
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs ${styles[status as keyof typeof styles]}`}>
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
        <button className="px-6 py-3 bg-gradient-to-r from-[#1FAA59] to-[#0B3D2E] text-white rounded-xl hover:shadow-lg transition-all duration-300 flex items-center gap-2">
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
              All legal content must be verified by qualified legal professionals. Information provided is for general guidance only and does not constitute legal advice.
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
              placeholder="Search by category, section, or content..."
              className="w-full pl-12 pr-4 py-3 bg-[#F8F9FA] rounded-xl outline-none focus:ring-2 focus:ring-[#1FAA59] transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-[#0B3D2E]/60" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-3 bg-[#F8F9FA] rounded-xl outline-none focus:ring-2 focus:ring-[#1FAA59] transition-all"
            >
              <option value="all">All Status</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="review">Under Review</option>
            </select>
          </div>
        </div>

        <div className="mt-4 text-sm text-[#0B3D2E]/60">
          Showing {filteredEntries.length} of {legalEntries.length} entries
        </div>
      </div>

      {/* Legal Entries Table */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-[#0B3D2E] to-[#1FAA59]">
              <tr>
                <th className="px-6 py-4 text-left text-white text-sm">Law Category</th>
                <th className="px-6 py-4 text-left text-white text-sm">Section</th>
                <th className="px-6 py-4 text-left text-white text-sm">Urdu Summary</th>
                <th className="px-6 py-4 text-left text-white text-sm">English Summary</th>
                <th className="px-6 py-4 text-left text-white text-sm">Status</th>
                <th className="px-6 py-4 text-left text-white text-sm">Last Updated</th>
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
                    <span className="inline-flex px-3 py-1 bg-[#1FAA59]/10 text-[#0B3D2E] rounded-lg text-sm">
                      {entry.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[#0B3D2E] text-sm max-w-xs">
                    {entry.section}
                  </td>
                  <td className="px-6 py-4 text-[#0B3D2E]/70 text-sm max-w-xs urdu-text">
                    {entry.urduSummary}
                  </td>
                  <td className="px-6 py-4 text-[#0B3D2E]/70 text-sm max-w-xs">
                    {entry.englishSummary}
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(entry.status)}
                  </td>
                  <td className="px-6 py-4 text-[#0B3D2E]/60 text-sm">
                    {new Date(entry.lastUpdated).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="p-2 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg transition-colors">
                        <Check className="w-4 h-4" />
                      </button>
                      <button className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-[#0B3D2E]/70">Total Entries</h4>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Check className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <p className="text-3xl text-[#0B3D2E]">{legalEntries.length}</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-[#0B3D2E]/70">Approved</h4>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Check className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <p className="text-3xl text-[#0B3D2E]">
            {legalEntries.filter(e => e.status === 'approved').length}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-[#0B3D2E]/70">Pending Review</h4>
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
          <p className="text-3xl text-[#0B3D2E]">
            {legalEntries.filter(e => e.status === 'pending' || e.status === 'review').length}
          </p>
        </div>
      </div>
    </div>
  );
}
