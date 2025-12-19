import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getAuth } from '../auth/firebase';
import {
  FacebookAuthProvider,
  OAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';

export interface AuthContextType {
  user: FirebaseUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithFacebook: () => Promise<FirebaseUser | null>;
  signInWithApple: () => Promise<FirebaseUser | null>;
  signUpWithEmail: (email: string, password: string, name?: string) => Promise<FirebaseUser | null>;
  signInWithEmail: (email: string, password: string) => Promise<FirebaseUser | null>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const API_BASE = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL) || '';

  // Helper to adapt backend user to Firebase User interface
  const adaptUser = (backendUser: any): FirebaseUser => {
    return {
        uid: backendUser.userId || backendUser.id,
        email: backendUser.email,
        displayName: backendUser.name,
        photoURL: backendUser.picture,
        emailVerified: true,
        isAnonymous: false,
        metadata: {},
        providerData: [],
        refreshToken: '',
        tenantId: null,
        delete: async () => {},
        getIdToken: async () => '',
        getIdTokenResult: async () => ({} as any),
        reload: async () => {},
        toJSON: () => ({}),
        phoneNumber: null,
        providerId: 'google.com', // Default or dynamic
    } as unknown as FirebaseUser;
  };

  // Check for session on mount
  useEffect(() => {
    let canceled = false;
    (async () => {
      try {
        const r = await fetch(`${API_BASE}/api/auth/me`, { credentials: 'include' });
        const data = await r.json();
        if (!canceled && data?.ok && data.user) {
          setUser(adaptUser(data.user));
        }
      } catch (e) {
          console.error("Session check failed", e);
      } finally {
        if (!canceled) setLoading(false);
      }
    })();
    return () => { canceled = true; };
  }, [API_BASE]);

  // Sync with Firebase Auth (if used in parallel)
  useEffect(() => {
    const a = getAuth();
    if (!a) return;
    return onAuthStateChanged(a, (u) => {
        if (u) {
            // Prefer Firebase user if active, but we mostly rely on our backend session for Google
            // This might conflict if we have both. 
            // For now, if we have a backend user, we keep it. If Firebase emits, we might update.
            // But since we moved Google to backend-only, Firebase won't emit for Google.
            // It might emit for Facebook/Apple if they still use client-side flow.
            setUser(u);
        }
    });
  }, []);

  const signInWithGoogle = async () => {
    try {
      const returnTo = window.location.pathname || '/';
      const state = encodeURIComponent(returnTo);
      // Redirect to backend Google Auth handler
      window.location.assign(`${API_BASE}/api/auth/google?state=${state}`);
    } catch (e) {
      console.error("Google Sign In Error", e);
    }
  };

  const signInWithFacebook = async () => {
    try {
      const provider = new FacebookAuthProvider();
      const a = getAuth();
      if (!a) throw new Error("Firebase not initialized");
      const res = await signInWithPopup(a, provider);
      const cred = FacebookAuthProvider.credentialFromResult(res) as any;
      const accessToken = cred?.accessToken;
      if (!accessToken) throw new Error("No access token");

      const r = await fetch(`${API_BASE}/api/auth/facebook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ accessToken }),
      });
      const data = await r.json();
      if (!r.ok || !data?.ok) throw new Error("Backend verification failed");
      
      const u = adaptUser(data.user);
      setUser(u);
      return u;
    } catch (e) {
      console.error("Facebook Sign In Error", e);
      return null;
    }
  };

  const signInWithApple = async () => {
    try {
      const provider = new OAuthProvider('apple.com');
      const a = getAuth();
      if (!a) throw new Error("Firebase not initialized");
      const res = await signInWithPopup(a, provider);
      const cred = OAuthProvider.credentialFromResult(res) as any;
      const idToken = cred?.idToken;
      if (!idToken) throw new Error("No ID token");

      const r = await fetch(`${API_BASE}/api/auth/apple`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ idToken }),
      });
      const data = await r.json();
      if (!r.ok || !data?.ok) throw new Error("Backend verification failed");

      const u = adaptUser(data.user);
      setUser(u);
      return u;
    } catch (e) {
      console.error("Apple Sign In Error", e);
      return null;
    }
  };

  const signUpWithEmail = async (email: string, password: string, name?: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/email/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Signup failed');
      setUser(adaptUser(data.user));
      return adaptUser(data.user);
    } catch (e) {
      console.error("Signup Error", e);
      throw e;
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/email/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      setUser(adaptUser(data.user));
      return adaptUser(data.user);
    } catch (e) {
      console.error("Login Error", e);
      throw e;
    }
  };

  const signOutFn = async () => {
    const a = getAuth();
    try {
      await fetch(`${API_BASE}/api/auth/logout`, { method: 'POST', credentials: 'include' });
    } catch {}
    if (a) {
      await signOut(a);
    }
    setUser(null);
  };

  const value = useMemo(() => ({
    user,
    loading,
    signInWithGoogle,
    signInWithFacebook,
    signInWithApple,
    signUpWithEmail,
    signInWithEmail,
    signOut: signOutFn,
  }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
