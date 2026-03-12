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

// GET /api/admin/activity — all activity logs with user info
export async function GET(request: NextRequest) {
  const supabase = createServerSupabaseClient();
  if (!(await isAdmin(supabase))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const serviceClient = createServiceRoleClient();

  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "100"), 500);
  const offset = parseInt(url.searchParams.get("offset") || "0");
  const type = url.searchParams.get("type") || null;

  let query = serviceClient
    .from("activity_logs")
    .select("*, user:users(name, email, role)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (type) {
    query = query.eq("activity_type", type);
  }

  const { data, count } = await query;

  // Get distinct activity types for filter
  const { data: types } = await serviceClient
    .from("activity_logs")
    .select("activity_type")
    .order("activity_type");

  const uniqueTypes = Array.from(new Set((types || []).map((t: { activity_type: string }) => t.activity_type)));

  return NextResponse.json({
    logs: data || [],
    total: count || 0,
    activityTypes: uniqueTypes,
  });
}
