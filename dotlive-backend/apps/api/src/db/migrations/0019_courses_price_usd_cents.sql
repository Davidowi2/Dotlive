-- Add price_usd_cents column to courses (referenced by /api/academy/courses, /api/academy/enroll)
ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "price_usd_cents" integer;
--> statement-breakpoint
