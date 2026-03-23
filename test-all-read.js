const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envPath = '.env.local';
let url, key;
const content = fs.readFileSync(envPath, 'utf8');
url = content.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
key = content.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)[1].trim();
const supabase = createClient(url, key);

async function test() {
  const { data: all } = await supabase.from('activity_logs').select('metadata').eq('activity_type', 'direct_message');
  console.log("All msg metadata:", all);
}
test();
