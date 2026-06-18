import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { api, UserProfile } from '../lib/api';
import { clearAuthToken, getAuthToken, setAuthToken } from '../lib/authToken';

function normalizeUser(user: UserProfile): UserProfile {
  const displayName =
    user.displayName?.trim() ||
    user.name?.trim() ||
    user.email?.split('@')[0]?.trim() ||
    'User';
  const picture = user.photoURL || user.picture || null;
  return {
    ...user,
    name: displayName,
    displayName,
    picture,
    photoURL: picture,
  };
}

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  loginWithGoogle: (credential: string) => Promise<UserProfile | null>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<UserProfile | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = useCallback(async (): Promise<UserProfile | null> => {
    if (!getAuthToken()) {
      setUser(null);
      setIsLoading(false);
      return null;
    }

    try {
      const response = await api.authMe();
      setUser(normalizeUser(response.user));
      return normalizeUser(response.user);
    } catch {
      clearAuthToken();
      setUser(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void checkAuth();
  }, [checkAuth]);

  const loginWithGoogle = useCallback(async (credential: string): Promise<UserProfile | null> => {
    setIsLoading(true);
    try {
      const response = await api.loginWithGoogle(credential);
      setAuthToken(response.token);
      const profile = normalizeUser(response.user);
      setUser(profile);
      return profile;
    } catch (err) {
      clearAuthToken();
      setUser(null);
      const message = err instanceof Error ? err.message : 'Google sign-in failed';
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await api.logout().catch(() => undefined);
    clearAuthToken();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isAdmin: user?.role === 'admin',
      isLoading,
      loginWithGoogle,
      logout,
      checkAuth,
    }),
    [user, isLoading, loginWithGoogle, logout, checkAuth],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
