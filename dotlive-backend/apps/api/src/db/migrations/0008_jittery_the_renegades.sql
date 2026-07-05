CREATE TABLE IF NOT EXISTS "builder_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"builder_id" text NOT NULL,
	"reviewer_id" text NOT NULL,
	"order_id" text NOT NULL,
	"rating" integer NOT NULL,
	"comment" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "builder_reviews_order_unique" UNIQUE("order_id","reviewer_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "certificates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"course_id" text,
	"title" text NOT NULL,
	"issuer" text NOT NULL,
	"score" integer,
	"dot_earned" integer DEFAULT 0 NOT NULL,
	"level" text,
	"credential_id" text NOT NULL,
	"source" text DEFAULT 'course' NOT NULL,
	"source_id" text,
	"issued_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone,
	"meta" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "certificates_credential_id_unique" UNIQUE("credential_id"),
	CONSTRAINT "certificates_credential_unique" UNIQUE("credential_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "community_challenge_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"challenge_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"body" text NOT NULL,
	"attachment_url" text,
	"status" text DEFAULT 'submitted' NOT NULL,
	"winning_rank" integer,
	"payout_dot" numeric(20, 2),
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"decided_at" timestamp with time zone,
	CONSTRAINT "community_challenge_submissions_unique" UNIQUE("challenge_id","user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "community_challenges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"community_id" uuid NOT NULL,
	"posted_by_user_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"prize_dot" numeric(20, 2) NOT NULL,
	"prize_total_dot" numeric(20, 2) NOT NULL,
	"deadline" timestamp with time zone NOT NULL,
	"max_winners" integer DEFAULT 1 NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"escrow_reference" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "community_channels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"community_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_admin_only" boolean DEFAULT false NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "community_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"community_id" uuid NOT NULL,
	"channel_id" uuid NOT NULL,
	"author_id" text NOT NULL,
	"parent_id" uuid,
	"body" text NOT NULL,
	"reactions" jsonb DEFAULT '{}'::jsonb,
	"reply_count" integer DEFAULT 0 NOT NULL,
	"pinned" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "connection_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"connection_id" uuid NOT NULL,
	"sender_id" text NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"read_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "connections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_a_id" text NOT NULL,
	"user_b_id" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"meeting_id" uuid,
	"initiated_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"closed_at" timestamp with time zone,
	CONSTRAINT "connections_unique" UNIQUE("user_a_id","user_b_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "discover_upvotes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"target_type" text NOT NULL,
	"target_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "discover_upvotes_user_target_unique" UNIQUE("user_id","target_type","target_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "investments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"investor_id" text NOT NULL,
	"founder_id" text NOT NULL,
	"shares" integer NOT NULL,
	"share_price_kobo" integer NOT NULL,
	"total_paid_dot" numeric(20, 2) NOT NULL,
	"wallet_tx_id" text,
	"paystack_ref" text,
	"status" text DEFAULT 'confirmed' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"link" text,
	"icon" text,
	"read_at" timestamp with time zone,
	"emailed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "stakes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"target_type" text NOT NULL,
	"target_id" uuid NOT NULL,
	"amount" numeric(20, 2) NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"metadata" jsonb DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "venture_advisors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"venture_id" uuid NOT NULL,
	"name" text NOT NULL,
	"credentials" text,
	"linkedin_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "venture_details" (
	"venture_id" uuid PRIMARY KEY NOT NULL,
	"one_liner" text,
	"problem" text,
	"solution" text,
	"traction_mrr" numeric(20, 2) DEFAULT '0' NOT NULL,
	"traction_paying_users" integer DEFAULT 0 NOT NULL,
	"traction_growth_pct" integer DEFAULT 0 NOT NULL,
	"traction_retention_pct" integer DEFAULT 0 NOT NULL,
	"use_of_funds" text,
	"cap_table_total_raised" numeric(20, 2) DEFAULT '0' NOT NULL,
	"cap_table_last_round" text,
	"cap_table_structure" text,
	"pitch_deck_url" text,
	"founding_date" date,
	"stage_rationale" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "venture_milestones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"venture_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"achieved_at" date,
	"is_upcoming" boolean DEFAULT false NOT NULL,
	"target_date" date,
	"order_index" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "venture_team_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"venture_id" uuid NOT NULL,
	"name" text NOT NULL,
	"role" text NOT NULL,
	"linkedin_url" text,
	"is_founder" boolean DEFAULT false NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "wizard_state" (
	"user_id" text PRIMARY KEY NOT NULL,
	"completed_at" timestamp with time zone,
	"last_step" integer DEFAULT 0 NOT NULL,
	"skipped_steps" jsonb DEFAULT '[]'::jsonb,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "builder_profiles" ADD COLUMN "hourly_dot" numeric(20, 2);--> statement-breakpoint
ALTER TABLE "builder_profiles" ADD COLUMN "portfolio_url" text;--> statement-breakpoint
ALTER TABLE "builder_profiles" ADD COLUMN "linkedin_url" text;--> statement-breakpoint
ALTER TABLE "builder_profiles" ADD COLUMN "twitter_url" text;--> statement-breakpoint
ALTER TABLE "builder_profiles" ADD COLUMN "github_url" text;--> statement-breakpoint
ALTER TABLE "builder_profiles" ADD COLUMN "location" text;--> statement-breakpoint
ALTER TABLE "builder_profiles" ADD COLUMN "total_earned_dot" numeric(20, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "builder_profiles" ADD COLUMN "total_completed_orders" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "builder_profiles" ADD COLUMN "avg_rating" numeric(3, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "builder_profiles" ADD COLUMN "review_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "builder_profiles" ADD COLUMN "last_active_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "whop_product_id" text;--> statement-breakpoint
ALTER TABLE "founder_profiles" ADD COLUMN "headcount" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "founder_profiles" ADD COLUMN "annual_revenue_dot" text DEFAULT '0';--> statement-breakpoint
ALTER TABLE "founder_profiles" ADD COLUMN "founded_year" integer;--> statement-breakpoint
ALTER TABLE "founder_profiles" ADD COLUMN "total_raised_dot" text DEFAULT '0';--> statement-breakpoint
ALTER TABLE "founder_profiles" ADD COLUMN "share_price_kobo" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "founder_profiles" ADD COLUMN "shares_available" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "service_orders" ADD COLUMN "dispute_reason" text;--> statement-breakpoint
ALTER TABLE "service_orders" ADD COLUMN "disputed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "referral_code" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "referred_by" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "referral_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "referral_earnings_dot" numeric(20, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "wallets" ADD COLUMN "staked_balance" numeric(20, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "wallets" ADD COLUMN "locked_balance" numeric(20, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "wallets" ADD COLUMN "earned_lifetime" numeric(20, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "wallets" ADD COLUMN "burned_lifetime" numeric(20, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "wallets" ADD COLUMN "staked_lifetime" numeric(20, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "wallets" ADD COLUMN "redeemed_lifetime" numeric(20, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "builder_reviews" ADD CONSTRAINT "builder_reviews_builder_id_users_id_fk" FOREIGN KEY ("builder_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "builder_reviews" ADD CONSTRAINT "builder_reviews_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "certificates" ADD CONSTRAINT "certificates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "community_challenge_submissions" ADD CONSTRAINT "community_challenge_submissions_challenge_id_community_challenges_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "public"."community_challenges"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "community_challenge_submissions" ADD CONSTRAINT "community_challenge_submissions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "community_challenges" ADD CONSTRAINT "community_challenges_community_id_communities_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "community_challenges" ADD CONSTRAINT "community_challenges_posted_by_user_id_users_id_fk" FOREIGN KEY ("posted_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "community_channels" ADD CONSTRAINT "community_channels_community_id_communities_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "community_posts" ADD CONSTRAINT "community_posts_community_id_communities_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "community_posts" ADD CONSTRAINT "community_posts_channel_id_community_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."community_channels"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "community_posts" ADD CONSTRAINT "community_posts_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "connection_messages" ADD CONSTRAINT "connection_messages_connection_id_connections_id_fk" FOREIGN KEY ("connection_id") REFERENCES "public"."connections"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "connection_messages" ADD CONSTRAINT "connection_messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "connections" ADD CONSTRAINT "connections_user_a_id_users_id_fk" FOREIGN KEY ("user_a_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "connections" ADD CONSTRAINT "connections_user_b_id_users_id_fk" FOREIGN KEY ("user_b_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "connections" ADD CONSTRAINT "connections_meeting_id_meeting_requests_id_fk" FOREIGN KEY ("meeting_id") REFERENCES "public"."meeting_requests"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "connections" ADD CONSTRAINT "connections_initiated_by_users_id_fk" FOREIGN KEY ("initiated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "discover_upvotes" ADD CONSTRAINT "discover_upvotes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "investments" ADD CONSTRAINT "investments_investor_id_users_id_fk" FOREIGN KEY ("investor_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "investments" ADD CONSTRAINT "investments_founder_id_users_id_fk" FOREIGN KEY ("founder_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "stakes" ADD CONSTRAINT "stakes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "venture_advisors" ADD CONSTRAINT "venture_advisors_venture_id_ventures_id_fk" FOREIGN KEY ("venture_id") REFERENCES "public"."ventures"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "venture_details" ADD CONSTRAINT "venture_details_venture_id_ventures_id_fk" FOREIGN KEY ("venture_id") REFERENCES "public"."ventures"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "venture_milestones" ADD CONSTRAINT "venture_milestones_venture_id_ventures_id_fk" FOREIGN KEY ("venture_id") REFERENCES "public"."ventures"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "venture_team_members" ADD CONSTRAINT "venture_team_members_venture_id_ventures_id_fk" FOREIGN KEY ("venture_id") REFERENCES "public"."ventures"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "wizard_state" ADD CONSTRAINT "wizard_state_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "builder_reviews_builder_idx" ON "builder_reviews" USING btree ("builder_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "certificates_user_idx" ON "certificates" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "certificates_source_idx" ON "certificates" USING btree ("source","source_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "community_challenge_submissions_challenge_idx" ON "community_challenge_submissions" USING btree ("challenge_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "community_challenge_submissions_user_idx" ON "community_challenge_submissions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "community_challenges_community_idx" ON "community_challenges" USING btree ("community_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "community_challenges_status_idx" ON "community_challenges" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "community_challenges_deadline_idx" ON "community_challenges" USING btree ("deadline");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "community_channels_community_idx" ON "community_channels" USING btree ("community_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "community_posts_community_idx" ON "community_posts" USING btree ("community_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "community_posts_channel_idx" ON "community_posts" USING btree ("channel_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "connection_messages_conn_idx" ON "connection_messages" USING btree ("connection_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "connection_messages_created_idx" ON "connection_messages" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "connections_user_a_idx" ON "connections" USING btree ("user_a_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "connections_user_b_idx" ON "connections" USING btree ("user_b_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "discover_upvotes_target_idx" ON "discover_upvotes" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "investments_investor_idx" ON "investments" USING btree ("investor_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "investments_founder_idx" ON "investments" USING btree ("founder_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_user_idx" ON "notifications" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_unread_idx" ON "notifications" USING btree ("user_id","read_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "stakes_user_idx" ON "stakes" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "stakes_target_idx" ON "stakes" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "venture_advisors_venture_idx" ON "venture_advisors" USING btree ("venture_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "venture_milestones_venture_idx" ON "venture_milestones" USING btree ("venture_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "venture_team_members_venture_idx" ON "venture_team_members" USING btree ("venture_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "builder_profiles_available_idx" ON "builder_profiles" USING btree ("available");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "builder_profiles_earned_idx" ON "builder_profiles" USING btree ("total_earned_dot");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "builder_profiles_completed_idx" ON "builder_profiles" USING btree ("total_completed_orders");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_referral_code_unique" UNIQUE("referral_code");