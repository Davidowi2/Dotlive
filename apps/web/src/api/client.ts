/**
 * Fetch wrapper.
 *
 * - Adds `Authorization: Bearer <token>` from localStorage.
 * - Throws ApiError with status + body for non-2xx responses.
 * - JSON in/out by default; .upload() handles FormData.
 */

const BASE_URL = import.meta.env.VITE_API_URL ?? "";
const TOKEN_KEY = "dotlive.token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token: string | null): void {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, message: string, body: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

interface RequestOpts {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

async function request<T>(path: string, opts: RequestOpts = {}): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...opts.headers,
  };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let body: BodyInit | undefined;
  if (opts.body !== undefined) {
    if (opts.body instanceof FormData || opts.body instanceof Blob) {
      body = opts.body;
    } else {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(opts.body);
    }
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method: opts.method ?? "GET",
    headers,
    body,
    signal: opts.signal,
  });

  const contentType = res.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  const payload = isJson ? await res.json().catch(() => null) : await res.text();

  if (!res.ok) {
    const msg =
      (isJson && payload && typeof payload === "object" && "error" in payload
        ? String((payload as any).error)
        : res.statusText) || "Request failed";
    if (res.status === 401) {
      setToken(null);
      // Soft redirect — the AuthContext will pick this up.
      if (!path.startsWith("/api/auth/")) {
        window.location.assign("/login");
      }
    }
    throw new ApiError(res.status, msg, payload);
  }

  return payload as T;
}

export const api = {
  get: <T>(path: string, opts?: RequestOpts) => request<T>(path, { ...opts, method: "GET" }),
  post: <T>(path: string, body?: unknown, opts?: RequestOpts) =>
    request<T>(path, { ...opts, method: "POST", body }),
  patch: <T>(path: string, body?: unknown, opts?: RequestOpts) =>
    request<T>(path, { ...opts, method: "PATCH", body }),
  delete: <T>(path: string, opts?: RequestOpts) => request<T>(path, { ...opts, method: "DELETE" }),

  /** Upload a single file to /api/upload/document (multipart). */
  upload: async <T>(path: string, file: File, extraFields: Record<string, string> = {}): Promise<T> => {
    const form = new FormData();
    form.append("file", file);
    for (const [k, v] of Object.entries(extraFields)) form.append(k, v);
    return request<T>(path, { method: "POST", body: form });
  },
};
