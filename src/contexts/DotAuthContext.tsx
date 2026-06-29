/**
 * DotAuthContext — Authentication context backed by the Fastify API.
 *
 * Client-side only: all localStorage access and API calls are guarded
 * behind useEffect so they never run during SSR.
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

/* ── Context shape ─────────────────────────────────────── */

interface DotAuthContextValue {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => void;
  signOut: () => void;
  isLoading: boolean;
  refresh: () => Promise<void>;
  hasRole: (role: string) => boolean;
  primaryRole: string | null;
  roles: string[];
}

const DotAuthContext = createContext<DotAuthContextValue | undefined>(undefined);

const ROLE_PRIORITY = [
  "admin", "super_admin", "community_leader", "investor",
  "founder", "vendor", "builder",
];

/* ── Provider ──────────────────────────────────────────── */

export function DotAuthProvider({ children }: { children: ReactNode }) {
  // Start as null / loading=true — never read localStorage during SSR
  const [user, setUser]         = useState<User | null>(null);
  const [token, setTokenState]  = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUser = useCallback(async () => {
    // Guard: only runs on the client
    if (typeof window === "undefined") {
      setIsLoading(false);
      return;
    }

    try {
      const stored = getToken();
      if (!stored) {
        setUser(null);
        setTokenState(null);
        setIsLoading(false);
        return;
      }

      const u = await getMe();
      if (u) {
        setUser(u);
        setTokenState(stored);
      } else {
        clearToken();
        setUser(null);
        setTokenState(null);
      }
    } catch {
      // Token invalid or API unreachable — stay logged out
      clearToken();
      setUser(null);
      setTokenState(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Only runs on the client after hydration
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
      // Auto-attach referralCode from URL ?ref=CODE if present
      let referralCode = data.referralCode;
      if (!referralCode && typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        const fromUrl = params.get("ref") ?? params.get("referral");
        if (fromUrl) referralCode = fromUrl.trim().toUpperCase();
      }
      const res = await apiSignup({ ...data, referralCode });
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
      value={{ user, token, login, signup, logout, signOut: logout, isLoading, refresh, hasRole, primaryRole, roles }}
    >
      {children}
    </DotAuthContext.Provider>
  );
}

/* ── Hook ──────────────────────────────────────────────── */

export function useDotAuth(): DotAuthContextValue {
  const ctx = useContext(DotAuthContext);
  if (!ctx) {
    // Return a safe no-op default instead of throwing. During SSR
    // streaming or initial hydration, the DotAuthProvider may not be
    // mounted yet — throwing here cascades to the error boundary
    // and "This page didn't load". Components that need a real
    // value should check `isLoading` first.
    return {
      user: null,
      token: null,
      isLoading: true,
      roles: [],
      primaryRole: null,
      login: async () => { throw new Error("DotAuthProvider not mounted"); },
      signup: async () => { throw new Error("DotAuthProvider not mounted"); },
      logout: () => {},
            signOut: () => {},
            refresh: async () => {},
            hasRole: () => false,
          };
  }
  return ctx;
}
