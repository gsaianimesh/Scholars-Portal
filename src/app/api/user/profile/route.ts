import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";

export async function PATCH(request: NextRequest) {
  const supabase = createServerSupabaseClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, department, institution } = body;

  const serviceClient = createServiceRoleClient();

  const { data: currentUser } = await serviceClient
    .from("users")
    .select("id, role")
    .eq("auth_id", authUser.id)
    .maybeSingle();

  if (!currentUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Update user name
  if (name) {
    await serviceClient.from("users").update({ name }).eq("id", currentUser.id);
  }

  // Update professor-specific fields
  if (currentUser.role === "professor") {
    const updates: any = {};
    if (department !== undefined) updates.department = department;
    if (institution !== undefined) updates.institution = institution;

    if (Object.keys(updates).length > 0) {
      await serviceClient
        .from("professors")
        .update(updates)
        .eq("user_id", currentUser.id);
    }
  }

  return NextResponse.json({ success: true });
}
