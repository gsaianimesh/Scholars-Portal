const fs = require('fs');

function updateDashboardActivity() {
  const file = "src/app/dashboard/activity/page.tsx";
  let content = fs.readFileSync(file, 'utf8');

  // We need to fetch the session and the user first.
  const newLoadActivity = `
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

    let userIds = [currentUser.id];

    if (currentUser.is_admin) {
      // Admins see everything, no filter on userIds needed, but we can just leave it as is or fetch all
      const { data } = await supabase
        .from("activity_logs")
        .select("*, user:users(*)")
        .order("created_at", { ascending: false })
        .limit(50);
      setLogs(data || []);
      setLoading(false);
      return;
    }

    if (currentUser.role === 'professor') {
      const { data: profBase } = await supabase.from('professors').select('id').eq('user_id', currentUser.id).single();
      if (profBase) {
        const { data: scholars } = await supabase.from('scholars').select('user_id').eq('professor_id', profBase.id);
        if (scholars) {
          userIds = [...userIds, ...scholars.map(s => s.user_id).filter(id => id !== null)];
        }
      }
    } else if (currentUser.role === 'co_supervisor') {
      const { data: coSupBase } = await supabase.from('co_supervisors').select('id').eq('user_id', currentUser.id).single();
      if (coSupBase) {
        const { data: scholars } = await supabase.from('scholars').select('user_id').eq('co_supervisor_id', coSupBase.id);
        if (scholars) {
          userIds = [...userIds, ...scholars.map(s => s.user_id).filter(id => id !== null)];
        }
      }
    } else if (currentUser.role === 'scholar') {
      // Just their own logs
    }

    const { data } = await supabase
      .from("activity_logs")
      .select("*, user:users(*)")
      .in('user_id', userIds)
      .order("created_at", { ascending: false })
      .limit(50);

    setLogs(data || []);
    setLoading(false);
  }
`;

  content = content.replace(/async function loadActivity\(\) \{[\s\S]*?setLoading\(false\);\n  \}/, newLoadActivity.trim());
  fs.writeFileSync(file, content);
}

updateDashboardActivity();
