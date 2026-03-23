-- Allow authenticated users to update their own direct messages to 'read'
DROP POLICY IF EXISTS "Update User Direct Messages" ON activity_logs;

CREATE POLICY "Update User Direct Messages" ON activity_logs 
  FOR UPDATE 
  TO authenticated 
  USING (
    activity_type = 'direct_message' AND 
    metadata->>'receiver_id' IN (SELECT id::text FROM users WHERE auth_id = auth.uid())
  )
  WITH CHECK (
    activity_type = 'direct_message' AND 
    metadata->>'receiver_id' IN (SELECT id::text FROM users WHERE auth_id = auth.uid())
  );
