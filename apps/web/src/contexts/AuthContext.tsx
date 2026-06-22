/**
 * AuthContext — JWT-based auth state for the SPA.
 *
 * - Token is stored in localStorage (set on signup/login).
 * - On mount we try to load the current user via /api/auth/me.
 *   If the token is invalid the helper in api/client redirects to /login.
 * - Role helpers (hasRole, primaryRole) match the backend's role list.
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { authApi } from "../api/auth.js";
import { setToken, getToken } from "../api/client.js";
import type { AppRole, User } from "@dotlive/shared";

interface AuthState {
  user: User | null;
  loading: boolean;
  signup: (input: { email: string; password: string; name?: string }) => Promise<void>;
  login: (input: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (role: AppRole) => boolean;
  /** The "primary" non-builder role, for display purposes. */
  primaryRole: AppRole | null;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    authApi
      .me()
      .then(({ user }) => setUser(user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  async function signup(input: { email: string; password: string; name?: string }) {
    const res = await authApi.signup(input);
    setToken(res.token);
    setUser(res.user);
  }

  async function login(input: { email: string; password: string }) {
    const res = await authApi.login(input);
    setToken(res.token);
    setUser(res.user);
  }

  async function logout() {
    try {
      await authApi.logout();
    } catch {
      /* ignore — token may already be invalid */
    }
    setToken(null);
    setUser(null);
  }

  function hasRole(role: AppRole) {
    return !!user?.roles?.includes(role);
  }

  // Builder is the default, so the "primary" role is the first
  // non-builder role a user has. Admin still wins for nav.
  const ROLE_PRIORITY: AppRole[] = ["admin", "super_admin", "founder", "investor", "community_leader", "vendor", "capital_partner"];
  const primaryRole: AppRole | null =
    user?.roles?.find((r) => ROLE_PRIORITY.includes(r)) ?? null;

  return (
    <AuthContext.Provider value={{ user, loading, signup, login, logout, hasRole, primaryRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
