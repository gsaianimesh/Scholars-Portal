-- ============================================
-- RELOAD SCHEMA CACHE
-- Run this in Supabase SQL Editor
-- ============================================

-- This forces PostgREST to refresh its schema cache
-- which fixes error 42P17 (invalid object definition)
NOTIFY pgrst, 'reload schema';

-- Also ensure permissions are granted
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
