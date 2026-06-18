import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Scale } from 'lucide-react';
import { Footer } from '../components/Footer';
import { GoogleSignInButton } from '../components/GoogleSignInButton';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner@2.0.3';

export function SignInPage() {
  const { isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    remember: false,
  });

  useEffect(() => {
    if (isAuthenticated) {
      navigate(isAdmin ? '/adminvoice2law001' : '/', { replace: true });
    }
  }, [isAuthenticated, isAdmin, navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.info('Use Continue with Google below to sign in. Email/password sign-in is not enabled.');
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
              <h1 className="text-4xl text-[#0B3D2E] mb-2">Welcome Back</h1>
              <p className="text-[#0B3D2E]/70 urdu-text text-xl">خوش آمدید</p>
            </div>

            <div
              className="bg-white rounded-3xl p-8 shadow-xl animate-fade-in-up"
              style={{ animationDelay: '0.1s' }}
            >
              <form onSubmit={handleSubmit} className="space-y-6">
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
                  <label className="block text-[#0B3D2E] mb-2">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#0B3D2E]/40" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full pl-12 pr-12 py-3 bg-[#F8F9FA] border border-[#0B3D2E]/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1FAA59] transition-all"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#0B3D2E]/40 hover:text-[#0B3D2E] transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="remember"
                      checked={formData.remember}
                      onChange={handleChange}
                      className="w-4 h-4 rounded border-[#0B3D2E]/20 text-[#1FAA59] focus:ring-[#1FAA59]"
                    />
                    <span className="text-sm text-[#0B3D2E]/70">Remember me</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => toast.info('Password reset is not available. Sign in with Google instead.')}
                    className="text-sm text-[#1FAA59] hover:text-[#0B3D2E] transition-colors"
                  >
                    Forgot Password?
                  </button>
                </div>

                <button
                  type="submit"
                  className="w-full px-6 py-4 bg-gradient-to-r from-[#1FAA59] to-[#0B3D2E] text-white rounded-xl hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2"
                >
                  <span>Sign In</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </form>

              <div className="relative my-8">
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
                  Don&apos;t have an account?{' '}
                  <Link to="/signup" className="text-[#1FAA59] hover:text-[#0B3D2E] transition-colors">
                    Sign Up
                  </Link>
                </p>
              </div>
            </div>

            <div className="mt-8 text-center animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <p className="text-sm text-[#0B3D2E]/50">
                By signing in, you agree to our Terms of Service and Privacy Policy
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
