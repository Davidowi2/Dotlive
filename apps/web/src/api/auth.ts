import { api } from "./client.js";
import type { AuthResponse, User } from "@dotlive/shared";

export const authApi = {
  signup: (input: { email: string; password: string; name?: string }) =>
    api.post<AuthResponse>("/api/auth/signup", input),

  login: (input: { email: string; password: string }) =>
    api.post<AuthResponse>("/api/auth/login", input),

  logout: () => api.post<{ ok: true }>("/api/auth/logout"),

  me: () => api.get<{ user: User }>("/api/auth/me"),

  googleUrl: () => `${import.meta.env.VITE_API_URL ?? ""}/api/auth/google`,
};
