/**
 * Drizzle ORM schema for the DOT platform.
 *
 * Mirrors the spec exactly: every column name, type, default,
 * and constraint from the master SQL is reproduced here.
 * No invented columns, no renamed tables.
 */

import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  numeric,
  jsonb,
  uuid,
  primaryKey,
  date,
  unique,
  check,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

/* ---------------------------- Users ---------------------------- */
// Lucia generates the id. Profile fields live in our DB.
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  passwordHash: text("password_hash"), // null for OAuth-only users
  name: text("name"),
  avatarUrl: text("avatar_url"),
  dotId: text("dot_id").notNull().unique(),
  referralCode: text("referral_code").unique(),
    referredBy: text("referred_by"), // referral_code of the user who referred this user
    referralCount: integer("referral_count").notNull().default(0),
    referralEarningsDot: numeric("referral_earnings_dot", { precision: 20, scale: 2 }).notNull().default("0"),
  onboardingIntent: text("onboarding_intent"),
    invitedBy: text("invited_by"),
    onboardedAt: timestamp("onboarded_at", { withTimezone: true }),
    privacyAcceptedAt: timestamp("privacy_accepted_at", { withTimezone: true }),
    termsAcceptedAt: timestamp("terms_accepted_at", { withTimezone: true }),
    // Denormalized mirror of tier_upgrades.expiresAt (latest active upgrade).
    // Set on upgrade/renew, cleared on expiry.
    tierExpiresAt: timestamp("tier_expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/* --------------------------- Sessions -------------------------- */
// Lucia's session table.
export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
},
  (t) => ({
      sessions_user_idx: index("sessions_user_idx").on(t.userId),
  }));

