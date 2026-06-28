-- 0009_notifications.sql
-- Notifications, discover upvotes, community channels, community posts,
-- certificates, wizard state.

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  link TEXT,
  icon TEXT,
  read_at TIMESTAMPTZ,
  emailed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS notifications_user_idx ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_unread_idx ON notifications(user_id) WHERE read_at IS NULL;

CREATE TABLE IF NOT EXISTS discover_upvotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT discover_upvotes_user_target_unique UNIQUE (user_id, target_type, target_id)
);
CREATE INDEX IF NOT EXISTS discover_upvotes_target_idx ON discover_upvotes(target_type, target_id);

CREATE TABLE IF NOT EXISTS community_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_admin_only BOOLEAN NOT NULL DEFAULT FALSE,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS community_channels_community_idx ON community_channels(community_id, position);

CREATE TABLE IF NOT EXISTS community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  channel_id UUID NOT NULL REFERENCES community_channels(id) ON DELETE CASCADE,
  author_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  reactions JSONB NOT NULL DEFAULT '{}'::jsonb,
  reply_count INTEGER NOT NULL DEFAULT 0,
  pinned BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS community_posts_community_idx ON community_posts(community_id, created_at DESC);
CREATE INDEX IF NOT EXISTS community_posts_channel_idx ON community_posts(channel_id, created_at DESC);
CREATE INDEX IF NOT EXISTS community_posts_parent_idx ON community_posts(parent_id) WHERE parent_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id TEXT,
  title TEXT NOT NULL,
  issuer TEXT NOT NULL,
  score INTEGER,
  dot_earned INTEGER NOT NULL DEFAULT 0,
  level TEXT,
  credential_id TEXT NOT NULL,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT certificates_credential_unique UNIQUE (credential_id)
);
CREATE INDEX IF NOT EXISTS certificates_user_idx ON certificates(user_id, issued_at DESC);

CREATE TABLE IF NOT EXISTS wizard_state (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ,
  last_step INTEGER NOT NULL DEFAULT 0,
  skipped_steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default channels for existing communities
INSERT INTO community_channels (community_id, name, description, position)
SELECT id, 'general', 'General discussion', 0 FROM communities
WHERE NOT EXISTS (
  SELECT 1 FROM community_channels WHERE community_channels.community_id = communities.id
);

INSERT INTO community_channels (community_id, name, description, position, is_admin_only)
SELECT id, 'announcements', 'Updates from the team', 1, TRUE FROM communities
WHERE NOT EXISTS (
  SELECT 1 FROM community_channels WHERE community_channels.community_id = communities.id AND name = 'announcements'
);

INSERT INTO community_channels (community_id, name, description, position)
SELECT id, 'help', 'Ask questions, get help', 2 FROM communities
WHERE NOT EXISTS (
  SELECT 1 FROM community_channels WHERE community_channels.community_id = communities.id AND name = 'help'
);