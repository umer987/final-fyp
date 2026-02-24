import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router';
import { Scale, Menu, X, User } from 'lucide-react';

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Ask a Question', path: '/ask' },
    { name: 'Find Lawyers', path: '/find-lawyers' },
    { name: 'Legal Topics', path: '/legal-topics' },
    { name: 'Search', path: '/search' },
    { name: 'About', path: '/about' },
    { name: 'How It Works', path: '/how-it-works' },
    { name: 'Contact', path: '/contact' }
  ];

  const handleNavClick = () => {
    setIsMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled 
          ? 'bg-white/95 backdrop-blur-lg shadow-lg py-4' 
          : 'bg-white/90 backdrop-blur-md py-6'
      }`}>
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link 
              to="/"
              onClick={handleNavClick}
              className="flex items-center gap-3 group"
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#0B3D2E] to-[#1FAA59] flex items-center justify-center transition-all duration-300">
                <Scale className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl text-black transition-colors duration-300">
                  Voice2Law
                </h1>
                <p className="text-xs text-black/70 urdu-text">
                  قانونی معاون
                </p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={handleNavClick}
                  className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                    location.pathname === link.path
                      ? 'bg-gradient-to-r from-[#0B3D2E] to-[#1FAA59] text-white shadow-lg'
                      : 'text-black hover:bg-[#E8F5ED]'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
              
              {/* Sign In / Sign Up */}
              <div className="ml-4 flex items-center gap-2">
                <Link
                  to="/signin"
                  onClick={handleNavClick}
                  className="px-4 py-2 text-black hover:bg-[#E8F5ED] rounded-lg transition-all duration-300"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  onClick={handleNavClick}
                  className="px-4 py-2 bg-gradient-to-r from-[#1FAA59] to-[#0B3D2E] text-white rounded-lg hover:shadow-lg transition-all duration-300 flex items-center gap-2"
                >
                  <User className="w-4 h-4" />
                  <span>Sign Up</span>
                </Link>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden w-10 h-10 rounded-lg bg-[#E8F5ED] text-black flex items-center justify-center transition-all duration-300"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden animate-fade-in">
          <div className="absolute inset-0 bg-[#0B3D2E]/95 backdrop-blur-lg" onClick={() => setIsMobileMenuOpen(false)}></div>
          <div className="absolute top-20 left-0 right-0 bg-white rounded-b-3xl shadow-2xl animate-slide-down">
            <div className="p-6 space-y-2">
              {navLinks.map((link, index) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={handleNavClick}
                  className={`block w-full text-left px-6 py-4 rounded-xl transition-all duration-300 animate-fade-in-up ${
                    location.pathname === link.path
                      ? 'bg-gradient-to-r from-[#0B3D2E] to-[#1FAA59] text-white shadow-lg'
                      : 'text-black hover:bg-[#E8F5ED]'
                  }`}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  {link.name}
                </Link>
              ))}
              
              {/* Mobile Sign In / Sign Up */}
              <div className="pt-4 border-t border-[#0B3D2E]/10 space-y-2">
                <Link
                  to="/signin"
                  onClick={handleNavClick}
                  className="block w-full text-left px-6 py-4 rounded-xl text-black hover:bg-[#E8F5ED] transition-all duration-300"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  onClick={handleNavClick}
                  className="block w-full text-left px-6 py-4 rounded-xl bg-gradient-to-r from-[#1FAA59] to-[#0B3D2E] text-white shadow-lg transition-all duration-300"
                >
                  Sign Up
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}