/* --------------------------- OAuth accounts -------------------- */
// Google (and future) OAuth identities.
export const oauthAccounts = pgTable("oauth_accounts", {
  providerId: text("provider_id").notNull(),   // "google"
  providerUserId: text("provider_user_id").notNull(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
},
  (t) => ({
      x: primaryKey({ columns: [t.providerId, t.providerUserId] }),
  }));

/* --------------------------- User roles ------------------------ */
export const userRoles = pgTable("user_roles", {
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  grantedAt: timestamp("granted_at", { withTimezone: true }).notNull().defaultNow(),
},
  (t) => ({
      x: primaryKey({ columns: [t.userId, t.role] }),
      user_roles_role_check_chk: check("user_roles_role_check", sql`${t.role} IN ('builder', 'founder', 'investor', 'community_leader', 'admin', 'super_admin', 'vendor', 'capital_partner', 'moderator', 'support', 'finance')`),
  }));

/* --------------------------- Wallets --------------------------- */
export const wallets = pgTable("wallets", {
  userId: text("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  // Multi-ledger balances
  balance: numeric("balance", { precision: 20, scale: 2 }).notNull().default("0"),        // Available for spending
  stakedBalance: numeric("staked_balance", { precision: 20, scale: 2 }).notNull().default("0"),  // Staked on ventures/gigs
  lockedBalance: numeric("locked_balance", { precision: 20, scale: 2 }).notNull().default("0"),   // Escrowed, pending
  // Lifetime counters (never decrease)
  earnedLifetime: numeric("earned_lifetime", { precision: 20, scale: 2 }).notNull().default("0"),
  burnedLifetime: numeric("burned_lifetime", { precision: 20, scale: 2 }).notNull().default("0"),
  stakedLifetime: numeric("staked_lifetime", { precision: 20, scale: 2 }).notNull().default("0"),
  redeemedLifetime: numeric("redeemed_lifetime", { precision: 20, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/* --------------------------- Transactions ---------------------- */
export const transactions = pgTable("transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  amount: numeric("amount", { precision: 20, scale: 2 }).notNull(),
  type: text("type").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
    (t) => ({
      transactions_user_idx: index("transactions_user_idx").on(t.userId, t.createdAt),
    }));

    /* --------------------------- Stakes --------------------------- */
  /* Tracks individual stakes per user per target (venture/gig) */
  export const stakes = pgTable("stakes", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    targetType: text("target_type").notNull(), // "venture" | "gig"
    targetId: uuid("target_id").notNull(),
    amount: numeric("amount", { precision: 20, scale: 2 }).notNull(),
    status: text("status").notNull().default("active"), // "active" | "unstaked" | "slashed" | "rewarded"
    metadata: jsonb("metadata").notNull().default("{}"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  }, (t) => ({
      stakes_user_idx: index("stakes_user_idx").on(t.userId, t.createdAt),
      stakes_target_idx: index("stakes_target_idx").on(t.targetType, t.targetId),
    }));

  /* --------------------------- Ventures -------------------------- */
export const ventures = pgTable("ventures", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  industry: text("industry"),
  stage: text("stage").notNull().default("Assess"),
  country: text("country"),
  description: text("description"),
  website: text("website"),
  fundingGoal: numeric("funding_goal", { precision: 20, scale: 2 }).notNull().default("0"),
  logoUrl: text("logo_url"),
  vantagePoint: integer("vantage_point").notNull().default(0),
  fundability: integer("fundability").notNull().default(0),
  investmentReadiness: integer("investment_readiness").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
},
  (t) => ({
      ventures_user_idx: index("ventures_user_idx").on(t.userId),
  }));

/* --------------------------- Assessments ----------------------- */
export const assessments = pgTable("assessments", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  answers: jsonb("answers").notNull(),
  categoryScores: jsonb("category_scores").notNull(),
  score: integer("score").notNull(),
  vantagePoint: integer("vantage_point").notNull(),
  fundability: integer("fundability").notNull(),
  investmentReadiness: integer("investment_readiness").notNull(),
  stage: text("stage"),
  report: jsonb("report"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
},
  (t) => ({
      assessments_user_idx: index("assessments_user_idx").on(t.userId, t.createdAt),
  }));

/* --------------------------- Founder profile (extra) ----------- *
 * Supabase had this table; the Neon schema didn't. Added so the
 * /api/users/me/founder-profile endpoint can read/write to it.
 * PK = user_id (one profile per user). user_id is text to match users.id.
 */
export const founderProfiles = pgTable("founder_profiles", {
  userId: text("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  ventureName: text("venture_name"),
  industry: text("industry"),
  stage: text("stage").default("Assess"),
  country: text("country"),
  communityId: text("community_id"),
  bio: text("bio"),
  website: text("website"),
  fundingGoal: text("funding_goal"),
  logoUrl: text("logo_url"),
  vantagePoint: integer("vantage_point").default(0),
  fundability: integer("fundability").default(0),
  investmentReadiness: integer("investment_readiness").default(0),
  // Tier 2 — fields investors need to make a decision.
  headcount: integer("headcount").default(0),
  annualRevenueDot: text("annual_revenue_dot").default("0"),
  foundedYear: integer("founded_year"),
  totalRaisedDot: text("total_raised_dot").default("0"),
  // Price per share, in kobo (smallest NGN unit). 1 DOT = 1500 kobo.
  sharePriceKobo: integer("share_price_kobo").default(0),
  // Total outstanding shares for sale to investors.
  sharesAvailable: integer("shares_available").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/* --------------------------- Builder profile ------------------- *
 * Supabase had this table; the Neon schema didn't. Added so the
 * /api/users/me/builder-profile endpoint can read/write to it.
 * PK = id (the user's id, one profile per user). id is text.
 *
 * Public reputation surface for builders — 2026-06 upgrade.
 * Stats are denormalized (refreshed when an order completes).
 */
export const builderProfiles = pgTable("builder_profiles", {
  id: text("id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  headline: text("headline").notNull().default(""),
  bio: text("bio"),
  skills: text("skills").array().notNull().default([]),
  available: boolean("available").notNull().default(true),
  // New public-profile fields.
  hourlyDot: numeric("hourly_dot", { precision: 20, scale: 2 }),
  portfolioUrl: text("portfolio_url"),
  linkedinUrl: text("linkedin_url"),
  twitterUrl: text("twitter_url"),
  githubUrl: text("github_url"),
  location: text("location"),
  // Denormalized public stats.
  totalEarnedDot: numeric("total_earned_dot", { precision: 20, scale: 2 }).notNull().default("0"),
  totalCompletedOrders: integer("total_completed_orders").notNull().default(0),
  avgRating: numeric("avg_rating", { precision: 3, scale: 2 }).notNull().default("0"),
  reviewCount: integer("review_count").notNull().default(0),
  lastActiveAt: timestamp("last_active_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  bpAvailableIdx: index("builder_profiles_available_idx").on(t.available),
  bpEarnedIdx: index("builder_profiles_earned_idx").on(t.totalEarnedDot),
  bpCompletedIdx: index("builder_profiles_completed_idx").on(t.totalCompletedOrders),
}));

/* --------------------------- Courses --------------------------- */
export const courses = pgTable("courses", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category"),
  whopUrl: text("whop_url"),
  whopProductId: text("whop_product_id"),     // for webhook match
  dotReward: integer("dot_reward").notNull().default(0),
  vantageBoost: integer("vantage_boost").notNull().default(0),
  isPublished: boolean("is_published").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/* --------------------------- Course enrollments ----------------- */
export const courseEnrollments = pgTable("course_enrollments", {
  id: uuid("id").primaryKey().defaultRandom(),
  courseId: uuid("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("enrolled"),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  rewardedAt: timestamp("rewarded_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
},
  (t) => ({
      course_enrollments_uniq: unique("course_enrollments_unique").on(t.courseId, t.userId),
  }));

/* --------------------------- Events (Sessions) ----------------- */
export const events = pgTable("events", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description"),
  speaker: text("speaker"),
  eventDate: timestamp("event_date", { withTimezone: true }),
  dotCost: integer("dot_cost").notNull().default(0),
  capacity: integer("capacity").notNull().default(100),
  whopUrl: text("whop_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/* --------------------------- Event registrations --------------- */
export const eventRegistrations = pgTable("event_registrations", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  attended: boolean("attended").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
},
  (t) => ({
      event_registrations_uniq: unique("event_registrations_unique").on(t.eventId, t.userId),
      event_registrations_user_idx: index("event_registrations_user_idx").on(t.userId),
  }));

/* --------------------------- Pitch Decks ----------------------- */
export const pitchDecks = pgTable("pitch_decks", {
  id: uuid("id").primaryKey().defaultRandom(),
  ventureId: uuid("venture_id").notNull().references(() => ventures.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  url: text("url").notNull(),
  version: integer("version").notNull().default(1),
  isPublic: boolean("is_public").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
},
  (t) => ({
      pitch_decks_venture_idx: index("pitch_decks_venture_idx").on(t.ventureId),
      pitch_decks_version_idx: index("pitch_decks_version_idx").on(t.ventureId, t.version),
  }));

/* --------------------------- Pitchathons ----------------------- */
export const pitchathons = pgTable("pitchathons", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description"),
  prize: text("prize"),
  startDate: timestamp("start_date", { withTimezone: true }),
  endDate: timestamp("end_date", { withTimezone: true }),
  status: text("status").notNull().default("open"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/* --------------------------- Pitchathon applications ----------- */
export const pitchathonApplications = pgTable("pitchathon_applications", {
  id: uuid("id").primaryKey().defaultRandom(),
  pitchathonId: uuid("pitchathon_id").notNull().references(() => pitchathons.id, { onDelete: "cascade" }),
  founderId: text("founder_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  ventureName: text("venture_name"),
  pitchDeckUrl: text("pitch_deck_url"),
  fundingAsk: numeric("funding_ask", { precision: 20, scale: 2 }),
  status: text("status").notNull().default("submitted"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
},
  (t) => ({
      pitchathon_applications_uniq: unique("pitchathon_applications_unique").on(t.pitchathonId, t.founderId),
      pitchathon_applications_founder_idx: index("pitchathon_applications_founder_idx").on(t.founderId),
  }));

/* --------------------------- Pitchathon judging --------------- */
export const pitchathonScores = pgTable(
  "pitchathon_scores",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    pitchathonId: uuid("pitchathon_id").notNull().references(() => pitchathons.id, { onDelete: "cascade" }),
    applicationId: uuid("application_id").notNull().references(() => pitchathonApplications.id, { onDelete: "cascade" }),
    judgeId: text("judge_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    score: integer("score").notNull(),     // 1-10
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    judgeAppUniq: unique("pitchathon_score_unique").on(t.pitchathonId, t.applicationId, t.judgeId),
    appIdx: index("pitch_score_app_idx").on(t.applicationId),
  }),
);

/* --------------------------- Communities ----------------------- */
export const communities = pgTable("communities", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  leaderId: text("leader_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  region: text("region"),
  category: text("category"),
  referralCode: text("referral_code").notNull().unique(),
  tier: text("tier").notNull().default("free"), // free | verified | campus | enterprise
  annualRenewalAt: timestamp("annual_renewal_at", { withTimezone: true }),
  subscriptionStatus: text("subscription_status").notNull().default("active"), // active | grace | expired | cancelled
  paidThroughAt: timestamp("paid_through_at", { withTimezone: true }),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  memberCount: integer("member_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
},
  (t) => ({
      communities_leader_idx: index("communities_leader_idx").on(t.leaderId),
      communities_tier_idx: index("communities_tier_idx").on(t.tier),
  }));

/* --------------------------- Community members ---------------- */
export const communityMembers = pgTable("community_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  communityId: uuid("community_id").notNull().references(() => communities.id, { onDelete: "cascade" }),
  founderId: text("founder_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("active"),
  joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
},
  (t) => ({
      community_members_uniq: unique("community_members_unique").on(t.communityId, t.founderId),
      community_members_founder_idx: index("community_members_founder_idx").on(t.founderId),
  }));

/* --------------------------- Services (Gigs) ------------------- */
export const services = pgTable("services", {
  id: uuid("id").primaryKey().defaultRandom(),
  builderId: text("builder_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  priceDot: numeric("price_dot", { precision: 20, scale: 2 }).notNull(),
  deliveryDays: integer("delivery_days").notNull().default(3),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
},
  (t) => ({
      services_builder_idx: index("services_builder_idx").on(t.builderId),
      services_category_idx: index("services_category_idx").on(t.category),
      services_active_idx: index("services_active_idx").on(t.isActive),
  }));

/* --------------------------- Job listings --------------------- */
export const jobListings = pgTable("job_listings", {
  id: uuid("id").primaryKey().defaultRandom(),
  ventureId: text("venture_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  salaryDot: numeric("salary_dot", { precision: 20, scale: 2 }).notNull(),
  employmentType: text("employment_type").notNull().default("full_time"),
  requirements: text("requirements"),
  isOpen: boolean("is_open").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
},
  (t) => ({
      job_listings_venture_idx: index("job_listings_venture_idx").on(t.ventureId),
      job_listings_open_idx: index("job_listings_open_idx").on(t.isOpen),
  }));

/* --------------------------- Service orders -------------------- */
export const serviceOrders = pgTable("service_orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  serviceId: uuid("service_id").notNull().references(() => services.id),
  clientId: text("client_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  builderId: text("builder_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  amountDot: numeric("amount_dot", { precision: 20, scale: 2 }).notNull(),
  title: text("title").notNull(),
  requirements: text("requirements"),
  deliveryNote: text("delivery_note"),
  status: text("status").notNull().default("in_progress"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  disputeReason: text("dispute_reason"),
  disputedAt: timestamp("disputed_at", { withTimezone: true }),
},
  (t) => ({
      service_orders_client_idx: index("service_orders_client_idx").on(t.clientId),
      service_orders_builder_idx: index("service_orders_builder_idx").on(t.builderId),
      service_orders_status_idx: index("service_orders_status_idx").on(t.status),
  }));

/* --------------------------- Service reviews ------------------- */
export const serviceReviews = pgTable("service_reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id").notNull().unique().references(() => serviceOrders.id, { onDelete: "cascade" }),
  serviceId: uuid("service_id").notNull().references(() => services.id, { onDelete: "cascade" }),
  builderId: text("builder_id").notNull(),
  clientId: text("client_id").notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
},
  (t) => ({
      service_reviews_rating_check_chk: check("service_reviews_rating_check", sql`${t.rating} >= 1 AND ${t.rating} <= 5`),
      service_reviews_builder_idx: index("service_reviews_builder_idx").on(t.builderId),
  }));

/* --------------------------- Investor saves -------------------- */
export const investorSaves = pgTable("investor_saves", {
  id: uuid("id").primaryKey().defaultRandom(),
  investorId: text("investor_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  founderId: text("founder_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
},
  (t) => ({
      investor_saves_uniq: unique("investor_saves_unique").on(t.investorId, t.founderId),
  }));

/* --------------------------- Meeting requests ------------------ */
export const meetingRequests = pgTable("meeting_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  investorId: text("investor_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  founderId: text("founder_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  message: text("message"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
},
  (t) => ({
      meeting_requests_investor_idx: index("meeting_requests_investor_idx").on(t.investorId),
      meeting_requests_founder_idx: index("meeting_requests_founder_idx").on(t.founderId),
  }));

/* --------------------------- Investments (shares) -------------- */
/**
 * A record of an investor buying shares in a founder's venture.
 * `sharePriceKobo` is captured at purchase time so future price changes
 * don't affect historical purchases.
 */
export const investments = pgTable("investments", {
  id: uuid("id").primaryKey().defaultRandom(),
  investorId: text("investor_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  founderId: text("founder_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  shares: integer("shares").notNull(),
  sharePriceKobo: integer("share_price_kobo").notNull(),
  // Total DOT the investor paid (snapshot at purchase).
  totalPaidDot: numeric("total_paid_dot", { precision: 20, scale: 2 }).notNull(),
  // Wallet transaction ref for traceability.
  walletTxId: text("wallet_tx_id"),
  // Paystack reference (for record-keeping; payment is via Paystack transfer).
  paystackRef: text("paystack_ref"),
  status: text("status").notNull().default("confirmed"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
},
  (t) => ({
      investments_investor_idx: index("investments_investor_idx").on(t.investorId, t.createdAt),
      investments_founder_idx: index("investments_founder_idx").on(t.founderId, t.createdAt),
  }));

/* --------------------------- Role requirements ----------------- */
export const roleRequirements = pgTable("role_requirements", {
  role: text("role").primaryKey(),
  dotCost: integer("dot_cost").notNull(),
  requiredFields: jsonb("required_fields").notNull().default(sql`'[]'::jsonb`),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
},
  (t) => ({
      role_requirements_role_check_chk: check("role_requirements_role_check", sql`${t.role} IN ('founder', 'investor', 'community_leader', 'vendor', 'capital_partner')`),
  }));

/* --------------------------- Payments -------------------------- */
export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  reference: text("reference").notNull().unique(),
  dotAmount: numeric("dot_amount", { precision: 20, scale: 2 }).notNull(),
  nairaAmount: numeric("naira_amount", { precision: 20, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  creditedAt: timestamp("credited_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
},
  (t) => ({
      payments_user_idx: index("payments_user_idx").on(t.userId),
  }));

/* --------------------------- Type exports ---------------------- */
export type UserRow = typeof users.$inferSelect;
export type SessionRow = typeof sessions.$inferSelect;
export type WalletRow = typeof wallets.$inferSelect;
export type TransactionRow = typeof transactions.$inferSelect;
export type VentureRow = typeof ventures.$inferSelect;
export type AssessmentRow = typeof assessments.$inferSelect;
export type CourseRow = typeof courses.$inferSelect;
export type EventRow = typeof events.$inferSelect;
export type PitchathonRow = typeof pitchathons.$inferSelect;
export type CommunityRow = typeof communities.$inferSelect;
export type ServiceRow = typeof services.$inferSelect;
export type JobListingRow = typeof jobListings.$inferSelect;
export type ServiceOrderRow = typeof serviceOrders.$inferSelect;
export type ServiceReviewRow = typeof serviceReviews.$inferSelect;
export type RoleRequirementRow = typeof roleRequirements.$inferSelect;
export type PaymentRow = typeof payments.$inferSelect;

/* ============================ ADMIN ============================ */

/**
 * admin_audit_log — append-only. Every admin action writes a row
 * here in the same DB transaction as the action itself, so the
 * audit log can never be out of sync with reality.
 *
 * Production should additionally REVOKE UPDATE/DELETE on this
 * table from the app's DB role. We can't enforce that from
 * Drizzle but the migration file 0002_admin_audit_immutable.sql
 * does.
 */
export const adminAuditLog = pgTable(
  "admin_audit_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    actorId: text("actor_id").notNull(), // user id of the admin
    actorEmail: text("actor_email").notNull(),
    action: text("action").notNull(), // e.g. "user.ban", "wallet.adjust", "feature_flag.update"
    targetType: text("target_type"), // "user" | "venture" | "service" | "feature_flag" | etc.
    targetId: text("target_id"),
    before: jsonb("before"),
    after: jsonb("after"),
    reason: text("reason").notNull(),
    ip: text("ip"),
    userAgent: text("user_agent"),
    requestId: text("request_id"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    actorIdx: index("audit_actor_idx").on(t.actorId, t.createdAt),
    targetIdx: index("audit_target_idx").on(t.targetType, t.targetId, t.createdAt),
    actionIdx: index("audit_action_idx").on(t.action, t.createdAt),
  })
);

/**
 * admin_confirm_tokens — short-lived (5 min) single-use tokens
 * for destructive actions. The flow is:
 *   1. Admin clicks "Adjust balance" in the UI.
 *   2. Frontend POSTs to /api/admin/confirm with the action
 *      type and a free-text reason. Backend returns a token.
 *   3. Frontend shows "Are you sure? <reason>" modal.
 *   4. On confirm, frontend POSTs the actual action with
 *      X-Admin-Confirm: <token> header.
 *   5. Backend validates the token, marks it used, and
 *      performs the action in a transaction with the audit log.
 */
export const adminConfirmTokens = pgTable(
  "admin_confirm_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    token: text("token").notNull().unique(), // random 32-byte hex
    adminId: text("admin_id").notNull(),
    action: text("action").notNull(), // action type the token authorizes
    targetType: text("target_type"),
    targetId: text("target_id"),
    payload: jsonb("payload"), // the args the action will be called with
    reason: text("reason").notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    adminIdx: index("confirm_admin_idx").on(t.adminId),
    expiresIdx: index("confirm_expires_idx").on(t.expiresAt),
  })
);

/**
 * admin_impersonation_tokens — bound to a specific user, expires
 * in 15 min, single-use, both issuance AND termination are
 * audit-logged.
 *
 * The token is a JWT signed with a different key from regular
 * session JWTs, scoped to a single user, and includes an
 * `impersonator` claim. The web app checks this claim and shows
 * a persistent red banner: "Viewing as <user>. End session."
 */
export const adminImpersonationTokens = pgTable("admin_impersonation_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  jti: text("jti").notNull().unique(), // unique token id; the JWT 'jti' claim
  adminId: text("admin_id").notNull(),
  targetUserId: text("target_user_id").notNull(),
  reason: text("reason").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * feature_flags — key/value with optional rollout percentage.
 * Lookup is per-request, so keep it small (in-process cache
 * with 30s TTL is fine).
 */
export const featureFlags = pgTable("feature_flags", {
  key: text("key").primaryKey(),
  enabled: boolean("enabled").notNull().default(false),
  /** 0-100: percent of users this is enabled for. null = all. */
  rolloutPercent: integer("rollout_percent"),
  /** Optional user-id allowlist that bypasses rollout. */
  allowList: jsonb("allow_list"), // string[]
  description: text("description"),
  updatedBy: text("updated_by").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * payments_audit — every Paystack/Whop webhook event lands here
 * BEFORE the wallet is touched. If the wallet update fails, we
 * can replay. The (provider, event_id) pair is UNIQUE so the
 * webhook handler is idempotent.
 */
export const paymentsAudit = pgTable(
  "payments_audit",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    provider: text("provider").notNull(), // 'paystack' | 'whop'
    eventId: text("event_id").notNull(),
    eventType: text("event_type").notNull(), // 'charge.success' | 'subscription.created' | etc.
    userId: text("user_id"), // resolved; null if event didn't map to a user
    amountMinor: integer("amount_minor").notNull(), // in kobo / cents
    currency: text("currency").notNull(), // 'NGN' | 'USD'
    rawPayload: jsonb("raw_payload").notNull(),
    status: text("status").notNull().default("received"), // 'received' | 'processed' | 'failed' | 'replayed'
    processedAt: timestamp("processed_at", { withTimezone: true }),
    failureReason: text("failure_reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    eventIdx: unique("payments_audit_event_uq").on(t.provider, t.eventId),
    userIdx: index("payments_audit_user_idx").on(t.userId, t.createdAt),
    statusIdx: index("payments_audit_status_idx").on(t.status, t.createdAt),
  })
);

/**
 * admin_idempotency_keys — admin writes require an
 * Idempotency-Key header. We store the (admin_id, key) → response
 * mapping for 24h. If a request comes in with a known key, we
 * return the cached response instead of re-running the action.
 * If the same key is used with a different action, 409.
 */
export const adminIdempotencyKeys = pgTable(
  "admin_idempotency_keys",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    adminId: text("admin_id").notNull(),
    idempotencyKey: text("idempotency_key").notNull(),
    action: text("action").notNull(),
    responseStatus: integer("response_status").notNull(),
    responseBody: jsonb("response_body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    keyUq: unique("idem_key_uq").on(t.adminId, t.idempotencyKey),
    expiresIdx: index("idem_expires_idx").on(t.createdAt),
  })
);

/**
 * user_bans — soft-bans with reason + expiry. Distinct from a
 * deleted user; a banned user can still be unbanned.
 */
export const userBans = pgTable(
  "user_bans",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull().unique(), // one active ban per user
    bannedBy: text("banned_by").notNull(),
    reason: text("reason").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }), // null = permanent
    revokedBy: text("revoked_by"),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userIdx: index("bans_user_idx").on(t.userId),
  })
);

/* --------------------------- DOT OS additions (Jun 25 2026) --------------- *
 * These power the four actor loops in the spec.
 */

export const challenges = pgTable(
  "challenges",
  {
    id: text("id").primaryKey(),
    postedBy: text("posted_by").notNull(),     // user_id of the poster
    posterType: text("poster_type").notNull().default("founder"), // founder | community | capital_partner | university | company | admin
    posterOrgId: text("poster_org_id"),       // communityId | ventureId | capitalPartnerId, nullable
    title: text("title").notNull(),
    description: text("description").notNull(),
    skill: text("skill").notNull(),           // "AI", "Design", "Coding", etc.
    rewardDot: text("reward_dot").notNull(),  // DOT credit on approval
    deadline: timestamp("deadline", { withTimezone: true }),
    maxSubmissions: integer("max_submissions").default(1),
    status: text("status").notNull().default("open"), // open / closed / completed
    ventureId: text("venture_id"),            // optional venture link
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    statusIdx: index("challenges_status_idx").on(t.status),
    skillIdx: index("challenges_skill_idx").on(t.skill),
    postedByIdx: index("challenges_posted_by_idx").on(t.postedBy),
    posterTypeIdx: index("challenges_poster_type_idx").on(t.posterType),
  }),
);

export const challengeSubmissions = pgTable(
  "challenge_submissions",
  {
    id: text("id").primaryKey(),
    challengeId: text("challenge_id").notNull(),
    builderId: text("builder_id").notNull(),
    content: text("content").notNull(),
    link: text("link"),
    status: text("status").notNull().default("pending"), // pending / approved / rejected
    submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    reviewNote: text("review_note"),
  },
  (t) => ({
    challengeIdx: index("cs_challenge_idx").on(t.challengeId),
    builderIdx: index("cs_builder_idx").on(t.builderId),
    statusIdx: index("cs_status_idx").on(t.status),
  }),
);

export const achievements = pgTable(
  "achievements",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    kind: text("kind").notNull(),   // "first_task", "level_up", "challenge_won", etc.
    label: text("label").notNull(),
    description: text("description"),
    icon: text("icon"),             // lucide icon name
    earnedAt: timestamp("earned_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userIdx: index("ach_user_idx").on(t.userId),
    kindIdx: index("ach_kind_idx").on(t.kind),
  }),
);

export const activities = pgTable(
  "activities",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    actorId: text("actor_id"),      // who did it (could be self or system)
    kind: text("kind").notNull(),   // "task_completed", "venture_created", "reputation_gained"
    title: text("title").notNull(),
    body: text("body"),
    refType: text("ref_type"),      // "challenge", "order", "venture"
    refId: text("ref_id"),
    pointsDelta: integer("points_delta").default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userIdx: index("act_user_idx").on(t.userId),
    createdIdx: index("act_created_idx").on(t.createdAt),
  }),
);

export const reputationEvents = pgTable(
  "reputation_events",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    delta: integer("delta").notNull(),
    reason: text("reason").notNull(),
    refType: text("ref_type"),
    refId: text("ref_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userIdx: index("rep_user_idx").on(t.userId),
  }),
);

export const builderLevels = pgTable(
  "builder_levels",
  {
    userId: text("user_id").primaryKey(),
    level: integer("level").notNull().default(1),
    label: text("label").notNull().default("Explorer"),
    promotedAt: timestamp("promoted_at", { withTimezone: true }),
  },
);

export type AdminAuditLogRow = typeof adminAuditLog.$inferSelect;
export type AdminConfirmTokenRow = typeof adminConfirmTokens.$inferSelect;
export type AdminImpersonationTokenRow = typeof adminImpersonationTokens.$inferSelect;
export type FeatureFlagRow = typeof featureFlags.$inferSelect;
export type PaymentsAuditRow = typeof paymentsAudit.$inferSelect;
export type AdminIdempotencyKeyRow = typeof adminIdempotencyKeys.$inferSelect;
export type UserBanRow = typeof userBans.$inferSelect;

/* ============================== TOKEN SUPPLY (100B hard cap) ============================== */

/**
 * token_supply — single-row tracker for the global DOT supply cap.
 *
 * The client mandated: there should only ever be 100,000,000,000 DOT.
 * Any mint operation that would exceed this cap is rejected.
 *
 * - max_supply_dot: the hard cap (100B = 100_000_000_000)
 * - total_minted_dot: total DOT ever credited to users
 * - total_burned_dot: DOT permanently removed from circulation
 * - circulating_supply_dot: total_minted_dot - total_burned_dot (computed)
 *
 * Updated atomically inside the same DB transaction as any mint/burn.
 */
export const tokenSupply = pgTable("token_supply", {
  id: text("id").primaryKey().default("singleton"),
  maxSupplyDot: numeric("max_supply_dot", { precision: 20, scale: 2 }).notNull().default("100000000000"),
  totalMintedDot: numeric("total_minted_dot", { precision: 20, scale: 2 }).notNull().default("500"), // initial 500 DOT per signup
  totalBurnedDot: numeric("total_burned_dot", { precision: 20, scale: 2 }).notNull().default("0"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ============================== TOKEN OPERATIONS AUDIT ============================== */

/**
 * token_operations — append-only log of every mint/burn/transfer-by-admin.
 * Required for auditing + regulatory compliance.
 */
export const tokenOperations = pgTable(
  "token_operations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    actorId: text("actor_id"), // user id of admin who triggered, or null for system
    actorEmail: text("actor_email"),
    operation: text("operation").notNull(), // mint | burn | admin_transfer | refund | withdrawal_pay
    fromUserId: text("from_user_id"), // null for mint
    toUserId: text("to_user_id"), // null for burn
    amountDot: numeric("amount_dot", { precision: 20, scale: 2 }).notNull(),
    reason: text("reason").notNull(),
    relatedId: text("related_id"), // withdrawal_id, payment_ref, etc.
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    actorIdx: index("token_ops_actor_idx").on(t.actorId, t.createdAt),
    fromIdx: index("token_ops_from_idx").on(t.fromUserId),
    toIdx: index("token_ops_to_idx").on(t.toUserId),
    opIdx: index("token_ops_op_idx").on(t.operation, t.createdAt),
  }),
);

/* ============================== WITHDRAWALS ============================== */

export const withdrawalRequests = pgTable(
  "withdrawal_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    amountDot: numeric("amount_dot", { precision: 14, scale: 2 }).notNull(),
    amountNgn: numeric("amount_ngn", { precision: 14, scale: 2 }).notNull(),
    bankInfo: jsonb("bank_info").notNull(), // { accountName, accountNumber, bankCode, bankName }
    kycTier: text("kyc_tier").notNull().default("tier1"), // tier1=email, tier2=bvn, tier3=nin+id
    status: text("status").notNull().default("pending"), // pending | approved | rejected | paid | failed
    adminNote: text("admin_note"),
    reviewedBy: text("reviewed_by"),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    failureReason: text("failure_reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userIdx: index("withdrawal_user_idx").on(t.userId),
    statusIdx: index("withdrawal_status_idx").on(t.status),
  }),
);

/* ============================== KYC SUBMISSIONS ============================== */

export const kycSubmissions = pgTable(
  "kyc_submissions",
  {
    userId: text("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
    tier: text("tier").notNull().default("tier1"), // tier1=email only, tier2=bvn, tier3=nin+gov_id
    bvn: text("bvn"),
    nin: text("nin"),
    govIdUrl: text("gov_id_url"),
    govIdType: text("gov_id_type"), // passport | drivers_license | voters_card | national_id
    fullName: text("full_name"),
    dateOfBirth: text("date_of_birth"),
    address: text("address"),
    country: text("country").notNull().default("NG"),
    status: text("status").notNull().default("pending"), // pending | approved | rejected
    reviewedBy: text("reviewed_by"),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    rejectionReason: text("rejection_reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
);

/* ============================== DEMO EVENTS ============================== */

export const demoEvents = pgTable(
  "demo_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    description: text("description"),
    coverImageUrl: text("cover_image_url"),
    startDate: timestamp("start_date", { withTimezone: true }).notNull(),
    endDate: timestamp("end_date", { withTimezone: true }).notNull(),
    registrationDeadline: timestamp("registration_deadline", { withTimezone: true }),
    votingOpensAt: timestamp("voting_opens_at", { withTimezone: true }),
    votingClosesAt: timestamp("voting_closes_at", { withTimezone: true }),
    tracks: jsonb("tracks").notNull().default(sql`'["open", "invitational"]'::jsonb`), // open | invitational
    sponsors: jsonb("sponsors").notNull().default(sql`'[]'::jsonb`),
    judges: jsonb("judges").notNull().default(sql`'[]'::jsonb`),
    prizePoolDot: numeric("prize_pool_dot", { precision: 14, scale: 2 }),
    livestreamUrl: text("livestream_url"),
    registrationFeeDot: numeric("registration_fee_dot", { precision: 14, scale: 2 }).default("0"),
    status: text("status").notNull().default("upcoming"), // upcoming | registration_open | voting_open | live | completed
    featuredVentures: jsonb("featured_ventures").notNull().default(sql`'[]'::jsonb`),
    createdBy: text("created_by").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    slugIdx: index("demo_event_slug_idx").on(t.slug),
    statusIdx: index("demo_event_status_idx").on(t.status),
  }),
);

/* ============================== VOTES ============================== */

export const votes = pgTable(
  "votes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    voterId: text("voter_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    eventSlug: text("event_slug").notNull(),
    targetType: text("target_type").notNull(), // venture | challenge | builder | community
    targetId: text("target_id").notNull(),
    weight: numeric("weight", { precision: 6, scale: 2 }).notNull().default("1.00"),
    reputationAtVote: numeric("reputation_at_vote", { precision: 6, scale: 2 }),
    ipHash: text("ip_hash"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    voterIdx: index("vote_voter_idx").on(t.voterId),
    eventIdx: index("vote_event_idx").on(t.eventSlug),
    targetIdx: index("vote_target_idx").on(t.targetType, t.targetId),
    uniqVote: uniqueIndex("vote_unique_idx").on(t.voterId, t.eventSlug, t.targetType, t.targetId),
  }),
);

/* ============================== COMMUNITIES EXTENSION ============================== */
// (handled as ALTER TABLE in migration; new columns: tier, annual_renewal_at, subscription_status)


/* --------------------------- Password reset tokens --------------- */
/* Issued by POST /api/auth/forgot-password; consumed by reset-password. */
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  prtUserIdx: index("prt_user_idx").on(t.userId),
  prtTokenIdx: index("prt_token_idx").on(t.token),
}));

/* --------------------------- Community referral codes ------------ */
/* Public join codes; 6-char alpha upper + 2-digit. */
export const communityReferralCodes = pgTable("community_referral_codes", {
  id: uuid("id").primaryKey().defaultRandom(),
  communityId: uuid("community_id").notNull().references(() => communities.id, { onDelete: "cascade" }),
  code: text("code").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  crcCommunityIdx: index("crc_community_idx").on(t.communityId),
}));

/* --------------------------- Notifications ----------------------- */
/* In-app notifications (and email-by-extension) for transfer receipts,
 * job/service events, community posts, and system messages. */
export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  // transfer_received | transfer_sent | job_posted | job_application_received |
  // service_purchased | community_invite | community_post | mention | system |
  // venture_published | venture_followed | certificate_issued | withdrawal_approved
  title: text("title").notNull(),
  body: text("body").notNull(),
  link: text("link"),                       // optional in-app destination
  icon: text("icon"),                       // lucide icon name hint for UI
  readAt: timestamp("read_at", { withTimezone: true }),
  isArchived: boolean("is_archived").notNull().default(false),
  // Email delivery
  emailedAt: timestamp("emailed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  notifUserIdx: index("notifications_user_idx").on(t.userId, t.createdAt),
  notifUnreadIdx: index("notifications_unread_idx").on(t.userId, t.readAt),
  notifArchivedIdx: index("notifications_archived_idx").on(t.userId, t.isArchived),
}));

/* --------------------------- Social Feed Posts -------------------- */
/* Public feed posts in Discover - gigs, announcements, venture updates, funding, general */
export const feedPosts = pgTable("feed_posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  authorId: text("author_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  authorName: text("author_name").notNull(),
  authorDotId: text("author_dot_id"),           // founder.ceoDotId if founder
  authorRole: text("author_role"),               // founder | builder | investor | capital_partner | admin
  type: text("type").notNull().default("general"), // gig | announcement | venture_update | funding | general
  title: text("title"),
  body: text("body").notNull(),
  tags: jsonb("tags").$type<string[]>().default([]),
  gigType: text("gig_type"),                     // part-time | full-time | contract
  budgetDot: integer("budget_dot"),             // for gigs
  fundingGoal: integer("funding_goal"),        // for funding posts
  fundingRound: text("funding_round"),          // seed | series_a | etc
  ventureName: text("venture_name"),            // for venture_updates
  ventureStage: text("venture_stage"),          // idea | validate | build | scale
  likesCount: integer("likes_count").notNull().default(0),
  commentsCount: integer("comments_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  feedAuthorIdx: index("feed_posts_author_idx").on(t.authorId),
  feedTypeIdx: index("feed_posts_type_idx").on(t.type),
  feedCreatedIdx: index("feed_posts_created_idx").on(t.createdAt),
}));

/* Feed post likes */
export const feedPostLikes = pgTable("feed_post_likes", {
  id: uuid("id").primaryKey().defaultRandom(),
  postId: uuid("post_id").notNull().references(() => feedPosts.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  feedLikeUnique: unique("feed_post_likes_user_post_unique").on(t.userId, t.postId),
  feedLikePostIdx: index("feed_post_likes_post_idx").on(t.postId),
}));

/* Feed post bookmarks */
export const feedPostBookmarks = pgTable("feed_post_bookmarks", {
  id: uuid("id").primaryKey().defaultRandom(),
  postId: uuid("post_id").notNull().references(() => feedPosts.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  feedBookmarkUnique: unique("feed_post_bookmarks_user_post_unique").on(t.userId, t.postId),
  feedBookmarkPostIdx: index("feed_post_bookmarks_post_idx").on(t.postId),
}));

/* Feed comments */
export const feedComments = pgTable("feed_comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  postId: uuid("post_id").notNull().references(() => feedPosts.id, { onDelete: "cascade" }),
  authorId: text("author_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  authorName: text("author_name").notNull(),
  authorDotId: text("author_dot_id"),
  authorRole: text("author_role"),
  body: text("body").notNull(),
  likesCount: integer("likes_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  feedCommentPostIdx: index("feed_comments_post_idx").on(t.postId),
  feedCommentAuthorIdx: index("feed_comments_author_idx").on(t.authorId),
}));

/* Feed comment likes */
export const feedCommentLikes = pgTable("feed_comment_likes", {
  id: uuid("id").primaryKey().defaultRandom(),
  commentId: uuid("comment_id").notNull().references(() => feedComments.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  feedCommentLikeUnique: unique("feed_comment_likes_user_comment_unique").on(t.userId, t.commentId),
}));

/* --------------------------- Discover upvotes ------------------- */
/* Tracks upvotes on ventures + posts so the Discover feed can rank. */
export const discoverUpvotes = pgTable("discover_upvotes", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  targetType: text("target_type").notNull(),  // 'venture' | 'post' | 'comment'
  targetId: text("target_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  duUserTargetUnique: unique("discover_upvotes_user_target_unique").on(t.userId, t.targetType, t.targetId),
  duTargetIdx: index("discover_upvotes_target_idx").on(t.targetType, t.targetId),
}));

/* --------------------------- Community channels ----------------- */
/* Discord-style channels within a community. Posts live inside a channel. */
export const communityChannels = pgTable("community_channels", {
  id: uuid("id").primaryKey().defaultRandom(),
  communityId: uuid("community_id").notNull().references(() => communities.id, { onDelete: "cascade" }),
  name: text("name").notNull(),                // 'general' | 'announcements' | 'help'
  description: text("description"),
  isAdminOnly: boolean("is_admin_only").notNull().default(false),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  ccCommunityIdx: index("community_channels_community_idx").on(t.communityId),
}));

/* --------------------------- Community posts -------------------- */
/* Posts inside a community channel. Supports replies via parentId. */
export const communityPosts = pgTable("community_posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  communityId: uuid("community_id").notNull().references(() => communities.id, { onDelete: "cascade" }),
  channelId: uuid("channel_id").notNull().references(() => communityChannels.id, { onDelete: "cascade" }),
  authorId: text("author_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  parentId: uuid("parent_id"),
  body: text("body").notNull(),
  reactions: jsonb("reactions").$type<Record<string, string[]>>().default({} as any), // {emoji: [userIds]}
  replyCount: integer("reply_count").notNull().default(0),
  pinned: boolean("pinned").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  cpCommunityIdx: index("community_posts_community_idx").on(t.communityId, t.createdAt),
  cpChannelIdx: index("community_posts_channel_idx").on(t.channelId, t.createdAt),
}));

/* --------------------------- Certificates ----------------------- */
/* Issued certificates from DOT Academy, challenges, pitchathons, gigs, or admin-issued. */
export const certificates = pgTable("certificates", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  courseId: text("course_id"),                  // nullable for challenge-issued
  title: text("title").notNull(),
  issuer: text("issuer").notNull(),             // 'DOT Academy' | 'DOT Demo' | etc
  score: integer("score"),                       // 0-100
  dotEarned: integer("dot_earned").notNull().default(0),
  level: text("level"),                          // 'Foundations' | 'Intermediate' | 'Advanced'
  credentialId: text("credential_id").notNull().unique(),  // public ID for verification
  // Source: 'course' | 'challenge' | 'pitchathon' | 'gig' | 'admin'
  // sourceId is the underlying record id (challenge id, course id, etc)
  source: text("source").notNull().default("course"),
  sourceId: text("source_id"),
  issuedAt: timestamp("issued_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  meta: jsonb("meta"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  certUserIdx: index("certificates_user_idx").on(t.userId),
  certCredentialIdx: unique("certificates_credential_unique").on(t.credentialId),
  certSourceIdx: index("certificates_source_idx").on(t.source, t.sourceId),
}));

