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
import { challengeRoutes }  from "./routes/challenges.js";
import { connectionRoutes } from "./routes/connections.js";
import { stakesRoutes }     from "./routes/stakes.js";
import { leaderboardRoutes } from "./routes/leaderboard.js";
import { builderArenaRoutes } from "./routes/builders.js";
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
import { vouchesRoutes } from "./routes/vouches.js";
import { notificationsRoutes } from "./routes/notifications.js";
import { certificatesRoutes } from "./routes/certificates.js";
import { wizardRoutes } from "./routes/wizard.js";
import { feedRoutes } from "./routes/feed.js";
import { referralRoutes } from "./routes/referrals.js";
import { loansRoutes } from "./routes/loans.js";
import { pitchRoutes } from "./routes/pitch.js";
import { dividendsRoutes } from "./routes/dividends.js";
import { meetingsRoutes } from "./routes/meetings.js";
import { analyticsRoutes } from "./routes/analytics.js";

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
await app.register(challengeRoutes,   { prefix: "/api/community" });
await app.register(connectionRoutes,  { prefix: "/api" });
await app.register(leaderboardRoutes, { prefix: "/api" });
await app.register(builderArenaRoutes, { prefix: "/api" });
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
    await app.register(stakesRoutes,                       { prefix: "/api" });
      await app.register(certificatesRoutes,             { prefix: "/api" });
    await app.register(wizardRoutes,                    { prefix: "/api" });
    await app.register(feedRoutes,                       { prefix: "/api" });
    await app.register(pitchRoutes,                    { prefix: "/api" });
    await app.register(analyticsRoutes,                { prefix: "/api" });
    await app.register(loansRoutes,                       { prefix: "/api" });
    await app.register(dividendsRoutes,                   { prefix: "/api" });
    await app.register(meetingsRoutes,                    { prefix: "/api" });
    await app.register(vouchesRoutes,                     { prefix: "/api" });

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

/* ── Boot ────────────────────────────────────────────────────── */

/**
 * runBootstrapMigrations — runs critical DDL at startup so tables
 * exist before the first request hits any route handler.
 * All statements use IF NOT EXISTS — safe to run on every boot.
 */
