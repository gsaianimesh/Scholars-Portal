import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerSupabaseClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serviceClient = createServiceRoleClient();

  // Get the current user
  const { data: currentUser } = await serviceClient
    .from("users")
    .select("id, role")
    .eq("auth_id", authUser.id)
    .maybeSingle();

  if (!currentUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Get the task to verify ownership
  const { data: task } = await serviceClient
    .from("tasks")
    .select("id, professor_id, created_by")
    .eq("id", params.id)
    .maybeSingle();

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  // Check if user is authorized to delete (professor or creator)
  let canDelete = false;

  if (currentUser.role === "professor") {
    const { data: prof } = await serviceClient
      .from("professors")
      .select("id")
      .eq("user_id", currentUser.id)
      .maybeSingle();

    if (prof && task.professor_id === prof.id) {
      canDelete = true;
    }
  }

  if (task.created_by === currentUser.id) {
    canDelete = true;
  }

  if (!canDelete) {
    return NextResponse.json({ error: "Not authorized to delete this task" }, { status: 403 });
  }

  // Delete task assignments first (cascade should handle this, but being explicit)
  await serviceClient
    .from("task_assignments")
    .delete()
    .eq("task_id", params.id);

  // Delete the task
  const { error } = await serviceClient
    .from("tasks")
    .delete()
    .eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
