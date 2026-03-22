const fs = require('fs');
const content = fs.readFileSync('src/app/dashboard/submissions/page.tsx', 'utf8');

const target = `    } else if (appUser.is_admin) {
      // Admins see all submissions
      const { data } = await supabase
        .from("task_assignments")
        .select("*, task:tasks(*), scholar:scholars(*, user:users(*))")
        .not("submitted_at", "is", null)
        .order("submitted_at", { ascending: false });
      setSubmissions(data || []);
    } else {
      let validScholarIds: string[] = [];
      
      if (appUser.role === 'professor') {
        const { data: prof } = await supabase.from('professors').select('id').eq('user_id', appUser.id).single();
        if (prof) {
          const { data: scholars } = await supabase.from('scholars').select('id').eq('professor_id', prof.id);
          if (scholars) validScholarIds = scholars.map(s => s.id);
        }
      } else if (appUser.role === 'co_supervisor') {
        const { data: coSup } = await supabase.from('co_supervisors').select('id').eq('user_id', appUser.id).single();
        if (coSup) {
          const { data: scholars } = await supabase.from('scholars').select('id').eq('co_supervisor_id', coSup.id);
          if (scholars) validScholarIds = scholars.map(s => s.id);
        }
      }

      if (validScholarIds.length > 0) {
        const { data } = await supabase
          .from("task_assignments")
          .select("*, task:tasks(*), scholar:scholars(*, user:users(*))")
          .in('scholar_id', validScholarIds)
          .not("submitted_at", "is", null)
          .order("submitted_at", { ascending: false });
        setSubmissions(data || []);
      } else {
        setSubmissions([]); // No scholars under them, so no submissions to see
      }
    }`;

const replacement = `    } else if (appUser.role === "professor" || appUser.role === "co_supervisor") {
      let validScholarIds: string[] = [];
      
      if (appUser.role === 'professor') {
        const { data: prof } = await supabase.from('professors').select('id').eq('user_id', appUser.id).single();
        if (prof) {
          const { data: scholars } = await supabase.from('scholars').select('id').eq('professor_id', prof.id);
          if (scholars) validScholarIds = scholars.map(s => s.id);
        }
      } else if (appUser.role === 'co_supervisor') {
        const { data: coSup } = await supabase.from('co_supervisors').select('id').eq('user_id', appUser.id).single();
        if (coSup) {
          const { data: scholars } = await supabase.from('scholars').select('id').eq('co_supervisor_id', coSup.id);
          if (scholars) validScholarIds = scholars.map(s => s.id);
        }
      }

      if (validScholarIds.length > 0) {
        const { data } = await supabase
          .from("task_assignments")
          .select("*, task:tasks(*), scholar:scholars(*, user:users(*))")
          .in('scholar_id', validScholarIds)
          .not("submitted_at", "is", null)
          .order("submitted_at", { ascending: false });
        setSubmissions(data || []);
      } else {
        setSubmissions([]); // No scholars under them, so no submissions to see
      }
    } else if (appUser.is_admin) {
      // Admins see all submissions
      const { data } = await supabase
        .from("task_assignments")
        .select("*, task:tasks(*), scholar:scholars(*, user:users(*))")
        .not("submitted_at", "is", null)
        .order("submitted_at", { ascending: false });
      setSubmissions(data || []);
    }`;

const newContent = content.replace(target, replacement);

if (newContent !== content) {
    fs.writeFileSync('src/app/dashboard/submissions/page.tsx', newContent);
    console.log("Replaced successfully!");
} else {
    console.log("String replace failed! Please check exact source strings");
}
