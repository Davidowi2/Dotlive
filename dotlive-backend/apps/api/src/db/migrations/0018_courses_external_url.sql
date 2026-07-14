-- Add external_url column to courses (referenced by /api/academy/courses)
ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "external_url" text;
--> statement-breakpoint

-- Defensive: ensure other academy columns referenced by the schema are present
ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "cover_image_url" text;
--> statement-breakpoint
ALTER TABLE "course_enrollments" ADD COLUMN IF NOT EXISTS "completed_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "course_enrollments" ADD COLUMN IF NOT EXISTS "rewarded_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "course_enrollments" ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone DEFAULT now();
