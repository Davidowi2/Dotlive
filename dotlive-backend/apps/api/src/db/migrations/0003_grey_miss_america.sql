ALTER TABLE "challenges" ADD COLUMN "poster_type" text DEFAULT 'founder' NOT NULL;--> statement-breakpoint
ALTER TABLE "challenges" ADD COLUMN "poster_org_id" text;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "challenges_poster_type_idx" ON "challenges" USING btree ("poster_type");