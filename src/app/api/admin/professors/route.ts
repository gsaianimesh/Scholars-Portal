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

// GET /api/admin/professors — all professors with their scholars, tasks, meetings
export async function GET(request: NextRequest) {
  const supabase = createServerSupabaseClient();
  if (!(await isAdmin(supabase))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const serviceClient = createServiceRoleClient();

  const { data: professors } = await serviceClient
    .from("professors")
    .select(`
      *,
      user:users(*),
      scholars:scholars(*, user:users(*)),
      meetings:meetings(
        *,
        participants:meeting_participants(*, user:users(name, email))
      ),
      tasks:tasks(
        *,
        assignments:task_assignments(*, scholar:scholars(*, user:users(name, email)))
      )
    `)
    .order("created_at", { referencedTable: "meetings", ascending: false });

  return NextResponse.json({ professors: professors || [] });
}
