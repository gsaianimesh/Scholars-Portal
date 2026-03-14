-- ============================================
-- FIX MISSING RLS POLICIES FOR SCHOLAR DASHBOARD
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Meeting Participants (Critical for Scholar Dashboard)
ALTER TABLE meeting_participants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Read Meeting Participants" ON meeting_participants;
CREATE POLICY "Read Meeting Participants" 
  ON meeting_participants FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Insert Meeting Participants" 
  ON meeting_participants FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

-- 2. Co-Supervisors (Just in case)
ALTER TABLE co_supervisors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Read Co-Supervisors" ON co_supervisors;
CREATE POLICY "Read Co-Supervisors" 
  ON co_supervisors FOR SELECT 
  TO authenticated 
  USING (true);

-- 3. Action Items (Needed for meeting details)
ALTER TABLE action_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Read Action Items" ON action_items;
CREATE POLICY "Read Action Items" 
  ON action_items FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Manage Action Items" 
  ON action_items FOR ALL 
  TO authenticated 
  USING (true);

-- 4. Reload Schema Cache to be safe
NOTIFY pgrst, 'reload schema';
