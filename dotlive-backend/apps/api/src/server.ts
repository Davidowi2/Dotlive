/**
 * Fastify entry point.
 *
 * Boot order:
 *   1. Load .env (dotenv/config).
 *   2. Validate critical env vars — hard-fail in production if missing.
 *   3. Build the app with plugins.
 *   4. Register rate limiting globally.
 *   5. Register JWT auth decorator.
 *   6. Capture raw body for webhook HMAC verification.
 *   7. Register route plugins.
 *   8. Central error handler.
 *   9. Listen on PORT.
 */

import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import multipart from "@fastify/multipart";
import cookie from "@fastify/cookie";
import rateLimit from "@fastify/rate-limit";

import { authRoutes }       from "./routes/auth.js";
import { investorRoutes } from "./routes/investor.js";
import { investmentsRoutes } from "./routes/investments.js";
import { userRoutes }       from "./routes/users.js";
import { walletRoutes }     from "./routes/wallet.js";
import { ventureRoutes }    from "./routes/ventures.js";
import { vantageRoutes }    from "./routes/vantage.js";
import { academyRoutes }    from "./routes/academy.js";
import { pitchathonRoutes } from "./routes/pitchathons.js";
import { marketplaceRoutes} from "./routes/marketplace.js";
import { communityRoutes }  from "./routes/community.js";
import { uploadRoutes }     from "./routes/upload.js";
import { webhookRoutes }    from "./routes/webhooks.js";
import { statsRoutes }      from "./routes/stats.js";
import { onboardingRoutes } from "./routes/onboarding.js";
import { osRoutes }          from "./routes/os.js";
import { withdrawalRoutes } from "./routes/withdrawals.js";
import { communityBillingRoutes } from "./routes/community-billing.js";
import { demoEventRoutes } from "./routes/demo-events.js";
import { adminRoutes }      from "./routes/admin.js";
import { adminToolsRoutes } from "./routes/admin-tools.js";
import { capitalPartnerRoutes } from "./routes/capital-partner.js";
import { extrasRoutes } from "./routes/extras.js";
import { otpRoutes } from "./routes/otp.js";
import { paymentsRoutes } from "./routes/payments.js";
import { magicLinkRoutes } from "./routes/magic-link.js";
import { notificationsRoutes } from "./routes/notifications.js";
import { certificatesRoutes } from "./routes/certificates.js";
import { wizardRoutes } from "./routes/wizard.js";
import { referralRoutes } from "./routes/referrals.js";

/* ── Env validation ─────────────────────────────────────────── */

const NODE_ENV  = process.env.NODE_ENV ?? "development";
const PORT      = Number(process.env.PORT ?? 3001);

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret || jwtSecret === "dev-secret-do-not-use-in-prod") {
  if (NODE_ENV === "production") {
    // Hard-fail — a guessable JWT secret in production is a critical vulnerability.
    throw new Error(
      "[FATAL] JWT_SECRET must be set to a strong random value in production. " +
      "Use render.yaml generateValue:true or set it manually in your dashboard."
    );
  }
  console.warn(
    "⚠️  JWT_SECRET is not set or is the default dev value. " +
    "This is fine for local development but MUST be changed before deploying to production."
  );
}

/* ── App setup ──────────────────────────────────────────────── */

const app = Fastify({
  logger: NODE_ENV === "development" ? { level: "info" } : true,
  // Webhooks need the raw body for HMAC verification.
  // We capture it via the content-type parser below.
});

/* ── Content-type parsers: capture raw body ─────────────────── */

app.addContentTypeParser(
  "application/json",
  { parseAs: "buffer" },
  (req, body: Buffer, done) => {
    (req as any).rawBody = body;
    try {
      const json = body.length > 0 ? JSON.parse(body.toString("utf8")) : {};
      done(null, json);
    } catch (err) {
      done(err as Error, undefined);
    }
  }
);

app.addContentTypeParser(
  "*",
  { parseAs: "buffer" },
  (req, body: Buffer, done) => {
    (req as any).rawBody = body;
    if (req.headers["content-type"]?.startsWith("multipart/")) {
      return done(null, body);
    }
    if (body.length === 0) return done(null, {});
    try {
      done(null, JSON.parse(body.toString("utf8")));
    } catch {
      done(null, body.toString("utf8"));
    }
  }
);

/* Sprint B admin tools deploy v2 */
/* ── Plugins ─────────────────────────────────────────────────── */

