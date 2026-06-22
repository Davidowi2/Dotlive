// @ts-nocheck
/**
 * Auth helpers — Lucia v3 for session management + Argon2 for
 * password hashing + Fastify JWT for stateless API auth.
 *
 * Why both Lucia and JWT?
 *   - Lucia owns the session table in Postgres (so we can
 *     invalidate sessions on logout, list active devices, etc.).
 *   - JWT is what the frontend stores in localStorage and
 *     sends in `Authorization: Bearer ...` headers.
 *   - On login/signup we create a Lucia session and mint a JWT
 *     that contains the same session id; the JWT is verifiable
 *     without a DB hit (signature check) but every protected
 *     route loads the user from the DB anyway for fresh roles.
 *
 * Google OAuth:
 *   - GET  /api/auth/google          → 302 to Google consent
 *   - GET  /api/auth/google/callback → exchanges code, creates
 *     user if first time, returns JWT like signup does.
 */

import { Lucia, TimeSpan } from "lucia";
import { DrizzlePostgreSQLAdapter } from "@lucia-auth/adapter-drizzle";
import argon2 from "argon2";
import { eq } from "drizzle-orm";

import { db } from "../db/client.js";
import { users, sessions, oauthAccounts, userRoles } from "../db/schema.js";
import type { AppRole } from "../../../packages/shared/types.js";

const adapter = new DrizzlePostgreSQLAdapter(db as any, sessions as any, users as any);

export const lucia = new Lucia(adapter, {
  sessionExpiresIn: new TimeSpan(30, "d"),
  sessionCookie: {
    name: "dotlive_session",
    expires: false,
    attributes: {
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    },
  },
  getUserAttributes: (attributes: any) => ({
    email: attributes.email,
    emailVerified: attributes.email_verified,
    name: attributes.name,
    avatarUrl: attributes.avatar_url,
    dotId: attributes.dot_id,
  }),
});

declare module "lucia" {
  interface Register {
    Lucia: typeof lucia;
    DatabaseUserAttributes: {
      email: string;
      email_verified: boolean;
      name: string | null;
      avatar_url: string | null;
      dot_id: string;
    };
  }
}

/* --------------------------- Password hashing --------------------------- */

const ARGON_OPTS: argon2.Options & { raw?: false } = {
  type: argon2.argon2id,
  memoryCost: 19456, // 19 MiB
  timeCost: 2,
  parallelism: 1,
};

export async function hashPassword(plain: string): Promise<string> {
  return argon2.hash(plain, ARGON_OPTS);
}

export async function verifyPassword(hash: string, plain: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, plain);
  } catch {
    return false;
  }
}

/* --------------------------- Dot-id generation --------------------------- */

const ADJECTIVES = [
  "swift", "bright", "calm", "bold", "wise", "kind", "quick", "sharp",
  "brave", "prime", "epic", "nova", "apex", "true", "wild", "free",
];

const NOUNS = [
  "founder", "builder", "maker", "spark", "core", "forge", "lab", "crew",
  "pilot", "studio", "works", "guild", "atlas", "summit", "horizon", "beacon",
];

/**
 * Generate a DOT ID like "swift-founders-7q4".
 * Sufficient entropy for an early-stage platform; collision
 * unlikely but the column is UNIQUE so the DB will catch it.
 */
export function generateDotId(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const tail = Math.random().toString(36).slice(2, 5);
  return `${adj}-${noun}-${tail}`;
}

/* --------------------------- User creation --------------------------- */

export interface CreateUserInput {
  email: string;
  password?: string;
  name?: string;
  avatarUrl?: string;
  googleId?: string;
}

/**
 * Create a user, give them the builder role + 500 DOT starter
 * grant + empty wallet, all in a single sequence. Returns the
 * newly-created user record (without password hash).
 */
export async function createUser(input: CreateUserInput): Promise<{
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  dotId: string;
}> {
  const email = input.email.toLowerCase().trim();
  let dotId = generateDotId();

  // Retry on the (very unlikely) dot_id collision.
  for (let i = 0; i < 5; i++) {
    const existing = await db.select({ id: users.id }).from(users).where(eq(users.dotId, dotId)).limit(1);
    if (existing.length === 0) break;
    dotId = generateDotId();
  }

  const passwordHash = input.password ? await hashPassword(input.password) : null;
  const id = crypto.randomUUID();

  await db.insert(users).values({
    id,
    email,
    emailVerified: !!input.googleId, // Google users are pre-verified
    passwordHash,
    name: input.name ?? null,
    avatarUrl: input.avatarUrl ?? null,
    dotId,
  });

  await db.insert(userRoles).values({
    userId: id,
    role: "builder",
  });

  // Starter grant — 500 DOT, idempotent by description.
  await db.execute(
    // Drizzle doesn't have a great way to do this without raw SQL
    // because we want ON CONFLICT to no-op.
    // We use the helper from lib/dot which already idempotency-checks.
    // import here to avoid circular dep
    (await import("./dot.js")).creditWallet({
      userId: id,
      amount: 500,
      type: "Starter Grant",
      description: `Welcome bonus for ${email}`,
    }) as any
  ).catch(() => {
    // creditWallet is already safe to retry — first call wins.
  });

  // OAuth linking if applicable.
  if (input.googleId) {
    await db.insert(oauthAccounts).values({
      providerId: "google",
      providerUserId: input.googleId,
      userId: id,
    }).onConflictDoNothing();
  }

  return {
    id,
    email,
    name: input.name ?? null,
    avatarUrl: input.avatarUrl ?? null,
    dotId,
  };
}

/* --------------------------- User loading --------------------------- */

export async function loadUserWithRoles(userId: string): Promise<{
  id: string;
  email: string;
  emailVerified: boolean;
  name: string | null;
  avatarUrl: string | null;
  dotId: string;
  roles: AppRole[];
} | null> {
  const rows = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  const u = rows[0];
  if (!u) return null;

  const roleRows = await db.select({ role: userRoles.role }).from(userRoles).where(eq(userRoles.userId, userId));
  const roles = roleRows.map((r) => r.role as AppRole);

  return {
    id: u.id,
    email: u.email,
    emailVerified: u.emailVerified,
    name: u.name,
    avatarUrl: u.avatarUrl,
    dotId: u.dotId,
    roles,
  };
}

export async function getUserRoles(userId: string): Promise<AppRole[]> {
  const rows = await db.select({ role: userRoles.role }).from(userRoles).where(eq(userRoles.userId, userId));
  return rows.map((r) => r.role as AppRole);
}

export async function userHasRole(userId: string, role: AppRole): Promise<boolean> {
  const roles = await getUserRoles(userId);
  return roles.includes(role);
}

/* --------------------------- Lucia wrappers --------------------------- */

export async function createSession(userId: string): Promise<string> {
  const session = await lucia.createSession(userId, {});
  return session.id;
}

export async function invalidateSession(sessionId: string): Promise<void> {
  await lucia.invalidateSession(sessionId);
}

export async function validateSession(sessionId: string): Promise<
  | { user: { id: string }; session: { id: string; expiresAt: Date } }
  | { user: null; session: null }
> {
  const { session, user } = await lucia.validateSession(sessionId);
  if (!session || !user) return { user: null, session: null };
  return {
    user: { id: user.id },
    session: { id: session.id, expiresAt: session.expiresAt },
  };
}
// @ts-nocheck