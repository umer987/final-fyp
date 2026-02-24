import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Star, Award, MapPin, Briefcase, Phone, Mail, Check, X } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface Lawyer {
  id: string;
  name: string;
  nameUrdu: string;
  expertise: string[];
  courtLocation: string;
  city: string;
  rating: number;
  reviewCount: number;
  experience: number;
  languages: string[];
  phoneNumber: string;
  whatsapp: string;
  email: string;
  image: string;
  verified: boolean;
  availability: string;
  barCouncilNo: string;
}

export function AddLawyer() {
  const [lawyers, setLawyers] = useState<Lawyer[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingLawyer, setEditingLawyer] = useState<Lawyer | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCity, setFilterCity] = useState('all');

  const [formData, setFormData] = useState({
    name: '',
    nameUrdu: '',
    expertise: [] as string[],
    courtLocation: '',
    city: 'Islamabad',
    experience: 5,
    languages: [] as string[],
    phoneNumber: '',
    whatsapp: '',
    email: '',
    image: '',
    availability: 'Available Today',
    barCouncilNo: ''
  });

  // Load lawyers from localStorage
  useEffect(() => {
    const storedLawyers = localStorage.getItem('lawyers_directory');
    if (storedLawyers) {
      setLawyers(JSON.parse(storedLawyers));
    }
  }, []);

  // Save to localStorage whenever lawyers change
  useEffect(() => {
    if (lawyers.length > 0) {
      localStorage.setItem('lawyers_directory', JSON.stringify(lawyers));
    }
  }, [lawyers]);

  const handleAddLawyer = () => {
    if (!formData.name || !formData.phoneNumber || !formData.email) {
      toast.error('Please fill in all required fields');
      return;
    }

    const newLawyer: Lawyer = {
      id: Date.now().toString(),
      name: formData.name,
      nameUrdu: formData.nameUrdu,
      expertise: formData.expertise,
      courtLocation: formData.courtLocation,
      city: formData.city,
      rating: 4.5,
      reviewCount: 0,
      experience: formData.experience,
      languages: formData.languages,
      phoneNumber: formData.phoneNumber,
      whatsapp: formData.whatsapp || formData.phoneNumber,
      email: formData.email,
      image: formData.image || 'https://images.unsplash.com/photo-1556157382-97eda2d62296?w=400&h=400&fit=crop',
      verified: true,
      availability: formData.availability,
      barCouncilNo: formData.barCouncilNo
    };

    setLawyers([newLawyer, ...lawyers]);
    setShowAddModal(false);
    resetForm();
    toast.success('Lawyer added successfully and will appear in Find Lawyers directory');
  };

  const handleUpdateLawyer = () => {
    if (!editingLawyer) return;

    const updatedLawyers = lawyers.map(lawyer =>
      lawyer.id === editingLawyer.id
        ? {
            ...lawyer,
            name: formData.name,
            nameUrdu: formData.nameUrdu,
            expertise: formData.expertise,
            courtLocation: formData.courtLocation,
            city: formData.city,
            experience: formData.experience,
            languages: formData.languages,
            phoneNumber: formData.phoneNumber,
            whatsapp: formData.whatsapp,
            email: formData.email,
            availability: formData.availability,
            barCouncilNo: formData.barCouncilNo
          }
        : lawyer
    );

    setLawyers(updatedLawyers);
    setEditingLawyer(null);
    resetForm();
    toast.success('Lawyer profile updated successfully');
  };

  const handleDeleteLawyer = (id: string) => {
    if (confirm('Are you sure you want to delete this lawyer profile?')) {
      setLawyers(lawyers.filter(lawyer => lawyer.id !== id));
      toast.success('Lawyer profile deleted successfully');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      nameUrdu: '',
      expertise: [],
      courtLocation: '',
      city: 'Islamabad',
      experience: 5,
      languages: [],
      phoneNumber: '',
      whatsapp: '',
      email: '',
      image: '',
      availability: 'Available Today',
      barCouncilNo: ''
    });
  };

  const startEdit = (lawyer: Lawyer) => {
    setEditingLawyer(lawyer);
    setFormData({
      name: lawyer.name,
      nameUrdu: lawyer.nameUrdu,
      expertise: lawyer.expertise,
      courtLocation: lawyer.courtLocation,
      city: lawyer.city,
      experience: lawyer.experience,
      languages: lawyer.languages,
      phoneNumber: lawyer.phoneNumber,
      whatsapp: lawyer.whatsapp,
      email: lawyer.email,
      image: lawyer.image,
      availability: lawyer.availability,
      barCouncilNo: lawyer.barCouncilNo
    });
  };

  const expertiseAreas = ['Family Law', 'Criminal Law', 'Business Law', 'Property Law', 'Civil Law', 'Corporate Law', 'Taxation', 'Women Rights', 'Child Custody', 'Cyber Law'];
  const cities = ['Islamabad', 'Lahore', 'Karachi', 'Rawalpindi', 'Peshawar', 'Multan', 'Faisalabad', 'Quetta'];
  const languageOptions = ['Urdu', 'English', 'Punjabi', 'Sindhi', 'Pashto', 'Balochi'];

  const toggleExpertise = (area: string) => {
    setFormData({
      ...formData,
      expertise: formData.expertise.includes(area)
        ? formData.expertise.filter(e => e !== area)
        : [...formData.expertise, area]
    });
  };

  const toggleLanguage = (lang: string) => {
    setFormData({
      ...formData,
      languages: formData.languages.includes(lang)
        ? formData.languages.filter(l => l !== lang)
        : [...formData.languages, lang]
    });
  };

  const filteredLawyers = lawyers.filter(lawyer => {
    const matchesSearch = lawyer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         lawyer.expertise.some(exp => exp.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCity = filterCity === 'all' || lawyer.city === filterCity;
    return matchesSearch && matchesCity;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl text-[#0B3D2E] mb-2">Lawyer Directory Management</h2>
          <p className="text-[#0B3D2E]/60 urdu-text">وکلاء کی فہرست کا انتظام</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-6 py-3 bg-gradient-to-r from-[#1FAA59] to-[#0B3D2E] text-white rounded-xl hover:shadow-lg transition-all duration-300 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          <span>Add Lawyer</span>
        </button>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-xl">
        <div className="flex items-start gap-3">
          <Award className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
          <div>
            <h4 className="text-lg text-[#0B3D2E] mb-2">Lawyer Verification</h4>
            <p className="text-[#0B3D2E]/70 text-sm">
              All lawyers added here will appear in the public "Find Lawyers" directory. Please ensure all information is accurate and verify bar council registration numbers.
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#0B3D2E]/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or expertise..."
              className="w-full pl-12 pr-4 py-3 bg-[#F8F9FA] rounded-xl outline-none focus:ring-2 focus:ring-[#1FAA59] transition-all"
            />
          </div>
          <select
            value={filterCity}
            onChange={(e) => setFilterCity(e.target.value)}
            className="px-4 py-3 bg-[#F8F9FA] rounded-xl outline-none focus:ring-2 focus:ring-[#1FAA59]"
          >
            <option value="all">All Cities</option>
            {cities.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>
        <div className="mt-4 text-sm text-[#0B3D2E]/60">
          Showing {filteredLawyers.length} of {lawyers.length} lawyers
        </div>
      </div>

      {/* Lawyers Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredLawyers.map((lawyer, index) => (
          <div
            key={lawyer.id}
            className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 animate-fade-in-up"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            {/* Lawyer Header */}
            <div className="relative bg-gradient-to-br from-[#0B3D2E] to-[#1FAA59] p-6 pb-16">
              <div className="flex justify-between items-start mb-4">
                {lawyer.verified && (
                  <span className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-xs rounded-full flex items-center gap-1">
                    <Award className="w-3 h-3" />
                    Verified
                  </span>
                )}
                <span className="px-3 py-1 bg-[#C5A253] text-white text-xs rounded-full">
                  {lawyer.availability}
                </span>
              </div>
              
              {/* Profile Image */}
              <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
                <div className="w-24 h-24 rounded-full border-4 border-white overflow-hidden shadow-xl">
                  <img 
                    src={lawyer.image} 
                    alt={lawyer.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>

            {/* Lawyer Info */}
            <div className="p-6 pt-16">
              <h3 className="text-xl text-[#0B3D2E] text-center mb-1">{lawyer.name}</h3>
              <p className="text-[#0B3D2E]/70 urdu-text text-center mb-3">{lawyer.nameUrdu}</p>
              
              {/* Rating */}
              <div className="flex items-center justify-center gap-2 mb-3">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.floor(lawyer.rating)
                          ? 'fill-[#C5A253] text-[#C5A253]'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-[#0B3D2E]">{lawyer.rating}</span>
                <span className="text-[#0B3D2E]/50 text-sm">({lawyer.reviewCount})</span>
              </div>

              {/* Details */}
              <div className="space-y-2 mb-4 text-sm">
                <div className="flex items-center gap-2 text-[#0B3D2E]/70">
                  <Briefcase className="w-4 h-4" />
                  <span>{lawyer.experience} years experience</span>
                </div>
                <div className="flex items-center gap-2 text-[#0B3D2E]/70">
                  <MapPin className="w-4 h-4 text-[#1FAA59]" />
                  <span>{lawyer.courtLocation}</span>
                </div>
                <div className="flex items-center gap-2 text-[#0B3D2E]/70">
                  <Phone className="w-4 h-4" />
                  <span>{lawyer.phoneNumber}</span>
                </div>
                <div className="flex items-center gap-2 text-[#0B3D2E]/70">
                  <Mail className="w-4 h-4" />
                  <span className="truncate">{lawyer.email}</span>
                </div>
              </div>

              {/* Expertise Tags */}
              <div className="flex flex-wrap gap-2 justify-center mb-4">
                {lawyer.expertise.slice(0, 3).map((exp, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 bg-[#E8F5ED] text-[#0B3D2E] text-xs rounded-full"
                  >
                    {exp}
                  </span>
                ))}
                {lawyer.expertise.length > 3 && (
                  <span className="px-2 py-1 bg-[#E8F5ED] text-[#0B3D2E] text-xs rounded-full">
                    +{lawyer.expertise.length - 3} more
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => startEdit(lawyer)}
                  className="flex-1 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  <span className="text-sm">Edit</span>
                </button>
                <button
                  onClick={() => handleDeleteLawyer(lawyer.id)}
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
      {filteredLawyers.length === 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-16 text-center">
          <Award className="w-16 h-16 text-[#0B3D2E]/20 mx-auto mb-4" />
          <h3 className="text-2xl text-[#0B3D2E] mb-2">No Lawyers Found</h3>
          <p className="text-[#0B3D2E]/60 mb-6">Add your first lawyer to the directory</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-[#1FAA59] to-[#0B3D2E] text-white rounded-xl hover:shadow-lg transition-all duration-300"
          >
            Add Lawyer
          </button>
        </div>
      )}

      {/* Add/Edit Modal */}
      {(showAddModal || editingLawyer) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-[#0B3D2E] to-[#1FAA59] p-6 flex items-center justify-between">
              <h3 className="text-2xl text-white">
                {editingLawyer ? 'Edit Lawyer Profile' : 'Add New Lawyer'}
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingLawyer(null);
                  resetForm();
                }}
                className="text-white hover:bg-white/20 p-2 rounded-lg transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-[#0B3D2E] mb-2">Full Name (English) *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Advocate Muhammad Ali Khan"
                  className="w-full px-4 py-3 bg-[#F8F9FA] border border-[#0B3D2E]/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1FAA59]"
                />
              </div>

              {/* Name Urdu */}
              <div>
                <label className="block text-[#0B3D2E] mb-2 urdu-text">نام (اردو)</label>
                <input
                  type="text"
                  value={formData.nameUrdu}
                  onChange={(e) => setFormData({ ...formData, nameUrdu: e.target.value })}
                  placeholder="مثال: ایڈووکیٹ محمد علی خان"
                  className="w-full px-4 py-3 bg-[#F8F9FA] border border-[#0B3D2E]/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1FAA59] urdu-text text-right"
                />
              </div>

              {/* Contact Info */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#0B3D2E] mb-2">Phone Number *</label>
                  <input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    placeholder="+92 300 1234567"
                    className="w-full px-4 py-3 bg-[#F8F9FA] border border-[#0B3D2E]/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1FAA59]"
                  />
                </div>
                <div>
                  <label className="block text-[#0B3D2E] mb-2">WhatsApp</label>
                  <input
                    type="tel"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    placeholder="+923001234567"
                    className="w-full px-4 py-3 bg-[#F8F9FA] border border-[#0B3D2E]/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1FAA59]"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-[#0B3D2E] mb-2">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="lawyer@example.com"
                  className="w-full px-4 py-3 bg-[#F8F9FA] border border-[#0B3D2E]/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1FAA59]"
                />
              </div>

              {/* Bar Council & Experience */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#0B3D2E] mb-2">Bar Council No.</label>
                  <input
                    type="text"
                    value={formData.barCouncilNo}
                    onChange={(e) => setFormData({ ...formData, barCouncilNo: e.target.value })}
                    placeholder="BC-12345"
                    className="w-full px-4 py-3 bg-[#F8F9FA] border border-[#0B3D2E]/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1FAA59]"
                  />
                </div>
                <div>
                  <label className="block text-[#0B3D2E] mb-2">Years of Experience</label>
                  <input
                    type="number"
                    value={formData.experience}
                    onChange={(e) => setFormData({ ...formData, experience: parseInt(e.target.value) || 0 })}
                    min="0"
                    className="w-full px-4 py-3 bg-[#F8F9FA] border border-[#0B3D2E]/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1FAA59]"
                  />
                </div>
              </div>

              {/* City & Court */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#0B3D2E] mb-2">City</label>
                  <select
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-4 py-3 bg-[#F8F9FA] border border-[#0B3D2E]/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1FAA59]"
                  >
                    {cities.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[#0B3D2E] mb-2">Court Location</label>
                  <input
                    type="text"
                    value={formData.courtLocation}
                    onChange={(e) => setFormData({ ...formData, courtLocation: e.target.value })}
                    placeholder="e.g., Islamabad High Court"
                    className="w-full px-4 py-3 bg-[#F8F9FA] border border-[#0B3D2E]/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1FAA59]"
                  />
                </div>
              </div>

              {/* Expertise */}
              <div>
                <label className="block text-[#0B3D2E] mb-2">Areas of Expertise</label>
                <div className="flex flex-wrap gap-2 p-4 bg-[#F8F9FA] rounded-xl">
                  {expertiseAreas.map(area => (
                    <button
                      key={area}
                      type="button"
                      onClick={() => toggleExpertise(area)}
                      className={`px-3 py-2 rounded-lg text-sm transition-all ${
                        formData.expertise.includes(area)
                          ? 'bg-[#1FAA59] text-white'
                          : 'bg-white text-[#0B3D2E] hover:bg-[#E8F5ED]'
                      }`}
                    >
                      {area}
                    </button>
                  ))}
                </div>
              </div>

              {/* Languages */}
              <div>
                <label className="block text-[#0B3D2E] mb-2">Languages</label>
                <div className="flex flex-wrap gap-2 p-4 bg-[#F8F9FA] rounded-xl">
                  {languageOptions.map(lang => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => toggleLanguage(lang)}
                      className={`px-3 py-2 rounded-lg text-sm transition-all ${
                        formData.languages.includes(lang)
                          ? 'bg-[#1FAA59] text-white'
                          : 'bg-white text-[#0B3D2E] hover:bg-[#E8F5ED]'
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>

              {/* Availability */}
              <div>
                <label className="block text-[#0B3D2E] mb-2">Availability Status</label>
                <select
                  value={formData.availability}
                  onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
                  className="w-full px-4 py-3 bg-[#F8F9FA] border border-[#0B3D2E]/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1FAA59]"
                >
                  <option value="Available Today">Available Today</option>
                  <option value="Available Tomorrow">Available Tomorrow</option>
                  <option value="Available This Week">Available This Week</option>
                  <option value="By Appointment">By Appointment</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingLawyer(null);
                    resetForm();
                  }}
                  className="flex-1 px-6 py-3 bg-gray-100 text-[#0B3D2E] rounded-xl hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={editingLawyer ? handleUpdateLawyer : handleAddLawyer}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-[#1FAA59] to-[#0B3D2E] text-white rounded-xl hover:shadow-lg transition-all"
                >
                  {editingLawyer ? 'Update Lawyer' : 'Add Lawyer'}
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
            <h4 className="text-[#0B3D2E]/70">Total Lawyers</h4>
            <Award className="w-8 h-8 text-blue-500" />
          </div>
          <p className="text-3xl text-[#0B3D2E]">{lawyers.length}</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-[#0B3D2E]/70">Verified</h4>
            <Check className="w-8 h-8 text-green-500" />
          </div>
          <p className="text-3xl text-[#0B3D2E]">
            {lawyers.filter(l => l.verified).length}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-[#0B3D2E]/70">Cities Covered</h4>
            <MapPin className="w-8 h-8 text-purple-500" />
          </div>
          <p className="text-3xl text-[#0B3D2E]">
            {new Set(lawyers.map(l => l.city)).size}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-[#0B3D2E]/70">Avg Experience</h4>
            <Briefcase className="w-8 h-8 text-orange-500" />
          </div>
          <p className="text-3xl text-[#0B3D2E]">
            {lawyers.length > 0 
              ? Math.round(lawyers.reduce((sum, l) => sum + l.experience, 0) / lawyers.length)
              : 0} yrs
          </p>
        </div>
      </div>
    </div>
  );
}
