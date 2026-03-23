const fs = require('fs');
let code = fs.readFileSync('src/components/dashboard/scholar-dashboard.tsx', 'utf-8');

// The original code uses .limit(5) inside the Promise.all for submissionsRes, which is breaking the "Total submissions" counter
// We need to fetch ALL submissions for the total counter, but only show 5 in "Recent Submissions"
code = code.replace(
  /supabase\s*\n\s*\.from\("task_assignments"\)\s*\n\s*\.select\("\*, task:tasks\(\*\)"\)\s*\n\s*\.eq\("scholar_id", scholar\.id\)\s*\n\s*\.not\("submitted_at", "is", null\)\s*\n\s*\.order\("submitted_at", { ascending: false }\)\s*\n\s*\.limit\(5\),/,
  `supabase
        .from("task_assignments")
        .select("*, task:tasks(*)")
        .eq("scholar_id", scholar.id)
        .not("submitted_at", "is", null)
        .order("submitted_at", { ascending: false }),`
);

code = code.replace(
  /\{submissions\.map\(\(sub: any\) => \(/,
  `{submissions.slice(0, 5).map((sub: any) => (`
);

fs.writeFileSync('src/components/dashboard/scholar-dashboard.tsx', code);
