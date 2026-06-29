/**
 * Certificate auto-mint helper.
 *
 * Source-aware deduplication: a single (userId, source, sourceId) tuple only
 * gets a certificate once. Re-mint attempts with the same key are no-ops.
 *
 * Side effects per mint:
 *   1. Insert a `certificates` row.
 *   2. Credit user's wallet with `dotReward` DOT (if > 0).
 *   3. Send a `certificate_issued` in-app notification.
 *
 * Returns { minted, certificate, reason }. `minted: false` means a duplicate
 * was detected and the call was a no-op.
 */
import type { FastifyInstance } from "fastify";
import { and, eq } from "drizzle-orm";

import { db } from "../db/client.js";
import { certificates } from "../db/schema.js";
import { creditWallet } from "./dot.js";
import { notify } from "./notify.js";

export type CertSource = "course" | "challenge" | "pitchathon" | "gig" | "admin";

export interface MintInput {
  userId: string;
  source: CertSource;
  sourceId: string;
  title: string;
  issuer: string;
  level?: string;
  score?: number;
  dotReward?: number;
  meta?: Record<string, unknown>;
}

export interface MintResult {
  minted: boolean;
  certificate?: typeof certificates.$inferSelect;
  reason?: "duplicate" | "ok";
}

function randomCredentialId(): string {
  // 12-char base36 readable id like "A1B2-C3D4-E5F6"
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 12; i++) {
    if (i > 0 && i % 4 === 0) s += "-";
    s += chars[Math.floor(Math.random() * chars.length)];
  }
  return s;
}

export async function mintCertificate(
  app: FastifyInstance,
  input: MintInput,
): Promise<MintResult> {
  const {
    userId, source, sourceId, title, issuer,
    level, score, dotReward = 0, meta,
  } = input;

  // Dedup: same (userId, source, sourceId) only mints once.
  const existing = await db
    .select({ id: certificates.id })
    .from(certificates)
    .where(
      and(
        eq(certificates.userId, userId),
        eq(certificates.source, source),
        eq(certificates.sourceId, sourceId),
      ),
    )
    .limit(1);
  if (existing.length > 0) {
    return { minted: false, reason: "duplicate" };
  }

  // Mint.
  const credentialId = randomCredentialId();
  const inserted = await db
    .insert(certificates)
    .values({
      userId,
      source,
      sourceId,
      title,
      issuer,
      level: level ?? null,
      score: score ?? null,
      dotEarned: dotReward,
      credentialId,
      meta: meta ?? null,
    } as any)
    .returning();

  const cert = inserted[0];

  // Credit wallet (best-effort).
  if (dotReward > 0) {
    try {
      await creditWallet({
        userId,
        amount: dotReward,
        type: "Certificate Reward",
        description: `Reward for certificate '${title}'`,
        reference: `cert:${cert.id}`,
      });
    } catch (e) {
      app.log?.warn?.(
        { err: e, userId, certId: cert.id },
        "failed to credit cert reward",
      );
    }
  }

  // Notify.
  try {
    await notify({
      userId,
      type: "certificate_issued",
      title: `You earned a certificate: ${title}`,
      body:
        `Issued by ${issuer}` +
        (dotReward > 0 ? ` · +${dotReward} DOT bonus` : "") +
        `. Verify at /certificates/${cert.id}.`,
      link: "/certificates",
      icon: "Award",
      sendEmail: true,
    });
  } catch {
    // best-effort
  }

  return { minted: true, certificate: cert, reason: "ok" };
}