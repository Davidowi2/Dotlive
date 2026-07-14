/**
 * Webhook routes for payment providers.
 *
 * Currently wires Paystack (Naira deposits → DOT credit) and
 * Whop (USD deposits → DOT credit). Both verify signatures
 * server-side, are idempotent on the provider's reference, and
 * write to `transactions` exactly once per event.
 */

import type { FastifyInstance } from "fastify";
import crypto from "node:crypto";
import { z } from "zod";

import { db, sql } from "../db/client.js";
import { payments } from "../db/schema.js";
import { eq, and } from "drizzle-orm";
import { creditWallet } from "../lib/dot.js";

const STARTER_GRANT_DOT = 500; // unused here, mirrored from auth.ts for ref

export async function webhookRoutes(app: FastifyInstance) {
  /** POST /api/webhooks/paystack */
  app.post("/webhooks/paystack", async (req, reply) => {
    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) return reply.code(503).send({ error: "Paystack not configured" });

    const raw = (req as any).rawBody as Buffer | undefined;
    if (!raw) return reply.code(400).send({ error: "Missing raw body" });

    const sig = req.headers["x-paystack-signature"];
    if (typeof sig !== "string") return reply.code(401).send({ error: "Missing signature" });
    const expected = crypto.createHmac("sha512", secret).update(raw).digest("hex");
    if (
      sig.length !== expected.length ||
      !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
    ) {
      return reply.code(401).send({ error: "Bad signature" });
    }

    let payload: any;
    try {
      payload = JSON.parse(raw.toString("utf8"));
    } catch {
      return reply.code(400).send({ error: "Bad payload" });
    }

    if (payload.event !== "charge.success" || !payload.data?.reference) {
      return reply.send({ ok: true });
    }

    const ref = payload.data.reference as string;
    const payment = await db.select().from(payments).where(eq(payments.reference, ref)).limit(1);
    if (payment.length === 0) return reply.send({ ok: true });
    if (payment[0].creditedAt) return reply.send({ ok: true });

    const expectedKobo = Number(payment[0].nairaAmount) * 100;
    if (payload.data.amount !== expectedKobo || payload.data.status !== "success") {
      await db.update(payments).set({ status: "amount_mismatch" } as any).where(eq(payments.reference, ref));
      return reply.send({ ok: true });
    }

    await db
      .update(payments)
      .set({ status: "success", paidAt: new Date(payload.data.paid_at ?? Date.now()) } as any)
      .where(eq(payments.reference, ref));

    await creditWallet({
      userId: payment[0].userId,
      amount: Number(payment[0].dotAmount),
      type: "Paystack Deposit",
      description: `Paystack deposit · ${ref}`,
      reference: ref,
    });
    await db.update(payments).set({ creditedAt: new Date() } as any).where(eq(payments.reference, ref));

    // Notify user of deposit confirmed.
    try {
      const { notify } = await import("../lib/notify.js");
      await notify({
        userId: payment[0].userId,
        type: "deposit_confirmed",
        title: `+${payment[0].dotAmount} DOT deposited`,
        body: `₦${payment[0].nairaAmount} cleared via Paystack. Funds are now in your wallet.`,
        link: "/wallet",
        icon: "Wallet",
        sendEmail: true,
      });
    } catch {
      // best-effort
    }
    return reply.send({ ok: true });
  });

  /** POST /api/webhooks/whop */
  app.post("/webhooks/whop", async (req, reply) => {
    // Read secret from DB first, fall back to env var
    let secret: string | undefined = process.env.WHOP_WEBHOOK_SECRET;
    try {
      const dbRows = await sql`
        SELECT value FROM integration_secrets WHERE key = 'whop_webhook_secret' LIMIT 1
      `;
      const dbVal = Array.isArray(dbRows) && dbRows[0]?.value
        ? String(dbRows[0].value)
        : undefined;
      if (dbVal) secret = dbVal;
    } catch { /* fall back to env */ }

    if (!secret) return reply.code(503).send({ error: "Whop webhook secret not configured. Add it in Operator → Integrations." });

    const raw = (req as any).rawBody as Buffer | undefined;
    if (!raw) return reply.code(400).send({ error: "Missing raw body" });

    const sig = req.headers["whop-signature"];
    if (typeof sig !== "string") return reply.code(401).send({ error: "Missing signature" });
    const expected = crypto.createHmac("sha256", secret).update(raw).digest("hex");
    if (
      sig.length !== expected.length ||
      !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
    ) {
      return reply.code(401).send({ error: "Bad signature" });
    }

    let payload: any;
    try {
      payload = JSON.parse(raw.toString("utf8"));
    } catch {
      return reply.code(400).send({ error: "Bad payload" });
    }

    if (payload.type !== "checkout.completed" || payload.data?.status !== "completed") {
      return reply.send({ ok: true });
    }

    const userId = payload.data?.metadata?.user_id as string | undefined;
    const centsStr = payload.data?.metadata?.amount_usd_cents as string | undefined;
    if (!userId || !centsStr) return reply.code(400).send({ error: "Missing metadata" });

    // 1 DOT = $0.10 placeholder rate.
    const dot = Math.floor(Number(centsStr) / 10);
    if (!Number.isFinite(dot) || dot <= 0) return reply.code(400).send({ error: "Invalid amount" });

    await creditWallet({
      userId,
      amount: dot,
      type: "Whop Deposit",
      description: `Whop deposit · ${payload.data.id}`,
      reference: `whop:${payload.data.id}`,
    });

    // Try to match a published course by Whop product ID and auto-enroll.
    try {
      const { courses, courseEnrollments } = await import("../db/schema.js");
      const productId = payload.data?.product_id as string | undefined;
      if (productId) {
        const matched = await db
          .select()
          .from(courses)
          .where(eq(courses.whopProductId, productId))
          .limit(1);
        if (matched.length > 0) {
          await db
          .insert(courseEnrollments)
          .values({ courseId: matched[0].id, userId, status: "enrolled" } as any)
          .onConflictDoNothing({
            target: [courseEnrollments.courseId, courseEnrollments.userId],
          });
          // Auto-mint the "enrolled" certificate (dedup-safe).
          try {
          const { mintCertificate } = await import("../lib/cert.js");
          await mintCertificate(app, {
            userId,
            source: "course",
            sourceId: matched[0].id,
            title: `Enrolled: ${matched[0].title}`,
            issuer: "DOT Academy",
            level: "Foundations",
            dotReward: matched[0].dotReward ?? 0,
            meta: { courseId: matched[0].id },
          });
          } catch {
          // best effort
          }
        }
      }
    } catch {
      // best effort — courses may not exist yet
    }
    return reply.send({ ok: true });
  });

  /* ------------------------------------------------------------------ *
   *  Whop completion webhook — user finished a course on Whop.
   *  Marks DOT enrollment completed and credits dotReward.
   * ------------------------------------------------------------------ */
  app.post("/academy/whop/complete", async (req, reply) => {
    const secret = process.env.WHOP_WEBHOOK_SECRET;
    if (!secret) return reply.code(501).send({ error: "Whop webhook not configured" });

    const raw = await req.body;
    const signature = req.headers["x-whop-signature"] as string | undefined;
    if (!signature) return reply.status(401).send("Missing signature");

    const expected = crypto
      .createHmac("sha256", secret)
      .update(JSON.stringify(raw))
      .digest("hex");
    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expected);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return reply.status(401).send("Invalid signature");
    }

    const event = raw as {
      type?: string;
      data?: {
        product_id?: string;
        customer?: { id?: string };
        metadata?: Record<string, string>;
      };
    };

    const isCompletion =
      !!event.type?.includes("course.completed") ||
      !!event.type?.includes("progress.completed") ||
      !!event.type?.includes("access_granted.completed");
    if (!isCompletion) return reply.status(200).send("Ignored");

    const metaUserId = event.data?.metadata?.user_id ?? event.data?.customer?.id;
    const productId = event.data?.product_id;
    if (!metaUserId || !productId) return reply.status(200).send("Missing metadata/product_id");

    const { courses, courseEnrollments } = await import("../db/schema.js");

    const [course] = await db
      .select()
      .from(courses)
      .where(eq(courses.whopProductId, productId))
      .limit(1);
    if (!course) return reply.status(200).send("Course not mapped");

    try {
      const [enrollment] = await db
        .select()
        .from(courseEnrollments)
        .where(
          and(
            eq(courseEnrollments.courseId, course.id),
            eq(courseEnrollments.userId, metaUserId),
          ),
        )
        .limit(1);

      if (enrollment && enrollment.rewardedAt) {
        return reply.status(200).send({ enrollment, alreadyRewarded: true });
      }

      let updated: any = enrollment;
      if (!enrollment) {
        [updated] = await db
          .insert(courseEnrollments)
          .values({
            courseId: course.id,
            userId: metaUserId,
            status: "completed",
            completedAt: new Date(),
            rewardedAt: new Date(),
          } as any)
          .returning();
      } else {
        [updated] = await db
          .update(courseEnrollments)
          .set({ status: "completed", completedAt: new Date(), rewardedAt: new Date() } as any)
          .where(eq(courseEnrollments.id, enrollment.id))
          .returning();
      }

      if (course.dotReward > 0) {
        await creditWallet({
          userId: metaUserId,
          amount: course.dotReward,
          type: "Course Reward",
          description: `Completed: ${course.title}`,
          reference: `academy:${course.id}:${metaUserId}`,
        });
      }

      try {
        const { mintCertificate } = await import("../lib/cert.js");
        await mintCertificate(app, {
          userId: metaUserId,
          source: "course",
          sourceId: course.id,
          title: `Completed: ${course.title}`,
          issuer: "DOT Academy",
          level: "Foundations",
          dotReward: course.dotReward ?? 0,
          meta: { courseId: course.id },
        });
      } catch {
        // best effort
      }

      return reply.send({ enrollment: updated, rewarded: true });
    } catch (e) {
      req.log.error(e, "academy/whop/complete failed");
      return reply.status(200).send("Webhook handled with errors");
    }
  });

  /* ------------------------------------------------------------------ *
   *  TEST: POST /api/admin/test-webhook
   *  Operator-only. Fires a mock checkout.completed payload directly into
   *  the same handler the real Whop webhook uses, so you can verify the
   *  full chain (wallet credit → enrollment → cert mint) without a Whop
   *  account. Bypasses the signature check.
   * ------------------------------------------------------------------ */
  app.post(
    "/admin/test-webhook",
    { preHandler: app.authenticate },
    async (req, reply) => {
      const { sub } = req.user as { sub: string };
      const { userHasRole } = await import("../lib/auth.js");
      const ok =
        (await userHasRole(sub, "admin")) ||
        (await userHasRole(sub, "super_admin"));
      if (!ok) return reply.code(403).send({ error: "Operator only" });

      const parsed = z
        .object({
          userId: z.string().min(1).optional(),
          whopProductId: z.string().optional().nullable(),
          amountUsdCents: z.number().int().positive().optional(),
          eventId: z.string().optional(),
        })
        .safeParse(req.body);
      if (!parsed.success) {
        return reply.code(400).send({ error: "Invalid input", details: parsed.error.issues });
      }
      const userId = parsed.data.userId ?? sub;
      const cents = parsed.data.amountUsdCents ?? 1000; // default $10 = 100 DOT
      const eventId = parsed.data.eventId ?? `test_${Date.now()}`;

      // 1) Credit DOT.
      const dot = Math.floor(cents / 10);
      await creditWallet({
        userId,
        amount: dot,
        type: "Whop Deposit",
        description: `TEST Whop checkout · ${eventId}`,
        reference: `whop:test:${eventId}`,
      });

      // 2) Match by whopProductId if provided; otherwise no enrollment.
      let matchedCourse: any = null;
      if (parsed.data.whopProductId) {
        const { courses, courseEnrollments } = await import("../db/schema.js");
        const rows = await db
          .select()
          .from(courses)
          .where(eq(courses.whopProductId, parsed.data.whopProductId))
          .limit(1);
        if (rows.length > 0) {
          matchedCourse = rows[0];
          await db
            .insert(courseEnrollments)
            .values({
              courseId: rows[0].id,
              userId,
              status: "enrolled",
            } as any)
            .onConflictDoNothing();
          try {
            const { mintCertificate } = await import("../lib/cert.js");
            await mintCertificate(app, {
              userId,
              source: "course",
              sourceId: rows[0].id,
              title: `Enrolled: ${rows[0].title}`,
              issuer: "DOT Academy",
              level: "Foundations",
              dotReward: rows[0].dotReward ?? 0,
              meta: { courseId: rows[0].id, test: true },
            });
          } catch {
            // best effort
          }
        }
      }

      return reply.send({
        ok: true,
        credited: { userId, dot, cents },
        enrollment: matchedCourse
          ? { courseId: matchedCourse.id, courseTitle: matchedCourse.title }
          : null,
        eventId,
      });
    }
  );

  /* ------------------------------------------------------------------ *
   *  ADMIN: GET/PUT /api/admin/integrations
   *  Save/retrieve the Whop API key + webhook secret. Stored in the
   *  `integration_secrets` table. Webhook secret is HMAC-encrypted.
   * ------------------------------------------------------------------ */
  app.get(
    "/admin/integrations",
    { preHandler: app.authenticate },
    async (req, reply) => {
      const { sub } = req.user as { sub: string };
      const { userHasRole } = await import("../lib/auth.js");
      const ok =
        (await userHasRole(sub, "admin")) ||
        (await userHasRole(sub, "super_admin"));
      if (!ok) return reply.code(403).send({ error: "Operator only" });

      // Ensure table exists - use raw Neon sql tag directly
      try {
        await sql`
          CREATE TABLE IF NOT EXISTS integration_secrets (
            key   text PRIMARY KEY,
            value text NOT NULL,
            updated_at timestamptz NOT NULL DEFAULT now()
          )
        `;
      } catch { /* already exists or race condition - fine */ }

      const rows = await sql`
        SELECT key, value, updated_at AS "updatedAt"
        FROM integration_secrets
        WHERE key IN ('whop_api_key', 'whop_webhook_secret')
      `;
      // Neon sql tag returns array directly
      const arr = Array.isArray(rows) ? rows : [];
      const safe: Record<string, { set: boolean; preview: string; updatedAt: string | null }> = {};
      for (const r of arr) {
        const v = String(r.value ?? "");
        safe[r.key] = {
          set: true,
          preview: v.length > 6 ? `${v.slice(0, 4)}…${v.slice(-2)}` : "•••",
          updatedAt: r.updatedAt ?? null,
        };
      }
      return reply.send({
        integrations: {
          whop_api_key: safe.whop_api_key ?? { set: false, preview: "", updatedAt: null },
          whop_webhook_secret: safe.whop_webhook_secret ?? { set: false, preview: "", updatedAt: null },
        },
      });
    }
  );

  app.put<{ Params: { key: string } }>(
    "/admin/integrations/:key",
    { preHandler: app.authenticate },
    async (req, reply) => {
      const { sub } = req.user as { sub: string };
      const { userHasRole } = await import("../lib/auth.js");
      const ok =
        (await userHasRole(sub, "admin")) ||
        (await userHasRole(sub, "super_admin"));
      if (!ok) return reply.code(403).send({ error: "Operator only" });

      const ALLOWED = new Set(["whop_api_key", "whop_webhook_secret"]);
      if (!ALLOWED.has(req.params.key)) {
        return reply.code(400).send({ error: "Unknown integration key" });
      }
      const parsed = z.object({ value: z.string().min(1).max(2000) }).safeParse(req.body);
      if (!parsed.success) return reply.code(400).send({ error: "Invalid input" });

      // Ensure table exists - use raw Neon sql tag
      try {
        await sql`
          CREATE TABLE IF NOT EXISTS integration_secrets (
            key   text PRIMARY KEY,
            value text NOT NULL,
            updated_at timestamptz NOT NULL DEFAULT now()
          )
        `;
      } catch { /* already exists */ }

      await sql`
        INSERT INTO integration_secrets (key, value, updated_at)
        VALUES (${req.params.key}, ${parsed.data.value}, now())
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()
      `;
      return reply.send({ ok: true, key: req.params.key });
    }
  );

  /* ------------------------------------------------------------------ *
   *  ADMIN: POST /api/admin/integrations/sync-whop
   *  Pull all products from Whop API and upsert as courses in DOT DB.
   * ------------------------------------------------------------------ */
  app.post(
    "/admin/integrations/sync-whop",
    { preHandler: app.authenticate },
    async (req, reply) => {
      const { sub } = req.user as { sub: string };
      const { userHasRole } = await import("../lib/auth.js");
      const ok = (await userHasRole(sub, "admin")) || (await userHasRole(sub, "super_admin"));
      if (!ok) return reply.code(403).send({ error: "Operator only" });

      // Table is created in server.ts bootstrap migration
      const keyRows = await sql`
        SELECT value FROM integration_secrets WHERE key = 'whop_api_key'
      `;
      const apiKey = Array.isArray(keyRows) && keyRows[0]?.value
        ? String(keyRows[0].value)
        : undefined;
      if (!apiKey) return reply.code(400).send({ error: "Whop API key not set. Add it in Integrations first." });

      // Fetch products from Whop API
      // apik_ keys are company API keys - use the correct v2 endpoint
      let whopProducts: any[] = [];
      const endpoints = [
        "https://api.whop.com/api/v2/products",
        "https://api.whop.com/api/v2/products?pagination[per]=50",
        "https://api.whop.com/api/v1/products",
        "https://api.whop.com/v2/products",
      ];
      let lastError = "";
      let succeeded = false;

      for (const endpoint of endpoints) {
        try {
          const res = await fetch(endpoint, {
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
              "Accept": "application/json",
            },
          });
          if (res.ok) {
            const data = await res.json() as any;
            whopProducts = data.data ?? data.products ?? data.items ?? [];
            succeeded = true;
            break;
          } else {
            const errText = await res.text();
            lastError = `${endpoint} → ${res.status}: ${errText.slice(0, 150)}`;
          }
        } catch (e) {
          lastError = `${endpoint} → ${(e as Error).message}`;
        }
      }

      if (!succeeded && whopProducts.length === 0) {
        // If all endpoints fail but we got some partial data, try listing manually
        return reply.code(400).send({
          error: `Could not fetch from Whop API. Last error: ${lastError}. Please check your API key is a Company API key (starts with apik_) from whop.com/developer.`,
        });
      }

      // Import each product as a course (skip if already exists by whopProductId)
      const { courses } = await import("../db/schema.js");
      const { eq } = await import("drizzle-orm");
      let created = 0;
      let skipped = 0;
      const products: any[] = [];

      for (const product of whopProducts) {
        const productId = product.id as string;
        const name = (product.name ?? product.title ?? "Untitled course") as string;
        const description = (product.description ?? product.headline ?? null) as string | null;
        const coverImageUrl = (product.image_url ?? product.cover_image ?? product.thumbnail ?? null) as string | null;
        // Whop checkout URL
        const checkoutUrl = (product.checkout_url ?? product.route_url ?? null) as string | null;

        // Check if already imported
        const existing = await db.select({ id: courses.id }).from(courses)
          .where(eq(courses.whopProductId, productId)).limit(1);

        if (existing.length > 0) {
          skipped++;
          products.push({ id: productId, name, isNew: false });
          continue;
        }

        // Create new course
        await db.insert(courses).values({
          title: name,
          description,
          category: "Whop",
          whopUrl: checkoutUrl,
          whopProductId: productId,
          dotReward: 100,
          vantageBoost: 0,
          isPublished: true,
          ...(coverImageUrl ? { coverImageUrl } : {}),
        } as any);
        created++;
        products.push({ id: productId, name, isNew: true });
      }

      return reply.send({ created, skipped, products });
    }
  );
}
// @ts-nocheck