/* --------------------------- Wizard state ----------------------- */
/* Tracks first-sign-in wizard completion. Users can restart from Help. */
export const wizardState = pgTable("wizard_state", {
  userId: text("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  lastStep: integer("last_step").notNull().default(0),  // 0..6 so user can resume
  skippedSteps: jsonb("skipped_steps").$type<number[]>().default([] as any),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
});
/* 6-digit codes for passwordless sign-in / email verification / 2FA.
 * Composite UNIQUE on (email, purpose) so we can UPSERT. */
export const otpCodes = pgTable("otp_codes", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull(),
  code: text("code").notNull(),
  purpose: text("purpose").notNull(),     // 'signin' | 'verify-email' | '2fa'
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  attempts: integer("attempts").notNull().default(0),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  otcEmailPurpose: unique("otp_codes_email_purpose_unique").on(t.email, t.purpose),
  otcEmailIdx: index("otp_codes_email_idx").on(t.email),
}));

/* --------------------------- Magic-link tokens -------------------------- */
/* Long opaque tokens (URL-safe) used for email verification magic links.
 * The user clicks a link in the email; the token is consumed once. */
export const magicLinkTokens = pgTable("magic_link_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull(),
  token: text("token").notNull().unique(),
  purpose: text("purpose").notNull(),     // 'signup' | 'verify-email' | 'signin'
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  mltEmailIdx: index("magic_link_tokens_email_idx").on(t.email),
  mltTokenIdx: index("magic_link_tokens_token_idx").on(t.token),
}));

