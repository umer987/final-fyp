import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Scale, Menu, X, LogIn, LogOut, User } from 'lucide-react';
import { prefetchRoute } from '../lib/routePrefetch';
import { useAuth } from '../contexts/AuthContext';
import { getUserDisplayName, getUserPhotoUrl } from '../lib/userDisplay';
import { toast } from 'sonner@2.0.3';

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { isAuthenticated, user, logout, isLoading } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSignOut = async () => {
    setIsMobileMenuOpen(false);
    try {
      await logout();
      toast.success('Signed out');
    } catch {
      toast.error('Could not sign out');
    }
  };

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

  const handleNavPrefetch = (path: string) => {
    prefetchRoute(path);
  };

  const displayName = getUserDisplayName(user);
  const photoUrl = getUserPhotoUrl(user);

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled 
          ? 'bg-white/95 backdrop-blur-lg shadow-lg py-3 md:py-4' 
          : 'bg-white/90 backdrop-blur-md py-4 md:py-6'
      }`}>
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <Link 
              to="/"
              onClick={handleNavClick}
              className="flex items-center gap-2 sm:gap-3 group min-w-0"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-[#0B3D2E] to-[#1FAA59] flex items-center justify-center transition-all duration-300 flex-shrink-0">
                <Scale className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-2xl text-black transition-colors duration-300 truncate">
                  Voice2Law
                </h1>
                <p className="text-xs text-black/70 urdu-text hidden sm:block">
                  قانونی معاون
                </p>
              </div>
            </Link>

            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={handleNavClick}
                  onMouseEnter={() => handleNavPrefetch(link.path)}
                  onFocus={() => handleNavPrefetch(link.path)}
                  className={`px-3 xl:px-4 py-2 rounded-lg transition-all duration-300 text-sm xl:text-base ${
                    location.pathname === link.path
                      ? 'bg-gradient-to-r from-[#0B3D2E] to-[#1FAA59] text-white shadow-lg'
                      : 'text-black hover:bg-[#E8F5ED]'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
              {isAuthenticated && (
                <Link
                  to="/my-questions"
                  onClick={handleNavClick}
                  className={`px-3 xl:px-4 py-2 rounded-lg transition-all duration-300 text-sm xl:text-base ${
                    location.pathname === '/my-questions'
                      ? 'bg-gradient-to-r from-[#0B3D2E] to-[#1FAA59] text-white shadow-lg'
                      : 'text-black hover:bg-[#E8F5ED]'
                  }`}
                >
                  My Questions
                </Link>
              )}
            </div>

            <div className="hidden lg:flex items-center gap-2 flex-shrink-0 min-w-0">
              {!isLoading && (
                isAuthenticated ? (
                  <>
                    <span
                      className="flex items-center gap-2 px-2 xl:px-3 py-2 text-sm text-[#0B3D2E]/80 min-w-0 max-w-[min(200px,30vw)]"
                      title={displayName}
                    >
                      {photoUrl ? (
                        <img
                          src={photoUrl}
                          alt=""
                          className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <User className="w-4 h-4 flex-shrink-0" />
                      )}
                      <span className="truncate">
                        Welcome, {displayName}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => void handleSignOut()}
                      className="flex items-center gap-2 px-3 xl:px-4 py-2 rounded-lg text-sm text-white bg-[#0B3D2E] hover:bg-[#1FAA59] transition-colors flex-shrink-0"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </>
                ) : (
                  <Link
                    to="/signin"
                    onClick={handleNavClick}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-white bg-gradient-to-r from-[#1FAA59] to-[#0B3D2E] hover:shadow-lg transition-all"
                  >
                    <LogIn className="w-4 h-4" />
                    Sign In
                  </Link>
                )
              )}
            </div>

            <div className="lg:hidden flex items-center gap-2 min-w-0 flex-shrink">
              {!isLoading && isAuthenticated && (
                <span
                  className="flex items-center gap-1.5 min-w-0 max-w-[min(140px,38vw)] text-xs sm:text-sm text-[#0B3D2E]/80"
                  title={displayName}
                >
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt=""
                      className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <User className="w-4 h-4 flex-shrink-0" />
                  )}
                  <span className="truncate">Welcome, {displayName}</span>
                </span>
              )}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="w-10 h-10 rounded-lg bg-[#E8F5ED] text-black flex items-center justify-center transition-all duration-300 flex-shrink-0"
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden animate-fade-in">
          <div className="absolute inset-0 bg-[#0B3D2E]/95 backdrop-blur-lg" onClick={() => setIsMobileMenuOpen(false)}></div>
          <div className="absolute top-16 sm:top-20 left-0 right-0 max-h-[calc(100vh-4rem)] overflow-y-auto bg-white rounded-b-3xl shadow-2xl animate-slide-down">
            <div className="p-4 sm:p-6 space-y-2">
              {navLinks.map((link, index) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={handleNavClick}
                  onMouseEnter={() => handleNavPrefetch(link.path)}
                  onFocus={() => handleNavPrefetch(link.path)}
                  className={`block w-full text-left px-4 sm:px-6 py-3 sm:py-4 rounded-xl transition-all duration-300 animate-fade-in-up ${
                    location.pathname === link.path
                      ? 'bg-gradient-to-r from-[#0B3D2E] to-[#1FAA59] text-white shadow-lg'
                      : 'text-black hover:bg-[#E8F5ED]'
                  }`}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  {link.name}
                </Link>
              ))}
              {isAuthenticated && (
                <Link
                  to="/my-questions"
                  onClick={handleNavClick}
                  className={`block w-full text-left px-4 sm:px-6 py-3 sm:py-4 rounded-xl transition-all duration-300 ${
                    location.pathname === '/my-questions'
                      ? 'bg-gradient-to-r from-[#0B3D2E] to-[#1FAA59] text-white shadow-lg'
                      : 'text-black hover:bg-[#E8F5ED]'
                  }`}
                >
                  My Questions
                </Link>
              )}
              {!isLoading && (
                isAuthenticated ? (
                  <>
                    <div className="px-4 sm:px-6 py-3 sm:py-4 rounded-xl bg-[#E8F5ED] text-sm text-[#0B3D2E]/80 truncate">
                      Welcome, {displayName}
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleSignOut()}
                      className="block w-full text-left px-4 sm:px-6 py-3 sm:py-4 rounded-xl text-red-700 hover:bg-red-50 transition-all"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <Link
                    to="/signin"
                    onClick={handleNavClick}
                    className="block w-full text-left px-4 sm:px-6 py-3 sm:py-4 rounded-xl bg-gradient-to-r from-[#1FAA59] to-[#0B3D2E] text-white shadow-lg"
                  >
                    Sign In
                  </Link>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
