-- ============================================
-- FIX: Add missing RLS SELECT policies
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================

-- 1. Replace restrictive users SELECT policy with permissive one
DROP POLICY IF EXISTS "Users can view own profile" ON users;
CREATE POLICY "Authenticated users can view users"
  ON users FOR SELECT
  TO authenticated
  USING (true);

-- 2. Add missing professors SELECT policy
DROP POLICY IF EXISTS "Authenticated users can view professors" ON professors;
CREATE POLICY "Authenticated users can view professors"
  ON professors FOR SELECT
  TO authenticated
  USING (true);

-- 3. Add missing co_supervisors SELECT policy
DROP POLICY IF EXISTS "Authenticated users can view co_supervisors" ON co_supervisors;
CREATE POLICY "Authenticated users can view co_supervisors"
  ON co_supervisors FOR SELECT
  TO authenticated
  USING (true);

-- 4. Add co-supervisor visibility to scholars policy
DROP POLICY IF EXISTS "Professors can view their scholars" ON scholars;
CREATE POLICY "Professors can view their scholars"
  ON scholars FOR SELECT
  USING (
    professor_id IN (
      SELECT p.id FROM professors p
      JOIN users u ON u.id = p.user_id
      WHERE u.auth_id = auth.uid()
    )
    OR user_id IN (
      SELECT id FROM users WHERE auth_id = auth.uid()
    )
    OR professor_id IN (
      SELECT cs.professor_id FROM co_supervisors cs
      JOIN users u ON u.id = cs.user_id
      WHERE u.auth_id = auth.uid()
    )
  );

-- 5. Update tasks policy to include co-supervisors
DROP POLICY IF EXISTS "Users can view relevant tasks" ON tasks;
CREATE POLICY "Users can view relevant tasks"
  ON tasks FOR SELECT
  USING (
    created_by IN (SELECT id FROM users WHERE auth_id = auth.uid())
    OR professor_id IN (
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

-- 6. Update task_assignments policy
DROP POLICY IF EXISTS "Users can view relevant task assignments" ON task_assignments;
CREATE POLICY "Users can view relevant task assignments"
  ON task_assignments FOR SELECT
  USING (
    scholar_id IN (
      SELECT s.id FROM scholars s
      JOIN users u ON u.id = s.user_id
      WHERE u.auth_id = auth.uid()
    )
    OR task_id IN (
      SELECT t.id FROM tasks t
      WHERE t.created_by IN (SELECT id FROM users WHERE auth_id = auth.uid())
    )
    OR task_id IN (
      SELECT t.id FROM tasks t
      WHERE t.professor_id IN (
        SELECT p.id FROM professors p
        JOIN users u ON u.id = p.user_id
        WHERE u.auth_id = auth.uid()
      )
    )
  );

-- 7. Update meetings policy to include co-supervisors
DROP POLICY IF EXISTS "Users can view relevant meetings" ON meetings;
CREATE POLICY "Users can view relevant meetings"
  ON meetings FOR SELECT
  USING (
    professor_id IN (
      SELECT p.id FROM professors p
      JOIN users u ON u.id = p.user_id
      WHERE u.auth_id = auth.uid()
    )
    OR id IN (
      SELECT mp.meeting_id FROM meeting_participants mp
      JOIN users u ON u.id = mp.user_id
      WHERE u.auth_id = auth.uid()
    )
    OR professor_id IN (
      SELECT cs.professor_id FROM co_supervisors cs
      JOIN users u ON u.id = cs.user_id
      WHERE u.auth_id = auth.uid()
    )
  );

-- 8. Add missing meeting_participants SELECT policy
DROP POLICY IF EXISTS "Authenticated users can view meeting_participants" ON meeting_participants;
CREATE POLICY "Authenticated users can view meeting_participants"
  ON meeting_participants FOR SELECT
  TO authenticated
  USING (true);

-- 9. Add missing action_items SELECT policy
DROP POLICY IF EXISTS "Authenticated users can view action_items" ON action_items;
CREATE POLICY "Authenticated users can view action_items"
  ON action_items FOR SELECT
  TO authenticated
  USING (true);