async function runBootstrapMigrations() {
  try {
    const { sql: neonSql } = await import("./db/client.js");

    // integration_secrets — required by /api/admin/integrations
    await neonSql`
      CREATE TABLE IF NOT EXISTS integration_secrets (
        key   text PRIMARY KEY,
        value text NOT NULL,
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `;

    // password_reset_tokens — required by auth/forgot-password
    await neonSql`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id    text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token      text NOT NULL UNIQUE,
        expires_at timestamptz NOT NULL,
        used_at    timestamptz,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `;

    // feed tables
    await neonSql`
      CREATE TABLE IF NOT EXISTS feed_posts (
        id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        type          text NOT NULL DEFAULT 'general',
        title         text,
        body          text NOT NULL,
        author_id     text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        tags          text[] NOT NULL DEFAULT '{}',
        likes_count   integer NOT NULL DEFAULT 0,
        comments_count integer NOT NULL DEFAULT 0,
        budget_dot    numeric(20,2),
        gig_type      text,
        funding_goal  numeric(20,2),
        funding_round text,
        created_at    timestamptz NOT NULL DEFAULT now(),
        updated_at    timestamptz NOT NULL DEFAULT now()
      )
    `;
    await neonSql`
      CREATE TABLE IF NOT EXISTS feed_post_likes (
        post_id    uuid NOT NULL REFERENCES feed_posts(id) ON DELETE CASCADE,
        user_id    text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY (post_id, user_id)
      )
    `;
    await neonSql`
      CREATE TABLE IF NOT EXISTS feed_post_bookmarks (
        post_id    uuid NOT NULL REFERENCES feed_posts(id) ON DELETE CASCADE,
        user_id    text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY (post_id, user_id)
      )
    `;
    await neonSql`
      CREATE TABLE IF NOT EXISTS feed_comments (
        id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        post_id    uuid NOT NULL REFERENCES feed_posts(id) ON DELETE CASCADE,
        author_id  text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        body       text NOT NULL,
        likes_count integer NOT NULL DEFAULT 0,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `;

    // communities: is_private column
    await neonSql`ALTER TABLE communities ADD COLUMN IF NOT EXISTS is_private boolean NOT NULL DEFAULT false`;

    // events: whop_url column
    await neonSql`ALTER TABLE events ADD COLUMN IF NOT EXISTS whop_url text`;

    // courses: ensure whop columns + cover image exist
    await neonSql`ALTER TABLE courses ADD COLUMN IF NOT EXISTS whop_product_id text`;
    await neonSql`ALTER TABLE courses ADD COLUMN IF NOT EXISTS whop_url text`;
    await neonSql`ALTER TABLE courses ADD COLUMN IF NOT EXISTS cover_image_url text`;

    // builder_reviews table (for arena stats)
    await neonSql`
      CREATE TABLE IF NOT EXISTS builder_reviews (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        builder_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        reviewer_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        order_id text NOT NULL,
        rating integer NOT NULL,
        comment text,
        created_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE(order_id, reviewer_id)
      )
    `;
    await neonSql`CREATE INDEX IF NOT EXISTS builder_reviews_builder_idx ON builder_reviews(builder_id)`;

    // builder_profiles: ensure all columns exist
    await neonSql`
      ALTER TABLE builder_profiles
        ADD COLUMN IF NOT EXISTS hourly_dot numeric(20,2),
        ADD COLUMN IF NOT EXISTS portfolio_url text,
        ADD COLUMN IF NOT EXISTS linkedin_url text,
        ADD COLUMN IF NOT EXISTS twitter_url text,
        ADD COLUMN IF NOT EXISTS github_url text,
        ADD COLUMN IF NOT EXISTS location text,
        ADD COLUMN IF NOT EXISTS total_earned_dot numeric(20,2) NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS total_completed_orders integer NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS avg_rating numeric(3,2) NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS review_count integer NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS last_active_at timestamptz
    `;

    console.log("[startup] Bootstrap migrations complete");
  } catch (err) {
    console.error("[startup] Bootstrap migration error:", err);
  }

  // 0013 — runtime fixes (missing tables/columns causing 500s)
  try {
    const { sql: neonSql } = await import("./db/client.js");
    await neonSql`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS is_archived boolean NOT NULL DEFAULT false`;
    await neonSql`ALTER TABLE users ADD COLUMN IF NOT EXISTS headline text`;
    await neonSql`ALTER TABLE users ADD COLUMN IF NOT EXISTS location text`;
    await neonSql`ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url text`;
    await neonSql`CREATE INDEX IF NOT EXISTS notifications_archived_idx ON notifications(user_id, is_archived)`;
    await neonSql`
      CREATE TABLE IF NOT EXISTS dot_stake_positions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        venture_id uuid REFERENCES ventures(id) ON DELETE CASCADE,
        position_type text NOT NULL DEFAULT 'dot',
        amount numeric(20,2) NOT NULL DEFAULT 0,
        staked_at timestamptz NOT NULL DEFAULT now(),
        unstaked_at timestamptz,
        status text NOT NULL DEFAULT 'active',
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `;
    await neonSql`CREATE INDEX IF NOT EXISTS dot_stake_positions_user_idx ON dot_stake_positions(user_id, status)`;
    await neonSql`
      CREATE TABLE IF NOT EXISTS meeting_slots (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        host_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        date date NOT NULL,
        start_time text NOT NULL,
        end_time text NOT NULL,
        duration_minutes integer DEFAULT 30,
        status text NOT NULL DEFAULT 'available',
        title text,
        description text,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `;
    await neonSql`CREATE INDEX IF NOT EXISTS meeting_slots_host_idx ON meeting_slots(host_id, date)`;
    await neonSql`CREATE INDEX IF NOT EXISTS meeting_slots_status_idx ON meeting_slots(status)`;
    await neonSql`
      CREATE TABLE IF NOT EXISTS meetings (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        slot_id uuid NOT NULL REFERENCES meeting_slots(id) ON DELETE CASCADE,
        host_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        guest_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title text NOT NULL,
        description text,
        scheduled_at timestamptz NOT NULL,
        status text NOT NULL DEFAULT 'pending',
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `;
    await neonSql`
      CREATE TABLE IF NOT EXISTS page_views (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid,
        viewer_id text REFERENCES users(id) ON DELETE SET NULL,
        page_type text NOT NULL,
        referrer text,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `;
    await neonSql`CREATE INDEX IF NOT EXISTS page_views_page_type_idx ON page_views(page_type, created_at)`;
    await neonSql`
      CREATE TABLE IF NOT EXISTS activity_log (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        action text NOT NULL,
        metadata jsonb,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `;
    await neonSql`CREATE INDEX IF NOT EXISTS activity_log_user_idx ON activity_log(user_id, created_at DESC)`;
    console.log("[startup] Bootstrap 0013 (runtime fixes) complete");
  } catch (err) {
    console.error("[startup] Bootstrap 0013 error:", err);
  }
}

const start = async () => {
  // Run critical migrations before accepting requests
  await runBootstrapMigrations();

  try {
    await app.listen({ port: PORT, host: "0.0.0.0" });
    app.log.info(`DOT API listening on http://0.0.0.0:${PORT}`);

    // ── Self-ping keep-alive (Render free tier stays awake) ──────
    // Render spins down free services after 15 min of inactivity.
    // We ping our own /api/health every 10 minutes so the process
    // never goes idle. This runs INSIDE the server process — no
    // external script or cron service needed.
    if (NODE_ENV === "production") {
      const SELF_URL = `http://0.0.0.0:${PORT}/api/health`;
      const PING_INTERVAL = 10 * 60 * 1000; // 10 minutes

      setInterval(async () => {
        try {
          const res = await fetch(SELF_URL);
          app.log.info(`[keep-alive] self-ping ${res.status} — ${new Date().toISOString()}`);
        } catch (e) {
          app.log.warn(`[keep-alive] self-ping failed — ${(e as Error).message}`);
        }
      }, PING_INTERVAL);

      app.log.info(`[keep-alive] Self-ping active every 10 minutes → ${SELF_URL}`);
    }
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
