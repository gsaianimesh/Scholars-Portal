const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const envPath = '.env.local';
const content = fs.readFileSync(envPath, 'utf8');
const url = content.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
const key = content.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1].trim();
const supabase = createClient(url, key);

async function test() {
  const { data } = await supabase.rpc('get_policies');
  if(!data) {
    const { data: q } = await supabase.from('pg_policies').select('*').eq('tablename', 'activity_logs');
    console.log(q);
  }
}
test();
