/**
 * DOT OS — Reputation + Level Engine
 *
 * Single source of truth for builder progression. Used by challenges,
 * orders, reviews, and admin actions to award reputation and auto-
 * promote builders to the next level.
 *
 * Reputation (0-1000):
 *   tasks_done     ×  10
 *   avg_rating_5   ×  50
 *   ventures_done  × 100
 *   challenges_won ×  25
 *
 * Levels (1-5):
 *   1 Explorer     — defaults
 *   2 Contributor  — 1+ task completed
 *   3 Specialist   — 5+ tasks, avg rating ≥ 4
 *   4 Core Builder — 1+ venture contributed, reputation ≥ 500
 *   5 Elite        — reputation ≥ 850, 3+ ventures contributed
 */

import { db } from "../db/client.js";
import {
  users,
  builderProfiles,
  serviceOrders,
  serviceReviews,
  challengeSubmissions,
  builderLevels,
  reputationEvents,
  activities,
  achievements,
} from "../db/schema.js";
import { eq, and, sql, desc, avg, count, gte } from "drizzle-orm";
import crypto from "node:crypto";

const REPUTATION_TIERS = [
  { min: 0,   label: "Newcomer",   level: 1 },
  { min: 100, label: "Explorer",   level: 1 },
  { min: 300, label: "Contributor",level: 2 },
  { min: 600, label: "Specialist", level: 3 },
  { min: 850, label: "Elite",      level: 5 },
] as const;

/** Compute current reputation score from all event deltas (cache-free, fast). */
export async function computeReputation(userId: string): Promise<number> {
  const rows = await db
    .select({ delta: reputationEvents.delta })
    .from(reputationEvents)
    .where(eq(reputationEvents.userId, userId));
  return rows.reduce((sum, r) => sum + r.delta, 0);
}

/** Get the current builder level row, defaulting to L1 Explorer. */
export async function getBuilderLevel(userId: string): Promise<{
  level: number;
  label: string;
  reputation: number;
  promotedAt: Date | null;
}> {
  const reputation = await computeReputation(userId);
  const tier = [...REPUTATION_TIERS].reverse().find((t) => reputation >= t.min) ?? REPUTATION_TIERS[0];

  const row = await db
    .select()
    .from(builderLevels)
    .where(eq(builderLevels.userId, userId))
    .limit(1);
  const current = row[0];

  // Compute level from gates (not just reputation) — overrides reputation tier if gates not met.
  const gates = await evaluateLevelGates(userId, tier.level);
  const finalLevel = gates.met ? tier.level : Math.max(1, tier.level - 1);
  const finalLabel =
    finalLevel === 5 ? "Elite"
    : finalLevel === 4 ? "Core Builder"
    : finalLevel === 3 ? "Specialist"
    : finalLevel === 2 ? "Contributor"
    : "Explorer";

  return {
    level: finalLevel,
    label: finalLabel,
    reputation,
    promotedAt: current?.promotedAt ?? null,
  };
}

/** Check level-specific gates (tasks, ratings, venture contributions). */
export async function evaluateLevelGates(userId: string, level: number) {
  const tasksDone = await db
    .select({ c: count() })
    .from(serviceOrders)
    .where(and(eq(serviceOrders.builderId, userId), eq(serviceOrders.status, "completed")));

  const reviewsAgg = await db
    .select({ avg: avg(serviceReviews.rating) })
    .from(serviceReviews)
    .where(eq(serviceReviews.builderId, userId));

  const venturesDone = await db
    .select({ c: count() })
    .from(challengeSubmissions)
    .where(and(eq(challengeSubmissions.builderId, userId), eq(challengeSubmissions.status, "approved")));

  const rep = await computeReputation(userId);
  const tasks = Number(tasksDone[0]?.c ?? 0);
  const rating = Number(reviewsAgg[0]?.avg ?? 0);
  const ventures = Number(venturesDone[0]?.c ?? 0);

  const gates = {
    2: { tasks: tasks >= 1 },
    3: { tasks: tasks >= 5, rating: rating >= 4 },
    4: { ventures: ventures >= 1, reputation: rep >= 500 },
    5: { reputation: rep >= 850, ventures: ventures >= 3 },
  } as const;

  const reqs = gates[level as 2 | 3 | 4 | 5];
  if (!reqs) return { met: level === 1, requirements: {} };
  const met = Object.values(reqs).every(Boolean);
  return { met, requirements: reqs, stats: { tasks, rating, ventures, reputation: rep } };
}

