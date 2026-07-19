CREATE TABLE IF NOT EXISTS "achievements" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"kind" text NOT NULL,
	"label" text NOT NULL,
	"description" text,
	"icon" text,
	"earned_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "activities" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"actor_id" text,
	"kind" text NOT NULL,
	"title" text NOT NULL,
	"body" text,
	"ref_type" text,
	"ref_id" text,
	"points_delta" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "admin_audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" text NOT NULL,
	"actor_email" text NOT NULL,
	"action" text NOT NULL,
	"target_type" text,
	"target_id" text,
	"before" jsonb,
	"after" jsonb,
	"reason" text NOT NULL,
	"ip" text,
	"user_agent" text,
	"request_id" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "admin_confirm_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token" text NOT NULL,
	"admin_id" text NOT NULL,
	"action" text NOT NULL,
	"target_type" text,
	"target_id" text,
	"payload" jsonb,
	"reason" text NOT NULL,
	"used_at" timestamp with time zone,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admin_confirm_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "admin_idempotency_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_id" text NOT NULL,
	"idempotency_key" text NOT NULL,
	"action" text NOT NULL,
	"response_status" integer NOT NULL,
	"response_body" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "idem_key_uq" UNIQUE("admin_id","idempotency_key")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "admin_impersonation_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"jti" text NOT NULL,
	"admin_id" text NOT NULL,
	"target_user_id" text NOT NULL,
	"reason" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admin_impersonation_tokens_jti_unique" UNIQUE("jti")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "builder_levels" (
	"user_id" text PRIMARY KEY NOT NULL,
	"level" integer DEFAULT 1 NOT NULL,
	"label" text DEFAULT 'Explorer' NOT NULL,
	"promoted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "builder_profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"headline" text DEFAULT '' NOT NULL,
	"bio" text,
	"skills" text[] DEFAULT '{}' NOT NULL,
	"available" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "challenge_submissions" (
	"id" text PRIMARY KEY NOT NULL,
	"challenge_id" text NOT NULL,
	"builder_id" text NOT NULL,
	"content" text NOT NULL,
	"link" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reviewed_at" timestamp with time zone,
	"review_note" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "challenges" (
	"id" text PRIMARY KEY NOT NULL,
	"posted_by" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"skill" text NOT NULL,
	"reward_dot" text NOT NULL,
	"deadline" timestamp with time zone,
	"max_submissions" integer DEFAULT 1,
	"status" text DEFAULT 'open' NOT NULL,
	"venture_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "feature_flags" (
	"key" text PRIMARY KEY NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"rollout_percent" integer,
	"allow_list" jsonb,
	"description" text,
	"updated_by" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "founder_profiles" (
	"user_id" text PRIMARY KEY NOT NULL,
	"venture_name" text,
	"industry" text,
	"stage" text DEFAULT 'Assess',
	"country" text,
	"community_id" text,
	"bio" text,
	"website" text,
	"funding_goal" text,
	"logo_url" text,
	"vantage_point" integer DEFAULT 0,
	"fundability" integer DEFAULT 0,
	"investment_readiness" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "payments_audit" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" text NOT NULL,
	"event_id" text NOT NULL,
	"event_type" text NOT NULL,
	"user_id" text,
	"amount_minor" integer NOT NULL,
	"currency" text NOT NULL,
	"raw_payload" jsonb NOT NULL,
	"status" text DEFAULT 'received' NOT NULL,
	"processed_at" timestamp with time zone,
	"failure_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payments_audit_event_uq" UNIQUE("provider","event_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pitchathon_scores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pitchathon_id" uuid NOT NULL,
	"application_id" uuid NOT NULL,
	"judge_id" text NOT NULL,
	"score" integer NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pitchathon_score_unique" UNIQUE("pitchathon_id","application_id","judge_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "reputation_events" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"delta" integer NOT NULL,
	"reason" text NOT NULL,
	"ref_type" text,
	"ref_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_bans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"banned_by" text NOT NULL,
	"reason" text NOT NULL,
	"expires_at" timestamp with time zone,
	"revoked_by" text,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_bans_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "onboarding_intent" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "invited_by" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "onboarded_at" timestamp with time zone;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "builder_profiles" ADD CONSTRAINT "builder_profiles_id_users_id_fk" FOREIGN KEY ("id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "founder_profiles" ADD CONSTRAINT "founder_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pitchathon_scores" ADD CONSTRAINT "pitchathon_scores_pitchathon_id_pitchathons_id_fk" FOREIGN KEY ("pitchathon_id") REFERENCES "public"."pitchathons"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pitchathon_scores" ADD CONSTRAINT "pitchathon_scores_application_id_pitchathon_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."pitchathon_applications"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pitchathon_scores" ADD CONSTRAINT "pitchathon_scores_judge_id_users_id_fk" FOREIGN KEY ("judge_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ach_user_idx" ON "achievements" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ach_kind_idx" ON "achievements" USING btree ("kind");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "act_user_idx" ON "activities" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "act_created_idx" ON "activities" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_actor_idx" ON "admin_audit_log" USING btree ("actor_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_target_idx" ON "admin_audit_log" USING btree ("target_type","target_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_action_idx" ON "admin_audit_log" USING btree ("action","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "confirm_admin_idx" ON "admin_confirm_tokens" USING btree ("admin_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "confirm_expires_idx" ON "admin_confirm_tokens" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idem_expires_idx" ON "admin_idempotency_keys" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cs_challenge_idx" ON "challenge_submissions" USING btree ("challenge_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cs_builder_idx" ON "challenge_submissions" USING btree ("builder_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cs_status_idx" ON "challenge_submissions" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "challenges_status_idx" ON "challenges" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "challenges_skill_idx" ON "challenges" USING btree ("skill");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "challenges_posted_by_idx" ON "challenges" USING btree ("posted_by");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payments_audit_user_idx" ON "payments_audit" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payments_audit_status_idx" ON "payments_audit" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pitch_score_app_idx" ON "pitchathon_scores" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "rep_user_idx" ON "reputation_events" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bans_user_idx" ON "user_bans" USING btree ("user_id");