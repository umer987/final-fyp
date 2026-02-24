import React, { useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { Shield, AlertTriangle } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { isAuthenticated, isAdmin, checkAuth } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Not authenticated - redirect to admin login
  if (!isAuthenticated) {
    return <Navigate to="/admin-login" replace />;
  }

  // Authenticated but not admin - show access denied
  if (requireAdmin && !isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-10 h-10 text-red-600" />
          </div>
          <h1 className="text-3xl text-[#0B3D2E] mb-4">Access Denied</h1>
          <p className="text-[#0B3D2E]/70 mb-6">
            You do not have permission to access this area. This section is restricted to administrators only.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/')}
              className="w-full px-6 py-3 bg-gradient-to-r from-[#1FAA59] to-[#0B3D2E] text-white rounded-xl hover:shadow-lg transition-all duration-300"
            >
              Go to Home
            </button>
            <button
              onClick={() => navigate('/admin-login')}
              className="w-full px-6 py-3 bg-white border-2 border-[#1FAA59] text-[#1FAA59] rounded-xl hover:bg-[#E8F5ED] transition-all duration-300"
            >
              Admin Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated and authorized
  return <>{children}</>;
}

// Component to display loading state while checking auth
export function AuthLoadingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E8F5ED] to-white flex items-center justify-center">
      <div className="text-center">
        <Shield className="w-16 h-16 text-[#1FAA59] mx-auto mb-4 animate-pulse" />
        <p className="text-[#0B3D2E] text-lg">Verifying authentication...</p>
      </div>
    </div>
  );
}
