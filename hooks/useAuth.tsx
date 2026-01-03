import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User } from '../types';
import { mockUser } from '../data/mockData';

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithFacebook: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signUpWithEmail: (email: string, password: string, name?: string) => Promise<boolean>;
  signInWithEmail: (email: string, password: string) => Promise<boolean>;
  loginAsGuest: () => void;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('ventyUser');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  const API_BASE = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL) || '';

  const saveSession = (user: User, token: string) => {
    localStorage.setItem('ventyAuthToken', token);
    localStorage.setItem('ventyUser', JSON.stringify(user));
    setUser(user);
  };

  const clearSession = () => {
    localStorage.removeItem('ventyAuthToken');
    localStorage.removeItem('ventyUser');
    setUser(null);
  };

  const refreshSession = useCallback(async () => {
    const token = localStorage.getItem('ventyAuthToken');

    try {
      const res = await fetch(`${API_BASE}/api/auth/me`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const data = await res.json();
      
      if (data.ok && data.user) {
        const base = user || mockUser;
        const fullUser: User = {
            ...base,
            id: data.user.userId || data.user.id,
            email: data.user.email,
            name: data.user.name,
            profilePictureUrl: data.user.picture || base.profilePictureUrl,
            isVerified: !!data.user.isVerified,
            accountType: data.user.role === 'merchant' ? 'merchant' : (base.accountType || 'regular'),
            merchantProfile: data.user.merchantProfile || undefined
        } as User;
        
        const nextToken = data.token || token || '';
        if (nextToken) saveSession(fullUser, nextToken); else setUser(fullUser);
        const pic = fullUser.profilePictureUrl || '';
        if (/^https?:/i.test(pic) && !pic.startsWith('data:')) {
          try {
            const resp = await fetch(pic, { mode: 'cors' });
            const blob = await resp.blob();
            const reader = new FileReader();
            const dataUrl: string = await new Promise(resolve => {
              reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
              reader.readAsDataURL(blob);
            });
            const patched = { ...fullUser, profilePictureUrl: dataUrl };
            if (nextToken) saveSession(patched, nextToken); else setUser(patched);
          } catch {}
        }
      } else {
        // Token invalid
        clearSession();
      }
    } catch (e) {
      console.error("Session check failed", e);
      // On error (e.g. network), we might want to keep the local user?
      // But if 401, we should clear.
      // api/auth/me returns {ok:false} on 401 caught internally, so we handled it above.
    } finally {
      setLoading(false);
    }
  }, [API_BASE, user]);

  // 1. Initial Session Check
  useEffect(() => {
    let canceled = false;
    refreshSession().then(() => {
       if (canceled) return;
    });
    return () => { canceled = true; };
  }, []); // Run once on mount (and if API_BASE changes)

  // 2. Global Logout Listener (for 401s from api.ts)
  useEffect(() => {
    const handleLogoutEvent = () => {
      clearSession();
      window.location.href = '/'; // Redirect to home/login
    };
    window.addEventListener('auth:logout', handleLogoutEvent);
    return () => window.removeEventListener('auth:logout', handleLogoutEvent);
  }, []);

  const signInWithGoogle = async () => {
    const returnTo = window.location.pathname || '/';
    const state = encodeURIComponent(returnTo);
    window.location.assign(`${API_BASE}/api/auth/google?state=${state}`);
  };

  const signInWithFacebook = async () => {
    // Placeholder - would need client-side SDK or redirect
    console.warn("Facebook login not fully implemented in this demo");
  };

  const signInWithApple = async () => {
     // Placeholder
     console.warn("Apple login not fully implemented in this demo");
  };

  const signUpWithEmail = async (email: string, password: string, name?: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/email/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Signup failed');
      
      const u = data.user;
      const fullUser: User = {
          ...mockUser,
          id: u.userId,
          email: u.email,
          name: u.name,
          profilePictureUrl: u.picture || (user || mockUser).profilePictureUrl,
          isVerified: !!u.isVerified,
          accountType: u.role === 'merchant' ? 'merchant' : 'regular',
          merchantProfile: u.merchantProfile || undefined
      } as User;
      
      saveSession(fullUser, data.token);
      return true;
    } catch (e) {
      console.error("Signup Error", e);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/email/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Login failed');

      const u = data.user;
      // Merge with existing or mock
      const fullUser: User = {
          ...mockUser,
          id: u.userId,
          email: u.email,
          name: u.name,
          profilePictureUrl: u.picture || (user || mockUser).profilePictureUrl,
          isVerified: !!u.isVerified,
          accountType: u.role === 'merchant' ? 'merchant' : 'regular',
          merchantProfile: u.merchantProfile || undefined
      } as User;

      saveSession(fullUser, data.token);
      return true;
    } catch (e) {
      console.error("Login Error", e);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const loginAsGuest = () => {
    const guestId = `guest_${Math.random().toString(36).slice(2, 10)}`;
    const guestUser: User = {
        ...mockUser,
        id: guestId,
        name: 'Guest',
        email: 'guest@example.com',
        salary: 0,
        familyMembers: 1,
        contactInfo: { phone: '', address: '', preferredMeetup: '' },
        isGuest: true,
        accountType: 'regular',
        accountPlan: 'single',
    } as User;
    saveSession(guestUser, 'guest_token');
  };

  const logout = async () => {
    try {
      await fetch(`${API_BASE}/api/auth/logout`, { method: 'POST' });
    } catch {}
    clearSession();
  };

  const updateUser = useCallback((updates: Partial<User>) => {
    setUser(prev => {
        if (!prev) return null;
        const next = { ...prev, ...updates };
        localStorage.setItem('ventyUser', JSON.stringify(next));
        return next;
    });
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signInWithGoogle,
      signInWithFacebook,
      signInWithApple,
      signUpWithEmail,
      signInWithEmail,
      loginAsGuest,
      logout,
      updateUser,
      refreshSession
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
