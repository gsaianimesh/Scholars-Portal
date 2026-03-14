-- DEBUG ALL MEETINGS FOR THIS PROFESSOR
-- Check if this professor (9ca62705-0d25-41aa-acc3-adf200b04a08) owns ANY meetings
SELECT id, meeting_title, professor_id 
FROM meetings 
WHERE professor_id = '9ca62705-0d25-41aa-acc3-adf200b04a08';

-- CHECK THESE SPECIFIC MEETING IDs
SELECT id, professor_id 
FROM meetings 
WHERE id IN ('4de88002-a765-470e-b924-1066e78e0c9e', '77e91d8c-4c29-4335-a7ae-63b4227a0e70');
