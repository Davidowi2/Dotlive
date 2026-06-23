import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { eq } from "drizzle-orm";

import { db, sql } from "../db/client.js";
import { users } from "../db/schema.js";

const intentSchema = z.object({
  intent: z.enum([
    "learn_skill",
    "start_business",
    "find_work",
    "hire_talent",
    "find_investment",
    "lead_community",
    "explore",
    "referral",
  ]),
  inviteCode: z.string().min(3).max(40).optional(),
});

export async function onboardingRoutes(app: FastifyInstance) {
  /**
   * POST /api/onboarding/intent
   *
   * Records WHY the user is here. The intent drives:
   *   - the dashboard welcome copy
   *   - which suggested-next-steps to show
   *   - the role-upgrade nudges (you only see Founder if
   *     start_business / hire_talent / find_investment)
   *
   * Inviter-credit: if `inviteCode` is present and matches
   * a user's dot_id, we set `invited_by` so future analytics
   * can trace referral chains. No DOT is transferred here —
   * credit accrues when the invitee completes a paying action.
   */
  app.post("/onboarding/intent", { preHandler: app.authenticate }, async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const parsed = intentSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "Invalid intent" });
    }

    let inviterDotId: string | null = null;
    if (parsed.data.inviteCode) {
      const inv = await db
        .select({ dotId: users.dotId })
        .from(users)
        .where(eq(users.dotId, parsed.data.inviteCode))
        .limit(1);
      if (inv[0]) inviterDotId = inv[0].dotId;
    }

    await db
      .update(users)
      .set({
        onboardingIntent: parsed.data.intent,
        invitedBy: inviterDotId ?? null,
        onboardedAt: new Date(),
        updatedAt: new Date(),
      } as any)
      .where(eq(users.id, sub));

    return reply.send({
      ok: true,
      intent: parsed.data.intent,
      inviterDotId,
    });
  });

  /**
   * GET /api/onboarding/suggested — public, no auth required
   *
   * Returns the suggested-next-steps list for a given intent.
   * Frontend uses this for the post-signup home screen.
   * The `dotReward` field tells the UI which steps pay DOT.
   */
  app.get<{ Querystring: { intent?: string } }>("/onboarding/suggested", async (req, reply) => {
    const intent = req.query.intent;
    if (!intent) {
      return reply.code(400).send({ error: "Missing intent" });
    }

    // Each suggestion is a static entry. Production would
    // compute these dynamically from the user's role state
    // (e.g. hide "Upgrade to Founder" if they already have it).
    const SUGGESTIONS: Record<string, { id: string; label: string; dotReward: number; route: string }[]> = {
      learn_skill: [
        { id: "vantage", label: "Take a 10-minute Vantage assessment", dotReward: 50, route: "/vantage" },
        { id: "browse_courses", label: "Browse 3 free Academy courses", dotReward: 0, route: "/academy" },
        { id: "first_gig", label: "Apply to a Starter gig", dotReward: 0, route: "/work" },
      ],
      start_business: [
        { id: "vantage", label: "Take the Vantage assessment", dotReward: 50, route: "/vantage" },
        { id: "venture", label: "Add 1 line about your venture", dotReward: 25, route: "/ventures/new" },
        { id: "post_gig", label: "Post your first gig when you need a builder", dotReward: 0, route: "/work" },
      ],
      find_work: [
        { id: "vantage", label: "Take a 10-minute Vantage assessment", dotReward: 50, route: "/vantage" },
        { id: "pick_categories", label: "Pick your top 3 categories", dotReward: 10, route: "/onboarding" },
        { id: "browse_gigs", label: "Browse open gigs in DOT Work", dotReward: 0, route: "/work" },
      ],
      hire_talent: [
        { id: "upgrade_founder", label: "Upgrade to Founder (2,000 DOT)", dotReward: -2000, route: "/dashboard" },
        { id: "venture_brief", label: "Write a short brief about your venture", dotReward: 25, route: "/ventures/new" },
        { id: "browse_portfolios", label: "Browse builder portfolios", dotReward: 0, route: "/work" },
      ],
      find_investment: [
        { id: "upgrade_investor", label: "Upgrade to Investor (10,000 DOT)", dotReward: -10000, route: "/dashboard" },
        { id: "pick_sectors", label: "Pick 3 sectors you follow", dotReward: 10, route: "/onboarding" },
        { id: "ticket_size", label: "Set your typical ticket size", dotReward: 0, route: "/onboarding" },
      ],
      lead_community: [
        { id: "upgrade_leader", label: "Upgrade to Community Leader (1,000 DOT)", dotReward: -1000, route: "/dashboard" },
        { id: "region_category", label: "Tell us your region + category", dotReward: 10, route: "/onboarding" },
        { id: "referral_code", label: "Generate your referral code", dotReward: 25, route: "/community" },
      ],
      explore: [
        { id: "vantage", label: "Take the Vantage assessment", dotReward: 50, route: "/vantage" },
        { id: "read_how", label: "Read the 3 How It Works steps", dotReward: 0, route: "/" },
        { id: "ask_community", label: "Ask a question in the Academy community", dotReward: 0, route: "/community" },
      ],
      referral: [
        { id: "paste_code", label: "Paste your invite code", dotReward: 0, route: "/onboarding" },
        { id: "vantage", label: "Take the Vantage assessment", dotReward: 50, route: "/vantage" },
        { id: "explore_free", label: "Explore what's free this week", dotReward: 0, route: "/" },
      ],
    };

    return reply.send({
      intent,
      suggestions: SUGGESTIONS[intent] ?? [],
    });
  });
}