/* --------------------- Venture enrichment -----------------------
 * Per direction: founder profile needs all 11 table fields.
 *   - ventureDetails (1:1 with venture): extended fields
 *   - teamMembers (1:N): people on the team
 *   - milestones (1:N): past + upcoming
 *   - advisors (1:N): credibility
 */
export const ventureDetails = pgTable("venture_details", {
  ventureId: uuid("venture_id").primaryKey().references(() => ventures.id, { onDelete: "cascade" }),
  oneLiner: text("one_liner"),
  problem: text("problem"),
  solution: text("solution"),
  tractionMr: numeric("traction_mrr", { precision: 20, scale: 2 }).notNull().default("0"),
  tractionPayingUsers: integer("traction_paying_users").notNull().default(0),
  tractionGrowthPct: integer("traction_growth_pct").notNull().default(0),
  tractionRetentionPct: integer("traction_retention_pct").notNull().default(0),
  useOfFunds: text("use_of_funds"),
  capTableTotalRaised: numeric("cap_table_total_raised", { precision: 20, scale: 2 }).notNull().default("0"),
  capTableLastRound: text("cap_table_last_round"),
  capTableStructure: text("cap_table_structure"), // SAFE / equity / convertible
  pitchDeckUrl: text("pitch_deck_url"),
  foundingDate: date("founding_date"),
  stageRationale: text("stage_rationale"), // "Why this stage?"
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const ventureTeamMembers = pgTable("venture_team_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  ventureId: uuid("venture_id").notNull().references(() => ventures.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  role: text("role").notNull(),
  linkedinUrl: text("linkedin_url"),
  isFounder: boolean("is_founder").notNull().default(false),
  orderIndex: integer("order_index").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  vtmVentureIdx: index("venture_team_members_venture_idx").on(t.ventureId),
}));

