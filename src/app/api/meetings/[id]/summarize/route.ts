import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";
import { summarizeMeeting } from "@/lib/services/ai-summarization";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log(`[Summarize API] Starting for meeting: ${id}`);

    const supabase = createServerSupabaseClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const serviceClient = createServiceRoleClient();

    const { data: meeting } = await serviceClient
      .from("meetings")
      .select("id, transcript, agenda, professor_id")
      .eq("id", id)
      .maybeSingle();

    if (!meeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    if (!meeting.transcript) {
      return NextResponse.json({ error: "No transcript available" }, { status: 400 });
    }

    // Get previous meeting summary for context
    const { data: previousMeeting } = await serviceClient
      .from("meetings")
      .select("summary")
      .eq("professor_id", meeting.professor_id)
      .lt("id", meeting.id)
      .order("meeting_date", { ascending: false })
      .limit(1)
      .maybeSingle();

    console.log(`[Summarize API] Calling AI summarization...`);
    const result = await summarizeMeeting(
      meeting.transcript,
      meeting.agenda,
      previousMeeting?.summary
    );
    console.log(`[Summarize API] AI summarization complete`);

    // Save summary to database
    await serviceClient
      .from("meetings")
      .update({ summary: result.summary })
      .eq("id", id);

    // Auto create Tasks out of them
    const autoCreatedTasks: any[] = [];
    if (result.actionItems?.length > 0) {
      const { data: profData } = await serviceClient
        .from("professors")
        .select("user_id")
        .eq("id", meeting.professor_id)
        .single();
      const createdBy = profData?.user_id;

      // Fetch participants for matching
      const { data: participants } = await serviceClient.from("meeting_participants").select("user_id").eq("meeting_id", id);
      const userIds = participants?.map((p: any) => p.user_id) || [];
      
      let scholarsData: any[] = [];
      if (userIds.length > 0) {
        const { data: schData } = await serviceClient.from("scholars").select("id, user_id, users(name)").in("user_id", userIds);
        scholarsData = schData || [];
      } else {
        const { data: allScholars } = await serviceClient.from("scholars").select("id, user_id, users(name)").eq("professor_id", meeting.professor_id);
        scholarsData = allScholars || [];
      }

      if (createdBy) {
        for (const item of result.actionItems) {
          const taskInsert = {
            title: item.title || "Action Item",
            description: item.description || "",
            created_by: createdBy,
            professor_id: meeting.professor_id,
            deadline: item.dueDate || null,
            status: "not_started",
            meeting_id: id,
            is_auto_generated: true
          };
          
          const { data: insertedTask, error: taskErr } = await serviceClient.from("tasks").insert(taskInsert).select().single();

          if (insertedTask && !taskErr) {
            let assignedScholars = scholarsData;
            
            if (item.assignee && item.assignee.toLowerCase() !== 'unassigned') {
              const matched = scholarsData.filter((s: any) => 
                s.users?.name?.toLowerCase().includes(item.assignee.toLowerCase())
              );
              if (matched.length > 0) {
                assignedScholars = matched;
              }
            }

            for (const sch of assignedScholars) {
              await serviceClient.from("task_assignments").insert({
                task_id: insertedTask.id,
                scholar_id: sch.id,
                status: "not_started"
              });
            }

            autoCreatedTasks.push({
              ...insertedTask,
              assignees: assignedScholars.map((s: any) => s.users?.name).join(", ")
            });
          }
        }
      }
    }

    return NextResponse.json({
      summary: result.summary,
      keyPoints: result.keyPoints,
      actionItems: result.actionItems,
      followUpTopics: result.followUpTopics,
      autoCreatedTasks
    });
  } catch (error: any) {
    console.error(`[Summarize API] Error:`, error);
    return NextResponse.json(
      { error: error.message || "Failed to summarize meeting" },
      { status: 500 }
    );
  }
}
