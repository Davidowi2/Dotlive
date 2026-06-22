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
  /** Set true to opt out of automatic 401 handling. */
  skipAuthRetry?: boolean;
}

interface ApiResponseMeta {
  status: number;
  ok: boolean;
}

async function request<T>(path: string, opts: RequestOpts = {}): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...opts.headers,
  };
  const token = getToken();
  if (token && !opts.skipAuthRetry) headers.Authorization = `Bearer ${token}`;

  let body: BodyInit | undefined;
  if (opts.body !== undefined) {
    if (opts.body instanceof FormData || opts.body instanceof Blob) {
      body = opts.body;
    } else {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(opts.body);
    }
  }

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method: opts.method ?? "GET",
      headers,
      body,
      signal: opts.signal,
    });
  } catch (e) {
    // Network error — bubble up with a clearer message.
    throw new ApiError(0, e instanceof Error ? e.message : "Network error", null);
  }

  const contentType = res.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  const payload = isJson ? await res.json().catch(() => null) : await res.text();

  // 401 on a non-auth route: token is dead. Clear it and let the
  // AuthContext pick up the change on next mount. We dispatch a
  // custom event so the AuthContext can react synchronously.
  if (res.status === 401 && !path.startsWith("/api/auth/") && !opts.skipAuthRetry) {
    setToken(null);
    window.dispatchEvent(new CustomEvent("dotlive:auth:expired"));
    if (window.location.pathname !== "/login") {
      window.location.assign("/login?expired=1");
    }
    throw new ApiError(401, "Session expired. Please log in again.", payload);
  }

  if (!res.ok) {
    const msg =
      (isJson && payload && typeof payload === "object" && "error" in payload
        ? String((payload as any).error)
        : res.statusText) || "Request failed";
    throw new ApiError(res.status, msg, payload);
  }

  return payload as T;
}

void ({} as ApiResponseMeta); // type marker — keeps the interface import-clean

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
