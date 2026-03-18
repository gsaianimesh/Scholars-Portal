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

  // Get previous meeting summary (that actually has a summary)
  const { data: previousMeeting } = await serviceClient
    .from("meetings")
    .select("summary, meeting_title, meeting_date")
    .eq("professor_id", meeting.professor_id)
    .not("summary", "is", null)
    .neq("summary", "")
    .lt("meeting_date", meeting.meeting_date)
    .order("meeting_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Get pending tasks
  const { data: pendingTasks } = await serviceClient
    .from("tasks")
    .select("id, title, deadline")
    .eq("professor_id", meeting.professor_id)
    .in("status", ["not_started", "in_progress"])
    .limit(10);

  // Get recent submissions
  const { data: recentSubmissions } = await serviceClient
    .from("task_assignments")
    .select("id, submitted_at, task:tasks(title), scholar:scholars(user:users(name))")
    .not("submitted_at", "is", null)
    .order("submitted_at", { ascending: false })
    .limit(5);

  const formattedSubmissions = recentSubmissions?.map((s: any) => ({
    id: s.id,
    submitted_at: s.submitted_at,
    task_title: s.task?.title,
    scholar_name: s.scholar?.user?.name,
  }));

  return NextResponse.json({
    lastMeetingSummary: previousMeeting?.summary || null,
    lastMeetingTitle: previousMeeting?.meeting_title || null,
    lastMeetingDate: previousMeeting?.meeting_date || null,
    pendingTasks: pendingTasks || [],
    recentSubmissions: formattedSubmissions || [],
  });
}
