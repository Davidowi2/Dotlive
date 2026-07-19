import { dotApi } from "@/api/client";
import type { Venture } from "@/types/api";

export interface VentureData {
  name: string;
  industry?: string;
  stage?: string;
  country?: string;
  description?: string;
  website?: string;
  fundingGoal?: number;
  logoUrl?: string;
}

export interface VentureListFilters {
  stage?: string;
  industry?: string;
  country?: string;
  search?: string;
  minVantage?: number;
  minFundability?: number;
  sort?: "newest" | "vantage_desc" | "fundability_desc";
  limit?: number;
}

/** Create a new venture for the current user. */
export async function createVenture(data: VentureData): Promise<Venture> {
  const res = await dotApi.post<{ venture: Venture }>("/api/ventures", data);
  return res.venture;
}

/** Update an existing venture. */
export async function updateVenture(id: string, data: Partial<VentureData>): Promise<Venture> {
  const res = await dotApi.patch<{ venture: Venture }>(`/api/ventures/${id}`, data);
  return res.venture;
}

/** Get a single venture by ID. */
export async function getVenture(id: string): Promise<Venture> {
  const res = await dotApi.get<{ venture: Venture }>(`/api/ventures/${id}`);
  return res.venture;
}

/** List ventures with optional filters. */
export async function listVentures(filters?: VentureListFilters): Promise<Venture[]> {
  const params = new URLSearchParams();
  if (filters?.stage) params.set("stage", filters.stage);
  if (filters?.industry) params.set("industry", filters.industry);
  if (filters?.country) params.set("country", filters.country);
  if (filters?.search) params.set("search", filters.search);
  if (filters?.minVantage !== undefined) params.set("minVantage", String(filters.minVantage));
  if (filters?.minFundability !== undefined) params.set("minFundability", String(filters.minFundability));
  if (filters?.sort) params.set("sort", filters.sort);
  if (filters?.limit) params.set("limit", String(filters.limit));

  const query = params.toString() ? `?${params.toString()}` : "";
  const res = await dotApi.get<{ ventures: Venture[]; nextCursor?: string | null }>(`/api/ventures${query}`);
  return res.ventures;
}

/** Get the current user's own venture (first one found). */
export async function getMyVenture(): Promise<Venture | null> {
  try {
    const res = await dotApi.get<{ venture: Venture | null }>("/api/ventures/my");
    return res.venture;
  } catch {
    return null;
  }
}
