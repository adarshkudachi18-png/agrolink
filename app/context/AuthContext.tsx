import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// ── Types ─────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  username: string;
  email: string;
  phone: string;
  role: 'farmer' | 'retailer' | 'transporter';
  location: string | null;
  pincode: string | null;
  farmName: string | null;
  farmSizeAcres: string | null;
  businessName: string | null;
  gstNumber: string | null;
  createdAt: string;
  profileCompleted: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
}

// ── Context ───────────────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextType | null>(null);

// ── AuthProvider ──────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user from DB using the HTTP-only cookie (credentials: 'include')
  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        credentials: 'include', // sends cookie automatically
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  }, []);

  // On every app mount — check if a valid session cookie exists
  useEffect(() => {
    setIsLoading(true);
    fetchUser().finally(() => setIsLoading(false));
  }, [fetchUser]);

  const refreshUser = useCallback(async () => {
    await fetchUser();
  }, [fetchUser]);

  const logout = useCallback(async () => {
    // Tell backend to clear the HTTP-only cookie
    await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, refreshUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