export const ventureMilestones = pgTable("venture_milestones", {
  id: uuid("id").primaryKey().defaultRandom(),
  ventureId: uuid("venture_id").notNull().references(() => ventures.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  achievedAt: date("achieved_at"),
  isUpcoming: boolean("is_upcoming").notNull().default(false),
  targetDate: date("target_date"),
  orderIndex: integer("order_index").notNull().default(0),
  fundedAmount: numeric("funded_amount", { precision: 20, scale: 2 }).notNull().default("0"),
  payoutAmount: numeric("payout_amount", { precision: 20, scale: 2 }),
  status: text("status").notNull().default("pending"), // pending | funded | released | skipped
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  vmVentureIdx: index("venture_milestones_venture_idx").on(t.ventureId),
  vmVentureStatusIdx: index("venture_milestones_venture_status_idx").on(t.ventureId, t.status),
}));

export const ventureAdvisors = pgTable("venture_advisors", {
  id: uuid("id").primaryKey().defaultRandom(),
  ventureId: uuid("venture_id").notNull().references(() => ventures.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  credentials: text("credentials"),
  linkedinUrl: text("linkedin_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  vaVentureIdx: index("venture_advisors_venture_idx").on(t.ventureId),
}));

/* --------------------------- Community Challenges ------------- */
/**
 * Leader-posted challenges WITHIN a community.
 * Prize DOT is escrowed from the leader's wallet at creation;
 * distributed to winners' wallets when leader picks them.
 *
 * NOTE: The global `challenges` table above (lines 692+) is platform-wide
 * founder/builder challenges. This is a *separate* table for community-scoped
 * challenges with prize escrow.
 *
 * Statuses:
 *   draft      — being edited, not visible to members
 *   open       — accepting submissions
 *   judging    — submission window closed, leader reviewing
 *   awarded    — winners announced, payouts complete
 *   cancelled  — leader cancelled before judging, prizes refunded
 */
export const communityChallenges = pgTable("community_challenges", {
  id: uuid("id").primaryKey().defaultRandom(),
  communityId: uuid("community_id").notNull().references(() => communities.id, { onDelete: "cascade" }),
  postedByUserId: text("posted_by_user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  prizeDot: numeric("prize_dot", { precision: 20, scale: 2 }).notNull(),
  prizeTotalDot: numeric("prize_total_dot", { precision: 20, scale: 2 }).notNull(),     // max payout if all spots win
  deadline: timestamp("deadline", { withTimezone: true }).notNull(),
  maxWinners: integer("max_winners").notNull().default(1),
  status: text("status").notNull().default("open"),
  escrowReference: text("escrow_reference"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  chCommunityIdx: index("community_challenges_community_idx").on(t.communityId),
  chStatusIdx: index("community_challenges_status_idx").on(t.status),
  chDeadlineIdx: index("community_challenges_deadline_idx").on(t.deadline),
}));

export const communityChallengeSubmissions = pgTable("community_challenge_submissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  challengeId: uuid("challenge_id").notNull().references(() => communityChallenges.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  attachmentUrl: text("attachment_url"),
  status: text("status").notNull().default("submitted"),
  winningRank: integer("winning_rank"),
  payoutDot: numeric("payout_dot", { precision: 20, scale: 2 }),
  submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
  decidedAt: timestamp("decided_at", { withTimezone: true }),
}, (t) => ({
  csChallengeIdx: index("community_challenge_submissions_challenge_idx").on(t.challengeId),
  csUserIdx: index("community_challenge_submissions_user_idx").on(t.userId),
  csUniqueEntry: unique("community_challenge_submissions_unique").on(t.challengeId, t.userId),
}));

/* --------------------------- Connections (chat threads) ----- */
/**
 * A connection between two users, opened when a meeting is accepted.
 * Statuses:
 *   pending    — invite sent, awaiting acceptance
 *   active     — both sides can message
 *   closed     — either side ended the conversation
 */
export const connections = pgTable("connections", {
  id: uuid("id").primaryKey().defaultRandom(),
  userAId: text("user_a_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  userBId: text("user_b_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("pending"),
  meetingId: uuid("meeting_id").references(() => meetingRequests.id, { onDelete: "set null" }),
  initiatedBy: text("initiated_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  closedAt: timestamp("closed_at", { withTimezone: true }),
}, (t) => ({
  connUserAIdx: index("connections_user_a_idx").on(t.userAId),
  connUserBIdx: index("connections_user_b_idx").on(t.userBId),
  connUnique: unique("connections_unique").on(t.userAId, t.userBId),
}));

/* --------------------------- Messages ------------------------ */
/**
 * Text-only messages inside a connection thread.
 * Polled every 5s (no WebSocket for v1).
 */
export const connectionMessages = pgTable("connection_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  connectionId: uuid("connection_id").notNull().references(() => connections.id, { onDelete: "cascade" }),
  senderId: text("sender_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  readAt: timestamp("read_at", { withTimezone: true }),
}, (t) => ({
  msgConnIdx: index("connection_messages_conn_idx").on(t.connectionId),
  msgCreatedIdx: index("connection_messages_created_idx").on(t.createdAt),
}));

/* --------------------------- Builder reviews ------------------ */
/**
 * Post-order rating (1..5) + comment. One review per (orderId, reviewerId).
 * Reviews power the avgRating on builderProfiles.
 */
export const builderReviews = pgTable("builder_reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  builderId: text("builder_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  reviewerId: text("reviewer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  orderId: text("order_id").notNull(),
  rating: integer("rating").notNull(), // 1..5
  comment: text("comment"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  brBuilderIdx: index("builder_reviews_builder_idx").on(t.builderId),
  brOrderIdx: unique("builder_reviews_order_unique").on(t.orderId, t.reviewerId),
}));

/* --------------------------- User Vouches --------------------- */
/**
 * Vouch primitive — users vouch each other's credibility.
 *
 * - voucherId = who is giving the vouch
 * - voucheeId = who is receiving the vouch
 * - scope     = voucher's role at the time of vouching
 *               ('founder' | 'builder' | 'capital')
 * - score     = min(voucher_vantage, 200) × scope_multiplier, computed at insert.
 *               Capped at 200 in the API. Stored as the snapshot value; the
 *               frontend applies 1% / 30-day decay on read (no decay row updates).
 *
 * Invariants:
 *   1. One vouch per (voucher, vouchee) pair — enforced by unique index.
 *   2. No self-vouch — enforced by API validation.
 *   3. Hard delete on revoke (simple, cheap, vouches are cheap to recreate).
 */
export const userVouches = pgTable("user_vouches", {
  id: uuid("id").primaryKey().defaultRandom(),
  voucherId: text("voucher_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  voucheeId: text("vouchee_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  scope: text("scope").notNull(), // 'founder' | 'builder' | 'capital'
  score: integer("score").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  uvVoucherIdx: index("user_vouches_voucher_idx").on(t.voucherId),
  uvVoucheeIdx: index("user_vouches_vouchee_idx").on(t.voucheeId),
  uvPairUnique: unique("user_vouches_pair_unique").on(t.voucherId, t.voucheeId),
  uvScopeCheck: check(
    "user_vouches_scope_check",
    sql`${t.scope} IN ('founder', 'builder', 'capital')`,
  ),
}));

export type UserVouch = typeof userVouches.$inferSelect;
export type NewUserVouch = typeof userVouches.$inferInsert;

/* --------------------------- Loan Requests ------------------- */
export const loanRequests = pgTable("loan_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  ventureId: uuid("venture_id").notNull().references(() => ventures.id),
  requestedBy: text("requested_by").notNull().references(() => users.id),
  amountNaira: integer("amount_naira").notNull(),
  termMonths: integer("term_months").notNull(), // 3, 6, or 12
  purpose: text("purpose"),
  status: text("status").notNull().default("pending"), // pending, voting, approved, rejected, funded
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  votingEndsAt: timestamp("voting_ends_at", { withTimezone: true }).notNull(),
}, (t) => ({
  lrVentureIdx: index("loan_requests_venture_idx").on(t.ventureId),
  lrRequestedByIdx: index("loan_requests_requested_by_idx").on(t.requestedBy),
  lrStatusIdx: index("loan_requests_status_idx").on(t.status),
}));

export type LoanRequest = typeof loanRequests.$inferSelect;
export type NewLoanRequest = typeof loanRequests.$inferInsert;

/* --------------------------- Loan Votes ---------------------- */
export const loanVotes = pgTable("loan_votes", {
  id: uuid("id").primaryKey().defaultRandom(),
  loanRequestId: uuid("loan_request_id").notNull().references(() => loanRequests.id, { onDelete: "cascade" }),
  voterId: text("voter_id").notNull().references(() => users.id),
  vote: boolean("vote").notNull(), // true = approve, false = reject
  amountNaira: integer("amount_naira"), // How much they're willing to fund
  votedAt: timestamp("voted_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  lvLoanIdIdx: index("loan_votes_loan_request_idx").on(t.loanRequestId),
  lvVoterIdIdx: index("loan_votes_voter_idx").on(t.voterId),
  lvPairUnique: unique("loan_votes_pair_unique").on(t.loanRequestId, t.voterId),
}));

export type LoanVote = typeof loanVotes.$inferSelect;
export type NewLoanVote = typeof loanVotes.$inferInsert;

/* --------------------------- Loans (Disbursed) ---------------- */
export const loans = pgTable("loans", {
  id: uuid("id").primaryKey().defaultRandom(),
  loanRequestId: uuid("loan_request_id").references(() => loanRequests.id),
  ventureId: uuid("venture_id").notNull().references(() => ventures.id),
  amountNaira: integer("amount_naira").notNull(),
  termMonths: integer("term_months").notNull(),
  interestRate: numeric("interest_rate", { precision: 10, scale: 4 }).notNull().default("0.02"), // 2% per month
  status: text("status").notNull().default("active"), // active, paid_off, default
  fundedBy: text("funded_by").notNull().references(() => users.id), // Capital partner
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  lVentureIdx: index("loans_venture_idx").on(t.ventureId),
  lFundedByIdx: index("loans_funded_by_idx").on(t.fundedBy),
  lStatusIdx: index("loans_status_idx").on(t.status),
}));

export type Loan = typeof loans.$inferSelect;
export type NewLoan = typeof loans.$inferInsert;

/* --------------------------- Dividends ------------------------ */
/**
 * Dividends declared by ventures for their shareholders.
 * Periodic profit sharing - quarterly distributions.
 */
export const dividends = pgTable("dividends", {
  id: uuid("id").primaryKey().defaultRandom(),
  ventureId: uuid("venture_id").notNull().references(() => ventures.id, { onDelete: "cascade" }),
  declaredBy: text("declared_by").notNull().references(() => users.id, { onDelete: "cascade" }),
  amountNaira: integer("amount_naira").notNull(), // Total dividend pool in kobo
  perShareAmount: integer("per_share_amount").notNull(), // ₦ per share in kobo
  period: text("period").notNull(), // e.g., "Q1 2026", "Q2 2026"
  status: text("status").notNull().default("declared"), // declared, paid, cancelled
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  paidAt: timestamp("paid_at", { withTimezone: true }),
}, (t) => ({
  divVentureIdx: index("dividends_venture_idx").on(t.ventureId, t.createdAt),
  divDeclaredByIdx: index("dividends_declared_by_idx").on(t.declaredBy),
  divStatusIdx: index("dividends_status_idx").on(t.status),
}));

export type Dividend = typeof dividends.$inferSelect;
export type NewDividend = typeof dividends.$inferInsert;

/* --------------------------- Dividend Payments ---------------- */
/**
 * Individual dividend payments to investors.
 * Tracks who got what for each dividend declaration.
 */
export const dividendPayments = pgTable("dividend_payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  dividendId: uuid("dividend_id").notNull().references(() => dividends.id, { onDelete: "cascade" }),
  investorId: text("investor_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  investmentId: uuid("investment_id").notNull().references(() => investments.id, { onDelete: "cascade" }),
  sharesOwned: integer("shares_owned").notNull(),
  amountNaira: integer("amount_naira").notNull(), // Amount in kobo
  status: text("status").notNull().default("pending"), // pending, paid, failed
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  paidAt: timestamp("paid_at", { withTimezone: true }),
}, (t) => ({
  dpDividendIdx: index("dividend_payments_dividend_idx").on(t.dividendId),
  dpInvestorIdx: index("dividend_payments_investor_idx").on(t.investorId, t.createdAt),
  dpStatusIdx: index("dividend_payments_status_idx").on(t.status),
}));

export type DividendPayment = typeof dividendPayments.$inferSelect;
export type NewDividendPayment = typeof dividendPayments.$inferInsert;

/* ──────────────────────── Dot Stake Positions ─────────────────────── */
/**
 * DOT staking positions for earning 12% APY
 * - Separate from the "stakes" table (which is for venture/gig stakes)
 * - 14-day cooldown on unstaking
 * - Rewards calculated server-side and stored
 */
export const dotStakePositions = pgTable("dot_stake_positions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(), // DOT staked (in cents/kobo)
  rewardClaimed: integer("reward_claimed").notNull().default(0), // Total rewards claimed
  rewardAccrued: integer("reward_accrued").notNull().default(0), // Accumulated but not claimed
  status: text("status").notNull().default("active"), // active, unstaking, withdrawn
  stakedAt: timestamp("staked_at", { withTimezone: true }).notNull().defaultNow(),
  unbondedAt: timestamp("unbonded_at", { withTimezone: true }), // When cooldown started
  claimedAt: timestamp("claimed_at", { withTimezone: true }), // Last claim time
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  dotStakePosUserIdx: index("dot_stake_positions_user_idx").on(t.userId),
  dotStakePosStatusIdx: index("dot_stake_positions_status_idx").on(t.status),
}));