await app.register(cors, {
  origin: (origin, cb) => {
    // Build allowed list from env at boot
    const envOrigins = (process.env.ALLOWED_ORIGINS ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const allowed = [
      "http://localhost:5173",
      "http://localhost:3000",
      "http://localhost:8081",
      "https://dotlive-lake.vercel.app",
      "https://dotlive-web.vercel.app",
      "https://dotlive.cv",
      "https://www.dotlive.cv",
      "http://dotlive.cv",
      ...envOrigins,
    ];
    // Allow all vercel.app previews and exact matches.
    // In dev / curl-with-no-origin, allow through.
    if (
      !origin ||
      allowed.includes(origin) ||
      origin.endsWith(".vercel.app") ||
      origin.endsWith(".onrender.com") ||
      process.env.NODE_ENV !== "production"
    ) {
      cb(null, true);
    } else {
      cb(new Error("Not allowed by CORS"), false);
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
});

// Cookie plugin — required for OAuth state CSRF protection.
await app.register(cookie, {
  secret: jwtSecret ?? "dev-cookie-secret",
  parseOptions: {},
});

// Global rate limit: 100 req/min per IP.
// Individual sensitive routes set tighter limits via config.rateLimit.
await app.register(rateLimit, {
  global: true,
  max: 100,
  timeWindow: "1 minute",
  allowList: ["127.0.0.1", "::1"],
  errorResponseBuilder: (_req, context) => ({
    error: "Too Many Requests",
    code: "rate_limited",
    message: `Rate limit exceeded. Try again in ${Math.ceil(context.ttl / 1000)} seconds.`,
    retryAfter: Math.ceil(context.ttl / 1000),
  }),
});

await app.register(jwt, {
  secret: jwtSecret ?? "dev-secret-do-not-use-in-prod",
});

await app.register(multipart, {
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB
});

/* ── Auth decorator ──────────────────────────────────────────── */

app.decorate("authenticate", async (req: any, reply: any) => {
  try {
    await req.jwtVerify();
  } catch {
    return reply.code(401).send({ error: "Unauthorized" });
  }
});

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (req: any, reply: any) => Promise<void>;
  }
}

/* ── Health check ────────────────────────────────────────────── */

app.get("/api/health", async () => {
  // Test DB connectivity so cold-start failures are visible
    let dbOk = false;
    let dbError: string | null = null;
    try {
      const { sql } = await import("drizzle-orm");
      const { db } = await import("./db/client.js");
      await db.execute(sql`SELECT 1`);
      dbOk = true;

      // Bootstrap migrations — ensure new columns exist before any
      // route handler hits them. Idempotent (uses IF NOT EXISTS).
      // Safe to re-run on every boot.
      await db.execute(sql`
        ALTER TABLE users
          ADD COLUMN IF NOT EXISTS referral_code text,
          ADD COLUMN IF NOT EXISTS referred_by text,
          ADD COLUMN IF NOT EXISTS referral_count integer NOT NULL DEFAULT 0,
          ADD COLUMN IF NOT EXISTS referral_earnings_dot numeric(20,2) NOT NULL DEFAULT 0;
      `);
      app.log.info("bootstrap migration: users referral columns ensured");
    } catch (err) {
      dbError = err instanceof Error ? err.message : String(err);
    }

  return {
    ok: dbOk,
    service: "dotlive-api",
    env: NODE_ENV,
    time: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {
      database: {
        ok: dbOk,
        error: dbError,
        configured: !!process.env.DATABASE_URL,
      },
      jwt: {
        ok: !!process.env.JWT_SECRET && process.env.JWT_SECRET !== "dev-secret-do-not-use-in-prod",
        configured: !!process.env.JWT_SECRET,
      },
      googleOAuth: {
        ok: !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET,
        configured: !!process.env.GOOGLE_CLIENT_ID,
      },
      paystack: {
        ok: !!process.env.PAYSTACK_SECRET_KEY,
        configured: !!process.env.PAYSTACK_SECRET_KEY,
      },
      cloudinary: {
        ok: !!process.env.CLOUDINARY_CLOUD_NAME && !!process.env.CLOUDINARY_API_KEY,
        configured: !!process.env.CLOUDINARY_CLOUD_NAME,
      },
    },
  };
});

/* ── Routes ──────────────────────────────────────────────────── */

await app.register(authRoutes,        { prefix: "/api" });
await app.register(userRoutes,        { prefix: "/api" });
await app.register(walletRoutes,      { prefix: "/api" });
await app.register(ventureRoutes,     { prefix: "/api" });
await app.register(vantageRoutes,     { prefix: "/api" });
await app.register(academyRoutes,     { prefix: "/api" });
await app.register(pitchathonRoutes,  { prefix: "/api" });
await app.register(marketplaceRoutes, { prefix: "/api" });
await app.register(communityRoutes,   { prefix: "/api" });
await app.register(uploadRoutes,      { prefix: "/api" });
await app.register(webhookRoutes,     { prefix: "/api" });
await app.register(statsRoutes,       { prefix: "/api" });
await app.register(investorRoutes,   { prefix: "/api" });
await app.register(investmentsRoutes, { prefix: "/api" });
await app.register(onboardingRoutes,  { prefix: "/api" });
await app.register(referralRoutes,   { prefix: "/api" });
  await app.register(osRoutes,           { prefix: "/api" });
await app.register(withdrawalRoutes,    { prefix: "/api" });
  await app.register(communityBillingRoutes, { prefix: "/api" });
  await app.register(demoEventRoutes,        { prefix: "/api" });
  await app.register(adminRoutes,            { prefix: "/api/admin" });
  await app.register(adminToolsRoutes,         { prefix: "/api" });
  await app.register(capitalPartnerRoutes,      { prefix: "/api" });
  await app.register(extrasRoutes,               { prefix: "/api" });
  await app.register(otpRoutes,                    { prefix: "/api" });
  await app.register(paymentsRoutes,                { prefix: "/api" });
  await app.register(magicLinkRoutes,                { prefix: "/api" });
  await app.register(notificationsRoutes,            { prefix: "/api" });
    await app.register(certificatesRoutes,             { prefix: "/api" });
    await app.register(wizardRoutes,                    { prefix: "/api" });

/* ── Error handler ───────────────────────────────────────────── */

app.setErrorHandler((err, req, reply) => {
  req.log.error(err);
  const statusCode = err.statusCode ?? 500;
  reply.code(statusCode).send({
    error: err.message ?? "Internal server error",
    code: err.code,
  });
});

/* ── Boot ────────────────────────────────────────────────────── */

const start = async () => {
  try {
    await app.listen({ port: PORT, host: "0.0.0.0" });
    app.log.info(`DOT API listening on http://0.0.0.0:${PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};
start();

// trigger deploy nt.times_result(user=0.109375, system=0.03125, children_user=0.0, children_system=0.0, elapsed=0.0)
// bump 7156 2026-06-26 22:36:29
// Sprint B extras trigger

// Sprint B force rebuild 1782519589
