/**
 * Authentication API — wraps the Fastify /api/auth/* endpoints.
 */

import { dotApi, setToken, clearToken, BASE_URL } from "./client";
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

/**
 * Sign up a new user.
 * Stores the JWT token on success.
 */
export async function signup(data: SignupData): Promise<AuthResponse> {
  const res = await dotApi.post<AuthResponse>("/api/auth/signup", {
    email: data.email,
    password: data.password,
    name: data.name,
  });
  setToken(res.token);
  return res;
}

/**
 * Sign in with email + password.
 * Stores the JWT token on success.
 */
export async function login(email: string, password: string): Promise<AuthResponse> {
  const res = await dotApi.post<AuthResponse>("/api/auth/login", { email, password });
  setToken(res.token);
  return res;
}

/**
 * Sign out — invalidates the server session and clears the local token.
 */
export async function logout(): Promise<void> {
  try {
    await dotApi.post<void>("/api/auth/logout");
  } finally {
    clearToken();
  }
}

/**
 * Fetch the current authenticated user from the server.
 * Uses the stored JWT. Returns null if not authenticated.
 */
export async function getMe(): Promise<User | null> {
  try {
    const res = await dotApi.get<{ user: User }>("/api/auth/me");
    return res.user;
  } catch {
    return null;
  }
}

/**
 * Returns the URL to redirect the user to for Google OAuth.
 * The backend handles the OAuth dance and redirects back to /auth/callback.
 */
export function getGoogleAuthUrl(): string {
  return `${BASE_URL}/api/auth/google`;
}
