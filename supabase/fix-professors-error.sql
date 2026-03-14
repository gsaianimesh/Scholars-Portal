-- ============================================
-- FIX PROFESSORS ERROR 500 (42P17)
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Reload PostgREST Schema Cache (Critical for Error 42P17)
NOTIFY pgrst, 'reload schema';

-- 2. Clean up any invalid/null user_id data which causes 500 errors
DELETE FROM professors 
WHERE user_id IS NULL 
   OR user_id::text !~ '^[0-9a-fA-F-]{8}-[0-9a-fA-F-]{4}-[0-9a-fA-F-]{4}-[0-9a-fA-F-]{4}-[0-9a-fA-F-]{12}$';

-- 3. Recreate index on user_id to fix corruption
DROP INDEX IF EXISTS idx_professors_user_id;
CREATE INDEX idx_professors_user_id ON professors(user_id);

-- 4. Ensure permissive RLS policy exists and is unique
DROP POLICY IF EXISTS "Authenticated users can view professors" ON professors;
DROP POLICY IF EXISTS "admins_read_all_professors" ON professors;
CREATE POLICY "Authenticated users can view professors"
  ON professors FOR SELECT
  TO authenticated
  USING (true);

-- 5. Grant explicit permissions
GRANT SELECT ON professors TO authenticated;
GRANT SELECT ON users TO authenticated;

-- 6. Verify column definition (optional, check output)
SELECT column_name, data_type, is_generated
FROM information_schema.columns
WHERE table_name = 'professors' AND column_name = 'user_id';
