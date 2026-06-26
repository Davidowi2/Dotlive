CREATE TABLE IF NOT EXISTS "demo_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"cover_image_url" text,
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone NOT NULL,
	"registration_deadline" timestamp with time zone,
	"voting_opens_at" timestamp with time zone,
	"voting_closes_at" timestamp with time zone,
	"tracks" jsonb DEFAULT '["open", "invitational"]'::jsonb NOT NULL,
	"sponsors" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"judges" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"prize_pool_dot" numeric(14, 2),
	"livestream_url" text,
	"registration_fee_dot" numeric(14, 2) DEFAULT '0',
	"status" text DEFAULT 'upcoming' NOT NULL,
	"featured_ventures" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "demo_events_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "kyc_submissions" (
	"user_id" text PRIMARY KEY NOT NULL,
	"tier" text DEFAULT 'tier1' NOT NULL,
	"bvn" text,
	"nin" text,
	"gov_id_url" text,
	"gov_id_type" text,
	"full_name" text,
	"date_of_birth" text,
	"address" text,
	"country" text DEFAULT 'NG' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"reviewed_by" text,
	"reviewed_at" timestamp with time zone,
	"rejection_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "votes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"voter_id" text NOT NULL,
	"event_slug" text NOT NULL,
	"target_type" text NOT NULL,
	"target_id" text NOT NULL,
	"weight" numeric(6, 2) DEFAULT '1.00' NOT NULL,
	"reputation_at_vote" numeric(6, 2),
	"ip_hash" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "withdrawal_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"amount_dot" numeric(14, 2) NOT NULL,
	"amount_ngn" numeric(14, 2) NOT NULL,
	"bank_info" jsonb NOT NULL,
	"kyc_tier" text DEFAULT 'tier1' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"admin_note" text,
	"reviewed_by" text,
	"reviewed_at" timestamp with time zone,
	"paid_at" timestamp with time zone,
	"failure_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "communities" ADD COLUMN "tier" text DEFAULT 'free' NOT NULL;--> statement-breakpoint
ALTER TABLE "communities" ADD COLUMN "annual_renewal_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "communities" ADD COLUMN "subscription_status" text DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE "communities" ADD COLUMN "paid_through_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "communities" ADD COLUMN "verified_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "communities" ADD COLUMN "member_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "kyc_submissions" ADD CONSTRAINT "kyc_submissions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "votes" ADD CONSTRAINT "votes_voter_id_users_id_fk" FOREIGN KEY ("voter_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "withdrawal_requests" ADD CONSTRAINT "withdrawal_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "demo_event_slug_idx" ON "demo_events" USING btree ("slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "demo_event_status_idx" ON "demo_events" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "vote_voter_idx" ON "votes" USING btree ("voter_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "vote_event_idx" ON "votes" USING btree ("event_slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "vote_target_idx" ON "votes" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "vote_unique_idx" ON "votes" USING btree ("voter_id","event_slug","target_type","target_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "withdrawal_user_idx" ON "withdrawal_requests" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "withdrawal_status_idx" ON "withdrawal_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "communities_tier_idx" ON "communities" USING btree ("tier");