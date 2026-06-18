import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner@2.0.3';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { GoogleOAuthRouteWrapper } from './components/GoogleOAuthRouteWrapper';
import { Navbar } from './components/Navbar';
import { PageLoader } from './components/PageLoader';
import { HomePage } from './pages/HomePage';

const AskQuestionPage = lazy(() =>
  import('./pages/AskQuestionPage').then((m) => ({ default: m.AskQuestionPage }))
);
const FindLawyersPage = lazy(() =>
  import('./pages/FindLawyersPage').then((m) => ({ default: m.FindLawyersPage }))
);
const LegalTopicsPage = lazy(() =>
  import('./pages/LegalTopicsPage').then((m) => ({ default: m.LegalTopicsPage }))
);
const SearchPage = lazy(() =>
  import('./pages/SearchPage').then((m) => ({ default: m.SearchPage }))
);
const AboutPage = lazy(() =>
  import('./pages/AboutPage').then((m) => ({ default: m.AboutPage }))
);
const HowItWorksPage = lazy(() =>
  import('./pages/HowItWorksPage').then((m) => ({ default: m.HowItWorksPage }))
);
const ContactPage = lazy(() =>
  import('./pages/ContactPage').then((m) => ({ default: m.ContactPage }))
);
const AdminPanelPage = lazy(() =>
  import('./pages/AdminPanelPage').then((m) => ({ default: m.AdminPanelPage }))
);
const AdminLoginPage = lazy(() =>
  import('./pages/AdminLoginPage').then((m) => ({ default: m.AdminLoginPage }))
);
const SignInPage = lazy(() =>
  import('./pages/SignInPage').then((m) => ({ default: m.SignInPage }))
);
const SignUpPage = lazy(() =>
  import('./pages/SignUpPage').then((m) => ({ default: m.SignUpPage }))
);
const MyQuestionsPage = lazy(() =>
  import('./pages/MyQuestionsPage').then((m) => ({ default: m.MyQuestionsPage }))
);

function LazyPage({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" richColors />
        <Routes>
          <Route path="/" element={<WithNavbar><HomePage /></WithNavbar>} />

          <Route
            path="/ask"
            element={
              <WithNavbar>
                <LazyPage><AskQuestionPage /></LazyPage>
              </WithNavbar>
            }
          />
          <Route
            path="/find-lawyers"
            element={
              <WithNavbar>
                <LazyPage><FindLawyersPage /></LazyPage>
              </WithNavbar>
            }
          />
          <Route
            path="/legal-topics"
            element={
              <WithNavbar>
                <LazyPage><LegalTopicsPage /></LazyPage>
              </WithNavbar>
            }
          />
          <Route
            path="/search"
            element={
              <WithNavbar>
                <LazyPage><SearchPage /></LazyPage>
              </WithNavbar>
            }
          />
          <Route
            path="/about"
            element={
              <WithNavbar>
                <LazyPage><AboutPage /></LazyPage>
              </WithNavbar>
            }
          />
          <Route
            path="/how-it-works"
            element={
              <WithNavbar>
                <LazyPage><HowItWorksPage /></LazyPage>
              </WithNavbar>
            }
          />
          <Route
            path="/contact"
            element={
              <WithNavbar>
                <LazyPage><ContactPage /></LazyPage>
              </WithNavbar>
            }
          />
          <Route path="/my-questions" element={
            <WithNavbar>
              <ProtectedRoute loginPath="/signin">
                <LazyPage><MyQuestionsPage /></LazyPage>
              </ProtectedRoute>
            </WithNavbar>
          } />
          <Route
            path="/signin"
            element={
              <GoogleOAuthRouteWrapper>
                <LazyPage><SignInPage /></LazyPage>
              </GoogleOAuthRouteWrapper>
            }
          />
          <Route
            path="/signup"
            element={
              <GoogleOAuthRouteWrapper>
                <LazyPage><SignUpPage /></LazyPage>
              </GoogleOAuthRouteWrapper>
            }
          />

          <Route
            path="/admin-login"
            element={
              <GoogleOAuthRouteWrapper>
                <LazyPage><AdminLoginPage /></LazyPage>
              </GoogleOAuthRouteWrapper>
            }
          />
          <Route
            path="/adminvoice2law001"
            element={
              <ProtectedRoute requireAdmin={true}>
                <LazyPage><AdminPanelPage /></LazyPage>
              </ProtectedRoute>
            }
          />
          <Route path="/admin" element={<Navigate to="/adminvoice2law001" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

function WithNavbar({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      {children}
    </div>
  );
}
