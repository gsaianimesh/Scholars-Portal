-- ============================================
-- Migration: Add Announcements & Reactions tables
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Create announcements table
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  professor_id UUID NOT NULL REFERENCES professors(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_announcements_professor_id ON announcements(professor_id);
CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON announcements(created_at DESC);

-- 2. Create announcement reactions table
CREATE TABLE IF NOT EXISTS announcement_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  announcement_id UUID NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(announcement_id, user_id, emoji)
);

CREATE INDEX IF NOT EXISTS idx_announcement_reactions_announcement_id ON announcement_reactions(announcement_id);
CREATE INDEX IF NOT EXISTS idx_announcement_reactions_user_id ON announcement_reactions(user_id);

-- 3. Enable RLS
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcement_reactions ENABLE ROW LEVEL SECURITY;

-- 4. RLS policies for announcements
CREATE POLICY "Users can view relevant announcements"
  ON announcements FOR SELECT
  USING (
    professor_id IN (
      SELECT p.id FROM professors p
      JOIN users u ON u.id = p.user_id
      WHERE u.auth_id = auth.uid()
    )
    OR professor_id IN (
      SELECT s.professor_id FROM scholars s
      JOIN users u ON u.id = s.user_id
      WHERE u.auth_id = auth.uid()
    )
    OR professor_id IN (
      SELECT cs.professor_id FROM co_supervisors cs
      JOIN users u ON u.id = cs.user_id
      WHERE u.auth_id = auth.uid()
    )
  );

-- 5. RLS policies for reactions
CREATE POLICY "Users can view announcement reactions"
  ON announcement_reactions FOR SELECT
  TO authenticated
  USING (true);
