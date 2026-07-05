ALTER TABLE "venture_milestones" ADD COLUMN "funded_amount" numeric(20, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "venture_milestones" ADD COLUMN "payout_amount" numeric(20, 2);--> statement-breakpoint
ALTER TABLE "venture_milestones" ADD COLUMN "status" text DEFAULT 'pending' NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "venture_milestones_venture_status_idx" ON "venture_milestones" USING btree ("venture_id","status");