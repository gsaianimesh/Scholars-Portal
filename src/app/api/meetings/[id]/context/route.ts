import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const serviceClient = createServiceRoleClient();

  // Get the meeting
  const { data: meeting } = await serviceClient
    .from("meetings")
    .select("professor_id, meeting_date")
    .eq("id", params.id)
    .maybeSingle();

  if (!meeting) {
    return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
  }

  // Get participants
  const { data: participants } = await serviceClient
    .from("meeting_participants")
    .select("user_id")
    .eq("meeting_id", params.id);

  const userIds = participants?.map((p: any) => p.user_id) || [];
  
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

  // Get previous meeting summary involving these participants
  // Since meetings are not directly linked to scholars simply, we get the professor's last meeting 
  // that had these users. For simplicity, let's just get the last meeting between this professor and these scholars.
  
  // Get all previous meetings of this professor
  const { data: previousMeetings } = await serviceClient
    .from("meetings")
    .select("id, summary, meeting_title, meeting_date")
    .eq("professor_id", meeting.professor_id)
    .not("summary", "is", null)
    .neq("summary", "")
    .lt("meeting_date", meeting.meeting_date)
    .order("meeting_date", { ascending: false });

  let previousMeeting = null;
  
  // Find the most recent meeting that shares at least one participant
  if (previousMeetings && previousMeetings.length > 0 && userIds.length > 0) {
    for (const pm of previousMeetings) {
      const { data: pmParticipants } = await serviceClient
        .from("meeting_participants")
        .select("user_id")
        .eq("meeting_id", pm.id);
      
      const pmUserIds = pmParticipants?.map((p: any) => p.user_id) || [];
      const hasOverlap = userIds.some((uid: any) => pmUserIds.includes(uid));
      if (hasOverlap) {
        previousMeeting = pm;
        break;
      }
    }
  }

  // Fallback to the professor's last meeting if no overlap or no participants
  if (!previousMeeting && previousMeetings && previousMeetings.length > 0) {
     previousMeeting = previousMeetings[0];
  }

  let pendingTasks = [];
  let recentSubmissions = [];

  // Get pending tasks & submissions for the scholars involved in this meeting
  if (scholarIds.length > 0) {
    const { data: assignments } = await serviceClient
      .from("task_assignments")
      .select("id, status, submitted_at, task_id, task:tasks(id, title, deadline), scholar:scholars(user:users(name))")
      .in("scholar_id", scholarIds);

    if (assignments) {
      const pendingAssignments = assignments.filter((a: any) => a.status === "not_started" || a.status === "in_progress");
      // Map back to tasks
      // Group by distinct tasks
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

  return NextResponse.json({
    lastMeetingSummary: previousMeeting?.summary || null,
    lastMeetingTitle: previousMeeting?.meeting_title || null,
    lastMeetingDate: previousMeeting?.meeting_date || null,
    pendingTasks: pendingTasks || [],
    recentSubmissions: recentSubmissions || [],
  });
}