export type DotStakePosition = typeof dotStakePositions.$inferSelect;
export type NewDotStakePosition = typeof dotStakePositions.$inferInsert;

/* ──────────────────────── Tier Upgrades (Session 15) ─────────────────────── */
/**
 * Paid, time-limited tier upgrades.
 *
 *   builder         → free, default. Granted at signup.
 *   founder         → 5,000 DOT / 365 days. Unlocks venture creation + pitches.
 *   capital_partner → 25,000 DOT / 365 days. Unlocks invest + deal flow.
 *   operator        → internal only, not buyable.
 *
 * Multiple rows per (user, tier) are allowed — a user can renew a tier
 * before it expires and the new row stacks on top of the old one
 * (via `renewed_from`). Auto-revert on expiry is handled by
 * `tierExpirySweep()` in server.ts.
 */
export const tierUpgrades = pgTable(
  "tier_upgrades",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    tier: text("tier").notNull(), // 'founder' | 'capital_partner'
    costDot: numeric("cost_dot", { precision: 20, scale: 2 }).notNull(),
    purchasedAt: timestamp("purchased_at", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    renewedFrom: uuid("renewed_from"),
    status: text("status").notNull().default("active"), // active | expired | revoked
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    tuUserIdx: index("tier_upgrades_user_idx").on(t.userId, t.status),
    tuExpiresIdx: index("tier_upgrades_expires_idx").on(t.expiresAt),
  }),
);

