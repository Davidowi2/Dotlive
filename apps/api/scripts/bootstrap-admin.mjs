// ============================================================
// Bootstrap super-admin
// ============================================================
//
// Creates the FIRST super_admin in a fresh deployment.
//
// Usage:
//   export BOOTSTRAP_ADMIN_EMAIL=you@example.com
//   node scripts/bootstrap-admin.mjs
//
// What it does:
//   1. Connects to Neon via DATABASE_URL (env only, never source).
//   2. Looks up the user by email.
//   3. If they exist:
//        - Promotes them to super_admin (idempotent).
//   4. If they don't exist:
//        - Creates them with a random password (printed ONCE to
//          stdout — you must copy it before closing the terminal).
//        - Email is left unverified; they can use password login
//          to bootstrap, then set up Google OAuth.
//
// The script refuses to run if:
//   - BOOTSTRAP_ADMIN_EMAIL is missing.
//   - There's already a super_admin in the system AND the env
//     var BOOTSTRAP_FORCE isn't set to "1". This prevents
//     accidentally adding a second one.
//
// Idempotency: re-running the script with the same email is a
// no-op (the ON CONFLICT in the user_roles insert covers it).

import { randomBytes } from "node:crypto";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import argon2 from "argon2";
import ws from "ws";

// @ts-ignore — the import side-effect is enough
import { users, userRoles } from "../src/db/schema.js";
import { schema } from "../src/db/client.js";

// Allow our seed to talk to Neon via the HTTP path.
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("\nDATABASE_URL is not set.\n");
  process.exit(1);
}

const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.toLowerCase().trim();
if (!email) {
  console.error(
    "\nBOOTSTRAP_ADMIN_EMAIL is not set.\n\n" +
      "Usage:\n" +
      "  export BOOTSTRAP_ADMIN_EMAIL=you@example.com\n" +
      "  node scripts/bootstrap-admin.mjs\n"
  );
  process.exit(1);
}

const sql = neon(databaseUrl);
const db = drizzle(sql, { schema });

console.log(`[1/4] Checking for existing super_admins...`);
const existing = await db
  .select({ id: users.id, email: users.email })
  .from(users)
  .innerJoin(userRoles, eq(userRoles.userId, users.id))
  .where(eq(userRoles.role, "super_admin"));

if (existing.length > 0 && process.env.BOOTSTRAP_FORCE !== "1") {
  console.error(
    `\nThere is already at least one super_admin (${existing[0].email}).\n` +
      `Refusing to add another without BOOTSTRAP_FORCE=1.\n` +
      `\nIf you really need to add ${email} as a super_admin:\n` +
      `  BOOTSTRAP_FORCE=1 BOOTSTRAP_ADMIN_EMAIL=${email} node scripts/bootstrap-admin.mjs\n`
  );
  process.exit(1);
}

console.log(`[2/4] Looking up user ${email}...`);
let user = (
  await db.select().from(users).where(eq(users.email, email)).limit(1)
)[0];

if (!user) {
  console.log(`  not found — creating new user with random password...`);
  const password = randomBytes(18).toString("base64url");
  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });

  const newId = crypto.randomUUID();
  const dotId =
    "founder-" +
    Array.from(randomBytes(3))
      .map((b) => b.toString(36).padStart(2, "0"))
      .join("")
      .slice(0, 6);

  await db.insert(users).values({
    id: newId,
    email,
    passwordHash,
    dotId,
    name: email.split("@")[0],
    emailVerified: true,
  } as any);

  console.log(`\n  ┌─────────────────────────────────────────────────────┐`);
  console.log(`  │  EMAIL:    ${email.padEnd(38)}│`);
  console.log(`  │  PASSWORD: ${password.padEnd(38)}│`);
  console.log(`  └─────────────────────────────────────────────────────┘`);
  console.log(`\n  ⚠️  Copy this password now. It will not be shown again.\n`);

  user = (await db.select().from(users).where(eq(users.id, newId)).limit(1))[0];
} else {
  console.log(`  found user ${user.id} (${user.dotId}) — promoting only.`);
}

console.log(`[3/4] Assigning super_admin role...`);
await db
  .insert(userRoles)
  .values({ userId: user.id, role: "super_admin" } as any)
  .onConflictDoNothing();

console.log(`[4/4] Verifying...`);
const roles = await db
  .select({ role: userRoles.role })
  .from(userRoles)
  .where(eq(userRoles.userId, user.id));
console.log(`  ${email} now has roles: ${roles.map((r) => r.role).join(", ")}`);
console.log(`\nDone. ${email} can now log in and use /api/admin/* endpoints.`);
