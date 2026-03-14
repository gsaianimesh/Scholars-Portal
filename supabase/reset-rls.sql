-- ============================================
-- NUCLEAR RLS RESET & FIX
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Force Schema Cache Reload (Fixes error 42P17 and stale definitions)
NOTIFY pgrst, 'reload schema';

-- 2. Drop ALL existing policies on key tables to remove hidden conflicts/recursion
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE schemaname = 'public' 
          AND tablename IN ('users', 'professors', 'scholars', 'tasks', 'task_assignments', 'meetings', 'activity_logs', 'action_items', 'co_supervisors', 'meeting_participants') 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON "' || r.tablename || '"';
    END LOOP;
END $$;

-- 3. Re-Enable RLS (Just in case)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE professors ENABLE ROW LEVEL SECURITY;
ALTER TABLE scholars ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- 4. Apply SIMPLE, NON-RECURSIVE Policies (Base Layer)

-- Users: Open mostly, restricted by app logic largely, but we keep it simple to fix 500s
CREATE POLICY "Read All Users" ON users FOR SELECT TO authenticated USING (true);
CREATE POLICY "Update Own User" ON users FOR UPDATE TO authenticated USING (auth_id = auth.uid());

-- Professors: Open read
CREATE POLICY "Read All Professors" ON professors FOR SELECT TO authenticated USING (true);
CREATE POLICY "Insert Professors" ON professors FOR INSERT TO authenticated WITH CHECK (true); -- Allow creation during onboarding
CREATE POLICY "Update Own Professor Profile" ON professors FOR UPDATE TO authenticated USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- Scholars: Open read (filtered by UI), but safe for API to return
CREATE POLICY "Read All Scholars" ON scholars FOR SELECT TO authenticated USING (true);
CREATE POLICY "Insert Scholars" ON scholars FOR INSERT TO authenticated WITH CHECK (true);

-- Tasks: Open read to authenticated users (Filtering happens in UI/Query)
CREATE POLICY "Read All Tasks" ON tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Insert Tasks" ON tasks FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Update Tasks" ON tasks FOR UPDATE TO authenticated USING (true);

-- Meetings: Open read
CREATE POLICY "Read All Meetings" ON meetings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Insert Meetings" ON meetings FOR INSERT TO authenticated WITH CHECK (true);

-- Task Assignments: Open read
CREATE POLICY "Read Assignments" ON task_assignments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Manage Assignments" ON task_assignments FOR ALL TO authenticated USING (true);

-- Activity Logs: Open read
CREATE POLICY "Read Logs" ON activity_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Insert Logs" ON activity_logs FOR INSERT TO authenticated WITH CHECK (true);

-- 5. Grant Permissions (Fixes "permission denied" causing 500s)
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- 6. Clean bad data (just in case)
DELETE FROM professors WHERE user_id IS NULL;
