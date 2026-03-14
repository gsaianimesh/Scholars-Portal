
-- INSPECT MEETING DEBUG
-- Run this in Supabase SQL Editor to debug the 404 error

-- 1. Check if the meeting exists
SELECT id, meeting_title, professor_id, meeting_date 
FROM meetings 
WHERE id = '4de88002-a765-470e-b924-1066e78e0c9e';

-- 2. Check the professor associated with the logged-in user
-- Replace 'LOGGED_IN_USER_AUTH_ID' with the auth.uid() if you know it, 
-- or just list all professors to see matches
SELECT p.id, p.user_id, u.email, u.auth_id
FROM professors p
JOIN users u ON u.id = p.user_id;
