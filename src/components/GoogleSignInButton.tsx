import { useEffect, useRef, useState } from 'react';
import { GoogleLogin, useGoogleOAuth, type CredentialResponse } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner@2.0.3';

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();
const isClientIdConfigured =
  !!googleClientId && googleClientId !== 'your_google_client_id';

/**
 * Google Identity Services (GIS) sign-in button.
 *
 * Troubleshooting blank https://accounts.google.com/gsi/select page:
 * - Use credential (ID token) flow via <GoogleLogin onSuccess> — not useGoogleLogin redirect.
 * - ux_mode must be "popup" so the main tab stays on localhost:5173.
 * - Google Cloud → OAuth consent screen configured; add test users if app is in Testing.
 * - Authorized JavaScript origins: http://localhost:5173 and http://localhost:5174 (and production URL).
 * - If you see Error 400 origin_mismatch, add the exact URL bar origin in Google Cloud Console.
 * - VITE_GOOGLE_CLIENT_ID must match the Web client ID in Google Console (same as backend GOOGLE_CLIENT_ID).
 */
export function GoogleSignInButton() {
  if (!isClientIdConfigured) {
    return (
      <p className="text-center text-sm text-[#0B3D2E]/60">
        Google sign-in is not configured. Set <code className="text-xs">VITE_GOOGLE_CLIENT_ID</code> in your
        frontend <code className="text-xs">.env</code> file.
      </p>
    );
  }

  return <GoogleSignInButtonInner />;
}

function GoogleSignInButtonInner() {
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const { scriptLoadedSuccessfully } = useGoogleOAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const [buttonWidth, setButtonWidth] = useState(400);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const oauthOrigin =
    typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.host}` : '';
  const showOriginHint =
    typeof window !== 'undefined' &&
    window.location.hostname === 'localhost' &&
    oauthOrigin !== 'http://localhost:5173';

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateWidth = () => {
      const w = Math.floor(el.getBoundingClientRect().width);
      if (w > 0) setButtonWidth(w);
    };

    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  if (!scriptLoadedSuccessfully) {
    return (
      <div
        ref={containerRef}
        className="flex h-10 w-full items-center justify-center rounded-xl border border-[#0B3D2E]/10 bg-[#F8F9FA] text-sm text-[#0B3D2E]/50"
      >
        Loading Google sign-in…
      </div>
    );
  }

  const handleSuccess = async (response: CredentialResponse) => {
    if (!response.credential) {
      toast.error('Google sign-in did not return a credential');
      return;
    }

    setIsSubmitting(true);
    try {
      const profile = await loginWithGoogle(response.credential);
      if (profile) {
        const label = profile.displayName || profile.name;
        toast.success(label ? `Welcome, ${label}` : 'Signed in with Google');
        navigate(profile.role === 'admin' ? '/adminvoice2law001' : '/');
      } else {
        toast.error(
          'Google sign-in failed. Ensure the backend is running and GOOGLE_CLIENT_ID + JWT_SECRET are set in backend/.env.'
        );
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Google sign-in failed';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex w-full flex-col gap-2">
      {showOriginHint && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          Google sign-in needs <strong>{oauthOrigin}</strong> in Google Cloud Console → Credentials →
          your OAuth client → <strong>Authorized JavaScript origins</strong>. Or free port 5173 and open{' '}
          <strong>http://localhost:5173</strong>.
        </p>
      )}
    <div
      ref={containerRef}
      className={`flex w-full justify-center [&>div]:w-full [&>div>div]:!w-full ${isSubmitting ? 'pointer-events-none opacity-60' : ''}`}
      aria-busy={isSubmitting}
    >
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={() =>
          toast.error(
            'Google sign-in was cancelled or blocked. If you saw a blank Google page, allow popups for this site or check OAuth settings in Google Cloud Console.'
          )
        }
        useOneTap={false}
        ux_mode="popup"
        auto_select={false}
        itp_support
        theme="outline"
        size="large"
        text="continue_with"
        shape="rectangular"
        width={buttonWidth}
      />
    </div>
    </div>
  );
}