export type TierUpgrade = typeof tierUpgrades.$inferSelect;
export type NewTierUpgrade = typeof tierUpgrades.$inferInsert;

/* ──────────────────────── Dot Stake History (audit log) ─────────────── */
export const dotStakeHistory = pgTable("dot_stake_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  stakeId: uuid("stake_id").notNull().references(() => dotStakePositions.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  action: text("action").notNull(), // stake, reward_claimed, unbond, complete_unbond
  amount: integer("amount"), // Principal or reward amount
  rewardAmount: integer("reward_amount"), // Reward claimed
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  dotStakeHistoryStakeIdx: index("dot_stake_history_stake_idx").on(t.stakeId),
  dotStakeHistoryUserIdx: index("dot_stake_history_user_idx").on(t.userId),
}));

export type DotStakeHistoryEntry = typeof dotStakeHistory.$inferSelect;
export type NewDotStakeHistoryEntry = typeof dotStakeHistory.$inferInsert;

/* ──────────────────────── Meeting Scheduler ─────────────────────── */
/**
 * Meeting scheduler for founders and investors.
 * Hosts create available time slots, guests request meetings.
 */

// Meeting slots - available times created by hosts
export const meetingSlots = pgTable("meeting_slots", {
  id: uuid("id").primaryKey().defaultRandom(),
  hostId: text("host_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  startTime: text("start_time").notNull(), // "09:00", "10:00"
  endTime: text("end_time").notNull(),
  durationMinutes: integer("duration_minutes").default(30),
  status: text("status").notNull().default("available"), // available, booked, confirmed
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  meetingSlotsHostIdx: index("meeting_slots_host_idx").on(t.hostId, t.date),
  meetingSlotsDateIdx: index("meeting_slots_date_idx").on(t.date),
  meetingSlotsStatusIdx: index("meeting_slots_status_idx").on(t.status),
}));

