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
  unique,
  check,
  index,
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
}, (t) => [index("sessions_user_idx").on(t.userId)]);

/* --------------------------- OAuth accounts -------------------- */
// Google (and future) OAuth identities.
export const oauthAccounts = pgTable("oauth_accounts", {
  providerId: text("provider_id").notNull(),   // "google"
  providerUserId: text("provider_user_id").notNull(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [primaryKey({ columns: [t.providerId, t.providerUserId] })]);

/* --------------------------- User roles ------------------------ */
export const userRoles = pgTable("user_roles", {
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  grantedAt: timestamp("granted_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  primaryKey({ columns: [t.userId, t.role] }),
  check("user_roles_role_check", sql`${t.role} IN ('builder', 'founder', 'investor', 'community_leader', 'admin', 'super_admin', 'vendor', 'capital_partner')`),
]);

/* --------------------------- Wallets --------------------------- */
export const wallets = pgTable("wallets", {
  userId: text("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  balance: numeric("balance", { precision: 20, scale: 2 }).notNull().default("0"),
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
}, (t) => [index("transactions_user_idx").on(t.userId, t.createdAt)]);

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
}, (t) => [index("ventures_user_idx").on(t.userId)]);

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
}, (t) => [index("assessments_user_idx").on(t.userId, t.createdAt)]);

/* --------------------------- Courses --------------------------- */
export const courses = pgTable("courses", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category"),
  whopUrl: text("whop_url"),
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
}, (t) => [unique("course_enrollments_unique").on(t.courseId, t.userId)]);

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
}, (t) => [
  unique("event_registrations_unique").on(t.eventId, t.userId),
  index("event_registrations_user_idx").on(t.userId),
]);

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
}, (t) => [
  unique("pitchathon_applications_unique").on(t.pitchathonId, t.founderId),
  index("pitchathon_applications_founder_idx").on(t.founderId),
]);

/* --------------------------- Communities ----------------------- */
export const communities = pgTable("communities", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  leaderId: text("leader_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  region: text("region"),
  category: text("category"),
  referralCode: text("referral_code").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("communities_leader_idx").on(t.leaderId)]);

/* --------------------------- Community members ---------------- */
export const communityMembers = pgTable("community_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  communityId: uuid("community_id").notNull().references(() => communities.id, { onDelete: "cascade" }),
  founderId: text("founder_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("active"),
  joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  unique("community_members_unique").on(t.communityId, t.founderId),
  index("community_members_founder_idx").on(t.founderId),
]);

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
}, (t) => [
  index("services_builder_idx").on(t.builderId),
  index("services_category_idx").on(t.category),
  index("services_active_idx").on(t.isActive),
]);

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
}, (t) => [
  index("job_listings_venture_idx").on(t.ventureId),
  index("job_listings_open_idx").on(t.isOpen),
]);

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
}, (t) => [
  index("service_orders_client_idx").on(t.clientId),
  index("service_orders_builder_idx").on(t.builderId),
  index("service_orders_status_idx").on(t.status),
]);

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
}, (t) => [
  check("service_reviews_rating_check", sql`${t.rating} >= 1 AND ${t.rating} <= 5`),
  index("service_reviews_builder_idx").on(t.builderId),
]);

/* --------------------------- Investor saves -------------------- */
export const investorSaves = pgTable("investor_saves", {
  id: uuid("id").primaryKey().defaultRandom(),
  investorId: text("investor_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  founderId: text("founder_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [unique("investor_saves_unique").on(t.investorId, t.founderId)]);

/* --------------------------- Meeting requests ------------------ */
export const meetingRequests = pgTable("meeting_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  investorId: text("investor_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  founderId: text("founder_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  message: text("message"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("meeting_requests_investor_idx").on(t.investorId),
  index("meeting_requests_founder_idx").on(t.founderId),
]);

/* --------------------------- Role requirements ----------------- */
export const roleRequirements = pgTable("role_requirements", {
  role: text("role").primaryKey(),
  dotCost: integer("dot_cost").notNull(),
  requiredFields: jsonb("required_fields").notNull().default(sql`'[]'::jsonb`),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  check("role_requirements_role_check", sql`${t.role} IN ('founder', 'investor', 'community_leader', 'vendor', 'capital_partner')`),
]);

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
}, (t) => [index("payments_user_idx").on(t.userId)]);

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
