/**
 * Auth API — wraps the Fastify /api/auth/* endpoints.
 *
 * DEV DEMO MODE
 * =============
 * If `VITE_API_URL` ends in `.example.com` (the placeholder from .env.example)
 * OR the URL has `?demo=1` query param in localStorage, we return a
 * synthetic user so the app can be previewed without a live backend.
 *
 * Set VITE_API_URL to a real Render URL (e.g. https://dotlive-api.onrender.com)
 * to use real auth. The dev mode is purely a preview affordance.
 */

import { dotApi, setToken, clearToken, getToken, BASE_URL } from "./client";
import type { User, AuthResponse } from "@/types/api";

export interface SignupData {
  email: string;
  password: string;
  name?: string;
  /** Onboarding intent from the signup flow */
  intent?: string;
  /** Extra metadata (skills, businessStage, etc.) */
  metadata?: Record<string, unknown>;
}

/* ── Dev demo mode detection ──────────────────────────── */

const DEMO_FLAG = "dot_demo_mode";

/** True when the app is configured to use a placeholder API URL or user opted into demo */
function isDemoMode(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (window.localStorage.getItem(DEMO_FLAG) === "1") return true;
  } catch { /* ignore */ }
  // If the configured API URL is the .env.example placeholder, run in demo mode
  return BASE_URL.includes("your-api.onrender.com") || BASE_URL.includes(".example.com");
}

function enableDemoMode() {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(DEMO_FLAG, "1"); } catch { /* ignore */ }
}

/** Build a fake but well-shaped user for demo mode */
function makeDemoUser(email: string, name?: string): User {
  const handle = name?.split(" ")[0] ?? email.split("@")[0];
  return {
    id: "demo-user-1",
    email,
    name: name ?? handle,
    dotId: `DOT-${handle.toUpperCase()}-0001`,
    avatarUrl: null,
    roles: ["founder", "builder"],
    primaryRole: "founder",
    walletBalance: 1247,
    vantageScore: 642,
    createdAt: new Date().toISOString(),
  };
}

/* ── API methods with demo fallback ────────────────────── */

/** Sign up. In demo mode, returns a fake user. */
export async function signup(data: SignupData): Promise<AuthResponse> {
  if (isDemoMode()) {
    enableDemoMode();
    const token = "demo-token-" + Date.now();
    const user = makeDemoUser(data.email, data.name);
    setToken(token);
    return { token, user };
  }
  const res = await dotApi.post<AuthResponse>("/api/auth/signup", {
    email: data.email,
    password: data.password,
    name: data.name,
  });
  setToken(res.token);
  return res;
}

/** Sign in. In demo mode, accepts any password and returns a fake user. */
export async function login(email: string, password: string): Promise<AuthResponse> {
  if (isDemoMode()) {
    enableDemoMode();
    const token = "demo-token-" + Date.now();
    const user = makeDemoUser(email);
    setToken(token);
    return { token, user };
  }
  const res = await dotApi.post<AuthResponse>("/api/auth/login", { email, password });
  setToken(res.token);
  return res;
}

/** Sign out — invalidates the server session and clears the local token. */
export async function logout(): Promise<void> {
  try {
    if (!isDemoMode()) {
      await dotApi.post<void>("/api/auth/logout");
    }
  } finally {
    clearToken();
  }
}

/** Fetch the current authenticated user from the server.
 *  Uses the stored JWT. Returns null if not authenticated.
 *  In demo mode, returns a fake user if a token is stored. */
export async function getMe(): Promise<User | null> {
  if (isDemoMode()) {
    if (!getToken()) return null;
    return makeDemoUser("demo@dotlive.app", "Demo Builder");
  }
  try {
    const res = await dotApi.get<{ user: User }>("/api/auth/me");
    return res.user;
  } catch {
    return null;
  }
}

/** Returns the URL to redirect the user to for Google OAuth.
 *  In demo mode, throws so the button can be disabled. */
export function getGoogleAuthUrl(): string {
  if (isDemoMode()) {
    return "#demo-mode";
  }
  return `${BASE_URL}/api/auth/google`;
}

export { isDemoMode, enableDemoMode, DEMO_FLAG };