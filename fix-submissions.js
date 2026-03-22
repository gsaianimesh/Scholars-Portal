const fs = require('fs');
let content = fs.readFileSync('src/app/dashboard/submissions/page.tsx', 'utf8');

// The block to replace:
/*
    } else {
      let professorId: string | null = null;
      const { data: prof } = await supabase
        .from("professors")
        .select("id")
        .eq("user_id", appUser.id)
        .maybeSingle();
      professorId = prof?.id || null;

      if (!professorId) {
        const { data: coSup } = await supabase
          .from("co_supervisors")
          .select("professor_id")
          .eq("user_id", appUser.id)
          .maybeSingle();
        professorId = coSup?.professor_id || null;
      }

      if (professorId) {
        const { data } = await supabase
          .from("task_assignments")
          .select("*, task:tasks(*), scholar:scholars(*, user:users(*))")
          .not("submitted_at", "is", null)
          .order("submitted_at", { ascending: false });
        setSubmissions(data || []);
      }
    }
*/

const newBlock = `    } else if (appUser.is_admin) {
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

// Do string manipulation to replace it.
const regex = /    \} else \{\n      let professorId: string \| null = null;[\s\S]*?      \}\n    \}/m;

if (regex.test(content)) {
  const final = content.replace(regex, newBlock);
  fs.writeFileSync('src/app/dashboard/submissions/page.tsx', final);
  console.log("Submissions page updated.");
} else {
  console.log("Could not find block to replace");
}
