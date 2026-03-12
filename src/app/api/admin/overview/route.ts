import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";

async function isAdmin(supabase: ReturnType<typeof createServerSupabaseClient>) {
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return false;
  const serviceClient = createServiceRoleClient();
  const { data } = await serviceClient
    .from("users")
    .select("is_admin")
    .eq("auth_id", authUser.id)
    .maybeSingle();
  return data?.is_admin === true;
}

// GET /api/admin/overview — summary stats
export async function GET(request: NextRequest) {
  const supabase = createServerSupabaseClient();
  if (!(await isAdmin(supabase))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const serviceClient = createServiceRoleClient();

  const [
    { count: totalUsers },
    { count: totalProfessors },
    { count: totalScholars },
    { count: totalMeetings },
    { count: totalTasks },
    { count: totalActivities },
  ] = await Promise.all([
    serviceClient.from("users").select("*", { count: "exact", head: true }),
    serviceClient.from("professors").select("*", { count: "exact", head: true }),
    serviceClient.from("scholars").select("*", { count: "exact", head: true }),
    serviceClient.from("meetings").select("*", { count: "exact", head: true }),
    serviceClient.from("tasks").select("*", { count: "exact", head: true }),
    serviceClient.from("activity_logs").select("*", { count: "exact", head: true }),
  ]);

  // Recent activity (last 20)
  const { data: recentActivity } = await serviceClient
    .from("activity_logs")
    .select("*, user:users(name, email, role)")
    .order("created_at", { ascending: false })
    .limit(20);

  // Users by role
  const { data: allUsers } = await serviceClient
    .from("users")
    .select("role")
    .order("role");

  const roleCounts: Record<string, number> = {};
  allUsers?.forEach((u: { role: string }) => {
    roleCounts[u.role] = (roleCounts[u.role] || 0) + 1;
  });

  return NextResponse.json({
    stats: {
      totalUsers: totalUsers || 0,
      totalProfessors: totalProfessors || 0,
      totalScholars: totalScholars || 0,
      totalMeetings: totalMeetings || 0,
      totalTasks: totalTasks || 0,
      totalActivities: totalActivities || 0,
    },
    roleCounts,
    recentActivity: recentActivity || [],
  });
}
