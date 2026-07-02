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
import { notificationsRoutes } from "./routes/notifications.js";
import { certificatesRoutes } from "./routes/certificates.js";
import { wizardRoutes } from "./routes/wizard.js";
import { feedRoutes } from "./routes/feed.js";
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

            // === venture enrichment (founder profile 11 fields) ===
            await db.execute(sql`
              CREATE TABLE IF NOT EXISTS venture_details (
                venture_id uuid PRIMARY KEY REFERENCES ventures(id) ON DELETE CASCADE,
                one_liner text,
                problem text,
                solution text,
                traction_mrr numeric(20,2) NOT NULL DEFAULT 0,
                traction_paying_users integer NOT NULL DEFAULT 0,
                traction_growth_pct integer NOT NULL DEFAULT 0,
                traction_retention_pct integer NOT NULL DEFAULT 0,
                use_of_funds text,
                cap_table_total_raised numeric(20,2) NOT NULL DEFAULT 0,
                cap_table_last_round text,
                cap_table_structure text,
                pitch_deck_url text,
                founding_date date,
                stage_rationale text,
                updated_at timestamptz NOT NULL DEFAULT now()
              );
            `);
            await db.execute(sql`
              CREATE TABLE IF NOT EXISTS venture_team_members (
                id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                venture_id uuid NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
                name text NOT NULL,
                role text NOT NULL,
                linkedin_url text,
                is_founder boolean NOT NULL DEFAULT false,
                order_index integer NOT NULL DEFAULT 0,
                created_at timestamptz NOT NULL DEFAULT now()
              );
              CREATE INDEX IF NOT EXISTS venture_team_members_venture_idx ON venture_team_members(venture_id);
            `);
            await db.execute(sql`
              CREATE TABLE IF NOT EXISTS venture_milestones (
                id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                venture_id uuid NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
                title text NOT NULL,
                description text,
                achieved_at date,
                is_upcoming boolean NOT NULL DEFAULT false,
                target_date date,
                order_index integer NOT NULL DEFAULT 0,
                created_at timestamptz NOT NULL DEFAULT now()
              );
              CREATE INDEX IF NOT EXISTS venture_milestones_venture_idx ON venture_milestones(venture_id);
            `);
            await db.execute(sql`
              CREATE TABLE IF NOT EXISTS venture_advisors (
                id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                venture_id uuid NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
                name text NOT NULL,
                credentials text,
                linkedin_url text,
                created_at timestamptz NOT NULL DEFAULT now()
              );
              CREATE INDEX IF NOT EXISTS venture_advisors_venture_idx ON venture_advisors(venture_id);
            `);
            app.log.info("bootstrap migration: venture enrichment tables ensured");

            // === users profile fields (for /settings edit + /profile display) ===
            await db.execute(sql`
              ALTER TABLE users
                ADD COLUMN IF NOT EXISTS bio text,
                ADD COLUMN IF NOT EXISTS headline varchar(140),
                ADD COLUMN IF NOT EXISTS location varchar(120),
                ADD COLUMN IF NOT EXISTS twitter_url text,
                ADD COLUMN IF NOT EXISTS linkedin_url text,
                ADD COLUMN IF NOT EXISTS github_url text,
                ADD COLUMN IF NOT EXISTS notif_meetings boolean NOT NULL DEFAULT true,
                ADD COLUMN IF NOT EXISTS notif_vantage boolean NOT NULL DEFAULT true,
                ADD COLUMN IF NOT EXISTS notif_wallet boolean NOT NULL DEFAULT true,
                ADD COLUMN IF NOT EXISTS notif_community boolean NOT NULL DEFAULT true,
                ADD COLUMN IF NOT EXISTS notif_academy boolean NOT NULL DEFAULT true,
                ADD COLUMN IF NOT EXISTS language varchar(8) NOT NULL DEFAULT 'en',
                ADD COLUMN IF NOT EXISTS currency varchar(8) NOT NULL DEFAULT 'NGN',
                ADD COLUMN IF NOT EXISTS timezone varchar(80) NOT NULL DEFAULT 'Africa/Lagos';
            `);
            app.log.info("bootstrap migration: users profile fields ensured");

            // === courses updatedAt + whop_product_id safety net ===
            await db.execute(sql`
              ALTER TABLE courses
                ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
            `);
            app.log.info("bootstrap migration: courses updatedAt ensured");

            // === community challenges + chat (connections/messages) ===
            await db.execute(sql`
              CREATE TABLE IF NOT EXISTS community_challenges (
                id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                community_id uuid NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
                posted_by_user_id text NOT NULL REFERENCES users(id),
                title text NOT NULL,
                description text NOT NULL,
                prize_dot numeric(20,2) NOT NULL,
                prize_total_dot numeric(20,2) NOT NULL,
                deadline timestamptz NOT NULL,
                max_winners integer NOT NULL DEFAULT 1,
                status text NOT NULL DEFAULT 'open',
                escrow_reference text,
                created_at timestamptz NOT NULL DEFAULT now(),
                updated_at timestamptz NOT NULL DEFAULT now()
              );
              CREATE INDEX IF NOT EXISTS community_challenges_community_idx ON community_challenges(community_id);
              CREATE INDEX IF NOT EXISTS community_challenges_status_idx ON community_challenges(status);
            `);

            await db.execute(sql`
              CREATE TABLE IF NOT EXISTS community_challenge_submissions (
                id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                challenge_id uuid NOT NULL REFERENCES community_challenges(id) ON DELETE CASCADE,
                user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                body text NOT NULL,
                attachment_url text,
                status text NOT NULL DEFAULT 'submitted',
                winning_rank integer,
                payout_dot numeric(20,2),
                submitted_at timestamptz NOT NULL DEFAULT now(),
                decided_at timestamptz,
                UNIQUE(challenge_id, user_id)
              );
              CREATE INDEX IF NOT EXISTS community_challenge_submissions_challenge_idx ON community_challenge_submissions(challenge_id);
              CREATE INDEX IF NOT EXISTS community_challenge_submissions_user_idx ON community_challenge_submissions(user_id);
            `);

            await db.execute(sql`
              CREATE TABLE IF NOT EXISTS connections (
                id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                user_a_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                user_b_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                status text NOT NULL DEFAULT 'pending',
                meeting_id uuid REFERENCES meeting_requests(id) ON DELETE SET NULL,
                initiated_by text NOT NULL REFERENCES users(id),
                created_at timestamptz NOT NULL DEFAULT now(),
                closed_at timestamptz,
                UNIQUE(user_a_id, user_b_id)
              );
              CREATE INDEX IF NOT EXISTS connections_user_a_idx ON connections(user_a_id);
              CREATE INDEX IF NOT EXISTS connections_user_b_idx ON connections(user_b_id);
            `);

            await db.execute(sql`
              CREATE TABLE IF NOT EXISTS connection_messages (
                id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                connection_id uuid NOT NULL REFERENCES connections(id) ON DELETE CASCADE,
                sender_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                body text NOT NULL,
                created_at timestamptz NOT NULL DEFAULT now(),
                read_at timestamptz
              );
              CREATE INDEX IF NOT EXISTS connection_messages_conn_idx ON connection_messages(connection_id);
              CREATE INDEX IF NOT EXISTS connection_messages_created_idx ON connection_messages(created_at);
            `);

            app.log.info("bootstrap migration: challenges + connections tables ensured");

            // === certificates: add source/sourceId columns if missing ===
            await db.execute(sql`
              ALTER TABLE certificates
                ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'course',
                ADD COLUMN IF NOT EXISTS source_id text;
            `);
            await db.execute(sql`
              CREATE INDEX IF NOT EXISTS certificates_source_idx
                ON certificates(source, source_id);
            `);
            app.log.info("bootstrap migration: certificates source columns ensured");

            // === builder arena: new public-profile fields + reviews table ===
            await db.execute(sql`
              ALTER TABLE builder_profiles
                ADD COLUMN IF NOT EXISTS hourly_dot numeric(20,2),
                ADD COLUMN IF NOT EXISTS portfolio_url text,
                ADD COLUMN IF NOT EXISTS linkedin_url text,
                ADD COLUMN IF NOT EXISTS twitter_url text,
                ADD COLUMN IF NOT EXISTS github_url text,
                ADD COLUMN IF NOT EXISTS location text,
                ADD COLUMN IF NOT EXISTS total_earned_dot numeric(20,2) NOT NULL DEFAULT '0',
                ADD COLUMN IF NOT EXISTS total_completed_orders integer NOT NULL DEFAULT 0,
                ADD COLUMN IF NOT EXISTS avg_rating numeric(3,2) NOT NULL DEFAULT '0',
                ADD COLUMN IF NOT EXISTS review_count integer NOT NULL DEFAULT 0,
                ADD COLUMN IF NOT EXISTS last_active_at timestamptz;
            `);
            await db.execute(sql`
              CREATE INDEX IF NOT EXISTS builder_profiles_available_idx ON builder_profiles(available);
              CREATE INDEX IF NOT EXISTS builder_profiles_earned_idx ON builder_profiles(total_earned_dot);
              CREATE INDEX IF NOT EXISTS builder_profiles_completed_idx ON builder_profiles(total_completed_orders);
            `);
            await db.execute(sql`
              CREATE TABLE IF NOT EXISTS builder_reviews (
                id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                builder_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                reviewer_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                order_id text NOT NULL,
                rating integer NOT NULL,
                comment text,
                created_at timestamptz NOT NULL DEFAULT now(),
                UNIQUE(order_id, reviewer_id)
              );
              CREATE INDEX IF NOT EXISTS builder_reviews_builder_idx ON builder_reviews(builder_id);
            `);
            app.log.info("bootstrap migration: builder arena tables ensured");

            // === feed_posts table (social feed) ===
            await db.execute(sql`
              CREATE TABLE IF NOT EXISTS feed_posts (
                id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                type text NOT NULL DEFAULT 'general',
                title text,
                body text NOT NULL,
                author_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                tags text[] NOT NULL DEFAULT '{}',
                likes_count integer NOT NULL DEFAULT 0,
                comments_count integer NOT NULL DEFAULT 0,
                budget_dot numeric(20,2),
                gig_type text,
                funding_goal numeric(20,2),
                funding_round text,
                created_at timestamptz NOT NULL DEFAULT now(),
                updated_at timestamptz NOT NULL DEFAULT now()
              );
              CREATE INDEX IF NOT EXISTS feed_posts_author_idx ON feed_posts(author_id);
              CREATE INDEX IF NOT EXISTS feed_posts_type_idx ON feed_posts(type);
              CREATE INDEX IF NOT EXISTS feed_posts_created_idx ON feed_posts(created_at DESC);
            `);
            await db.execute(sql`
              CREATE TABLE IF NOT EXISTS feed_post_likes (
                post_id uuid NOT NULL REFERENCES feed_posts(id) ON DELETE CASCADE,
                user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                created_at timestamptz NOT NULL DEFAULT now(),
                PRIMARY KEY (post_id, user_id)
              );
            `);
            await db.execute(sql`
              CREATE TABLE IF NOT EXISTS feed_post_bookmarks (
                post_id uuid NOT NULL REFERENCES feed_posts(id) ON DELETE CASCADE,
                user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                created_at timestamptz NOT NULL DEFAULT now(),
                PRIMARY KEY (post_id, user_id)
              );
            `);
            await db.execute(sql`
              CREATE TABLE IF NOT EXISTS feed_comments (
                id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                post_id uuid NOT NULL REFERENCES feed_posts(id) ON DELETE CASCADE,
                author_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                body text NOT NULL,
                likes_count integer NOT NULL DEFAULT 0,
                created_at timestamptz NOT NULL DEFAULT now()
              );
              CREATE INDEX IF NOT EXISTS feed_comments_post_idx ON feed_comments(post_id);
              CREATE INDEX IF NOT EXISTS feed_comments_author_idx ON feed_comments(author_id);
            `);
            app.log.info("bootstrap migration: feed tables ensured");

            // === communities: is_private column ===
            await db.execute(sql`
              ALTER TABLE communities
                ADD COLUMN IF NOT EXISTS is_private boolean NOT NULL DEFAULT false;
            `);
            app.log.info("bootstrap migration: communities.is_private ensured");

            // === events: add whop_url column for live sessions ===
            await db.execute(sql`
              ALTER TABLE events ADD COLUMN IF NOT EXISTS whop_url text;
            `);
            app.log.info("bootstrap migration: events.whop_url ensured");

            // === integration_secrets table ===
            await db.execute(sql`
              CREATE TABLE IF NOT EXISTS integration_secrets (
                key   text PRIMARY KEY,
                value text NOT NULL,
                updated_at timestamptz NOT NULL DEFAULT now()
              );
            `);
            app.log.info("bootstrap migration: integration_secrets table ensured");
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
    await app.register(certificatesRoutes,             { prefix: "/api" });
    await app.register(wizardRoutes,                    { prefix: "/api" });
    await app.register(feedRoutes,                       { prefix: "/api" });

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
    const { sql } = await import("drizzle-orm");
    const { db } = await import("./db/client.js");

    // integration_secrets — required by /api/admin/integrations
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS integration_secrets (
        key   text PRIMARY KEY,
        value text NOT NULL,
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    // password_reset_tokens — required by auth/forgot-password
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id    text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token      text NOT NULL UNIQUE,
        expires_at timestamptz NOT NULL,
        used_at    timestamptz,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    // feed tables — required by /api/feed
    await db.execute(sql`
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
    `);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS feed_post_likes (
        post_id    uuid NOT NULL REFERENCES feed_posts(id) ON DELETE CASCADE,
        user_id    text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY (post_id, user_id)
      )
    `);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS feed_post_bookmarks (
        post_id    uuid NOT NULL REFERENCES feed_posts(id) ON DELETE CASCADE,
        user_id    text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY (post_id, user_id)
      )
    `);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS feed_comments (
        id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        post_id    uuid NOT NULL REFERENCES feed_posts(id) ON DELETE CASCADE,
        author_id  text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        body       text NOT NULL,
        likes_count integer NOT NULL DEFAULT 0,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    // communities: is_private column
    await db.execute(sql`
      ALTER TABLE communities ADD COLUMN IF NOT EXISTS is_private boolean NOT NULL DEFAULT false
    `);

    // events: whop_url column
    await db.execute(sql`
      ALTER TABLE events ADD COLUMN IF NOT EXISTS whop_url text
    `);

    console.log("[startup] Bootstrap migrations complete");
  } catch (err) {
    console.error("[startup] Bootstrap migration error:", err);
    // Don't crash — migrations are best-effort for existing tables
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
