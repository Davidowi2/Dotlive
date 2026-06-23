/**
 * DOT API client — fetch wrapper for the Fastify backend.
 *
 * - Base URL: VITE_API_URL env var (default: https://dotlive-api.onrender.com)
 * - JWT stored in localStorage under 'dot_jwt'
 * - Auto-attaches Authorization: Bearer <token> header
 * - Handles 401 by clearing token and redirecting to /auth
 * - Throws ApiError on non-2xx responses
 */

import { ApiError, type ApiErrorResponse } from "@/types/api";

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
    // Only redirect if we're in a browser context
    if (typeof window !== "undefined") {
      window.location.href = "/auth";
    }
    throw new ApiError("Unauthorized — please sign in again.", 401, "unauthorized");
  }

  // Parse response body
  let data: unknown;
  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    data = await res.json();
  } else {
    data = await res.text();
  }

  if (!res.ok) {
    const err = data as ApiErrorResponse;
    throw new ApiError(
      err?.error ?? `Request failed with status ${res.status}`,
      res.status,
      err?.code,
      err?.details
    );
  }

  return data as T;
}

/* ── Public API ────────────────────────────────────────── */

export const dotApi = {
  get<T>(path: string, options?: RequestInit): Promise<T> {
    return request<T>("GET", path, undefined, options);
  },

  post<T>(path: string, body?: unknown, options?: RequestInit): Promise<T> {
    return request<T>("POST", path, body, options);
  },

  patch<T>(path: string, body?: unknown, options?: RequestInit): Promise<T> {
    return request<T>("PATCH", path, body, options);
  },

  put<T>(path: string, body?: unknown, options?: RequestInit): Promise<T> {
    return request<T>("PUT", path, body, options);
  },

  delete<T>(path: string, options?: RequestInit): Promise<T> {
    return request<T>("DELETE", path, undefined, options);
  },
};

export { BASE_URL };
