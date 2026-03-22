const fs = require('fs');

let file = "src/app/dashboard/activity/page.tsx";
let content = fs.readFileSync(file, 'utf8');

let newLoadActivity = `
  async function loadActivity() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    // Get the current user profile from users table
    const { data: currentUser } = await supabase
      .from('users')
      .select('id, role, is_admin')
      .eq('auth_id', user.id)
      .single();

    if (!currentUser) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("activity_logs")
      .select("*, user:users(*)")
      .eq('user_id', currentUser.id)
      .order("created_at", { ascending: false })
      .limit(50);

    setLogs(data || []);
    setLoading(false);
  }
`;

content = content.replace(/async function loadActivity\(\) \{[\s\S]*?setLoading\(false\);\n  \}/, newLoadActivity.trim());
fs.writeFileSync(file, content);


file = "src/components/dashboard/professor-dashboard.tsx";
content = fs.readFileSync(file, 'utf8');
content = content.replace(/\.in\("user_id", relevantUserIds\)/g, '.eq("user_id", userId)');
fs.writeFileSync(file, content);


file = "src/components/dashboard/co-supervisor-dashboard.tsx";
content = fs.readFileSync(file, 'utf8');
content = content.replace(/\.in\("user_id", relevantUserIds\)/g, '.eq("user_id", userId)');
fs.writeFileSync(file, content);

