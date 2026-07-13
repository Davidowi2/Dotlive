CREATE TABLE IF NOT EXISTS "moderation_reports" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "community_id" uuid NOT NULL REFERENCES "communities"("id") ON DELETE CASCADE,
  "reporter_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "post_id" uuid REFERENCES "community_posts"("id") ON DELETE CASCADE,
  "channel_id" uuid REFERENCES "community_channels"("id") ON DELETE CASCADE,
  "reason" text NOT NULL DEFAULT '',
  "status" text NOT NULL DEFAULT 'open',
  "resolved_by" text REFERENCES "users"("id") ON DELETE SET NULL,
  "resolved_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "moderation_reports_community_idx" ON "moderation_reports" ("community_id");
CREATE INDEX IF NOT EXISTS "moderation_reports_status_idx" ON "moderation_reports" ("status");
CREATE INDEX IF NOT EXISTS "moderation_reports_created_idx" ON "moderation_reports" ("created_at");
