-- Add duration_minutes column to meetings table
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 60;
