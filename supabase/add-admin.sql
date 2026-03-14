-- ============================================
-- Migration: Add is_admin column to users
-- Run this in Supabase SQL Editor
-- ============================================

-- Add is_admin flag
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Grant admin to specific user
UPDATE users SET is_admin = TRUE WHERE auth_id = 'a917ceb5-c3ad-43c3-beab-f70774225b24';

CREATE POLICY "admins_read_all_users" ON users
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users u WHERE u.auth_id = auth.uid() AND u.is_admin = TRUE)
  );


CREATE POLICY "admins_read_all_scholars" ON scholars
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users u WHERE u.auth_id = auth.uid() AND u.is_admin = TRUE)
  );

CREATE POLICY "admins_read_all_meetings" ON meetings
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users u WHERE u.auth_id = auth.uid() AND u.is_admin = TRUE)
  );

CREATE POLICY "admins_read_all_meeting_participants" ON meeting_participants
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users u WHERE u.auth_id = auth.uid() AND u.is_admin = TRUE)
  );

CREATE POLICY "admins_read_all_tasks" ON tasks
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users u WHERE u.auth_id = auth.uid() AND u.is_admin = TRUE)
  );

CREATE POLICY "admins_read_all_task_assignments" ON task_assignments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users u WHERE u.auth_id = auth.uid() AND u.is_admin = TRUE)
  );

CREATE POLICY "admins_read_all_activity_logs" ON activity_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users u WHERE u.auth_id = auth.uid() AND u.is_admin = TRUE)
  );

CREATE POLICY "admins_read_all_notifications" ON notifications
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users u WHERE u.auth_id = auth.uid() AND u.is_admin = TRUE)
  );

CREATE POLICY "admins_read_all_action_items" ON action_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users u WHERE u.auth_id = auth.uid() AND u.is_admin = TRUE)
  );
