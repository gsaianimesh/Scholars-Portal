-- Check for orphaned meetings (professor_id not in professors table)
SELECT 
    m.id as meeting_id, 
    m.meeting_title, 
    m.professor_id
FROM meetings m
LEFT JOIN professors p ON m.professor_id = p.id
WHERE p.id IS NULL;
