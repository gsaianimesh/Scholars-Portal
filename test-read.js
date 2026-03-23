const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envPath = '.env.local';
let url, key;
const content = fs.readFileSync(envPath, 'utf8');
url = content.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
key = content.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)[1].trim();
const supabase = createClient(url, key);

async function test() {
  const { data: users } = await supabase.from('users').select('id').limit(2);
  const u1 = users[0].id;
  const u2 = users[1].id;

  const { data: unreadMe } = await supabase
    .from('activity_logs')
    .select('id')
    .eq('activity_type', 'direct_message')
    .eq('user_id', u1)
    .eq('metadata->>receiver_id', u2)
    .eq('metadata->>read', 'false');

  console.log("Unread:", unreadMe);
}
test();
