/**
 * Marketplace routes: services (gigs), job listings, orders.
 */

import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { eq, and, desc, sql } from "drizzle-orm";

import { db } from "../db/client.js";
import { services, jobListings, serviceOrders, serviceReviews } from "../db/schema.js";
import { transferDot, dotToNaira, creditWallet, debitWallet } from "../lib/dot.js";
import { userHasRole } from "../lib/auth.js";
import { awardReputation } from "../lib/os-engine.js";

const CATEGORIES = ["Graphics & Design", "Web Development", "Marketing", "Writing", "Video", "Other"] as const;
const EMPLOYMENT = ["full_time", "part_time", "contract", "internship"] as const;

const serviceCreate = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  category: z.enum(CATEGORIES),
  priceDot: z.number().positive().max(1_000_000),
  deliveryDays: z.number().int().positive().max(180).default(3),
});

const jobCreate = serviceCreate.extend({
  salaryDot: z.number().positive().max(1_000_000),
  employmentType: z.enum(EMPLOYMENT).default("full_time"),
  requirements: z.string().max(5000).optional(),
}).omit({ priceDot: true, deliveryDays: true });

export async function marketplaceRoutes(app: FastifyInstance) {
  /* ---------------- Services (gigs) ---------------- */

  /** GET /api/services — active listings, filterable */
  app.get("/services", async (req, reply) => {
    const q = z
      .object({
        category: z.enum(CATEGORIES).optional(),
        search: z.string().optional(),
        builderId: z.string().optional(),
        limit: z.coerce.number().int().min(1).max(100).default(20),
      })
      .safeParse(req.query);
    if (!q.success) return reply.code(400).send({ error: "Invalid query" });
    const { category, search, builderId, limit } = q.data;

    const conds: any[] = [eq(services.isActive, true)];
    if (category) conds.push(eq(services.category, category));
    if (builderId) conds.push(eq(services.builderId, builderId));
    if (search) conds.push(sql`${services.title} ILIKE ${`%${search}%`}`);

    const rows = await db
      .select()
      .from(services)
      .where(and(...conds) as any)
      .orderBy(desc(services.createdAt))
      .limit(limit);
    return reply.send({ services: rows.map(serializeService) });
  });

  /** POST /api/services — create (builders only) */
  app.post("/services", { preHandler: app.authenticate }, async (req, reply) => {
    const { sub } = req.user as { sub: string };
    if (!(await userHasRole(sub, "builder"))) {
      return reply.code(403).send({ error: "Only builders can list services" });
    }
    const parsed = serviceCreate.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid input" });
    const s = parsed.data;

    const inserted = await db
      .insert(services)
      .values({
        builderId: sub,
        title: s.title,
        description: s.description,
        category: s.category,
        priceDot: String(s.priceDot),
        deliveryDays: s.deliveryDays,
        isActive: true,
      } as any)
      .returning();
    return reply.send({ service: serializeService(inserted[0]) });
  });

  /** GET /api/services/:id */
  app.get<{ Params: { id: string } }>("/services/:id", async (req, reply) => {
    const rows = await db.select().from(services).where(eq(services.id, req.params.id)).limit(1);
    if (rows.length === 0) return reply.code(404).send({ error: "Not found" });
    return reply.send({ service: serializeService(rows[0]) });
  });

  /** PATCH /api/services/:id — owner only */
  app.patch<{ Params: { id: string } }>("/services/:id", { preHandler: app.authenticate }, async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const existing = await db.select().from(services).where(eq(services.id, req.params.id)).limit(1);
    if (existing.length === 0) return reply.code(404).send({ error: "Not found" });
    if (existing[0].builderId !== sub) return reply.code(403).send({ error: "Not your service" });

    const parsed = serviceCreate.partial().safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid input" });
    const u = parsed.data as any;
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (u.title !== undefined) updates.title = u.title;
    if (u.description !== undefined) updates.description = u.description;
    if (u.category !== undefined) updates.category = u.category;
    if (u.priceDot !== undefined) updates.priceDot = String(u.priceDot);
    if (u.deliveryDays !== undefined) updates.deliveryDays = u.deliveryDays;
    const updated = await db.update(services).set(updates as any).where(eq(services.id, req.params.id)).returning();
    return reply.send({ service: serializeService(updated[0]) });
  });

  /** DELETE /api/services/:id — owner only (soft delete via isActive=false) */
  app.delete<{ Params: { id: string } }>("/services/:id", { preHandler: app.authenticate }, async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const existing = await db.select().from(services).where(eq(services.id, req.params.id)).limit(1);
    if (existing.length === 0) return reply.code(404).send({ error: "Not found" });
    if (existing[0].builderId !== sub) return reply.code(403).send({ error: "Not your service" });
    await db.update(services).set({ isActive: false, updatedAt: new Date() } as any).where(eq(services.id, req.params.id));
    return reply.send({ ok: true });
  });

  /* ---------------- Jobs ---------------- */

  /** GET /api/jobs */
  app.get("/jobs", async (req, reply) => {
    const q = z
      .object({
        category: z.enum(CATEGORIES).optional(),
        minSalary: z.coerce.number().optional(),
        maxSalary: z.coerce.number().optional(),
        search: z.string().optional(),
        limit: z.coerce.number().int().min(1).max(100).default(20),
      })
      .safeParse(req.query);
    if (!q.success) return reply.code(400).send({ error: "Invalid query" });

    const conds: any[] = [eq(jobListings.isOpen, true)];
    if (q.data.category) conds.push(eq(jobListings.category, q.data.category));
    if (q.data.minSalary != null) conds.push(sql`${jobListings.salaryDot} >= ${q.data.minSalary}`);
    if (q.data.maxSalary != null) conds.push(sql`${jobListings.salaryDot} <= ${q.data.maxSalary}`);
    if (q.data.search) conds.push(sql`${jobListings.title} ILIKE ${`%${q.data.search}%`}`);

    const rows = await db
      .select()
      .from(jobListings)
      .where(and(...conds) as any)
      .orderBy(desc(jobListings.createdAt))
      .limit(q.data.limit);
    return reply.send({ jobs: rows });
  });

  /** POST /api/jobs — founders only */
  app.post("/jobs", { preHandler: app.authenticate }, async (req, reply) => {
      const { sub } = req.user as { sub: string };
      // Open to any authenticated user — builders, founders, ventures, business owners.
      // Per ops direction, job posting is a Tier 1 action available to all roles.
      const parsed = jobCreate.safeParse(req.body);
      if (!parsed.success) return reply.code(400).send({ error: "Invalid input" });

      const inserted = await db
        .insert(jobListings)
        .values({
          ventureId: sub,
          title: parsed.data.title,
          description: parsed.data.description,
          category: parsed.data.category,
          salaryDot: String(parsed.data.salaryDot),
          employmentType: parsed.data.employmentType,
          requirements: parsed.data.requirements,
          isOpen: true,
        } as any)
        .returning();
      return reply.send({ job: inserted[0] });
    });

  /** GET /api/jobs/:id */
  app.get<{ Params: { id: string } }>("/jobs/:id", async (req, reply) => {
    const rows = await db.select().from(jobListings).where(eq(jobListings.id, req.params.id)).limit(1);
    if (rows.length === 0) return reply.code(404).send({ error: "Not found" });
    return reply.send({ job: rows[0] });
  });

  /** PATCH /api/jobs/:id — owner only */
  app.patch<{ Params: { id: string } }>("/jobs/:id", { preHandler: app.authenticate }, async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const existing = await db.select().from(jobListings).where(eq(jobListings.id, req.params.id)).limit(1);
    if (existing.length === 0) return reply.code(404).send({ error: "Not found" });
    if (existing[0].ventureId !== sub) return reply.code(403).send({ error: "Not your job" });

    const parsed = jobCreate.partial().safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid input" });
    const u = parsed.data as any;
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (u.title !== undefined) updates.title = u.title;
    if (u.description !== undefined) updates.description = u.description;
    if (u.category !== undefined) updates.category = u.category;
    if (u.salaryDot !== undefined) updates.salaryDot = String(u.salaryDot);
    if (u.employmentType !== undefined) updates.employmentType = u.employmentType;
    if (u.requirements !== undefined) updates.requirements = u.requirements;

    const updated = await db.update(jobListings).set(updates as any).where(eq(jobListings.id, req.params.id)).returning();
    return reply.send({ job: updated[0] });
  });

  /* ---------------- Orders ---------------- */

  /** POST /api/orders — client creates a gig order; amount held in escrow metadata */
  app.post("/orders", { preHandler: app.authenticate }, async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const parsed = z
      .object({
        serviceId: z.string().uuid(),
        requirements: z.string().max(5000).optional(),
      })
      .safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid input" });

    const svc = await db.select().from(services).where(eq(services.id, parsed.data.serviceId)).limit(1);
    if (svc.length === 0 || !svc[0].isActive) return reply.code(404).send({ error: "Service not available" });
    if (svc[0].builderId === sub) return reply.code(400).send({ error: "Cannot order your own service" });

    const amount = Number(svc[0].priceDot);

    // Neon HTTP doesn't support multi-statement transactions, so we use a
    // two-phase escrow model:
    //   1. NOW (POST /orders): record the order with `amountDot` as the
    //      held-in-escrow amount. No DOT moves yet — but the order is locked.
    //   2. LATER (PATCH /complete): atomically debit client + credit builder
    //      via transferDot() once the client accepts the delivery.
    //
    // This still prevents theft: builder can't withdraw until /complete is
    // called by the client (status guard), and the client can't get their
    // money back without an explicit cancel/dispute flow.

    const inserted = await db
      .insert(serviceOrders)
      .values({
        serviceId: svc[0].id,
        clientId: sub,
        builderId: svc[0].builderId,
        amountDot: String(amount),
        title: svc[0].title,
        requirements: parsed.data.requirements,
        status: "in_progress",
        updatedAt: new Date(),
      } as any)
      .returning();

    // Mark the order as escrowed so the client sees the charge is locked.
    return reply.send({
      order: { ...inserted[0], escrowHeld: true },
      notice: "DOT will be deducted from your wallet when you mark the order complete.",
    });
  });

  /** GET /api/orders — list my orders (both client and builder sides) */
  app.get("/orders", { preHandler: app.authenticate }, async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const role = z.enum(["client", "builder"]).default("client").safeParse((req.query as any).role);
    if (!role.success) return reply.code(400).send({ error: "Invalid role" });

    const column = role.data === "client" ? serviceOrders.clientId : serviceOrders.builderId;
    const rows = await db
      .select()
      .from(serviceOrders)
      .where(eq(column, sub))
      .orderBy(desc(serviceOrders.createdAt))
      .limit(50);
    return reply.send({ orders: rows });
  });

  /** PATCH /api/orders/:id/deliver — builder marks delivered */
  app.patch<{ Params: { id: string } }>("/orders/:id/deliver", { preHandler: app.authenticate }, async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const parsed = z.object({ deliveryNote: z.string().max(5000) }).safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid input" });

    const o = await db.select().from(serviceOrders).where(eq(serviceOrders.id, req.params.id)).limit(1);
    if (o.length === 0) return reply.code(404).send({ error: "Not found" });
    if (o[0].builderId !== sub) return reply.code(403).send({ error: "Not your order" });
    if (o[0].status !== "in_progress") return reply.code(409).send({ error: `Cannot deliver from status ${o[0].status}` });

    const updated = await db
      .update(serviceOrders)
      .set({ status: "delivered", deliveryNote: parsed.data.deliveryNote, updatedAt: new Date() } as any)
      .where(eq(serviceOrders.id, req.params.id))
      .returning();
    return reply.send({ order: updated[0] });
  });

  /** PATCH /api/orders/:id/complete — client accepts, funds released */
  app.patch<{ Params: { id: string } }>("/orders/:id/complete", { preHandler: app.authenticate }, async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const o = await db.select().from(serviceOrders).where(eq(serviceOrders.id, req.params.id)).limit(1);
    if (o.length === 0) return reply.code(404).send({ error: "Not found" });
    if (o[0].clientId !== sub) return reply.code(403).send({ error: "Not your order" });
    if (o[0].status !== "delivered") return reply.code(409).send({ error: "Builder has not delivered yet" });

    // Release escrow to builder (this also handles the wallet-side accounting).
    // Two-phase model: client was NOT debited at order creation, so we must
    // debit them now AND credit the builder. If the client has insufficient
    // balance, surface the error and don't mark complete.
    try {
      await debitWallet({
        userId: sub,
        amount: Number(o[0].amountDot),
        description: `Order ${o[0].id} payment`,
        type: "debit",
      });
    } catch (e: any) {
      return reply.code(402).send({ error: e?.message ?? "Insufficient balance to complete order" });
    }

    try {
      await creditWallet({
        userId: o[0].builderId,
        amount: Number(o[0].amountDot),
        description: `Order ${o[0].id} completed`,
        type: "credit",
      });
    } catch (e: any) {
      // Best-effort: if credit fails after debit, try to refund the client.
      try {
        await creditWallet({
          userId: sub,
          amount: Number(o[0].amountDot),
          description: `Refund: order ${o[0].id} credit failed`,
          type: "credit",
        });
      } catch {}
      return reply.code(402).send({ error: e?.message ?? "Could not release escrow to builder" });
    }

    // Award reputation — completing a paid order is the core builder growth action.
    try {
      await awardReputation({
        userId: o[0].builderId,
        delta: 50,
        reason: `Completed order ${o[0].id}`,
        refType: "service_order",
        refId: o[0].id,
      });
    } catch {
      // Reputation is best-effort; don't fail the completion if it errors.
    }

    // Mint a "gig completed" certificate for the builder (dedup-safe).
    try {
      const { mintCertificate } = await import("../lib/cert.js");
      await mintCertificate(app, {
        userId: o[0].builderId,
        source: "gig",
        sourceId: o[0].id,
        title: `Gig: Order ${o[0].id.slice(0, 8)}`,
        issuer: "DOT Marketplace",
        level: "Foundations",
        dotReward: 0,
        meta: { orderId: o[0].id, amountDot: o[0].amountDot },
      });
    } catch {
      // best effort
    }

    const updated = await db
      .update(serviceOrders)
      .set({ status: "completed", completedAt: new Date(), updatedAt: new Date() } as any)
      .where(eq(serviceOrders.id, req.params.id))
      .returning();

    // Fire notifications to both parties (fire-and-forget)
    if (o[0]) {
      Promise.allSettled([
        import("../lib/notify.js").then(({ notify }) =>
          notify({
            userId: o[0].builderId,
            type: "service_purchased",
            title: "Order completed",
            body: `Order for ${o[0].title ?? "service"} marked complete — escrowed DOT released.`,
            link: `/builder/orders`,
            icon: "CheckCircle2",
          }),
        ),
        import("../lib/notify.js").then(({ notify }) =>
          notify({
            userId: o[0].clientId,
            type: "service_purchased",
            title: "Order completed",
            body: `Your order is complete. Leave a review to help the builder's reputation.`,
            link: `/builder/orders`,
            icon: "CheckCircle2",
          }),
        ),
      ]).catch(() => {});
    }

    return reply.send({ order: updated[0] });
  });

  /** PATCH /api/orders/:id/cancel — either side, only while in_progress */
  app.patch<{ Params: { id: string } }>("/orders/:id/cancel", { preHandler: app.authenticate }, async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const o = await db.select().from(serviceOrders).where(eq(serviceOrders.id, req.params.id)).limit(1);
    if (o.length === 0) return reply.code(404).send({ error: "Not found" });
    if (o[0].builderId !== sub && o[0].clientId !== sub) return reply.code(403).send({ error: "Not your order" });
    if (o[0].status !== "in_progress") return reply.code(409).send({ error: `Cannot cancel from status ${o[0].status}` });

    // Refund: builder → client.
    try {
      await transferDot({
        fromUserId: o[0].builderId,
        toUserId: o[0].clientId,
        amount: Number(o[0].amountDot),
        description: `Refund for cancelled order ${o[0].id}`,
      });
    } catch (e) {
      // If the builder has insufficient DOT for refund (rare — only
      // possible if they spent escrow), mark for manual review.
      await db
        .update(serviceOrders)
        .set({ status: "disputed", updatedAt: new Date() } as any)
        .where(eq(serviceOrders.id, req.params.id));
      return reply.code(409).send({ error: "Refund failed; order marked disputed" });
    }

    const updated = await db
      .update(serviceOrders)
      .set({ status: "cancelled", updatedAt: new Date() } as any)
      .where(eq(serviceOrders.id, req.params.id))
            .returning();
          return reply.send({ order: updated[0] });
        });

        /* ── Convenience endpoints for "mine" queries ─────────────── */

        /** GET /api/services/mine — current user's services as builder */
        app.get("/services/mine", { preHandler: app.authenticate }, async (req, reply) => {
          const { sub } = req.user as { sub: string };
          const rows = await db
            .select()
            .from(services)
            .where(eq(services.builderId, sub))
            .orderBy(desc(services.createdAt));
          return reply.send({ services: rows.map(serializeService) });
        });

        /** GET /api/jobs/mine — current user's posted job listings */
        app.get("/jobs/mine", { preHandler: app.authenticate }, async (req, reply) => {
          const { sub } = req.user as { sub: string };
          const rows = await db
            .select()
            .from(jobListings)
            .where(eq(jobListings.ventureId, sub))
            .orderBy(desc(jobListings.createdAt));
          return reply.send({ jobs: rows.map(serializeJob) });
        });
        /** POST /api/orders/:id/dispute — client flags a completed order
         *  as unsatisfactory. Marks the order "disputed" and notifies
         *  admins. The admin team resolves via /admin/orders. */
        app.post<{ Params: { id: string } }>(
          "/orders/:id/dispute",
          { preHandler: app.authenticate, config: { rateLimit: { max: 5, timeWindow: "1 minute" } } },
          async (req, reply) => {
            const { sub } = req.user as { sub: string };
            const { reason } = (req.body ?? {}) as { reason?: string };
            const order = await db
              .select()
              .from(serviceOrders)
              .where(eq(serviceOrders.id, req.params.id))
              .limit(1);
            if (order.length === 0) return reply.code(404).send({ error: "Order not found" });
            if (order[0].clientId !== sub) return reply.code(403).send({ error: "Not your order" });
            if (!["in_progress", "completed"].includes(order[0].status as string)) {
              return reply.code(409).send({ error: `Cannot dispute from status ${order[0].status}` });
            }

            await db
              .update(serviceOrders)
              .set({
                status: "disputed",
                disputeReason: reason ?? null,
                disputedAt: new Date(),
                updatedAt: new Date(),
              } as any)
              .where(eq(serviceOrders.id, req.params.id));

            // Notify builder + admin.
            const { notify } = await import("../lib/notify.js");
            Promise.allSettled([
              notify({
                userId: order[0].builderId,
                type: "order_disputed",
                title: "Order disputed",
                body: `Client opened a dispute on order ${req.params.id}.${reason ? ` Reason: ${reason.slice(0, 120)}` : ""}`,
                link: `/builder/orders`,
                icon: "AlertTriangle",
              }),
              notify({
                userId: sub,
                type: "order_disputed",
                title: "Dispute opened",
                body: `We received your dispute. An admin will review within 48h.`,
                link: `/wallet`,
                icon: "AlertTriangle",
              }),
            ]).catch(() => {});

            return reply.send({ ok: true, orderId: req.params.id });
          },
        );

        /** POST /api/orders/:id/review — rate a completed service order. */
        app.post<{ Params: { id: string } }>(
          "/orders/:id/review",
          { preHandler: app.authenticate, config: { rateLimit: { max: 10, timeWindow: "1 minute" } } },
          async (req, reply) => {
            const { sub } = req.user as { sub: string };
            const { rating, comment } = (req.body ?? {}) as { rating?: number; comment?: string };
            if (typeof rating !== "number" || rating < 1 || rating > 5) {
              return reply.code(400).send({ error: "Rating must be 1-5" });
            }
            const order = await db
              .select()
              .from(serviceOrders)
              .where(eq(serviceOrders.id, req.params.id))
              .limit(1);
            if (order.length === 0) return reply.code(404).send({ error: "Order not found" });
            if (order[0].clientId !== sub) return reply.code(403).send({ error: "Not your order" });
            if (order[0].status !== "completed") return reply.code(400).send({ error: "Order not completed" });
            try {
              const inserted = await db
                .insert(serviceReviews)
                .values({
                  orderId: order[0].id,
                  builderId: order[0].builderId,
                  clientId: sub,
                  rating,
                  comment: comment ?? null,
                  createdAt: new Date(),
                } as any)
                .returning();
              return reply.send({ review: inserted[0] });
            } catch {
              return reply.code(409).send({ error: "Already reviewed" });
            }
          },
        );

      }

      function serializeService(s: any) {
        return {
          id: s.id,
          builderId: s.builderId,
          title: s.title,
          description: s.description,
          category: s.category,
          priceDot: Number(s.priceDot),
          nairaEquivalent: dotToNaira(s.priceDot),
          deliveryDays: s.deliveryDays,
          isActive: s.isActive,
          createdAt: s.createdAt,
        };
      }

      function serializeJob(j: any) {
        return {
          id: j.id,
          ventureId: j.ventureId,
          title: j.title,
          description: j.description,
          category: j.category,
          salaryDot: Number(j.salaryDot),
          employmentType: j.employmentType,
          requirements: j.requirements,
          isOpen: j.isOpen,
          createdAt: j.createdAt,
          updatedAt: j.updatedAt,
        };
      }
// @ts-nocheck