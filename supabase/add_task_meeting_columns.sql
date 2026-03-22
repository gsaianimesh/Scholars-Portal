-- Add meeting_id and is_auto_generated columns to tasks table
-- This allows tasks to be linked to meetings and marked as auto-generated from AI

-- Add meeting_id column to link tasks to meetings
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS meeting_id UUID REFERENCES meetings(id) ON DELETE SET NULL;

-- Add is_auto_generated column to mark AI-created tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_auto_generated BOOLEAN DEFAULT FALSE;

-- Create index for meeting_id lookups
CREATE INDEX IF NOT EXISTS idx_tasks_meeting_id ON tasks(meeting_id);

-- Create index for filtering auto-generated tasks
CREATE INDEX IF NOT EXISTS idx_tasks_is_auto_generated ON tasks(is_auto_generated);
