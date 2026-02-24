import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  role: 'admin' | 'user';
  name: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Secure admin credentials (in production, this should be in a backend)
const ADMIN_CREDENTIALS = {
  email: 'admin@voice2law.com',
  password: 'Voice2Law@Admin2024!', // Strong password
  user: {
    id: 'admin-001',
    email: 'admin@voice2law.com',
    role: 'admin' as const,
    name: 'Voice2Law Admin'
  }
};

// Session timeout (30 minutes)
const SESSION_TIMEOUT = 30 * 60 * 1000;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication on mount and restore session
  useEffect(() => {
    checkAuth();
    
    // Check session expiry every minute
    const interval = setInterval(() => {
      checkSessionExpiry();
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const checkAuth = () => {
    try {
      const storedUser = localStorage.getItem('voice2law_admin_user');
      const sessionExpiry = localStorage.getItem('voice2law_session_expiry');
      
      if (storedUser && sessionExpiry) {
        const expiryTime = parseInt(sessionExpiry, 10);
        const currentTime = Date.now();
        
        if (currentTime < expiryTime) {
          const parsedUser = JSON.parse(storedUser);
          if (parsedUser.role === 'admin') {
            setUser(parsedUser);
            setIsAuthenticated(true);
            // Extend session on activity
            extendSession();
          } else {
            logout();
          }
        } else {
          logout();
        }
      }
    } catch (error) {
      console.error('Auth check error:', error);
      logout();
    }
  };

  const checkSessionExpiry = () => {
    const sessionExpiry = localStorage.getItem('voice2law_session_expiry');
    if (sessionExpiry) {
      const expiryTime = parseInt(sessionExpiry, 10);
      const currentTime = Date.now();
      
      if (currentTime >= expiryTime) {
        logout();
      }
    }
  };

  const extendSession = () => {
    const newExpiry = Date.now() + SESSION_TIMEOUT;
    localStorage.setItem('voice2law_session_expiry', newExpiry.toString());
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // Verify credentials
      if (email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password) {
        const sessionExpiry = Date.now() + SESSION_TIMEOUT;
        
        // Store user and session
        localStorage.setItem('voice2law_admin_user', JSON.stringify(ADMIN_CREDENTIALS.user));
        localStorage.setItem('voice2law_session_expiry', sessionExpiry.toString());
        localStorage.setItem('voice2law_login_time', Date.now().toString());
        
        setUser(ADMIN_CREDENTIALS.user);
        setIsAuthenticated(true);
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    // Clear all auth data
    localStorage.removeItem('voice2law_admin_user');
    localStorage.removeItem('voice2law_session_expiry');
    localStorage.removeItem('voice2law_login_time');
    
    setUser(null);
    setIsAuthenticated(false);
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isAdmin, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
