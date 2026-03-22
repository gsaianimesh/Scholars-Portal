import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { generateMeetingInsights } from "@/lib/services/ai-summarization";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const serviceClient = createServiceRoleClient();

  // Get the meeting
  const { data: meeting } = await serviceClient
    .from("meetings")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  if (!meeting) {
    return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
  }

  // Get participants of this meeting
  const { data: participants } = await serviceClient
    .from("meeting_participants")
    .select("user_id")
    .eq("meeting_id", params.id);

  const userIds = participants?.map((p: any) => p.user_id) || [];

  // Get scholar IDs for the participants (for task fetching)
  let scholarIds: string[] = [];
  if (userIds.length > 0) {
    const { data: scholars } = await serviceClient
      .from("scholars")
      .select("id")
      .in("user_id", userIds);
    if (scholars) {
      scholarIds = scholars.map((s: any) => s.id);
    }
  }

  // Find the most recent previous meeting that shares at least one participant with this meeting
  // This ensures we get context from meetings with the SAME people, not random meetings
  let previousMeeting = null;

  if (userIds.length > 0) {
    // Get all previous meetings of this professor that have a summary
    const { data: previousMeetings } = await serviceClient
      .from("meetings")
      .select("id, summary, meeting_title, meeting_date")
      .eq("professor_id", meeting.professor_id)
      .not("summary", "is", null)
      .neq("summary", "")
      .lt("meeting_date", meeting.meeting_date)
      .order("meeting_date", { ascending: false });

    if (previousMeetings && previousMeetings.length > 0) {
      // Find a meeting that shares participants with the current one
      for (const pm of previousMeetings) {
        const { data: pmParticipants } = await serviceClient
          .from("meeting_participants")
          .select("user_id")
          .eq("meeting_id", pm.id);

        const pmUserIds = pmParticipants?.map((p: any) => p.user_id) || [];

        // Check if any participants overlap between meetings
        const hasOverlap = userIds.some((uid: string) => pmUserIds.includes(uid));

        if (hasOverlap) {
          previousMeeting = pm;
          break;
        }
      }

      // If no meeting with overlapping participants found, don't use any previous meeting
      // This prevents showing irrelevant meeting summaries
    }
  }

  let pendingTasks: any[] = [];
  let recentSubmissions: any[] = [];

  // Get pending tasks & submissions for the scholars involved in this meeting
  if (scholarIds.length > 0) {
    const { data: assignments } = await serviceClient
      .from("task_assignments")
      .select("id, status, submitted_at, task_id, task:tasks(id, title, deadline), scholar:scholars(user:users(name))")
      .in("scholar_id", scholarIds);

    if (assignments) {
      const pendingAssignments = assignments.filter((a: any) => a.status === "not_started" || a.status === "in_progress");
      // Map back to tasks - group by distinct tasks
      const taskMap = new Map();
      for (const a of pendingAssignments) {
        if (a.task && !taskMap.has(a.task.id)) {
           taskMap.set(a.task.id, {
             id: a.task.id,
             title: a.task.title,
             deadline: a.task.deadline
           });
        }
      }
      pendingTasks = Array.from(taskMap.values()).slice(0, 10);

      const submittedAssignments = assignments
        .filter((a: any) => a.submitted_at !== null)
        .sort((a: any, b: any) => new Date(b.submitted_at).valueOf() - new Date(a.submitted_at).valueOf())
        .slice(0, 5);

      recentSubmissions = submittedAssignments.map((s: any) => ({
        id: s.id,
        submitted_at: s.submitted_at,
        task_title: s.task?.title,
        scholar_name: s.scholar?.user?.name,
      }));
    }
  }

  let insights = meeting.pre_meeting_insights || null;
  if (!insights && (previousMeeting?.summary || pendingTasks.length > 0)) {
    // Check if professor has AI insights enabled
    const { data: profData } = await serviceClient
      .from("professors")
      .select("user_id")
      .eq("id", meeting.professor_id)
      .maybeSingle();

    let aiInsightsEnabled = true;
    if (profData?.user_id) {
      const { data: userData } = await serviceClient
        .from("users")
        .select("ai_insights")
        .eq("id", profData.user_id)
        .maybeSingle();
      
      if (userData && userData.ai_insights === false) {
        aiInsightsEnabled = false;
      }
    }

    if (aiInsightsEnabled) {
      try {
        insights = await generateMeetingInsights(
          previousMeeting?.summary || "",
          pendingTasks,
          recentSubmissions
        );

        // Save insights to DB
        await serviceClient
          .from("meetings")
          .update({ pre_meeting_insights: insights })
          .eq("id", params.id);
      } catch (e) {
        console.error("Failed to generate meeting insights:", e);
      }
    } else {
      console.log(`[Meeting Insights] Generation disabled for professor ${meeting.professor_id}`);
    }
  }

  return NextResponse.json({
    lastMeetingSummary: previousMeeting?.summary || null,
    lastMeetingTitle: previousMeeting?.meeting_title || null,
    lastMeetingDate: previousMeeting?.meeting_date || null,
    pendingTasks: pendingTasks || [],
    recentSubmissions: recentSubmissions || [],
    insights: insights || null,
  });
}