/** Award reputation points and log activity. Auto-promotes level. */
export async function awardReputation(opts: {
  userId: string;
  delta: number;
  reason: string;
  refType?: string;
  refId?: string;
}) {
  const id = crypto.randomUUID();
  await db.insert(reputationEvents).values({
    id,
    userId: opts.userId,
    delta: opts.delta,
    reason: opts.reason,
    refType: opts.refType ?? null,
    refId: opts.refId ?? null,
    createdAt: new Date(),
  } as any);

  await logActivity({
    userId: opts.userId,
    kind: "reputation_gained",
    title: opts.reason,
    body: `${opts.delta > 0 ? "+" : ""}${opts.delta} reputation`,
    refType: opts.refType,
    refId: opts.refId,
    pointsDelta: opts.delta,
  });

  // Re-evaluate level + persist promotion if needed
  const lvl = await getBuilderLevel(opts.userId);
  const existing = await db
    .select()
    .from(builderLevels)
    .where(eq(builderLevels.userId, opts.userId))
    .limit(1);

  if (existing.length === 0) {
    await db.insert(builderLevels).values({
      userId: opts.userId,
      level: lvl.level,
      label: lvl.label,
      promotedAt: new Date(),
    } as any);
    if (lvl.level > 1) await grantAchievement(opts.userId, "level_up", `Reached ${lvl.label}`, `You are now a ${lvl.label} (Level ${lvl.level}).`, "Trophy");
  } else if (existing[0].level < lvl.level) {
    await db
      .update(builderLevels)
      .set({ level: lvl.level, label: lvl.label, promotedAt: new Date() } as any)
      .where(eq(builderLevels.userId, opts.userId));
    await grantAchievement(opts.userId, "level_up", `Reached ${lvl.label}`, `You are now a ${lvl.label} (Level ${lvl.level}).`, "Trophy");
  }

  return lvl;
}

/** Append an activity row (timeline). */
export async function logActivity(opts: {
  userId: string;
  actorId?: string;
  kind: string;
  title: string;
  body?: string;
  refType?: string;
  refId?: string;
  pointsDelta?: number;
}) {
  await db.insert(activities).values({
    id: crypto.randomUUID(),
    userId: opts.userId,
    actorId: opts.actorId ?? null,
    kind: opts.kind,
    title: opts.title,
    body: opts.body ?? null,
    refType: opts.refType ?? null,
    refId: opts.refId ?? null,
    pointsDelta: opts.pointsDelta ?? 0,
    createdAt: new Date(),
  } as any);
}

/** Grant an achievement (idempotent by kind+userId). */
export async function grantAchievement(
  userId: string,
  kind: string,
  label: string,
  description: string,
  icon = "Award",
) {
  const existing = await db
    .select()
    .from(achievements)
    .where(and(eq(achievements.userId, userId), eq(achievements.kind, kind)))
    .limit(1);
  if (existing.length > 0) return existing[0];

  const row = await db
    .insert(achievements)
    .values({
      id: crypto.randomUUID(),
      userId,
      kind,
      label,
      description,
      icon,
      earnedAt: new Date(),
    } as any)
    .returning();
  return row[0];
}

/** Compute DOT Venture Valuation (₦) from stage + vantage + fundability. */
export function computeVentureValuation(opts: {
  stage: string;
  vantage: number;       // 0-100
  fundability: number;   // 0-100
}) {
  const base = { Idea: 5_000_000, Prototype: 15_000_000, Growth: 60_000_000, Scale: 200_000_000 } as const;
  const stageKey = (opts.stage ?? "Idea") as keyof typeof base;
  const baseVal = base[stageKey] ?? base.Idea;
  const vantageMul = 1 + Math.max(0, Math.min(100, opts.vantage)) / 100;
  const fundMul = Math.max(0.2, Math.min(1, opts.fundability / 100));
  const valuation = Math.round(baseVal * vantageMul * fundMul);
  const confidence = Math.round(
    Math.min(95, Math.max(15, (opts.vantage + opts.fundability) / 2 + 10)),
  );
  return {
    valuation_ngn: valuation,
    confidence,
    fundability: opts.fundability,
    investment_readiness: Math.round(opts.vantage * 0.7 + opts.fundability * 0.3),
    currency: "NGN" as const,
  };
}

/** Build a list of next-best-action recommendations for a user. */
export async function aiAdvise(userId: string) {
  const lvl = await getBuilderLevel(userId);
  const profile = await db.select().from(builderProfiles).where(eq(builderProfiles.id, userId)).limit(1);
  const recs: { kind: string; priority: number; title: string; body: string }[] = [];

  if (!profile[0]?.headline) {
    recs.push({ kind: "passport", priority: 90, title: "Complete your Builder Passport", body: "Add a headline and 3+ skills so founders can find you." });
  }
  if (lvl.reputation < 100) {
    recs.push({ kind: "earn", priority: 80, title: "Earn your first 100 reputation", body: "Complete a service order or win a challenge to unlock Level 2." });
  }
  if (lvl.level < 3) {
    recs.push({ kind: "specialize", priority: 70, title: "Reach Level 3 Specialist", body: "5 completed tasks with 4+ rating unlocks paid projects." });
  }
  if (lvl.level >= 4 && lvl.level < 5) {
    recs.push({ kind: "elite", priority: 95, title: "You're close to Elite", body: "3 venture contributions and 850+ reputation puts you in front of investors." });
  }
  return recs.sort((a, b) => b.priority - a.priority);
}