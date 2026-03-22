const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const PROFESSOR_AUTH_ID = 'a917ceb5-c3ad-43c3-beab-f70774225b24';

async function seedData() {
  console.log('Seeding fake data for professor auth ID:', PROFESSOR_AUTH_ID);

  // 1. Get Professor App User & Professor Profile
  const { data: profUser } = await supabase
    .from('users')
    .select('*')
    .eq('auth_id', PROFESSOR_AUTH_ID)
    .single();

  if (!profUser) {
    console.error('No professor user found mapping to that UUID. Please ensure the UUID provided is correct auth_id or id.');
    const { data: maybeRealUUID } = await supabase.from('users').select('*').eq('id', PROFESSOR_AUTH_ID).single();
    if(maybeRealUUID) {
       console.log('Ah, the provided UUID is the user.id, not the auth_id.');
    } else {
       return;
    }
  }

  const profIdToUse = profUser?.id || PROFESSOR_AUTH_ID;
  
  const { data: profProfile } = await supabase
    .from('professors')
    .select('id')
    .eq('user_id', profIdToUse)
    .single();

  if (!profProfile) {
    console.error('No professors profile found for user:', profIdToUse);
    return;
  }

  const pid = profProfile.id;
  console.log('Found professor profile ID:', pid);

  // 2. Create Sample Scholars (Auth + User + Scholar)
  const fakeScholars = [
    { name: 'Sarah Chen', email: 'sarah.c@university.edu', topic: 'Machine Learning in Genomics' },
    { name: 'Michael Rodriguez', email: 'm.rodriguez@university.edu', topic: 'Distributed Consensus Algorithms' },
    { name: 'Dr. Elena Rostova', email: 'elena.r@university.edu', topic: 'Quantum Cryptography Protocol' }
  ];

  const scholarIds = [];
  
  for (const s of fakeScholars) {
    // Generate an auth ID
    const fakeAuthId = crypto.randomUUID();
    
    // Insert into auth.users is hard without raw SQL or admin api, for sample let's just create 'users' table entries
    // Usually auth is handled by supabase, but we can just mock the public.users for the portal's relational integrity constraint!
    
    const { data: newUser, error: uErr } = await supabase
      .from('users')
      .insert({ auth_id: fakeAuthId, name: s.name, email: s.email, role: 'scholar' })
      .select().single();
      
    if (uErr) { console.error('user insert err', uErr); continue; }

    const { data: newSchol, error: sErr } = await supabase
      .from('scholars')
      .insert({ user_id: newUser.id, professor_id: pid })
      .select().single();
      
    if (sErr) { console.error('scholar insert err', sErr); continue; }
    
    scholarIds.push(newSchol.id);
    console.log(`Created scholar: ${s.name} (${newSchol.id})`);
  }

  if (scholarIds.length === 0) return console.log('Failed to create scholars');

  // 3. Create Announcements
  await supabase.from('announcements').insert([
    { professor_id: pid, content: "Don't forget the upcoming lab seminar next Thursday! Attendance is expected unless you are traveling.", priority: 'high' },
    { professor_id: pid, content: "The grant proposal deadline has been extended by two weeks. Update your timeline accordingly.", priority: 'medium' },
    { professor_id: pid, content: "New computing cluster resources are available starting Monday. Reach out to the admin if you need access keys.", priority: 'low' }
  ]);
  console.log('Added announcements');

  // 4. Create Meetings (Past & Upcoming)
  const now = new Date();
  const pastMeetingDate = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000); // 2 days ago
  const upcomingMeetingDate = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000); // Tomorrow
  
  const { data: m1 } = await supabase.from('meetings').insert({
    professor_id: pid,
    meeting_title: 'Weekly 1-on-1: Sarah (Algorithm Review)',
    meeting_date: pastMeetingDate.toISOString(),
    duration_minutes: 45,
    summary: 'Sarah presented the initial results of the genetic algorithm mapping. It performed well on the test dataset but degraded on the control. We need to normalize the inputs.',
    agenda: '1. Review test results\n2. Discuss normalization strategies\n3. Next steps for paper'
  }).select().single();

  const { data: m2 } = await supabase.from('meetings').insert({
    professor_id: pid,
    meeting_title: 'Lab Group Sync',
    meeting_date: upcomingMeetingDate.toISOString(),
    duration_minutes: 60,
    agenda: '1. Cluster allocation\n2. Sarahs update\n3. Michaels proposal draft review\n4. Open Q&A',
    meeting_link: 'https://zoom.us/j/123456789'
  }).select().single();

  console.log('Added meetings');

  // Add participants
  await supabase.from('meeting_participants').insert([
    { meeting_id: m1.id, user_id: profIdToUse },
    { meeting_id: m1.id, user_id: (await supabase.from('scholars').select('user_id').eq('id', scholarIds[0]).single()).data.user_id },
    // Group sync
    { meeting_id: m2.id, user_id: profIdToUse },
    { meeting_id: m2.id, user_id: (await supabase.from('scholars').select('user_id').eq('id', scholarIds[0]).single()).data.user_id },
    { meeting_id: m2.id, user_id: (await supabase.from('scholars').select('user_id').eq('id', scholarIds[1]).single()).data.user_id }
  ]);

  // 5. Create Tasks
  const { data: t1 } = await supabase.from('tasks').insert({
    professor_id: pid,
    title: 'Normalize genomic input arrays',
    description: 'Use the new standard deviation method discussed in the previous meeting to clean the input sets before running the training model.',
    deadline: upcomingMeetingDate.toISOString(),
    meeting_id: m1.id
  }).select().single();

  const { data: t2 } = await supabase.from('tasks').insert({
    professor_id: pid,
    title: 'Draft Abstract for Distributed Consensus',
    description: 'Write the first abstract draft for the IEEE submission. Keep it under 500 words.',
    deadline: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString() // Yesterday
  }).select().single();

  const { data: t3 } = await supabase.from('tasks').insert({
    professor_id: pid,
    title: 'Literature Review: Quantum Protocols',
    description: 'Gather at least 15 recent papers (2022-2024) regarding hybrid quantum cryptography.',
    deadline: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString() // 2 weeks
  }).select().single();

  console.log('Added tasks');

  // 6. Assign Tasks and Submissions
  await supabase.from('task_assignments').insert({
    task_id: t1.id,
    scholar_id: scholarIds[0],
    status: 'in_progress'
  });

  await supabase.from('task_assignments').insert({
    task_id: t2.id,
    scholar_id: scholarIds[1],
    status: 'completed',
    submitted_at: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(),
    submission_text: "I have uploaded the draft to our shared Overleaf directory. The word count is currently exactly 480 words. Let me know what you think of the framing in the second paragraph.",
    submission_files: []
  });

  await supabase.from('task_assignments').insert({
    task_id: t3.id,
    scholar_id: scholarIds[2],
    status: 'not_started'
  });

  console.log('Assigned tasks and generated mock submissions');
  console.log('Done!');
}

seedData().catch(console.error);
