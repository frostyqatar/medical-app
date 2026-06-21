import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';

interface AuthState {
  token: string | null;
  username: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthState | null>(null);

const STORAGE_KEY = 'care-tracker-auth';
const AUTO_LOGOUT_MS = 3 * 60 * 60 * 1000; // 3 hours
const CHECK_INTERVAL_MS = 60 * 1000; // check every minute

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const lastActivityRef = useRef<number>(Date.now());

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const { token: t, username: u } = JSON.parse(stored);
        if (t && u) {
          setToken(t);
          setUsername(u);
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setLoading(false);
  }, []);

  const resetTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  useEffect(() => {
    if (!token) return;

    const onActivity = () => resetTimer();
    window.addEventListener('mousemove', onActivity, { passive: true });
    window.addEventListener('keydown', onActivity, { passive: true });
    window.addEventListener('click', onActivity, { passive: true });
    window.addEventListener('scroll', onActivity, { passive: true });
    window.addEventListener('touchstart', onActivity, { passive: true });

    const interval = setInterval(() => {
      if (Date.now() - lastActivityRef.current > AUTO_LOGOUT_MS) {
        localStorage.removeItem(STORAGE_KEY);
        setToken(null);
        setUsername(null);
      }
    }, CHECK_INTERVAL_MS);

    return () => {
      window.removeEventListener('mousemove', onActivity);
      window.removeEventListener('keydown', onActivity);
      window.removeEventListener('click', onActivity);
      window.removeEventListener('scroll', onActivity);
      window.removeEventListener('touchstart', onActivity);
      clearInterval(interval);
    };
  }, [token, resetTimer]);

  const login = async (user: string, pass: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: user, password: pass }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Login failed' }));
      throw new Error(err.detail || 'Login failed');
    }
    const data = await res.json();
    const t = data.token;
    const u = data.username;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ token: t, username: u }));
    resetTimer();
    setToken(t);
    setUsername(u);
  };

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setToken(null);
    setUsername(null);
  }, []);

  return (
    <AuthContext.Provider value={{ token, username, login, logout, isAuthenticated: !!token, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
