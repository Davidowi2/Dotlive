/**
 * DOT API client — fetch wrapper for the Fastify backend.
 *
 * - Base URL: VITE_API_URL env var (default: https://dotlive-api.onrender.com)
 * - JWT stored in localStorage under 'dot_jwt'
 * - Auto-attaches Authorization: Bearer <token> header
 * - Handles 401 by clearing token and redirecting to /auth
 * - Throws ApiError on non-2xx responses
 */

export class ApiError extends Error {
  constructor(message: string, public status?: number, public code?: string) {
    super(message);
    this.name = "ApiError";
  }
}

const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? "https://dotlive-api.onrender.com";
const TOKEN_KEY = "dot_jwt";

/* ── Token helpers ─────────────────────────────────────── */

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch { /* storage unavailable */ }
}

export function clearToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch { /* storage unavailable */ }
}

/* ── Core fetch ────────────────────────────────────────── */

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  options?: RequestInit
): Promise<T> {
  const token = getToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string> | undefined),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    ...options,
  });

  // 401 — token expired or invalid
  if (res.status === 401) {
    clearToken();
    if (typeof window !== "undefined") {
      window.location.href = "/auth?mode=signin&expired=1";
    }
    throw new ApiError("Session expired", 401, "session_expired");
  }

  if (!res.ok) {
    let err: any = { error: `Request failed (${res.status})` };
    try {
      err = await res.json();
    } catch {
      /* not JSON */
    }
    throw new ApiError(err.error || `Request failed (${res.status})`, res.status, err.code);
  }

  // 204 — no content
  if (res.status === 204) return undefined as T;

  return res.json() as Promise<T>;
}

/* ── Public API ────────────────────────────────────────── */

export const dotApi = {
  get: <T = unknown>(path: string, options?: RequestInit) =>
    request<T>("GET", path, undefined, options),
  post: <T = unknown>(path: string, body?: unknown, options?: RequestInit) =>
    request<T>("POST", path, body, options),
  put: <T = unknown>(path: string, body?: unknown, options?: RequestInit) =>
    request<T>("PUT", path, body, options),
  patch: <T = unknown>(path: string, body?: unknown, options?: RequestInit) =>
    request<T>("PATCH", path, body, options),
  delete: <T = unknown>(path: string, options?: RequestInit) =>
    request<T>("DELETE", path, undefined, options),
};

export { BASE_URL };