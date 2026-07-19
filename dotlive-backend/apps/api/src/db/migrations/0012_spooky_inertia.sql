CREATE TABLE IF NOT EXISTS "community_chat_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"community_id" uuid NOT NULL,
	"author_id" text NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "loan_applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"legal_name" text NOT NULL,
	"country_of_residence" text NOT NULL,
	"phone_number" text NOT NULL,
	"national_id" text NOT NULL,
	"date_of_birth" timestamp with time zone NOT NULL,
	"source_of_income" text NOT NULL,
	"venture_name" text NOT NULL,
	"business_reg_number" text NOT NULL,
	"country_of_registration" text NOT NULL,
	"monthly_revenue" numeric(20, 2) NOT NULL,
	"monthly_expenses" numeric(20, 2) NOT NULL,
	"outstanding_debts" text NOT NULL,
	"amount_requested" numeric(20, 2) NOT NULL,
	"purpose" text NOT NULL,
	"repayment_period_months" integer NOT NULL,
	"collateral" text,
	"revenue_proof_url" text,
	"expense_proof_url" text,
	"terms_accepted" boolean DEFAULT false NOT NULL,
	"fraud_acknowledged" boolean DEFAULT false NOT NULL,
	"verification_authorized" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"reviewed_by" text,
	"reviewed_at" timestamp with time zone,
	"admin_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "loan_repayments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"loan_application_id" uuid NOT NULL,
	"due_date" timestamp with time zone NOT NULL,
	"amount_dot" numeric(20, 2) NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"paid_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "meeting_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"meeting_id" uuid NOT NULL,
	"author_id" text NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "moderation_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"community_id" uuid NOT NULL,
	"reporter_id" text NOT NULL,
	"target_type" text NOT NULL,
	"target_id" text NOT NULL,
	"reason" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"resolved_by" text,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "platform_config" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updated_by" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "course_enrollments" ALTER COLUMN "status" SET DEFAULT 'active';--> statement-breakpoint
ALTER TABLE "communities" ADD COLUMN IF NOT EXISTS "visibility" text DEFAULT 'private' NOT NULL;--> statement-breakpoint
ALTER TABLE "communities" ADD COLUMN IF NOT EXISTS "invite_code" text;--> statement-breakpoint
UPDATE "communities" SET "invite_code" = gen_random_uuid()::text WHERE "invite_code" IS NULL;--> statement-breakpoint
ALTER TABLE "communities" ALTER COLUMN "invite_code" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "communities" ADD COLUMN IF NOT EXISTS "invite_expires_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "communities" ADD COLUMN IF NOT EXISTS "archived_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "communities" ADD COLUMN IF NOT EXISTS "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "community_members" ADD COLUMN IF NOT EXISTS "role" text DEFAULT 'member' NOT NULL;--> statement-breakpoint
ALTER TABLE "community_members" ADD COLUMN IF NOT EXISTS "removed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "community_members" ADD COLUMN IF NOT EXISTS "removed_by" text;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "external_url" text;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "price_usd_cents" integer;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'scheduled' NOT NULL;--> statement-breakpoint
ALTER TABLE "feed_posts" ADD COLUMN IF NOT EXISTS "image_url" text;--> statement-breakpoint
ALTER TABLE "founder_profiles" ADD COLUMN IF NOT EXISTS "pitch_deck_url" text;--> statement-breakpoint
ALTER TABLE "founder_profiles" ADD COLUMN IF NOT EXISTS "whatsapp_link" text;--> statement-breakpoint
ALTER TABLE "founder_profiles" ADD COLUMN IF NOT EXISTS "email_link" text;--> statement-breakpoint
ALTER TABLE "founder_profiles" ADD COLUMN IF NOT EXISTS "telegram_link" text;--> statement-breakpoint
ALTER TABLE "founder_profiles" ADD COLUMN IF NOT EXISTS "discord_link" text;--> statement-breakpoint
ALTER TABLE "service_orders" ADD COLUMN IF NOT EXISTS "escrow_status" text DEFAULT 'funded' NOT NULL;--> statement-breakpoint
ALTER TABLE "service_orders" ADD COLUMN IF NOT EXISTS "delivered_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "user_roles" ADD COLUMN IF NOT EXISTS "purchased_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "user_roles" ADD COLUMN IF NOT EXISTS "expires_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "user_roles" ADD COLUMN IF NOT EXISTS "grace_until" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "user_roles" ADD COLUMN IF NOT EXISTS "renewal_status" text DEFAULT 'active';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "vantage_test_prompted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "last_vantage_taken_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "loan_application_blocked" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "two_factor_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "two_factor_secret" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "backup_codes" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "community_chat_messages" ADD CONSTRAINT "community_chat_messages_community_id_communities_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "community_chat_messages" ADD CONSTRAINT "community_chat_messages_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "loan_applications" ADD CONSTRAINT "loan_applications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "loan_applications" ADD CONSTRAINT "loan_applications_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "loan_repayments" ADD CONSTRAINT "loan_repayments_loan_application_id_loan_applications_id_fk" FOREIGN KEY ("loan_application_id") REFERENCES "public"."loan_applications"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "meeting_messages" ADD CONSTRAINT "meeting_messages_meeting_id_meetings_id_fk" FOREIGN KEY ("meeting_id") REFERENCES "public"."meetings"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "meeting_messages" ADD CONSTRAINT "meeting_messages_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "moderation_reports" ADD CONSTRAINT "moderation_reports_community_id_communities_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "moderation_reports" ADD CONSTRAINT "moderation_reports_reporter_id_users_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "moderation_reports" ADD CONSTRAINT "moderation_reports_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "platform_config" ADD CONSTRAINT "platform_config_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "community_chat_messages_community_idx" ON "community_chat_messages" USING btree ("community_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "loan_applications_user_idx" ON "loan_applications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "loan_applications_status_idx" ON "loan_applications" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "meeting_messages_meeting_idx" ON "meeting_messages" USING btree ("meeting_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "moderation_reports_community_idx" ON "moderation_reports" USING btree ("community_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "moderation_reports_status_idx" ON "moderation_reports" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "moderation_reports_created_idx" ON "moderation_reports" USING btree ("created_at");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "community_members" ADD CONSTRAINT "community_members_removed_by_users_id_fk" FOREIGN KEY ("removed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "communities_visibility_idx" ON "communities" USING btree ("visibility");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "communities_invite_idx" ON "communities" USING btree ("invite_code");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "community_members_community_role_idx" ON "community_members" USING btree ("community_id","role");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "communities" ADD CONSTRAINT "communities_invite_code_unique" UNIQUE("invite_code");
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;