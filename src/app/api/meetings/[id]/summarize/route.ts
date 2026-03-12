import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";
import { summarizeMeeting } from "@/lib/services/ai-summarization";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerSupabaseClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serviceClient = createServiceRoleClient();

  const { data: meeting } = await serviceClient
    .from("meetings")
    .select("id, transcript, agenda, professor_id")
    .eq("id", params.id)
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

  try {
    const result = await summarizeMeeting(
      meeting.transcript,
      meeting.agenda,
      previousMeeting?.summary
    );

    // Save summary to database
    await serviceClient
      .from("meetings")
      .update({ summary: result.summary })
      .eq("id", params.id);

    // Create action items
    if (result.actionItems?.length) {
      const actionItems = result.actionItems.map((item) => ({
        meeting_id: params.id,
        title: item.title,
        description: item.description,
        assignee_name: item.assignee,
        due_date: item.dueDate || null,
      }));

      await serviceClient.from("action_items").insert(actionItems);
    }

    return NextResponse.json({
      summary: result.summary,
      keyPoints: result.keyPoints,
      actionItems: result.actionItems,
      followUpTopics: result.followUpTopics,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to summarize meeting" },
      { status: 500 }
    );
  }
}
