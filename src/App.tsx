import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { Toaster } from 'sonner@2.0.3';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Navbar } from './components/Navbar';
import { HomePage } from './pages/HomePage';
import { AskQuestionPage } from './pages/AskQuestionPage';
import { FindLawyersPage } from './pages/FindLawyersPage';
import { LegalTopicsPage } from './pages/LegalTopicsPage';
import { SearchPage } from './pages/SearchPage';
import { AboutPage } from './pages/AboutPage';
import { HowItWorksPage } from './pages/HowItWorksPage';
import { ContactPage } from './pages/ContactPage';
import { SignInPage } from './pages/SignInPage';
import { SignUpPage } from './pages/SignUpPage';
import { AdminPanelPage } from './pages/AdminPanelPage';
import { AdminLoginPage } from './pages/AdminLoginPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" richColors />
        <Routes>
          {/* Public Routes with Navbar */}
          <Route path="/" element={<WithNavbar><HomePage /></WithNavbar>} />
          <Route path="/ask" element={<WithNavbar><AskQuestionPage /></WithNavbar>} />
          <Route path="/find-lawyers" element={<WithNavbar><FindLawyersPage /></WithNavbar>} />
          <Route path="/legal-topics" element={<WithNavbar><LegalTopicsPage /></WithNavbar>} />
          <Route path="/search" element={<WithNavbar><SearchPage /></WithNavbar>} />
          <Route path="/about" element={<WithNavbar><AboutPage /></WithNavbar>} />
          <Route path="/how-it-works" element={<WithNavbar><HowItWorksPage /></WithNavbar>} />
          <Route path="/contact" element={<WithNavbar><ContactPage /></WithNavbar>} />
          <Route path="/signin" element={<WithNavbar><SignInPage /></WithNavbar>} />
          <Route path="/signup" element={<WithNavbar><SignUpPage /></WithNavbar>} />

          {/* Admin Login Route (public) */}
          <Route path="/admin-login" element={<AdminLoginPage />} />

          {/* Secure Admin Route - Protected */}
          <Route
            path="/adminvoice2law001"
            element={
              <ProtectedRoute requireAdmin={true}>
                <AdminPanelPage />
              </ProtectedRoute>
            }
          />

          {/* Legacy admin route - redirect to secure route */}
          <Route path="/admin" element={<Navigate to="/adminvoice2law001" replace />} />

          {/* 404 - Redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

// Wrapper component to include Navbar
function WithNavbar({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      {children}
    </div>
  );
}