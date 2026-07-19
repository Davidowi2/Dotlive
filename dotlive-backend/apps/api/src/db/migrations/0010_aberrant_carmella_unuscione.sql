CREATE TABLE IF NOT EXISTS "activity_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"action" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "builder_certifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"builder_id" text NOT NULL,
	"name" text NOT NULL,
	"issuer" text NOT NULL,
	"issued_date" date,
	"expires_date" date,
	"credential_url" text,
	"credential_id" text,
	"badge_url" text,
	"is_verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "builder_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"builder_id" text NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"file_url" text NOT NULL,
	"file_name" text,
	"file_size" integer,
	"is_verified" boolean DEFAULT false NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "builder_vouches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"builder_id" text NOT NULL,
	"voucher_id" text NOT NULL,
	"skill" text NOT NULL,
	"comment" text,
	"is_endorsed" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "builder_vouches_unique" UNIQUE("builder_id","voucher_id","skill")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "dividend_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dividend_id" uuid NOT NULL,
	"investor_id" text NOT NULL,
	"investment_id" uuid NOT NULL,
	"shares_owned" integer NOT NULL,
	"amount_naira" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"paid_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "dividends" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"venture_id" uuid NOT NULL,
	"declared_by" text NOT NULL,
	"amount_naira" integer NOT NULL,
	"per_share_amount" integer NOT NULL,
	"period" text NOT NULL,
	"status" text DEFAULT 'declared' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"paid_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "dot_stake_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"stake_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"action" text NOT NULL,
	"amount" integer,
	"reward_amount" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "dot_stake_positions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"amount" integer NOT NULL,
	"reward_claimed" integer DEFAULT 0 NOT NULL,
	"reward_accrued" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"staked_at" timestamp with time zone DEFAULT now() NOT NULL,
	"unbonded_at" timestamp with time zone,
	"claimed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "feed_comment_likes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"comment_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "feed_comment_likes_user_comment_unique" UNIQUE("user_id","comment_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "feed_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" uuid NOT NULL,
	"author_id" text NOT NULL,
	"author_name" text NOT NULL,
	"author_dot_id" text,
	"author_role" text,
	"body" text NOT NULL,
	"likes_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "feed_post_bookmarks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "feed_post_bookmarks_user_post_unique" UNIQUE("user_id","post_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "feed_post_likes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "feed_post_likes_user_post_unique" UNIQUE("user_id","post_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "feed_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"author_id" text NOT NULL,
	"author_name" text NOT NULL,
	"author_dot_id" text,
	"author_role" text,
	"type" text DEFAULT 'general' NOT NULL,
	"title" text,
	"body" text NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"gig_type" text,
	"budget_dot" integer,
	"funding_goal" integer,
	"funding_round" text,
	"venture_name" text,
	"venture_stage" text,
	"likes_count" integer DEFAULT 0 NOT NULL,
	"comments_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "loan_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"venture_id" uuid NOT NULL,
	"requested_by" text NOT NULL,
	"amount_naira" integer NOT NULL,
	"term_months" integer NOT NULL,
	"purpose" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"voting_ends_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "loan_votes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"loan_request_id" uuid NOT NULL,
	"voter_id" text NOT NULL,
	"vote" boolean NOT NULL,
	"amount_naira" integer,
	"voted_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "loan_votes_pair_unique" UNIQUE("loan_request_id","voter_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "loans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"loan_request_id" uuid,
	"venture_id" uuid NOT NULL,
	"amount_naira" integer NOT NULL,
	"term_months" integer NOT NULL,
	"interest_rate" numeric(10, 4) DEFAULT '0.02' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"funded_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "meeting_slots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"host_id" text NOT NULL,
	"date" date NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"duration_minutes" integer DEFAULT 30,
	"status" text DEFAULT 'available' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "meetings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slot_id" uuid NOT NULL,
	"host_id" text NOT NULL,
	"guest_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"meeting_reason" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"scheduled_at" timestamp with time zone NOT NULL,
	"confirmed_at" timestamp with time zone,
	"declined_at" timestamp with time zone,
	"declined_reason" text,
	"cancelled_at" timestamp with time zone,
	"cancelled_reason" text,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "page_views" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text,
	"viewer_id" text,
	"page_type" text NOT NULL,
	"referrer" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pitch_decks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"venture_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"url" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"is_public" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "referrals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"referrer_id" text NOT NULL,
	"referee_id" text NOT NULL,
	"referral_code" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"reward_claimed" boolean DEFAULT false NOT NULL,
	"claimed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_vouches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"voucher_id" text NOT NULL,
	"vouchee_id" text NOT NULL,
	"scope" text NOT NULL,
	"score" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_vouches_pair_unique" UNIQUE("voucher_id","vouchee_id")
);
--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "is_archived" boolean DEFAULT false NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "builder_certifications" ADD CONSTRAINT "builder_certifications_builder_id_users_id_fk" FOREIGN KEY ("builder_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "builder_documents" ADD CONSTRAINT "builder_documents_builder_id_users_id_fk" FOREIGN KEY ("builder_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "builder_vouches" ADD CONSTRAINT "builder_vouches_builder_id_users_id_fk" FOREIGN KEY ("builder_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "builder_vouches" ADD CONSTRAINT "builder_vouches_voucher_id_users_id_fk" FOREIGN KEY ("voucher_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "dividend_payments" ADD CONSTRAINT "dividend_payments_dividend_id_dividends_id_fk" FOREIGN KEY ("dividend_id") REFERENCES "public"."dividends"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "dividend_payments" ADD CONSTRAINT "dividend_payments_investor_id_users_id_fk" FOREIGN KEY ("investor_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "dividend_payments" ADD CONSTRAINT "dividend_payments_investment_id_investments_id_fk" FOREIGN KEY ("investment_id") REFERENCES "public"."investments"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "dividends" ADD CONSTRAINT "dividends_venture_id_ventures_id_fk" FOREIGN KEY ("venture_id") REFERENCES "public"."ventures"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "dividends" ADD CONSTRAINT "dividends_declared_by_users_id_fk" FOREIGN KEY ("declared_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "dot_stake_history" ADD CONSTRAINT "dot_stake_history_stake_id_dot_stake_positions_id_fk" FOREIGN KEY ("stake_id") REFERENCES "public"."dot_stake_positions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "dot_stake_history" ADD CONSTRAINT "dot_stake_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "dot_stake_positions" ADD CONSTRAINT "dot_stake_positions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "feed_comment_likes" ADD CONSTRAINT "feed_comment_likes_comment_id_feed_comments_id_fk" FOREIGN KEY ("comment_id") REFERENCES "public"."feed_comments"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "feed_comment_likes" ADD CONSTRAINT "feed_comment_likes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "feed_comments" ADD CONSTRAINT "feed_comments_post_id_feed_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."feed_posts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "feed_comments" ADD CONSTRAINT "feed_comments_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "feed_post_bookmarks" ADD CONSTRAINT "feed_post_bookmarks_post_id_feed_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."feed_posts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "feed_post_bookmarks" ADD CONSTRAINT "feed_post_bookmarks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "feed_post_likes" ADD CONSTRAINT "feed_post_likes_post_id_feed_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."feed_posts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "feed_post_likes" ADD CONSTRAINT "feed_post_likes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "feed_posts" ADD CONSTRAINT "feed_posts_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "loan_requests" ADD CONSTRAINT "loan_requests_venture_id_ventures_id_fk" FOREIGN KEY ("venture_id") REFERENCES "public"."ventures"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "loan_requests" ADD CONSTRAINT "loan_requests_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "loan_votes" ADD CONSTRAINT "loan_votes_loan_request_id_loan_requests_id_fk" FOREIGN KEY ("loan_request_id") REFERENCES "public"."loan_requests"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "loan_votes" ADD CONSTRAINT "loan_votes_voter_id_users_id_fk" FOREIGN KEY ("voter_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "loans" ADD CONSTRAINT "loans_loan_request_id_loan_requests_id_fk" FOREIGN KEY ("loan_request_id") REFERENCES "public"."loan_requests"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "loans" ADD CONSTRAINT "loans_venture_id_ventures_id_fk" FOREIGN KEY ("venture_id") REFERENCES "public"."ventures"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "loans" ADD CONSTRAINT "loans_funded_by_users_id_fk" FOREIGN KEY ("funded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "meeting_slots" ADD CONSTRAINT "meeting_slots_host_id_users_id_fk" FOREIGN KEY ("host_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "meetings" ADD CONSTRAINT "meetings_slot_id_meeting_slots_id_fk" FOREIGN KEY ("slot_id") REFERENCES "public"."meeting_slots"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "meetings" ADD CONSTRAINT "meetings_host_id_users_id_fk" FOREIGN KEY ("host_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "meetings" ADD CONSTRAINT "meetings_guest_id_users_id_fk" FOREIGN KEY ("guest_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "page_views" ADD CONSTRAINT "page_views_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "page_views" ADD CONSTRAINT "page_views_viewer_id_users_id_fk" FOREIGN KEY ("viewer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pitch_decks" ADD CONSTRAINT "pitch_decks_venture_id_ventures_id_fk" FOREIGN KEY ("venture_id") REFERENCES "public"."ventures"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referrer_id_users_id_fk" FOREIGN KEY ("referrer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referee_id_users_id_fk" FOREIGN KEY ("referee_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_vouches" ADD CONSTRAINT "user_vouches_voucher_id_users_id_fk" FOREIGN KEY ("voucher_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_vouches" ADD CONSTRAINT "user_vouches_vouchee_id_users_id_fk" FOREIGN KEY ("vouchee_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "activity_log_user_idx" ON "activity_log" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "activity_log_action_idx" ON "activity_log" USING btree ("action","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "builder_certifications_builder_idx" ON "builder_certifications" USING btree ("builder_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "builder_certifications_verified_idx" ON "builder_certifications" USING btree ("is_verified");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "builder_documents_builder_idx" ON "builder_documents" USING btree ("builder_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "builder_documents_type_idx" ON "builder_documents" USING btree ("type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "builder_documents_verified_idx" ON "builder_documents" USING btree ("is_verified");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "builder_vouches_builder_idx" ON "builder_vouches" USING btree ("builder_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "builder_vouches_voucher_idx" ON "builder_vouches" USING btree ("voucher_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "dividend_payments_dividend_idx" ON "dividend_payments" USING btree ("dividend_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "dividend_payments_investor_idx" ON "dividend_payments" USING btree ("investor_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "dividend_payments_status_idx" ON "dividend_payments" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "dividends_venture_idx" ON "dividends" USING btree ("venture_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "dividends_declared_by_idx" ON "dividends" USING btree ("declared_by");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "dividends_status_idx" ON "dividends" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "dot_stake_history_stake_idx" ON "dot_stake_history" USING btree ("stake_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "dot_stake_history_user_idx" ON "dot_stake_history" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "dot_stake_positions_user_idx" ON "dot_stake_positions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "dot_stake_positions_status_idx" ON "dot_stake_positions" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "feed_comments_post_idx" ON "feed_comments" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "feed_comments_author_idx" ON "feed_comments" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "feed_post_bookmarks_post_idx" ON "feed_post_bookmarks" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "feed_post_likes_post_idx" ON "feed_post_likes" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "feed_posts_author_idx" ON "feed_posts" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "feed_posts_type_idx" ON "feed_posts" USING btree ("type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "feed_posts_created_idx" ON "feed_posts" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "loan_requests_venture_idx" ON "loan_requests" USING btree ("venture_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "loan_requests_requested_by_idx" ON "loan_requests" USING btree ("requested_by");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "loan_requests_status_idx" ON "loan_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "loan_votes_loan_request_idx" ON "loan_votes" USING btree ("loan_request_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "loan_votes_voter_idx" ON "loan_votes" USING btree ("voter_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "loans_venture_idx" ON "loans" USING btree ("venture_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "loans_funded_by_idx" ON "loans" USING btree ("funded_by");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "loans_status_idx" ON "loans" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "meeting_slots_host_idx" ON "meeting_slots" USING btree ("host_id","date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "meeting_slots_date_idx" ON "meeting_slots" USING btree ("date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "meeting_slots_status_idx" ON "meeting_slots" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "meetings_slot_idx" ON "meetings" USING btree ("slot_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "meetings_host_idx" ON "meetings" USING btree ("host_id","scheduled_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "meetings_guest_idx" ON "meetings" USING btree ("guest_id","scheduled_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "meetings_status_idx" ON "meetings" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "page_views_user_idx" ON "page_views" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "page_views_viewer_idx" ON "page_views" USING btree ("viewer_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "page_views_page_type_idx" ON "page_views" USING btree ("page_type","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pitch_decks_venture_idx" ON "pitch_decks" USING btree ("venture_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pitch_decks_version_idx" ON "pitch_decks" USING btree ("venture_id","version");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "referrals_referrer_idx" ON "referrals" USING btree ("referrer_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "referrals_referee_idx" ON "referrals" USING btree ("referee_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "referrals_code_idx" ON "referrals" USING btree ("referral_code");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "referrals_status_idx" ON "referrals" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_vouches_voucher_idx" ON "user_vouches" USING btree ("voucher_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_vouches_vouchee_idx" ON "user_vouches" USING btree ("vouchee_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_archived_idx" ON "notifications" USING btree ("user_id","is_archived");