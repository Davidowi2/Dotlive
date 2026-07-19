CREATE TABLE IF NOT EXISTS "investor_profiles" (
	"user_id" text PRIMARY KEY NOT NULL,
	"capital_type" text,
	"check_size" text,
	"focus_areas" text[] DEFAULT '{}',
	"bio" text,
	"linkedin_url" text,
	"twitter_url" text,
	"website_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "investor_profiles" ADD CONSTRAINT "investor_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
