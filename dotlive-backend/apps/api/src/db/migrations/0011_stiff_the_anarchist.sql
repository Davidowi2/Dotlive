ALTER TABLE "feed_posts" ALTER COLUMN "tags" SET DATA TYPE text[];--> statement-breakpoint
ALTER TABLE "feed_posts" ALTER COLUMN "tags" SET DEFAULT '{}'::text[];--> statement-breakpoint
ALTER TABLE "meeting_slots" ADD COLUMN IF NOT EXISTS "title" text DEFAULT 'Available Slot' NOT NULL;--> statement-breakpoint
ALTER TABLE "meetings" ADD COLUMN IF NOT EXISTS "meeting_platform" text;--> statement-breakpoint
ALTER TABLE "meetings" ADD COLUMN IF NOT EXISTS "meeting_link" text;--> statement-breakpoint
ALTER TABLE "meetings" ADD COLUMN IF NOT EXISTS "coordination_notes" text;--> statement-breakpoint
ALTER TABLE "meetings" ADD COLUMN IF NOT EXISTS "agenda" jsonb;--> statement-breakpoint
ALTER TABLE "meetings" ADD COLUMN IF NOT EXISTS "reminder_sent_at" timestamp with time zone;