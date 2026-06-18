import React, { useState, useEffect } from 'react';
import { Search, MapPin, Star, MessageCircle, Calendar, Award, Briefcase, Phone, Filter, Loader, AlertCircle, Mail } from 'lucide-react';
import { Footer } from '../components/Footer';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { DEFAULT_LAWYER_IMAGE } from '../constants/lawyerImages';
import { api, type Lawyer } from '../lib/api';
import { toast } from 'sonner@2.0.3';


interface LawyerCard {
  id: string;
  name: string;
  nameUrdu: string;
  expertise: string[];
  courtLocation: string;
  city: string;
  rating: number;
  reviewCount: number;
  experience: number;
  phoneNumber: string;
  whatsappLink: string;
  email: string;
  image: string;
  verified: boolean;
  availability: string;
}

function mapLawyer(l: Lawyer): LawyerCard {
  return {
    id: l.id,
    name: l.name,
    nameUrdu: l.nameUrdu || '',
    expertise: l.expertise || [],
    courtLocation: l.courtLocation || '',
    city: l.city,
    rating: l.rating ?? 0,
    reviewCount: l.reviewCount ?? 0,
    experience: l.experience ?? 0,
    phoneNumber: l.phoneNumber,
    whatsappLink: l.whatsapp ? `https://wa.me/${l.whatsapp.replace(/\D/g, '')}` : `tel:${l.phoneNumber}`,
    email: l.email || '',
    image: l.image || DEFAULT_LAWYER_IMAGE,
    verified: l.verified,
    availability: l.availability || 'Available Today',
  };
}

