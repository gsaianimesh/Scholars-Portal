const fs = require('fs');
const file = "src/components/dashboard/co-supervisor-dashboard.tsx";
let content = fs.readFileSync(file, 'utf8');

let newContent = content.replace(/const \[scholarsRes, tasksRes, meetingsRes, activityRes\] = await Promise\.all\(\[[\s\S]*?    \]\);/, `    // Fetch scholars first to filter activity
    const scholarsRes = await supabase
      .from("scholars")
      .select("*, user:users(*)")
      .eq("professor_id", coSup.professor_id)
      .eq("status", "active");

    const profRes = await supabase
      .from("professors")
      .select("user_id")
      .eq("id", coSup.professor_id)
      .maybeSingle();

    const scholarUserIds = (scholarsRes.data || []).map((s: any) => s.user_id).filter(Boolean);
    const relevantUserIds = [userId, ...scholarUserIds];
    if (profRes.data?.user_id) {
      relevantUserIds.push(profRes.data.user_id);
    }

    const [tasksRes, meetingsRes, activityRes] = await Promise.all([
      supabase
        .from("tasks")
        .select("*")
        .eq("professor_id", coSup.professor_id)
        .in("status", ["not_started", "in_progress"])
        .limit(10),
      supabase
        .from("meetings")
        .select("*")
        .eq("professor_id", coSup.professor_id)
        .gte("meeting_date", new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString())
        .order("meeting_date", { ascending: true })
        .limit(10),
      supabase
        .from("activity_logs")
        .select("*, user:users(*)")
        .in("user_id", relevantUserIds)
        .order("created_at", { ascending: false })
        .limit(10),
    ]);`);

fs.writeFileSync(file, newContent);
