ALTER TABLE "feed_posts" ALTER COLUMN "tags" SET DATA TYPE text[];--> statement-breakpoint
ALTER TABLE "feed_posts" ALTER COLUMN "tags" SET DEFAULT '{}'::text[];--> statement-breakpoint
ALTER TABLE "meeting_slots" ADD COLUMN "title" text DEFAULT 'Available Slot' NOT NULL;--> statement-breakpoint
ALTER TABLE "meetings" ADD COLUMN "meeting_platform" text;--> statement-breakpoint
ALTER TABLE "meetings" ADD COLUMN "meeting_link" text;--> statement-breakpoint
ALTER TABLE "meetings" ADD COLUMN "coordination_notes" text;--> statement-breakpoint
ALTER TABLE "meetings" ADD COLUMN "agenda" jsonb;--> statement-breakpoint
ALTER TABLE "meetings" ADD COLUMN "reminder_sent_at" timestamp with time zone;