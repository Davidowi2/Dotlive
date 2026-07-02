import { dotApi } from "@/api/client";
/**
 * Users API — wraps the Fastify /api/users/* endpoints.
 */
import type { User, RoleRequirement } from "@/types/api";

export interface ProfileUpdateData {
  name?: string;
  avatarUrl?: string;
  bio?: string;
  country?: string;
}

export interface RoleUpgradeResult {
  success: boolean;
  newBalance: number;
  roles: string[];
}

/** Update the current user's profile fields. */
export async function updateProfile(data: ProfileUpdateData): Promise<User> {
  const res = await dotApi.patch<{ user: User }>("/api/users/me", data);
  return res.user;
}

/**
 * Request a role upgrade (e.g., builder → founder).
 * Backend: POST /api/users/roles
 */
export async function requestRoleUpgrade(
  role: string,
  data?: Record<string, unknown>
): Promise<RoleUpgradeResult> {
  return dotApi.post<RoleUpgradeResult>("/api/users/roles", { role, ...data });
}

/** Get the current user's active roles. */
export async function getMyRoles(): Promise<string[]> {
  const res = await dotApi.get<{ roles: string[] }>("/api/users/me/roles");
  return res.roles;
}

/**
 * Look up a user by their DOT ID (public profile).
 * Backend: GET /api/users/lookup?dotId=...
 */
export async function getByDotId(dotId: string): Promise<User> {
  const res = await dotApi.get<{ user: User }>(`/api/users/lookup?dotId=${encodeURIComponent(dotId)}`);
  return res.user;
}

export interface PublicUser {
  id: string;
  name: string | null;
  avatarUrl: string | null;
  dotId: string | null;
  headline: string | null;
  location: string | null;
  createdAt: string;
}

export async function getUserPublic(id: string): Promise<PublicUser> {
  const res = await dotApi.get<{ user: PublicUser }>(`/api/users/${id}/public`);
  return res.user;
}

/**
 * Fetch role upgrade requirements (costs, required fields).
 * Backend: GET /api/users/roles/requirements
 */
export async function getRoleRequirements(): Promise<RoleRequirement[]> {
  const res = await dotApi.get<{ requirements: RoleRequirement[] }>("/api/users/roles/requirements");
  return res.requirements;
}

export async function updateMyBuilderProfile(input: {
  headline: string;
  bio?: string;
  skills: string[];
  available: boolean;
  hourlyDot?: number;
  portfolioUrl?: string;
  linkedinUrl?: string;
  twitterUrl?: string;
  githubUrl?: string;
  location?: string;
}) {
  return dotApi.post("/api/users/me/builder-profile", input);
}
