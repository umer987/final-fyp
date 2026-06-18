import React from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { toast } from 'sonner@2.0.3';

const googleClientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim();
const isGoogleOAuthConfigured =
  !!googleClientId && googleClientId !== 'your_google_client_id';

/** Loads Google OAuth script only on sign-in / sign-up routes (not on home). */
export function GoogleOAuthRouteWrapper({ children }: { children: React.ReactNode }) {
  if (!isGoogleOAuthConfigured) {
    return <>{children}</>;
  }

  return (
    <GoogleOAuthProvider
      clientId={googleClientId}
      onScriptLoadError={() =>
        toast.error(
          'Could not load Google sign-in. Disable ad blockers for accounts.google.com or check your network.'
        )
      }
    >
      {children}
    </GoogleOAuthProvider>
  );
}
