import { api } from "./client.js";
import type { Venture } from "@dotlive/shared";

export const ventureApi = {
  list: (filters: { stage?: string; industry?: string; search?: string } = {}) => {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(filters)) if (v) qs.set(k, String(v));
    return api.get<{ ventures: Venture[] }>(`/api/ventures?${qs}`);
  },
  get: (id: string) => api.get<{ venture: Venture }>(`/api/ventures/${id}`),
  create: (input: Partial<Venture>) => api.post<{ venture: Venture }>("/api/ventures", input),
  update: (id: string, input: Partial<Venture>) =>
    api.patch<{ venture: Venture }>(`/api/ventures/${id}`, input),
};
