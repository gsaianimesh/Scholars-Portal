import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { title, description, deadline, expectedOutputFormat, referenceLinks, scholarIds, meetingId } = body;

  if (!title || !scholarIds?.length) {
    return NextResponse.json({ error: "Title and at least one scholar are required" }, { status: 400 });
  }

  const serviceClient = createServiceRoleClient();

  const { data: currentUser } = await serviceClient
    .from("users")
    .select("id")
    .eq("auth_id", authUser.id)
    .maybeSingle();

  if (!currentUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { data: prof } = await serviceClient
    .from("professors")
    .select("id")
    .eq("user_id", currentUser.id)
    .maybeSingle();

  if (!prof) {
    return NextResponse.json({ error: "Not a professor" }, { status: 403 });
  }

  // Create task
  const { data: task, error: taskError } = await serviceClient
    .from("tasks")
    .insert({
      title,
      description: description || "",
      created_by: currentUser.id,
      professor_id: prof.id,
      deadline: deadline || null,
      expected_output_format: expectedOutputFormat || null,
      reference_links: referenceLinks || null,
      meeting_id: meetingId || null,
    })
    .select()
    .single();

  if (taskError) {
    return NextResponse.json({ error: taskError.message }, { status: 500 });
  }

  // Create assignments
  const assignments = scholarIds.map((scholarId: string) => ({
    task_id: task.id,
    scholar_id: scholarId,
    status: "not_started",
  }));

  const { error: assignError } = await serviceClient
    .from("task_assignments")
    .insert(assignments);

  if (assignError) {
    return NextResponse.json({ error: assignError.message }, { status: 500 });
  }

  // Log activity
  await serviceClient.rpc("log_activity", {
    p_user_id: currentUser.id,
    p_activity_type: "task_created",
    p_description: `Created task "${title}" and assigned to ${scholarIds.length} scholar(s)`,
  });

  // Notify scholars
  for (const scholarId of scholarIds) {
    const { data: scholar } = await serviceClient
      .from("scholars")
      .select("user_id")
      .eq("id", scholarId)
      .single();

    if (scholar) {
      await serviceClient.rpc("create_notification", {
        p_user_id: scholar.user_id,
        p_title: "New Task Assigned",
        p_message: `You've been assigned: "${title}"`,
        p_type: "task_assigned",
      });
    }
  }

  return NextResponse.json({ task });
}
