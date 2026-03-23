const { Client } = require('pg');
const fs = require('fs');

const envPath = '.env.local';
let connectionString;
const content = fs.readFileSync(envPath, 'utf8');
const match = content.match(/DATABASE_URL=(.*)/);

async function run() {
  if (!match) {
    console.log("No DATABASE_URL in .env.local");
    return;
  }
  
  connectionString = match[1].trim();
  
  const client = new Client({
    connectionString,
  });

  await client.connect();
  
  const res = await client.query(`
    DROP POLICY IF EXISTS "Users can update direct message activity logs" ON activity_logs;
    CREATE POLICY "Users can update direct message activity logs"
      ON activity_logs FOR UPDATE
      USING ( activity_type = 'direct_message' AND metadata->>'receiver_id' = (SELECT id::text FROM users WHERE auth_id = auth.uid()) );
  `);
  
  console.log("Policy added!", res);
  await client.end();
}
run();
