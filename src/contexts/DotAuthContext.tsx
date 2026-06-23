/**
 * DotAuthContext — Authentication context backed by the Fastify API.
 *
 * Exports the same interface as the existing Supabase-based AuthContext
 * so pages can be migrated one at a time without breaking others.
 *
 * Usage (when migrating a page):
 *   import { useDotAuth } from "@/contexts/DotAuthContext";
 *   const { user, login, logout, isLoading } = useDotAuth();
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { getMe, login as apiLogin, signup as apiSignup, logout as apiLogout } from "@/api/auth";
import { getToken, setToken, clearToken } from "@/api/client";
import type { User } from "@/types/api";
import type { SignupData } from "@/api/auth";

/* ── Context shape — mirrors existing AuthContext ────────── */

interface DotAuthContextValue {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  /** Re-fetch user from the server (e.g., after role upgrade) */
  refresh: () => Promise<void>;
  /** Convenience helpers */
  hasRole: (role: string) => boolean;
  primaryRole: string | null;
  roles: string[];
}

const DotAuthContext = createContext<DotAuthContextValue | undefined>(undefined);

const ROLE_PRIORITY = ["admin", "super_admin", "community_leader", "investor", "founder", "vendor", "builder"];

/* ── Provider ───────────────────────────────────────────── */

export function DotAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(getToken());
  const [isLoading, setIsLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const stored = getToken();
    if (!stored) {
      setUser(null);
      setTokenState(null);
      setIsLoading(false);
      return;
    }
    const u = await getMe();
    setUser(u);
    setTokenState(u ? stored : null);
    if (!u) clearToken();
    setIsLoading(false);
  }, []);

  // On mount — load user from stored token
  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiLogin(email, password);
    setToken(res.token);
    setTokenState(res.token);
    setUser(res.user);
  }, []);

  const signup = useCallback(async (data: SignupData) => {
    const res = await apiSignup(data);
    setToken(res.token);
    setTokenState(res.token);
    setUser(res.user);
  }, []);

  const logout = useCallback(() => {
    apiLogout().catch(() => { /* best-effort */ });
    clearToken();
    setTokenState(null);
    setUser(null);
  }, []);

  const refresh = useCallback(async () => {
    await loadUser();
  }, [loadUser]);

  const roles = (user?.roles ?? []) as string[];
  const primaryRole = ROLE_PRIORITY.find((r) => roles.includes(r)) ?? null;
  const hasRole = (role: string) => roles.includes(role);

  return (
    <DotAuthContext.Provider
      value={{ user, token, login, signup, logout, isLoading, refresh, hasRole, primaryRole, roles }}
    >
      {children}
    </DotAuthContext.Provider>
  );
}

/* ── Hook ───────────────────────────────────────────────── */

export function useDotAuth(): DotAuthContextValue {
  const ctx = useContext(DotAuthContext);
  if (!ctx) throw new Error("useDotAuth must be used within DotAuthProvider");
  return ctx;
}
