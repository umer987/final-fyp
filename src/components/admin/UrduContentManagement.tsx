import React, { useState, useEffect } from 'react';
import { Upload, FileText, Plus, Trash2, Eye, Edit, Check, X, AlertTriangle, Download } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface UrduDocument {
  id: string;
  title: string;
  titleUrdu: string;
  category: string;
  description: string;
  descriptionUrdu: string;
  fileName: string;
  fileSize: string;
  uploadDate: string;
  status: 'published' | 'draft' | 'pending';
  content?: string;
}

export function UrduContentManagement() {
  const [documents, setDocuments] = useState<UrduDocument[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDoc, setEditingDoc] = useState<UrduDocument | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const [formData, setFormData] = useState({
    title: '',
    titleUrdu: '',
    category: 'Family Law',
    description: '',
    descriptionUrdu: '',
    fileName: '',
    fileSize: '',
    content: ''
  });

  // Load documents from localStorage
  useEffect(() => {
    const storedDocs = localStorage.getItem('urdu_documents');
    if (storedDocs) {
      setDocuments(JSON.parse(storedDocs));
    } else {
      // Sample data
      const sampleDocs: UrduDocument[] = [
        {
          id: '1',
          title: 'Muslim Family Laws Ordinance 1961',
          titleUrdu: 'مسلم عائلی قوانین آرڈیننس 1961',
          category: 'Family Law',
          description: 'Complete guide to Muslim family laws in Pakistan',
          descriptionUrdu: 'پاکستان میں مسلم عائلی قوانین کی مکمل رہنمائی',
          fileName: 'family-laws-1961.pdf',
          fileSize: '2.5 MB',
          uploadDate: new Date().toISOString(),
          status: 'published'
        },
        {
          id: '2',
          title: 'Property Transfer Guidelines',
          titleUrdu: 'جائیداد کی منتقلی کے رہنما خطوط',
          category: 'Property Law',
          description: 'Step by step property transfer process',
          descriptionUrdu: 'جائیداد کی منتقلی کا قدم بہ قدم عمل',
          fileName: 'property-transfer.pdf',
          fileSize: '1.8 MB',
          uploadDate: new Date().toISOString(),
          status: 'published'
        }
      ];
      setDocuments(sampleDocs);
      localStorage.setItem('urdu_documents', JSON.stringify(sampleDocs));
    }
  }, []);

  // Save to localStorage whenever documents change
  useEffect(() => {
    if (documents.length > 0) {
      localStorage.setItem('urdu_documents', JSON.stringify(documents));
      // Also save to legalTopics for frontend display
      localStorage.setItem('legalTopicsDocuments', JSON.stringify(documents.filter(d => d.status === 'published')));
    }
  }, [documents]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
      setFormData({
        ...formData,
        fileName: file.name,
        fileSize: `${sizeInMB} MB`
      });
      toast.success(`File "${file.name}" uploaded successfully`);
    }
  };

  const handleAddDocument = () => {
    if (!formData.title || !formData.titleUrdu || !formData.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    const newDoc: UrduDocument = {
      id: Date.now().toString(),
      title: formData.title,
      titleUrdu: formData.titleUrdu,
      category: formData.category,
      description: formData.description,
      descriptionUrdu: formData.descriptionUrdu,
      fileName: formData.fileName || 'document.pdf',
      fileSize: formData.fileSize || '1.0 MB',
      uploadDate: new Date().toISOString(),
      status: 'published',
      content: formData.content
    };

    setDocuments([newDoc, ...documents]);
    setShowAddModal(false);
    resetForm();
    toast.success('Document added successfully and will appear on Legal Topics page');
  };

  const handleUpdateDocument = () => {
    if (!editingDoc) return;

    const updatedDocs = documents.map(doc =>
      doc.id === editingDoc.id
        ? {
            ...doc,
            title: formData.title,
            titleUrdu: formData.titleUrdu,
            category: formData.category,
            description: formData.description,
            descriptionUrdu: formData.descriptionUrdu,
            content: formData.content
          }
        : doc
    );

    setDocuments(updatedDocs);
    setEditingDoc(null);
    resetForm();
    toast.success('Document updated successfully');
  };

  const handleDeleteDocument = (id: string) => {
    if (confirm('Are you sure you want to delete this document?')) {
      setDocuments(documents.filter(doc => doc.id !== id));
      toast.success('Document deleted successfully');
    }
  };

  const handleStatusChange = (id: string, status: 'published' | 'draft' | 'pending') => {
    const updatedDocs = documents.map(doc =>
      doc.id === id ? { ...doc, status } : doc
    );
    setDocuments(updatedDocs);
    toast.success(`Document status updated to ${status}`);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      titleUrdu: '',
      category: 'Family Law',
      description: '',
      descriptionUrdu: '',
      fileName: '',
      fileSize: '',
      content: ''
    });
  };

  const startEdit = (doc: UrduDocument) => {
    setEditingDoc(doc);
    setFormData({
      title: doc.title,
      titleUrdu: doc.titleUrdu,
      category: doc.category,
      description: doc.description,
      descriptionUrdu: doc.descriptionUrdu,
      fileName: doc.fileName,
      fileSize: doc.fileSize,
      content: doc.content || ''
    });
  };

  const categories = ['Family Law', 'Property Law', 'Civil Law', 'Business Law', 'Criminal Law', 'Traffic Law'];

  const filteredDocs = filterStatus === 'all'
    ? documents
    : documents.filter(doc => doc.status === filterStatus);

  const getStatusBadge = (status: string) => {
    const styles = {
      published: 'bg-green-100 text-green-700',
      draft: 'bg-gray-100 text-gray-700',
      pending: 'bg-yellow-100 text-yellow-700'
    };
    return styles[status as keyof typeof styles] || styles.draft;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl text-[#0B3D2E] mb-2">Urdu Law Content Management</h2>
          <p className="text-[#0B3D2E]/60 urdu-text">اردو قانونی مواد کا انتظام</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-6 py-3 bg-gradient-to-r from-[#1FAA59] to-[#0B3D2E] text-white rounded-xl hover:shadow-lg transition-all duration-300 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          <span>Upload Document</span>
        </button>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-xl">
        <div className="flex items-start gap-3">
          <FileText className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
          <div>
            <h4 className="text-lg text-[#0B3D2E] mb-2">Content Publishing</h4>
            <p className="text-[#0B3D2E]/70 text-sm">
              Documents uploaded here with "Published" status will automatically appear on the Legal Topics page for users to access. Ensure all content is verified and accurate before publishing.
            </p>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-2xl shadow-lg p-4 flex items-center gap-4">
        <span className="text-[#0B3D2E]">Filter by Status:</span>
        <div className="flex gap-2">
          {['all', 'published', 'draft', 'pending'].map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg transition-all ${
                filterStatus === status
                  ? 'bg-[#1FAA59] text-white'
                  : 'bg-gray-100 text-[#0B3D2E] hover:bg-gray-200'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Documents Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {filteredDocs.map((doc, index) => (
          <div
            key={doc.id}
            className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 animate-fade-in-up"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            {/* Document Header */}
            <div className="bg-gradient-to-br from-[#0B3D2E] to-[#1FAA59] p-6">
              <div className="flex items-start justify-between mb-3">
                <span className={`px-3 py-1 rounded-full text-xs ${getStatusBadge(doc.status)}`}>
                  {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                </span>
                <span className="px-3 py-1 bg-white/20 text-white text-xs rounded-full">
                  {doc.category}
                </span>
              </div>
              <h3 className="text-xl text-white mb-2">{doc.title}</h3>
              <p className="text-white/90 urdu-text text-lg">{doc.titleUrdu}</p>
            </div>

            {/* Document Body */}
            <div className="p-6">
              <p className="text-[#0B3D2E]/70 text-sm mb-2">{doc.description}</p>
              <p className="text-[#0B3D2E]/70 urdu-text text-sm mb-4">{doc.descriptionUrdu}</p>

              <div className="flex items-center gap-4 text-xs text-[#0B3D2E]/50 mb-4">
                <div className="flex items-center gap-1">
                  <FileText className="w-4 h-4" />
                  <span>{doc.fileName}</span>
                </div>
                <span>•</span>
                <span>{doc.fileSize}</span>
                <span>•</span>
                <span>{new Date(doc.uploadDate).toLocaleDateString()}</span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => startEdit(doc)}
                  className="flex-1 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  <span className="text-sm">Edit</span>
                </button>
                
                {doc.status !== 'published' && (
                  <button
                    onClick={() => handleStatusChange(doc.id, 'published')}
                    className="flex-1 px-4 py-2 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg transition-all flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    <span className="text-sm">Publish</span>
                  </button>
                )}

                <button
                  onClick={() => handleDeleteDocument(doc.id)}
                  className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredDocs.length === 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-16 text-center">
          <Upload className="w-16 h-16 text-[#0B3D2E]/20 mx-auto mb-4" />
          <h3 className="text-2xl text-[#0B3D2E] mb-2">No Documents Found</h3>
          <p className="text-[#0B3D2E]/60 mb-6">Upload your first legal document to get started</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-[#1FAA59] to-[#0B3D2E] text-white rounded-xl hover:shadow-lg transition-all duration-300"
          >
            Upload Document
          </button>
        </div>
      )}

      {/* Add/Edit Modal */}
      {(showAddModal || editingDoc) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-[#0B3D2E] to-[#1FAA59] p-6 flex items-center justify-between">
              <h3 className="text-2xl text-white">
                {editingDoc ? 'Edit Document' : 'Upload New Document'}
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingDoc(null);
                  resetForm();
                }}
                className="text-white hover:bg-white/20 p-2 rounded-lg transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* File Upload */}
              {!editingDoc && (
                <div>
                  <label className="block text-[#0B3D2E] mb-2">Upload File (PDF, DOCX)</label>
                  <div className="border-2 border-dashed border-[#1FAA59]/30 rounded-xl p-8 text-center hover:border-[#1FAA59] transition-all cursor-pointer">
                    <input
                      type="file"
                      onChange={handleFileUpload}
                      accept=".pdf,.doc,.docx"
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <Upload className="w-12 h-12 text-[#1FAA59] mx-auto mb-2" />
                      <p className="text-[#0B3D2E] mb-1">Click to upload or drag and drop</p>
                      <p className="text-sm text-[#0B3D2E]/60">PDF, DOC, DOCX up to 10MB</p>
                      {formData.fileName && (
                        <p className="text-sm text-[#1FAA59] mt-2">✓ {formData.fileName}</p>
                      )}
                    </label>
                  </div>
                </div>
              )}

              {/* Category */}
              <div>
                <label className="block text-[#0B3D2E] mb-2">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-3 bg-[#F8F9FA] border border-[#0B3D2E]/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1FAA59]"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* English Title */}
              <div>
                <label className="block text-[#0B3D2E] mb-2">Title (English) *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Muslim Family Laws Ordinance 1961"
                  className="w-full px-4 py-3 bg-[#F8F9FA] border border-[#0B3D2E]/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1FAA59]"
                />
              </div>

              {/* Urdu Title */}
              <div>
                <label className="block text-[#0B3D2E] mb-2 urdu-text">عنوان (اردو) *</label>
                <input
                  type="text"
                  value={formData.titleUrdu}
                  onChange={(e) => setFormData({ ...formData, titleUrdu: e.target.value })}
                  placeholder="مثال: مسلم عائلی قوانین آرڈیننس 1961"
                  className="w-full px-4 py-3 bg-[#F8F9FA] border border-[#0B3D2E]/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1FAA59] urdu-text text-right"
                />
              </div>

              {/* English Description */}
              <div>
                <label className="block text-[#0B3D2E] mb-2">Description (English) *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the document..."
                  rows={3}
                  className="w-full px-4 py-3 bg-[#F8F9FA] border border-[#0B3D2E]/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1FAA59]"
                />
              </div>

              {/* Urdu Description */}
              <div>
                <label className="block text-[#0B3D2E] mb-2 urdu-text">تفصیل (اردو) *</label>
                <textarea
                  value={formData.descriptionUrdu}
                  onChange={(e) => setFormData({ ...formData, descriptionUrdu: e.target.value })}
                  placeholder="دستاویز کی مختصر تفصیل..."
                  rows={3}
                  className="w-full px-4 py-3 bg-[#F8F9FA] border border-[#0B3D2E]/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1FAA59] urdu-text text-right"
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-[#0B3D2E] mb-2">Document Content (Optional)</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Full text content of the document..."
                  rows={5}
                  className="w-full px-4 py-3 bg-[#F8F9FA] border border-[#0B3D2E]/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1FAA59]"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingDoc(null);
                    resetForm();
                  }}
                  className="flex-1 px-6 py-3 bg-gray-100 text-[#0B3D2E] rounded-xl hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={editingDoc ? handleUpdateDocument : handleAddDocument}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-[#1FAA59] to-[#0B3D2E] text-white rounded-xl hover:shadow-lg transition-all"
                >
                  {editingDoc ? 'Update Document' : 'Add Document'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-[#0B3D2E]/70">Total Documents</h4>
            <FileText className="w-8 h-8 text-blue-500" />
          </div>
          <p className="text-3xl text-[#0B3D2E]">{documents.length}</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-[#0B3D2E]/70">Published</h4>
            <Check className="w-8 h-8 text-green-500" />
          </div>
          <p className="text-3xl text-[#0B3D2E]">
            {documents.filter(d => d.status === 'published').length}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-[#0B3D2E]/70">Draft</h4>
            <Edit className="w-8 h-8 text-gray-500" />
          </div>
          <p className="text-3xl text-[#0B3D2E]">
            {documents.filter(d => d.status === 'draft').length}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-[#0B3D2E]/70">Pending</h4>
            <AlertTriangle className="w-8 h-8 text-yellow-500" />
          </div>
          <p className="text-3xl text-[#0B3D2E]">
            {documents.filter(d => d.status === 'pending').length}
          </p>
        </div>
      </div>
    </div>
  );
}