export type MeetingSlot = typeof meetingSlots.$inferSelect;
export type NewMeetingSlot = typeof meetingSlots.$inferInsert;

// Meetings - scheduled meetings between host and guest
export const meetings = pgTable("meetings", {
  id: uuid("id").primaryKey().defaultRandom(),
  slotId: uuid("slot_id").notNull().references(() => meetingSlots.id, { onDelete: "cascade" }),
  hostId: text("host_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  guestId: text("guest_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  meetingReason: text("meeting_reason"),
  status: text("status").notNull().default("pending"), // pending, confirmed, cancelled, completed, declined
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
  confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
  declinedAt: timestamp("declined_at", { withTimezone: true }),
  declinedReason: text("declined_reason"),
  cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
  cancelledReason: text("cancelled_reason"),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  meetingsSlotIdx: index("meetings_slot_idx").on(t.slotId),
  meetingsHostIdx: index("meetings_host_idx").on(t.hostId, t.scheduledAt),
  meetingsGuestIdx: index("meetings_guest_idx").on(t.guestId, t.scheduledAt),
  meetingsStatusIdx: index("meetings_status_idx").on(t.status),
}));

export type Meeting = typeof meetings.$inferSelect;
export type NewMeeting = typeof meetings.$inferInsert;

/* ──────────────────────── Referral System ─────────────────────── */
/**
 * Tracks individual referral relationships between users.
 * When a user signs up with a referral code, a referral record is created.
 */

export const referrals = pgTable("referrals", {
  id: uuid("id").primaryKey().defaultRandom(),
  referrerId: text("referrer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  refereeId: text("referee_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  referralCode: text("referral_code").notNull(),
  status: text("status").notNull().default("pending"), // pending, completed, rewarded
  rewardClaimed: boolean("reward_claimed").notNull().default(false),
  claimedAt: timestamp("claimed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }), // When referee reached milestone
}, (t) => ({
  referralsReferrerIdx: index("referrals_referrer_idx").on(t.referrerId),
  referralsRefereeIdx: index("referrals_referee_idx").on(t.refereeId),
  referralsCodeIdx: index("referrals_code_idx").on(t.referralCode),
  referralsStatusIdx: index("referrals_status_idx").on(t.status),
}));

export type Referral = typeof referrals.$inferSelect;
export type NewReferral = typeof referrals.$inferInsert;

/* ============================== ANALYTICS ============================== */

/**
 * page_views — track profile views for analytics.
 * Records who viewed whose profile and when.
 */
export const pageViews = pgTable(
  "page_views",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }), // the user whose profile was viewed
    viewerId: text("viewer_id").references(() => users.id, { onDelete: "cascade" }), // who viewed
    pageType: text("page_type").notNull(), // "venture" | "founder" | "builder" | "investor"
    referrer: text("referrer"), // source of the view
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    pvUserIdx: index("page_views_user_idx").on(t.userId, t.createdAt),
    pvViewerIdx: index("page_views_viewer_idx").on(t.viewerId, t.createdAt),
    pvPageTypeIdx: index("page_views_page_type_idx").on(t.pageType, t.createdAt),
  })
);

/**
 * activity_log — general activity tracking for analytics.
 * Records actions like vouch given, investment made, meeting scheduled, etc.
 */
export const activityLog = pgTable(
  "activity_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    action: text("action").notNull(), // "vouch_given" | "investment_made" | "meeting_scheduled" | "venture_created" | "pitch_submitted"
    metadata: jsonb("metadata"), // { ventureId, amount, meetingId, etc. }
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    alUserIdx: index("activity_log_user_idx").on(t.userId, t.createdAt),
    alActionIdx: index("activity_log_action_idx").on(t.action, t.createdAt),
  })
);

export type PageView = typeof pageViews.$inferSelect;
export type ActivityLogEntry = typeof activityLog.$inferSelect;
