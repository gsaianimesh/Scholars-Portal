-- ============================================
-- VERIFY PROFESSORS TABLE
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Check user_id definition
SELECT column_name, data_type, is_nullable, column_default, is_generated
FROM information_schema.columns
WHERE table_name = 'professors' AND column_name = 'user_id';

-- 2. Check for triggers
SELECT trigger_name, event_manipulation, event_object_table, action_statement
FROM information_schema.triggers
WHERE event_object_table = 'professors';

-- 3. Check for policies
SELECT polname, polpermissive, polroles, polcmd, qual
FROM pg_policy
WHERE polrelid = 'professors'::regclass;

-- 4. Check for constraints
SELECT conname, contype, conrelid::regclass, confrelid::regclass
FROM pg_constraint
WHERE conrelid = 'professors'::regclass;
