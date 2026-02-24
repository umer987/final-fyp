import React from 'react';
import { Scale, Mail, Phone, MapPin, AlertCircle } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-[#0B3D2E] text-white relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-[#1FAA59]/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#C5A253]/10 rounded-full blur-3xl"></div>

      <div className="container mx-auto px-6 relative z-10">
        {/* Main Footer Content */}
        <div className="py-16 grid md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#1FAA59] to-[#C5A253] flex items-center justify-center">
                <Scale className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl heading-serif">Voice2Law</h3>
                <p className="text-[#C5A253] text-sm urdu-text">قانونی معلومات کا اردو اسسٹنٹ</p>
              </div>
            </div>
            <p className="text-white/80 mb-6 max-w-md leading-relaxed">
              Empowering Urdu-speaking citizens with accessible legal information through AI-powered voice and text assistance. Making Pakistani law understandable for everyone.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 hover:bg-[#1FAA59] flex items-center justify-center transition-all duration-300 hover:scale-110">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 hover:bg-[#1FAA59] flex items-center justify-center transition-all duration-300 hover:scale-110">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 hover:bg-[#1FAA59] flex items-center justify-center transition-all duration-300 hover:scale-110">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg mb-6 text-[#C5A253]">
              Quick Links
            </h4>
            <ul className="space-y-3">
              <li>
                <a href="#about" className="text-white/80 hover:text-[#1FAA59] transition-colors duration-300">
                  About Project
                </a>
              </li>
              <li>
                <a href="#features" className="text-white/80 hover:text-[#1FAA59] transition-colors duration-300">
                  Features
                </a>
              </li>
              <li>
                <a href="#tech" className="text-white/80 hover:text-[#1FAA59] transition-colors duration-300">
                  Technology
                </a>
              </li>
              <li>
                <a href="#team" className="text-white/80 hover:text-[#1FAA59] transition-colors duration-300">
                  Team
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg mb-6 text-[#C5A253]">
              Contact
            </h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-[#1FAA59] mt-1 flex-shrink-0" />
                <div>
                  <p className="text-white/80">voice2law@example.com</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-[#1FAA59] mt-1 flex-shrink-0" />
                <div>
                  <p className="text-white/80">+92 XXX XXXXXXX</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-[#1FAA59] mt-1 flex-shrink-0" />
                <div>
                  <p className="text-white/80">University Campus, Pakistan</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Legal Disclaimer */}
        <div className="py-8 border-t border-white/10">
          <div className="bg-[#C5A253]/20 backdrop-blur-sm rounded-xl px-6 py-4 mb-8">
            <div className="flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-[#C5A253] flex-shrink-0 mt-1" />
              <div>
                <h5 className="text-[#C5A253] mb-2">
                  Important Legal Notice
                </h5>
                <p className="text-white/90 text-sm leading-relaxed">
                  Voice2Law provides legal information summaries and educational content only. This is <strong>not legal advice</strong>. For specific legal matters, please consult a qualified lawyer. We do not create attorney-client relationships through this service.
                </p>
                <p className="text-white/70 text-sm mt-2 urdu-text">
                  Voice2Law صرف قانونی معلومات فراہم کرتا ہے، قانونی مشورہ نہیں۔ اپنے مخصوص معاملات کے لیے کسی وکیل سے رابطہ کریں۔
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-white/60 text-sm">
            <p>
              © 2024 Voice2Law. Final Year Project. All rights reserved.
            </p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-[#1FAA59] transition-colors duration-300">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-[#1FAA59] transition-colors duration-300">
                Terms of Use
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}