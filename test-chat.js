const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envPath = '.env.local';
let url, key;
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  const matchUrl = content.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
  const matchKey = content.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/);
  if (matchUrl && matchKey) {
    url = matchUrl[1].trim();
    key = matchKey[1].trim();
  }
}

if (!url || !key) {
  console.log("Could not find variables");
  process.exit(1);
}

const supabase = createClient(url, key);

async function test() {
  const { data, error } = await supabase
    .from('activity_logs')
    .select('id, metadata')
    .eq('activity_type', 'direct_message')
    .eq('metadata->>read', 'false');
    
  console.log("Query 'false':", data ? data.length : error);
  
  const { data: data2 } = await supabase
    .from('activity_logs')
    .select('id, metadata')
    .eq('activity_type', 'direct_message');
    
  console.log("All msg logs:", data2 ? data2.length : 'err', data2 ? data2.slice(0, 3) : '');
}
test();
