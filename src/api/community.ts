/**
 * Community API — wraps the Fastify /api/community/* endpoints.
 */
import { dotApi } from "./client";
import type { Community } from "@/types/api";

export interface CommunityMember {
  id: string;
  founderId: string;
  communityId: string;
  status: string;
  joinedAt: string;
  founder?: { name: string | null; dotId: string; email: string };
}

export interface CreateCommunityData {
  name: string;
  description?: string;
  region?: string;
  category?: string;
}

export async function getMyCommunity(): Promise<Community | null> {
  try {
    const res = await dotApi.get<{ community: Community | null }>("/api/community/my");
    return res.community;
  } catch {
    return null;
  }
}

export async function listMembers(communityId: string): Promise<CommunityMember[]> {
  const res = await dotApi.get<{ members: CommunityMember[] }>(`/api/community/${communityId}/members`);
  return res.members ?? [];
}

export async function getReferralCode(): Promise<string | null> {
  try {
    const res = await dotApi.get<{ referralCode: string }>("/api/community/referral-code");
    return res.referralCode;
  } catch {
    return null;
  }
}

export async function createCommunity(data: CreateCommunityData): Promise<Community> {
  const res = await dotApi.post<{ community: Community }>("/api/community", data);
  return res.community;
}

export async function joinByCode(code: string): Promise<{ ok: boolean }> {
  return dotApi.post("/api/community/join", { code });
}
