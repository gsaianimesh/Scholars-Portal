const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://nlzeocbjyskxfzfienln.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5semVvY2JqeXNreGZ6ZmllbmxuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzEzNjcxMSwiZXhwIjoyMDg4NzEyNzExfQ.yWW_G4JtO1pUoeas9z7KDqVfsn2q4VaSytrjWoFNNGM');

async function check() {
  const { data: users } = await supabase.from('users').select('*');
  console.log("Users:", users.map(u => ({ id: u.id, name: u.name, role: u.role, is_admin: u.is_admin })));
  
  const { data: profs } = await supabase.from('professors').select('*');
  console.log("Profs:", profs);

  const { data: coSups } = await supabase.from('co_supervisors').select('*');
  console.log("CoSups:", coSups);

  const { data: scholars } = await supabase.from('scholars').select('*');
  console.log("Scholars:", scholars);

  const { data: tasks } = await supabase.from('task_assignments').select('*, scholar_id').not('submitted_at', 'is', null);
  console.log("Reviewed/Submitted Assignments:", tasks.map(t => ({ id: t.id, scholar_id: t.scholar_id, status: t.submission_status })));
}

check();
