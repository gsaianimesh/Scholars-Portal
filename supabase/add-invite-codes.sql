-- ============================================
-- Migration: Add invite_code to professors
-- Run this in Supabase SQL Editor
-- ============================================

-- Add invite_code column
ALTER TABLE professors ADD COLUMN IF NOT EXISTS invite_code TEXT UNIQUE;

-- Generate invite codes for existing professors (8-char alphanumeric)
UPDATE professors
SET invite_code = upper(substr(md5(random()::text), 1, 8))
WHERE invite_code IS NULL;

-- Make it NOT NULL going forward
ALTER TABLE professors ALTER COLUMN invite_code SET NOT NULL;
ALTER TABLE professors ALTER COLUMN invite_code SET DEFAULT upper(substr(md5(random()::text), 1, 8));

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_professors_invite_code ON professors(invite_code);
