const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const envPath = '.env.local';
const content = fs.readFileSync(envPath, 'utf8');
const url = content.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
const key = content.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1].trim();
const supabase = createClient(url, key);

async function run() {
  const { data, error } = await supabase.rpc('execute_sql', {
    sql_query: `
      DROP POLICY IF EXISTS "Users can update direct message activity logs" ON activity_logs;
      CREATE POLICY "Users can update direct message activity logs"
        ON activity_logs FOR UPDATE
        TO authenticated
        USING ( activity_type = 'direct_message' AND metadata->>'receiver_id' = (SELECT id::text FROM users WHERE auth_id = auth.uid()) );
    `
  });
  if (error) {
     console.log("No execute_sql RPC, querying via a custom query...", error);
  }
}
run();
