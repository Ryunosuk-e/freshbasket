import { createContext, useCallback, useContext, useState } from 'react';

const AuthContext = createContext(null);
const STORAGE_KEY = 'freshbasket_auth';

function readStoredAuth() {
  const raw = localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => readStoredAuth());

  // rememberMe=true -> localStorage (survives closing the browser).
  // rememberMe=false -> sessionStorage (cleared when the tab/browser closes).
  const login = useCallback((user, token, rememberMe = true) => {
    const payload = { user, token };
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem(STORAGE_KEY, JSON.stringify(payload));
    setAuth(payload);
  }, []);

  // Used after Complete Your Profile succeeds, so the app immediately knows
  // profile_completed is now true without requiring a fresh login.
  const updateUser = useCallback((updatedFields) => {
    setAuth((prev) => {
      if (!prev) return prev;
      const next = { ...prev, user: { ...prev.user, ...updatedFields } };
      const storage = localStorage.getItem(STORAGE_KEY) ? localStorage : sessionStorage;
      storage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
    setAuth(null);
  }, []);

  const value = {
    user: auth?.user || null,
    token: auth?.token || null,
    isAuthenticated: Boolean(auth?.token),
    login,
    updateUser,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
