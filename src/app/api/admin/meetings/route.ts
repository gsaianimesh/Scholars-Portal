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

// GET /api/admin/meetings — all meetings with full details
export async function GET(request: NextRequest) {
  const supabase = createServerSupabaseClient();
  if (!(await isAdmin(supabase))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const serviceClient = createServiceRoleClient();

  const { data: meetings } = await serviceClient
    .from("meetings")
    .select(`
      *,
      professor:professors(*, user:users(name, email)),
      participants:meeting_participants(*, user:users(name, email, role)),
      action_items:action_items(*, assigned_user:users(name, email))
    `)
    .order("meeting_date", { ascending: false });

  return NextResponse.json({ meetings: meetings || [] });
}
