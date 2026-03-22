const fs = require('fs');
const file = "src/components/dashboard/professor-dashboard.tsx";
let content = fs.readFileSync(file, 'utf8');

// Replace the Promise.all fetch to pull activityRes out
// Originally it has:
// const [scholarsRes, tasksRes, assignmentsRes, meetingsRes, activityRes] = await Promise.all([
// ... scholars query
// ... tasks query
// ... assignments query
// ... meetings query
// ... activity logs query
// ]);

let newContent = content.replace(/const \[scholarsRes, tasksRes, assignmentsRes, meetingsRes, activityRes\] =[\s\S]*?\]\);/g, `
    // Fetch scholars first so we can filter activity logs
    const scholarsRes = await supabase
      .from("scholars")
      .select("*, user:users(*)")
      .eq("professor_id", prof.id);

    const scholarUserIds = (scholarsRes.data || []).map((s: any) => s.user_id).filter(Boolean);
    const relevantUserIds = [userId, ...scholarUserIds];

    const [tasksRes, assignmentsRes, meetingsRes, activityRes] =
      await Promise.all([
        supabase
          .from("tasks")
          .select("*")
          .eq("professor_id", prof.id),
        supabase
          .from("task_assignments")
          .select("*, task:tasks(*), scholar:scholars(*, user:users(*))")
          .eq("task.professor_id", prof.id)
          .or("submission_status.eq.pending,and(submitted_at.not.is.null,submission_status.is.null)"),
        supabase
          .from("meetings")
          .select("*")
          .eq("professor_id", prof.id)
          .gte("meeting_date", new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString())
          .order("meeting_date", { ascending: true })
          .limit(5),
        supabase
          .from("activity_logs")
          .select("*, user:users(*)")
          .in("user_id", relevantUserIds)
          .order("created_at", { ascending: false })
          .limit(10),
      ]);
`);

fs.writeFileSync(file, newContent);
