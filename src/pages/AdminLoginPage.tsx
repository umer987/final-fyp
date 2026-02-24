import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { Shield, Lock, Mail, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

export function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);

  const { login, isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated as admin
  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      navigate('/adminvoice2law001', { replace: true });
    }
  }, [isAuthenticated, isAdmin, navigate]);

  // Rate limiting - lock after 5 failed attempts
  useEffect(() => {
    if (attempts >= 5) {
      setIsLocked(true);
      setError('Too many failed attempts. Please try again in 15 minutes.');
      
      const lockTimer = setTimeout(() => {
        setIsLocked(false);
        setAttempts(0);
        setError('');
      }, 15 * 60 * 1000); // 15 minutes

      return () => clearTimeout(lockTimer);
    }
  }, [attempts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLocked) {
      toast.error('Account temporarily locked due to multiple failed attempts');
      return;
    }

    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const success = await login(email, password);

      if (success) {
        toast.success('Login successful! Redirecting to admin panel...');
        setTimeout(() => {
          navigate('/adminvoice2law001', { replace: true });
        }, 500);
      } else {
        setAttempts(prev => prev + 1);
        setError('Invalid credentials. Please check your email and password.');
        toast.error('Invalid credentials');
        
        // Clear password field on failed attempt
        setPassword('');
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
      toast.error('Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E8F5ED] to-white flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        {/* Logo Section */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-[#0B3D2E] to-[#1FAA59] rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl text-[#0B3D2E] mb-2">Voice2Law Admin</h1>
          <p className="text-[#0B3D2E]/60">Secure Administrative Access</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="mb-6">
            <h2 className="text-2xl text-[#0B3D2E] mb-2">Admin Login</h2>
            <p className="text-[#0B3D2E]/60 text-sm">Enter your credentials to access the admin panel</p>
          </div>

          {/* Security Notice */}
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-lg mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-[#0B3D2E]">
                  This is a restricted area. Unauthorized access attempts are logged and monitored.
                </p>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg mb-6 animate-fade-in">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          )}

          {/* Attempts Warning */}
          {attempts > 0 && attempts < 5 && (
            <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-lg mb-6">
              <p className="text-sm text-orange-800">
                Failed attempts: {attempts}/5. After 5 attempts, the account will be locked for 15 minutes.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-[#0B3D2E] mb-2 text-sm font-medium">Admin Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#0B3D2E]/40" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@voice2law.com"
                  disabled={isLocked || isLoading}
                  className="w-full pl-12 pr-4 py-3 bg-[#F8F9FA] border border-[#0B3D2E]/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1FAA59] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-[#0B3D2E] mb-2 text-sm font-medium">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#0B3D2E]/40" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  disabled={isLocked || isLoading}
                  className="w-full pl-12 pr-12 py-3 bg-[#F8F9FA] border border-[#0B3D2E]/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1FAA59] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#0B3D2E]/40 hover:text-[#0B3D2E] transition-colors"
                  disabled={isLocked || isLoading}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLocked || isLoading || !email || !password}
              className="w-full px-6 py-3 bg-gradient-to-r from-[#1FAA59] to-[#0B3D2E] text-white rounded-xl hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          {/* Demo Credentials Info */}
          <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-[#0B3D2E] mb-2 font-medium">Demo Credentials:</p>
                <div className="space-y-1 text-xs text-[#0B3D2E]/70 font-mono">
                  <p>Email: admin@voice2law.com</p>
                  <p>Password: Voice2Law@Admin2024!</p>
                </div>
              </div>
            </div>
          </div>

          {/* Back to Home */}
          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/')}
              className="text-[#1FAA59] hover:text-[#0B3D2E] text-sm transition-colors"
            >
              ← Back to Home
            </button>
          </div>
        </div>

        {/* Security Features */}
        <div className="mt-6 text-center">
          <div className="flex items-center justify-center gap-4 text-xs text-[#0B3D2E]/50">
            <div className="flex items-center gap-1">
              <Shield className="w-4 h-4" />
              <span>Encrypted</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1">
              <Lock className="w-4 h-4" />
              <span>Secure Login</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              <span>Rate Limited</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
