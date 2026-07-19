import { dotApi } from "@/api/client";

export interface DiscoverPerson {
  id: string;
  name: string;
  dotId: string;
  avatarUrl: string | null;
  headline: string | null;
  location: string | null;
  roles: string[];
  primaryRole: string;
  builderSkills: string[];
  ventureName: string | null;
  ventureStage: string | null;
  capitalType: string | null;
  vantageScore: number;
  vouchesCount: number;
}

export interface DiscoverPeopleResponse {
  people: DiscoverPerson[];
  hasMore: boolean;
  nextCursor: string | null;
}

export interface DiscoverPeopleFilters {
  role?: string;
  skill?: string;
  industry?: string;
  country?: string;
  minVantage?: number;
  sort?: "newest" | "vantage_desc" | "vouches_desc";
  limit?: number;
  cursor?: string;
}

export async function getDiscoverPeople(
  filters?: DiscoverPeopleFilters
): Promise<DiscoverPeopleResponse> {
  const params = new URLSearchParams();
  if (filters?.role) params.set("role", filters.role);
  if (filters?.skill) params.set("skill", filters.skill);
  if (filters?.industry) params.set("industry", filters.industry);
  if (filters?.country) params.set("country", filters.country);
  if (filters?.minVantage !== undefined) params.set("minVantage", String(filters.minVantage));
  if (filters?.sort) params.set("sort", filters.sort);
  if (filters?.limit) params.set("limit", String(filters.limit));
  if (filters?.cursor) params.set("cursor", filters.cursor);

  const query = params.toString();
  return await dotApi.get<DiscoverPeopleResponse>(`/api/people/discover${query ? `?${query}` : ""}`);
}
