import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; assignmentId: string } }
) {
  const supabase = createServerSupabaseClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { status, submissionLink, notes } = body;

  const serviceClient = createServiceRoleClient();

  const updateData: any = {};
  if (status) updateData.status = status;
  if (submissionLink !== undefined) updateData.submission_link = submissionLink;
  if (notes !== undefined) updateData.notes = notes;
  if (status === "submitted") updateData.submitted_at = new Date().toISOString();

  const { error } = await serviceClient
    .from("task_assignments")
    .update(updateData)
    .eq("id", params.assignmentId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Log activity
  const { data: currentUser } = await serviceClient
    .from("users")
    .select("id, name")
    .eq("auth_id", authUser.id)
    .maybeSingle();

  if (currentUser) {
    const activityType =
      status === "submitted" ? "task_submitted" : "task_status_updated";
    await serviceClient.rpc("log_activity", {
      p_user_id: currentUser.id,
      p_activity_type: activityType,
      p_description: `${currentUser.name} ${status === "submitted" ? "submitted work for" : "updated status of"} a task`,
    });
  }

  return NextResponse.json({ success: true });
}
