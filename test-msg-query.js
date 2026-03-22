const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testMsg() {
   const {data: user1} = await supabase.from('users').select('id').limit(1).single();
   const {data: user2} = await supabase.from('users').select('id').order('id', {ascending: false}).limit(1).single();
   
   console.log("u1", user1.id, "u2", user2.id);

   const res = await supabase.from('activity_logs').insert({
       user_id: user1.id,
       activity_type: 'direct_message',
       description: 'Hello this is a test chat message!',
       metadata: { receiver_id: user2.id }
   }).select();
   console.log("Insert result", res);
   
   const fetchRes = await supabase.from('activity_logs')
        .select('*')
        .eq('activity_type', 'direct_message')
        .contains('metadata', {receiver_id: user2.id});
   console.log("Fetch result", fetchRes.data);
}
testMsg();
