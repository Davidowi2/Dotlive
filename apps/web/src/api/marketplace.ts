import { api } from "./client.js";
import type { Service, JobListing, ServiceOrder } from "@dotlive/shared";

export const marketplaceApi = {
  // Gigs
  listServices: (filters: { category?: string; search?: string } = {}) => {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(filters)) if (v) qs.set(k, String(v));
    return api.get<{ services: Service[] }>(`/api/services?${qs}`);
  },
  createService: (input: Partial<Service>) => api.post<{ service: Service }>("/api/services", input),

  // Jobs
  listJobs: (filters: { category?: string; minSalary?: number; maxSalary?: number; search?: string } = {}) => {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(filters)) if (v != null && v !== "") qs.set(k, String(v));
    return api.get<{ jobs: JobListing[] }>(`/api/jobs?${qs}`);
  },
  createJob: (input: Partial<JobListing>) => api.post<{ job: JobListing }>("/api/jobs", input),

  // Orders
  createOrder: (serviceId: string, requirements?: string) =>
    api.post<{ order: ServiceOrder }>("/api/orders", { serviceId, requirements }),
  myOrders: (role: "client" | "builder" = "client") =>
    api.get<{ orders: ServiceOrder[] }>(`/api/orders?role=${role}`),
};
