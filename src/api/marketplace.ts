import { dotApi } from "@/api/client";
/**
 * Marketplace API — wraps the Fastify /api/services, /api/jobs, /api/orders endpoints.
 */
import type { Service, JobListing, ServiceOrder } from "@/types/api";

/* ── Services (Gigs) ──────────────────────────────── */

export interface ServiceData {
  title: string;
  description: string;
  category: string;
  priceDot: number;
  deliveryDays: number;
  isActive?: boolean;
}

export interface ServiceFilters {
  category?: string;
  search?: string;
  limit?: number;
}

export async function listServices(filters?: ServiceFilters): Promise<Service[]> {
  const params = new URLSearchParams();
  if (filters?.category) params.set("category", filters.category);
  if (filters?.search) params.set("search", filters.search);
  if (filters?.limit) params.set("limit", String(filters.limit));
  const query = params.toString() ? `?${params}` : "";
  const res = await dotApi.get<{ services: Service[] }>(`/api/services${query}`);
  return res.services ?? [];
}

export async function createService(data: ServiceData): Promise<Service> {
  const res = await dotApi.post<{ service: Service }>("/api/services", data);
  return res.service;
}

export async function updateService(id: string, data: Partial<ServiceData>): Promise<Service> {
  const res = await dotApi.patch<{ service: Service }>(`/api/services/${id}`, data);
  return res.service;
}

export async function deleteService(id: string): Promise<void> {
  await dotApi.delete<void>(`/api/services/${id}`);
}

export async function listMyServices(): Promise<Service[]> {
  const res = await dotApi.get<{ services: Service[] }>("/api/services/mine");
  return res.services ?? [];
}

/* ── Jobs ─────────────────────────────────────────── */

export interface JobData {
  title: string;
  description: string;
  category: string;
  salaryDot: number;
  employmentType: string;
  requirements?: string;
  isOpen?: boolean;
}

export interface JobFilters {
  category?: string;
  search?: string;
  limit?: number;
  minSalary?: number;
  employmentType?: string;
}

export async function listJobs(filters?: JobFilters): Promise<JobListing[]> {
  const params = new URLSearchParams();
  if (filters?.category) params.set("category", filters.category);
  if (filters?.search) params.set("search", filters.search);
  if (filters?.limit) params.set("limit", String(filters.limit));
  if (filters?.minSalary) params.set("minSalary", String(filters.minSalary));
  if (filters?.employmentType) params.set("employmentType", filters.employmentType);
  const query = params.toString() ? `?${params}` : "";
  const res = await dotApi.get<{ jobs: JobListing[] }>(`/api/jobs${query}`);
  return res.jobs ?? [];
}

export async function createJob(data: JobData): Promise<JobListing> {
  const res = await dotApi.post<{ job: JobListing }>("/api/jobs", data);
  return res.job;
}

export async function updateJob(id: string, data: Partial<JobData>): Promise<JobListing> {
  const res = await dotApi.patch<{ job: JobListing }>(`/api/jobs/${id}`, data);
  return res.job;
}

export async function deleteJob(id: string): Promise<void> {
  await dotApi.delete<void>(`/api/jobs/${id}`);
}

/* ── Orders ───────────────────────────────────────── */

export async function listOrders(role: "client" | "builder" = "client"): Promise<ServiceOrder[]> {
  const res = await dotApi.get<{ orders: ServiceOrder[] }>(`/api/orders?role=${role}`);
  return res.orders ?? [];
}

export async function createOrder(serviceId: string, requirements?: string): Promise<ServiceOrder> {
  const res = await dotApi.post<{ order: ServiceOrder }>("/api/orders", { serviceId, requirements });
  return res.order;
}

export async function deliverOrder(orderId: string, note?: string): Promise<ServiceOrder> {
  const res = await dotApi.patch<{ order: ServiceOrder }>(`/api/orders/${orderId}/deliver`, { note });
  return res.order;
}

export async function completeOrder(orderId: string): Promise<ServiceOrder> {
  const res = await dotApi.patch<{ order: ServiceOrder }>(`/api/orders/${orderId}/complete`);
  return res.order;
}

export async function cancelOrder(orderId: string): Promise<ServiceOrder> {
  const res = await dotApi.patch<{ order: ServiceOrder }>(`/api/orders/${orderId}/cancel`);
  return res.order;
}

export interface ServiceReview {
  id: string;
  orderId: string;
  authorId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

/**
 * Leave a review for a completed order
 */
export async function reviewOrder(
  orderId: string,
  data: { rating: number; comment: string }
): Promise<ServiceReview> {
  const res = await dotApi.post<{ review: ServiceReview }>(`/api/orders/${orderId}/review`, data);
  return res.review;
}
