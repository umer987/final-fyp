import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, User as UserIcon, Phone, ArrowRight, Scale } from 'lucide-react';
import { Footer } from '../components/Footer';
import { GoogleSignInButton } from '../components/GoogleSignInButton';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner@2.0.3';

export function SignUpPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false,
  });

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    toast.info(
      'Use Continue with Google below to create your account. Your profile is created automatically on first Google sign-in.',
    );
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-[#E8F5ED] to-white pt-32 pb-20">
        <div className="container mx-auto px-6">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8 animate-fade-in-up">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-[#0B3D2E] to-[#1FAA59] mb-4">
                <Scale className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-4xl text-[#0B3D2E] mb-2">Create Account</h1>
              <p className="text-[#0B3D2E]/70 urdu-text text-xl">اکاؤنٹ بنائیں</p>
            </div>

            <div
              className="bg-white rounded-3xl p-8 shadow-xl animate-fade-in-up"
              style={{ animationDelay: '0.1s' }}
            >
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-[#0B3D2E] mb-2">Full Name</label>
                  <div className="relative">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#0B3D2E]/40" />
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-3 bg-[#F8F9FA] border border-[#0B3D2E]/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1FAA59] transition-all"
                      placeholder="Enter your full name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[#0B3D2E] mb-2">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#0B3D2E]/40" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-3 bg-[#F8F9FA] border border-[#0B3D2E]/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1FAA59] transition-all"
                      placeholder="your.email@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[#0B3D2E] mb-2">Phone Number (Optional)</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#0B3D2E]/40" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-3 bg-[#F8F9FA] border border-[#0B3D2E]/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1FAA59] transition-all"
                      placeholder="+92 300 1234567"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[#0B3D2E] mb-2">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#0B3D2E]/40" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full pl-12 pr-12 py-3 bg-[#F8F9FA] border border-[#0B3D2E]/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1FAA59] transition-all"
                      placeholder="Create a strong password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#0B3D2E]/40 hover:text-[#0B3D2E] transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <p className="text-xs text-[#0B3D2E]/50 mt-1">
                    At least 8 characters with numbers and symbols
                  </p>
                </div>

                <div>
                  <label className="block text-[#0B3D2E] mb-2">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#0B3D2E]/40" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="w-full pl-12 pr-12 py-3 bg-[#F8F9FA] border border-[#0B3D2E]/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1FAA59] transition-all"
                      placeholder="Re-enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#0B3D2E]/40 hover:text-[#0B3D2E] transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="agreeTerms"
                      checked={formData.agreeTerms}
                      onChange={handleChange}
                      className="w-4 h-4 mt-1 rounded border-[#0B3D2E]/20 text-[#1FAA59] focus:ring-[#1FAA59]"
                    />
                    <span className="text-sm text-[#0B3D2E]/70">
                      I agree to the{' '}
                      <button type="button" className="text-[#1FAA59] hover:text-[#0B3D2E]">
                        Terms of Service
                      </button>{' '}
                      and{' '}
                      <button type="button" className="text-[#1FAA59] hover:text-[#0B3D2E]">
                        Privacy Policy
                      </button>
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full px-6 py-4 bg-gradient-to-r from-[#1FAA59] to-[#0B3D2E] text-white rounded-xl hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2"
                >
                  <span>Create Account</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#0B3D2E]/10" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-[#0B3D2E]/60">OR</span>
                </div>
              </div>

              <GoogleSignInButton />

              <div className="mt-6 text-center">
                <p className="text-[#0B3D2E]/70">
                  Already have an account?{' '}
                  <Link to="/signin" className="text-[#1FAA59] hover:text-[#0B3D2E] transition-colors">
                    Sign In
                  </Link>
                </p>
              </div>
            </div>

            <div
              className="mt-8 bg-white rounded-2xl p-6 shadow-lg animate-fade-in-up"
              style={{ animationDelay: '0.2s' }}
            >
              <h3 className="text-lg text-[#0B3D2E] mb-4">Why create an account?</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#1FAA59]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-[#1FAA59] text-xs">✓</span>
                  </div>
                  <span className="text-sm text-[#0B3D2E]/70">
                    Save your search history and favorite topics
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#1FAA59]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-[#1FAA59] text-xs">✓</span>
                  </div>
                  <span className="text-sm text-[#0B3D2E]/70">
                    Get personalized legal information recommendations
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#1FAA59]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-[#1FAA59] text-xs">✓</span>
                  </div>
                  <span className="text-sm text-[#0B3D2E]/70">
                    Receive updates on Pakistani law changes
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
