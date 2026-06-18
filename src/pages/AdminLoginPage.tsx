import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { GoogleSignInButton } from '../components/GoogleSignInButton';
import { Shield, AlertCircle } from 'lucide-react';

export function AdminLoginPage() {
  const { isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      navigate('/adminvoice2law001', { replace: true });
    }
  }, [isAuthenticated, isAdmin, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E8F5ED] to-white flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-[#0B3D2E] to-[#1FAA59] rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl text-[#0B3D2E] mb-2">Voice2Law Admin</h1>
          <p className="text-[#0B3D2E]/60">Secure Administrative Access</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="mb-6 text-center">
            <h2 className="text-2xl text-[#0B3D2E] mb-2">Admin Login</h2>
            <p className="text-[#0B3D2E]/60 text-sm">Sign in with an authorized Google account</p>
          </div>

          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-lg mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-[#0B3D2E]">
                Only Google accounts listed in backend <code className="text-xs">ADMIN_EMAILS</code> receive
                admin access.
              </p>
            </div>
          </div>

          <GoogleSignInButton />

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="text-[#1FAA59] hover:text-[#0B3D2E] text-sm transition-colors"
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
