-- List all meetings with their professor IDs and emails
SELECT 
    m.id as meeting_id, 
    m.meeting_title, 
    m.professor_id as meeting_owner_id, 
    p.id as professor_table_id,
    u.email as professor_email,
    u.id as user_id
FROM meetings m
LEFT JOIN professors p ON m.professor_id = p.id
LEFT JOIN users u ON p.user_id = u.id;
