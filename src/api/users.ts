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

/**
 * Update the current user's profile fields.
 */
export async function updateProfile(data: ProfileUpdateData): Promise<User> {
  const res = await dotApi.patch<{ user: User }>("/api/users/me", data);
  return res.user;
}

/**
 * Request a role upgrade (e.g., builder → founder).
 * Deducts DOT from the user's wallet.
 */
export async function requestRoleUpgrade(
  role: string,
  data?: Record<string, unknown>
): Promise<RoleUpgradeResult> {
  return dotApi.post<RoleUpgradeResult>("/api/users/upgrade-role", { role, ...data });
}

/**
 * Get the current user's active roles.
 */
export async function getMyRoles(): Promise<string[]> {
  const res = await dotApi.get<{ roles: string[] }>("/api/users/me/roles");
  return res.roles;
}

/**
 * Look up a user by their DOT ID (public profile).
 */
export async function getByDotId(dotId: string): Promise<User> {
  const res = await dotApi.get<{ user: User }>(`/api/users/by-dot-id/${dotId}`);
  return res.user;
}

/**
 * Fetch role upgrade requirements (costs, required fields).
 */
export async function getRoleRequirements(): Promise<RoleRequirement[]> {
  const res = await dotApi.get<{ requirements: RoleRequirement[] }>("/api/users/role-requirements");
  return res.requirements;
}