export function FindLawyersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('all');
  const [selectedExpertise, setSelectedExpertise] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [lawyers, setLawyers] = useState<LawyerCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Load lawyers from the backend API.
  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setError('');
    api.getLawyers()
      .then(({ lawyers: data }) => {
        if (active) setLawyers(data.map(mapLawyer));
      })
      .catch(err => {
        const message = err instanceof Error ? err.message : 'Failed to load lawyers';
        if (active) {
          setError(message);
          toast.error(`Could not load lawyers: ${message}`);
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const cities = ['all', 'Islamabad', 'Lahore', 'Karachi', 'Rawalpindi', 'Peshawar', 'Multan'];
  const expertiseAreas = ['all', 'Family Law', 'Criminal Law', 'Property Law', 'Corporate Law'];

  const filteredLawyers = lawyers.filter(lawyer => {
    const matchesSearch = lawyer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         lawyer.expertise.some(exp => exp.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCity = selectedCity === 'all' || lawyer.city === selectedCity;
    const matchesExpertise = selectedExpertise === 'all' ||
                         lawyer.expertise.some(exp => exp.toLowerCase().includes(selectedExpertise.toLowerCase()));
    return matchesSearch && matchesCity && matchesExpertise;
  });

  const handleWhatsApp = (whatsappLink: string) => {
    window.open(whatsappLink, '_blank');
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-[#E8F5ED] to-white pt-24 sm:pt-32 pb-12 sm:pb-20">
        <div className="container mx-auto px-4 sm:px-6">
          {/* Header */}
          <div className="text-center mb-12 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#1FAA59]/10 rounded-full mb-6">
              <Briefcase className="w-5 h-5 text-[#1FAA59]" />
              <span className="text-[#0B3D2E]">Professional Legal Services</span>
            </div>
            <h1 className="text-3xl sm:text-5xl md:text-6xl text-[#0B3D2E] mb-6">
              Find Expert Lawyers
            </h1>
            <p className="text-xl text-[#0B3D2E]/70 mb-4 urdu-text">
              ماہر وکلاء تلاش کریں
            </p>
            <p className="text-lg text-[#0B3D2E]/60 max-w-3xl mx-auto">
              Connect with verified legal professionals across Pakistan. Book appointments, chat on WhatsApp, or call directly.
            </p>
          </div>

          {/* Search & Filters */}
          <div className="max-w-5xl mx-auto mb-12 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <div className="bg-white rounded-2xl shadow-xl p-6">
              {/* Search Bar */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#0B3D2E]/40" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name or expertise..."
                    className="w-full pl-12 pr-4 py-4 bg-[#F8F9FA] rounded-xl outline-none focus:ring-2 focus:ring-[#1FAA59] transition-all"
                  />
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="px-6 py-4 bg-[#E8F5ED] text-[#0B3D2E] rounded-xl hover:bg-[#1FAA59] hover:text-white transition-all duration-300 flex items-center gap-2"
                >
                  <Filter className="w-5 h-5" />
                  <span className="hidden md:inline">Filters</span>
                </button>
              </div>

              {/* Filter Options */}
              {showFilters && (
                <div className="grid md:grid-cols-2 gap-4 pt-4 border-t border-[#0B3D2E]/10 animate-fade-in">
                  <div>
                    <label className="block text-[#0B3D2E] mb-2 text-sm">City</label>
                    <select
                      value={selectedCity}
                      onChange={(e) => setSelectedCity(e.target.value)}
                      className="w-full px-4 py-3 bg-[#F8F9FA] border border-[#0B3D2E]/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1FAA59] transition-all"
                    >
                      {cities.map(city => (
                        <option key={city} value={city}>
                          {city === 'all' ? 'All Cities' : city}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[#0B3D2E] mb-2 text-sm">Expertise</label>
                    <select
                      value={selectedExpertise}
                      onChange={(e) => setSelectedExpertise(e.target.value)}
                      className="w-full px-4 py-3 bg-[#F8F9FA] border border-[#0B3D2E]/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1FAA59] transition-all"
                    >
                      {expertiseAreas.map(area => (
                        <option key={area} value={area}>
                          {area === 'all' ? 'All Expertise Areas' : area}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Results Count */}
            <div className="mt-4 text-center">
              <p className="text-[#0B3D2E]/70">
                Found <span className="text-[#1FAA59]">{filteredLawyers.length}</span> lawyer{filteredLawyers.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-16 animate-fade-in">
              <Loader className="w-8 h-8 text-[#1FAA59] animate-spin" />
              <span className="ml-3 text-[#0B3D2E]/70">Loading lawyers...</span>
            </div>
          )}

          {/* Error State */}
          {!isLoading && error && (
            <div className="text-center py-16 animate-fade-in">
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-10 h-10 text-red-500" />
              </div>
              <h3 className="text-2xl text-[#0B3D2E] mb-2">Could not load lawyers</h3>
              <p className="text-[#0B3D2E]/60 mb-6">{error}</p>
            </div>
          )}

          {/* Lawyers Grid */}
          {!isLoading && !error && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {filteredLawyers.map((lawyer, index) => (
              <div
                key={lawyer.id}
                className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden group hover:scale-105 animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Lawyer Header */}
                <div className="relative bg-gradient-to-br from-[#0B3D2E] to-[#1FAA59] p-6 pb-16">
                  <div className="flex justify-between items-start mb-4">
                    {lawyer.verified ? (
                      <span className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-xs rounded-full flex items-center gap-1">
                        <Award className="w-3 h-3" />
                        Verified
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-white/10 backdrop-blur-sm text-white/80 text-xs rounded-full">
                        Unverified
                      </span>
                    )}
                    <span className="px-3 py-1 bg-[#C5A253] text-white text-xs rounded-full">
                      {lawyer.availability}
                    </span>
                  </div>

                  {/* Profile Image */}
                  <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
                    <div className="w-24 h-24 rounded-full border-4 border-white overflow-hidden shadow-xl">
                      <ImageWithFallback
                        src={lawyer.image || DEFAULT_LAWYER_IMAGE}
                        alt={lawyer.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </div>

                {/* Lawyer Info */}
                <div className="p-6 pt-16">
                  <h3 className="text-xl text-[#0B3D2E] text-center mb-1">{lawyer.name}</h3>
                  {lawyer.nameUrdu && (
                    <p className="text-[#0B3D2E]/70 urdu-text text-center mb-3">{lawyer.nameUrdu}</p>
                  )}

                  {/* Rating */}
                  {lawyer.rating > 0 && (
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
                  )}

                  {/* Details */}
                  <div className="space-y-2 mb-4 text-sm">
                    {lawyer.experience > 0 && (
                      <div className="flex items-center gap-2 text-[#0B3D2E]/70">
                        <Briefcase className="w-4 h-4" />
                        <span>{lawyer.experience} years experience</span>
                      </div>
                    )}
                    {lawyer.courtLocation && (
                      <div className="flex items-center gap-2 text-[#0B3D2E]/70">
                        <MapPin className="w-4 h-4 text-[#1FAA59]" />
                        <span>{lawyer.courtLocation}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-[#0B3D2E]/70">
                      <MapPin className="w-4 h-4 text-[#1FAA59]" />
                      <span>{lawyer.city}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[#0B3D2E]/70">
                      <Phone className="w-4 h-4" />
                      <span>{lawyer.phoneNumber}</span>
                    </div>
                    {lawyer.email && (
                      <div className="flex items-center gap-2 text-[#0B3D2E]/70">
                        <Mail className="w-4 h-4" />
                        <span className="truncate">{lawyer.email}</span>
                      </div>
                    )}
                  </div>

                  {/* Expertise Tags */}
                  {lawyer.expertise.length > 0 && (
                    <div className="flex flex-wrap gap-2 justify-center mb-6">
                      {lawyer.expertise.slice(0, 3).map((exp, i) => (
                        <span
                          key={i}
                          className="px-3 py-1 bg-[#E8F5ED] text-[#0B3D2E] text-xs rounded-full"
                        >
                          {exp}
                        </span>
                      ))}
                      {lawyer.expertise.length > 3 && (
                        <span className="px-3 py-1 bg-[#E8F5ED] text-[#0B3D2E] text-xs rounded-full">
                          +{lawyer.expertise.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    <button
                      onClick={() => handleWhatsApp(lawyer.whatsappLink)}
                      className="w-full px-4 py-3 bg-[#25D366] hover:bg-[#20BA5A] text-white rounded-xl transition-all duration-300 flex items-center justify-center gap-2"
                    >
                      <MessageCircle className="w-5 h-5" />
                      <span>WhatsApp</span>
                    </button>
                    <button className="w-full px-4 py-3 bg-gradient-to-r from-[#1FAA59] to-[#0B3D2E] hover:from-[#0B3D2E] hover:to-[#1FAA59] text-white rounded-xl transition-all duration-300 flex items-center justify-center gap-2">
                      <Calendar className="w-5 h-5" />
                      <span>Book Appointment</span>
                    </button>
                    <a
                      href={`tel:${lawyer.phoneNumber}`}
                      className="w-full px-4 py-3 bg-white border-2 border-[#1FAA59] text-[#1FAA59] hover:bg-[#1FAA59] hover:text-white rounded-xl transition-all duration-300 flex items-center justify-center gap-2"
                    >
                      <Phone className="w-5 h-5" />
                      <span>Call Now</span>
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
          )}

          {/* No Results */}
          {!isLoading && !error && filteredLawyers.length === 0 && (
            <div className="text-center py-16 animate-fade-in">
              <div className="w-20 h-20 bg-[#E8F5ED] rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-10 h-10 text-[#0B3D2E]/40" />
              </div>
              <h3 className="text-2xl text-[#0B3D2E] mb-2">No Lawyers Found</h3>
              <p className="text-[#0B3D2E]/60 mb-6">
                {lawyers.length === 0 ? 'No lawyers have been added yet.' : 'Try adjusting your search or filters'}
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCity('all');
                  setSelectedExpertise('all');
                }}
                className="px-6 py-3 bg-gradient-to-r from-[#1FAA59] to-[#0B3D2E] text-white rounded-xl hover:shadow-lg transition-all duration-300"
              >
                Clear Filters
              </button>
            </div>
          )}

          {/* Info Section */}
          <div className="mt-16 bg-white rounded-3xl p-12 shadow-xl max-w-4xl mx-auto animate-fade-in-up">
            <h2 className="text-3xl text-[#0B3D2E] mb-6 text-center">Why Choose Voice2Law Lawyers?</h2>
            
            {/* Contact Note */}
            <div className="mb-8 p-6 bg-gradient-to-r from-[#1FAA59]/10 to-[#C5A253]/10 rounded-2xl border-2 border-[#1FAA59]/20">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-[#1FAA59] flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl text-[#0B3D2E] mb-2">Are You a Legal Professional?</h3>
                  <p className="text-[#0B3D2E]/80 mb-2">
                    Join our directory and connect with clients across Pakistan. To add your profile to our lawyer directory, please contact us at:
                  </p>
                  <a 
                    href="mailto:voice2law@gmail.com" 
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#1FAA59] hover:bg-[#0B3D2E] text-white rounded-lg transition-all duration-300"
                  >
                    <Mail className="w-4 h-4" />
                    <span>voice2law@gmail.com</span>
                  </a>
                  <p className="text-sm text-[#0B3D2E]/60 mt-3 urdu-text">
                    اپنا نام شامل کرنے کے لیے voice2law@gmail.com پر رابطہ کریں
                  </p>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-full bg-[#1FAA59]/10 flex items-center justify-center flex-shrink-0">
                  <Award className="w-6 h-6 text-[#1FAA59]" />
                </div>
                <div>
                  <h4 className="text-lg text-[#0B3D2E] mb-2">Verified Professionals</h4>
                  <p className="text-[#0B3D2E]/60">All lawyers are verified with valid bar council registration</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-full bg-[#C5A253]/10 flex items-center justify-center flex-shrink-0">
                  <Star className="w-6 h-6 text-[#C5A253]" />
                </div>
                <div>
                  <h4 className="text-lg text-[#0B3D2E] mb-2">Client Reviews</h4>
                  <p className="text-[#0B3D2E]/60">Real ratings and reviews from verified clients</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-full bg-[#1FAA59]/10 flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="w-6 h-6 text-[#1FAA59]" />
                </div>
                <div>
                  <h4 className="text-lg text-[#0B3D2E] mb-2">Easy Communication</h4>
                  <p className="text-[#0B3D2E]/60">Connect instantly via WhatsApp, phone, or appointment</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-full bg-[#C5A253]/10 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-6 h-6 text-[#C5A253]" />
                </div>
                <div>
                  <h4 className="text-lg text-[#0B3D2E] mb-2">Nationwide Coverage</h4>
                  <p className="text-[#0B3D2E]/60">Find lawyers in all major cities across Pakistan</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}