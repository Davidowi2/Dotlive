import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const adminRole = z.enum(["admin", "super_admin"]);

const elevateInput = z.object({
  targetUserId: z.string().uuid(),
  newRole: adminRole.default("super_admin"),
  reason: z.string().trim().max(500).optional(),
});

const revokeInput = z.object({
  targetUserId: z.string().uuid(),
  role: adminRole.default("admin"),
  reason: z.string().trim().max(500).optional(),
});

/**
 * Elevate a user to an admin-ish role by calling the Fastify backend
 * POST /api/admin/users/:id/promote with our custom JWT auth.
 *
 * NOTE: the backend default role for this endpoint is `admin`.
 */
export const elevateUser = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => elevateInput.parse(data))
  .handler(async ({ data }) => {
    const token = (await import("@/api/client")).getToken();
    if (!token) throw new Error("Not authenticated");

    const res = await fetch(
      `${(await import("@/api/client")).BASE_URL}/api/admin/users/${encodeURIComponent(data.targetUserId)}/promote`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          role: data.newRole,
          reason: data.reason ?? undefined,
        }),
      },
    );

    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: `Failed with ${res.status}` }));
      throw new Error((body as { error?: string }).error ?? "Elevate failed");
    }

    return (await res.json()) as { ok: boolean; role: string };
  });

/**
 * Revoke a role from a user by calling the Fastify backend
 * PUT /api/admin/users/:id/roles with our custom JWT auth.
 *
 * You must pass the exact role array you want the target to keep.
 */
export const revokeAdmin = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => revokeInput.parse(data))
  .handler(async ({ data }) => {
    const token = (await import("@/api/client")).getToken();
    if (!token) throw new Error("Not authenticated");

    const res = await fetch(
      `${(await import("@/api/client")).BASE_URL}/api/admin/users/${encodeURIComponent(data.targetUserId)}/roles`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          remove: [data.role],
          reason: data.reason ?? undefined,
        }),
      },
    );

    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: `Failed with ${res.status}` }));
      throw new Error((body as { error?: string }).error ?? "Revoke failed");
    }

    return (await res.json()) as { ok: boolean; roles: string[] };
  });

/**
 * Bootstrap/claim the first Super Admin role is intentionally removed.
 *
 * The latest backend exposes the same bootstrap logic only through the
 * authenticated `/api/admin/users/:id/roles` path; there is no separate
 * public RPC endpoint for RPC/bootstrap_super_admin anymore.
 *
 * If you need first-time Super Admin creation, use `elevateUser(...)`
 * from an already-authenticated super admin context.
 */
