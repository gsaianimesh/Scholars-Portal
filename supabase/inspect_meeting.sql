-- Inspect a specific meeting and its owner
SELECT
  m.id,
  m.meeting_title,
  m.professor_id,
  p.user_id as professor_user_id,
  u.email as professor_email,
  m.created_at
FROM meetings m
JOIN professors p ON m.professor_id = p.id
JOIN users u ON p.user_id = u.id
WHERE m.id = '4de88002-86ee-47da-9705-0210e75ec788';
