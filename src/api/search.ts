import { dotApi } from "@/api/client";

export type SearchPerson = {
  id: string;
  name: string | null;
  dotId: string;
  bio: string | null;
  avatarUrl: string | null;
  headline: string | null;
  roles: string[];
  skills: string[];
  verified: boolean;
};

export type SearchVenture = {
  id: string;
  name: string;
  tagline: string | null;
  logoUrl: string | null;
  industry: string | null;
  stage: string | null;
  foundedAt: string | null;
};

export type SearchPost = {
  id: string;
  type: string;
  title: string | null;
  body: string;
  imageUrl: string | null;
  tags: string[];
  likesCount: number;
  commentsCount: number;
  budgetDot: number | null;
  createdAt: string;
  authorName: string | null;
  authorDotId: string | null;
};

export interface SearchResponse {
  posts: SearchPost[];
  people: SearchPerson[];
  ventures: SearchVenture[];
}

export async function searchAll(query: string, limit = 5): Promise<SearchResponse> {
  const params = new URLSearchParams({ q: query, limit: String(limit) });
  return dotApi.get<SearchResponse>(`/api/search?${params.toString()}`);
}
