import { readFileSync } from 'fs';
const envFile = readFileSync('.env.local', 'utf-8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...rest] = line.split('=');
  if (key && rest.length) env[key.trim()] = rest.join('=').trim().replace(/['"]/g, '');
});

import { createClient } from '@supabase/supabase-js';
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const {data} = await supabase.from('task_assignments').select('*').not('submitted_at', 'is', null);
console.log('Submissions:', data);
