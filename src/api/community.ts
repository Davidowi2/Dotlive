/**
 * Community API — wraps the Fastify /api/communities/* endpoints.
 * (Includes the legacy /api/community/* routes used by the community management page.)
 */
import { dotApi } from "@/api/client";
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

/* ============================== Legacy (community.tsx) ============================== */

export async function getMyCommunity(): Promise<Community | null> {
  try {
    const res = await dotApi.get<{ community: Community | null }>("/api/community/my");
    return res.community;
  } catch {
    return null;
  }
}

/** All communities the user is a member of (including ones they lead) */
export async function getMyAllCommunities(): Promise<Community[]> {
  try {
    // Fetch both: community I lead + communities I'm a member of
    const [ledRes, memberRes] = await Promise.allSettled([
      dotApi.get<{ community: Community | null }>("/api/community/my"),
      dotApi.get<{ membership: any }>("/api/community/membership"),
    ]);
    const results: Community[] = [];
    if (ledRes.status === "fulfilled" && ledRes.value.community) {
      results.push({ ...ledRes.value.community, role: "leader" } as any);
    }
    if (memberRes.status === "fulfilled" && memberRes.value.membership) {
      const m = memberRes.value.membership;
      // Only add if not already in results (different from led)
      if (!results.find((r) => r.id === m.community?.id)) {
        results.push({ ...m.community, role: "member" } as any);
      }
    }
    return results;
  } catch {
    return [];
  }
}

export async function listMembers(communityId: string): Promise<CommunityMember[]> {
  const res = await dotApi.get<{ members: CommunityMember[] }>(`/api/communities/${communityId}/members`);
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
  const res = await dotApi.post<{ community: Community }>("/api/communities", data);
  return res.community;
}

export async function joinByCode(code: string): Promise<{ ok: boolean }> {
  return dotApi.post("/api/communities/join", { referralCode: code });
}

/* Community management actions */
export async function leaveCommunity(communityId: string): Promise<{ ok: boolean }> {
  return dotApi.post(`/api/communities/${communityId}/leave`, {});
}

export async function regenerateInviteCode(communityId: string): Promise<{ code: string }> {
  return dotApi.post(`/api/communities/${communityId}/referral-code/regenerate`, {});
}

export async function kickMember(communityId: string, memberId: string): Promise<{ ok: boolean }> {
  return dotApi.post(`/api/communities/${communityId}/members/${memberId}/kick`, {});
}

export async function banMember(communityId: string, memberId: string): Promise<{ ok: boolean }> {
  return dotApi.post(`/api/communities/${communityId}/members/${memberId}/ban`, {});
}

export interface PublicCommunity {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  region: string | null;
  memberCount: number;
  leaderName?: string | null;
}

export async function listPublicCommunities(): Promise<PublicCommunity[]> {
  const res = await dotApi.get<{ communities: any[] }>("/api/communities");
  return (res.communities ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description,
    category: c.category,
    region: c.region,
    memberCount: Number(c.memberCount ?? 0),
    leaderName: c.leader?.name ?? null,
  }));
}

/* ============================== Discord-style channels + posts ============================== */

export interface CommunityChannel {
  id: string;
  communityId: string;
  name: string;
  description: string | null;
  isAdminOnly: boolean;
  position: number;
  postCount: number;
  recentCount: number;
  createdAt: string;
}

export interface CommunityPost {
  id: string;
  communityId: string;
  channelId: string;
  authorId: string;
  body: string;
  reactions: Record<string, string[]>;
  replyCount: number;
  pinned: boolean;
  createdAt: string;
  authorName?: string | null;
  authorDotId?: string | null;
  authorAvatarUrl?: string | null;
}

export async function listChannels(communityId: string): Promise<{ channels: CommunityChannel[] }> {
  return dotApi.get<{ channels: CommunityChannel[] }>(`/api/communities/${communityId}/channels`);
}

export async function createChannel(
  communityId: string,
  data: { name: string; description?: string; isAdminOnly?: boolean },
): Promise<{ channel: CommunityChannel }> {
  return dotApi.post<{ channel: CommunityChannel }>(`/api/communities/${communityId}/channels`, data);
}

export async function listPosts(
  communityId: string,
  opts?: { channelId?: string; limit?: number },
): Promise<{ posts: CommunityPost[] }> {
  const params = new URLSearchParams();
  if (opts?.channelId) params.set("channelId", opts.channelId);
  if (opts?.limit) params.set("limit", String(opts.limit));
  const q = params.toString();
  return dotApi.get<{ posts: CommunityPost[] }>(`/api/communities/${communityId}/posts${q ? `?${q}` : ""}`);
}

export async function createPost(
  communityId: string,
  data: { channelId: string; body: string; parentId?: string },
): Promise<{ post: CommunityPost }> {
  return dotApi.post<{ post: CommunityPost }>(`/api/communities/${communityId}/posts`, data);
}

/* Community chat */
export interface CommunityChatMessage {
  id: string;
  body: string;
  created_at: string;
  author_id: string;
  author_name: string | null;
  author_avatar: string | null;
}

export async function listCommunityChat(communityId: string, limit = 50): Promise<CommunityChatMessage[]> {
  const qs = new URLSearchParams({ limit: String(limit) });
  const res = await dotApi.get<{ messages: CommunityChatMessage[] }>(`/api/communities/${communityId}/chat?${qs.toString()}`);
  return res.messages ?? [];
}

export async function sendCommunityChat(communityId: string, body: string): Promise<{ message: CommunityChatMessage }> {
  return dotApi.post(`/api/communities/${communityId}/chat`, { body });
}

export async function reactToPost(
  communityId: string,
  postId: string,
  emoji: string,
): Promise<{ reactions: Record<string, string[]> }> {
  return dotApi.post<{ reactions: Record<string, string[]> }>(`/api/communities/${communityId}/posts/${postId}/react`, { emoji });
}
