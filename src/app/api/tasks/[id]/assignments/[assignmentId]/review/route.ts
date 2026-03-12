import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; assignmentId: string } }
) {
  const supabase = createServerSupabaseClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { submissionStatus, reviewNotes } = body;

  if (!submissionStatus) {
    return NextResponse.json({ error: "Submission status is required" }, { status: 400 });
  }

  const validStatuses = ["approved", "revision_required", "rejected"];
  if (!validStatuses.includes(submissionStatus)) {
    return NextResponse.json({ error: "Invalid submission status" }, { status: 400 });
  }

  const serviceClient = createServiceRoleClient();

  // Update assignment
  const updateData: any = {
    submission_status: submissionStatus,
    reviewed_at: new Date().toISOString(),
  };
  if (reviewNotes) updateData.review_notes = reviewNotes;

  // If revision required, reset status so scholar can resubmit
  if (submissionStatus === "revision_required") {
    updateData.status = "in_progress";
  }
  if (submissionStatus === "approved") {
    updateData.status = "completed";
  }

  const { error } = await serviceClient
    .from("task_assignments")
    .update(updateData)
    .eq("id", params.assignmentId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Notify scholar
  const { data: assignment } = await serviceClient
    .from("task_assignments")
    .select("scholar:scholars(user_id), task:tasks(title)")
    .eq("id", params.assignmentId)
    .maybeSingle();

  if (assignment?.scholar) {
    const scholarUserId = (assignment.scholar as any).user_id;
    const taskTitle = (assignment.task as any)?.title || "a task";
    await serviceClient.rpc("create_notification", {
      p_user_id: scholarUserId,
      p_title: "Submission Reviewed",
      p_message: `Your submission for "${taskTitle}" has been ${submissionStatus.replace("_", " ")}`,
      p_type: "submission_reviewed",
    });
  }

  // Log activity
  const { data: currentUser } = await serviceClient
    .from("users")
    .select("id, name")
    .eq("auth_id", authUser.id)
    .maybeSingle();

  if (currentUser) {
    await serviceClient.rpc("log_activity", {
      p_user_id: currentUser.id,
      p_activity_type: "submission_reviewed",
      p_description: `${currentUser.name} reviewed a submission: ${submissionStatus.replace("_", " ")}`,
    });
  }

  return NextResponse.json({ success: true });
}
