import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const USERS_KEY = 'nexus_users';
const SESSION_KEY = 'nexus_session';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const safeRead = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};
const safeWrite = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable */
  }
};

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => safeRead(SESSION_KEY, null));

  // Seed admin + demo account on first visit
  useEffect(() => {
    const users = safeRead(USERS_KEY, []);
    let updated = [...users];

    // Add admin account
    if (!updated.some((u) => u.email === 'admin@nexus.gg')) {
      updated.push({
        name: 'Admin',
        email: 'admin@nexus.gg',
        password: 'admin123',
        role: 'admin',
        createdAt: Date.now(),
      });
    }

    // Add demo user account
    if (!updated.some((u) => u.email === 'demo@nexus.gg')) {
      updated.push({
        name: 'Demo Player',
        email: 'demo@nexus.gg',
        password: 'demo123',
        role: 'user',
        createdAt: Date.now(),
      });
    }

    if (updated.length !== users.length) {
      safeWrite(USERS_KEY, updated);
    }
  }, []);

  const register = ({ name, email, password }) => {
    const cleanEmail = email.trim().toLowerCase();
    if (name.trim().length < 3) return { ok: false, error: 'Username must be at least 3 characters.' };
    if (!EMAIL_RE.test(cleanEmail)) return { ok: false, error: 'Please enter a valid email address.' };
    if (password.length < 6) return { ok: false, error: 'Password must be at least 6 characters.' };

    const users = safeRead(USERS_KEY, []);
    if (users.some((u) => u.email === cleanEmail)) {
      return { ok: false, error: 'An account with this email already exists.' };
    }

    // Prevent registering as admin
    const newUser = { name: name.trim(), email: cleanEmail, password, role: 'user', createdAt: Date.now() };
    safeWrite(USERS_KEY, [...users, newUser]);

    const session = { name: newUser.name, email: newUser.email, role: newUser.role, joined: Date.now() };
    safeWrite(SESSION_KEY, session);
    setUser(session);
    return { ok: true };
  };

  const login = ({ email, password }) => {
    const cleanEmail = email.trim().toLowerCase();
    const users = safeRead(USERS_KEY, []);
    const found = users.find((u) => u.email === cleanEmail && u.password === password);
    if (!found) return { ok: false, error: 'Invalid email or password.' };

    const session = { name: found.name, email: found.email, role: found.role || 'user', joined: Date.now() };
    safeWrite(SESSION_KEY, session);
    setUser(session);
    return { ok: true };
  };

  const logout = () => {
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch {
      /* noop */
    }
    setUser(null);
  };

  // Admin functions
  const getAllUsers = () => {
    if (user?.role !== 'admin') return [];
    return safeRead(USERS_KEY, []);
  };

  const deleteUser = (email) => {
    if (user?.role !== 'admin') return false;
    const users = safeRead(USERS_KEY, []);
    const filtered = users.filter((u) => u.email !== email);
    safeWrite(USERS_KEY, filtered);
    return true;
  };

  const promoteUser = (email) => {
    if (user?.role !== 'admin') return false;
    const users = safeRead(USERS_KEY, []);
    const updated = users.map((u) => (u.email === email ? { ...u, role: 'admin' } : u));
    safeWrite(USERS_KEY, updated);
    return true;
  };

  const value = useMemo(
    () => ({ user, login, register, logout, getAllUsers, deleteUser, promoteUser }),
    [user]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}