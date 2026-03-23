const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envPath = '.env.local';
let url, key;
const content = fs.readFileSync(envPath, 'utf8');
url = content.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
key = content.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)[1].trim();
const supabase = createClient(url, key);

async function test() {
  const { data: users } = await supabase.from('users').select('id, full_name').limit(2);
  const u1 = users[0].id;
  const u2 = users[1].id;
  console.log("Users:", users.map(u => u.full_name));

  const { data: insertData, error: insertError } = await supabase.from('activity_logs').insert({
    user_id: u1,
    activity_type: 'direct_message',
    description: 'Hello world!',
    metadata: { receiver_id: u2, read: false }
  }).select();
  
  if (insertError) console.error("Insert error", insertError);
  console.log("Inserted:", insertData);
  
  const ids = insertData.map(d => d.id);
  const { data: updateData, error: updateError } = await supabase.from('activity_logs')
    .update({ metadata: { receiver_id: u2, read: true } })
    .in('id', ids).select();
    
  if (updateError) console.error("Update error", updateError);
  console.log("Updated metadata:", updateData[0].metadata);
}
test();
