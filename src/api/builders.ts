/**
 * Builder Arena API client.
 */
import { dotApi } from "./client";

export interface BuilderProfile {
  id: string;
  headline: string;
  bio: string | null;
  skills: string[];
  available: boolean;
  hourlyDot: string | null;
  portfolioUrl: string | null;
  linkedinUrl: string | null;
  twitterUrl: string | null;
  githubUrl: string | null;
  location: string | null;
  totalEarnedDot: string;
  totalCompletedOrders: number;
  avgRating: string;
  reviewCount: number;
  lastActiveAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BuilderPublic {
  id: string;
  name: string | null;
  avatarUrl: string | null;
  dotId: string;
  createdAt: string;
  profile: BuilderProfile | null;
}

export interface BuilderReview {
  id: string;
  orderId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  reviewerId: string;
}

export async function getBuilderArena(id: string) {
  const res = await dotApi.get<{ builder: BuilderPublic }>(
    `/api/builders/${id}/arena`,
  );
  return res.builder;
}

export async function getBuilderReviews(id: string) {
  const res = await dotApi.get<{ reviews: BuilderReview[] }>(
    `/api/builders/${id}/reviews`,
  );
  return res.reviews ?? [];
}

export async function leaveReview(
  builderId: string,
  input: { orderId: string; rating: number; comment?: string },
) {
  const res = await dotApi.post<{ review: BuilderReview }>(
    `/api/builders/${builderId}/reviews`,
    input,
  );
  return res.review;
}
