import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { title, date, link, agenda, participantUserIds } = body;

  if (!title || !date) {
    return NextResponse.json({ error: "Title and date are required" }, { status: 400 });
  }

  const serviceClient = createServiceRoleClient();

  const { data: currentUser } = await serviceClient
    .from("users")
    .select("id")
    .eq("auth_id", authUser.id)
    .single();

  if (!currentUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { data: prof } = await serviceClient
    .from("professors")
    .select("id")
    .eq("user_id", currentUser.id)
    .single();

  if (!prof) {
    return NextResponse.json({ error: "Not a professor" }, { status: 403 });
  }

  // Create meeting
  const { data: meeting, error: meetingError } = await serviceClient
    .from("meetings")
    .insert({
      professor_id: prof.id,
      meeting_title: title,
      meeting_date: date,
      meeting_link: link,
      agenda,
    })
    .select()
    .single();

  if (meetingError) {
    return NextResponse.json({ error: meetingError.message }, { status: 500 });
  }

  // Add professor as participant
  const participants = [
    { meeting_id: meeting.id, user_id: currentUser.id, role: "organizer" },
  ];

  // Add selected participants
  if (participantUserIds?.length) {
    for (const userId of participantUserIds) {
      participants.push({
        meeting_id: meeting.id,
        user_id: userId,
        role: "attendee",
      });
    }
  }

  await serviceClient.from("meeting_participants").insert(participants);

  // Try creating a Google Calendar event
  try {
    const calendarRes = await fetch(
      `${request.nextUrl.origin}/api/calendar/create-event`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meetingId: meeting.id,
          title,
          date,
          link,
          agenda,
        }),
      }
    );

    if (calendarRes.ok) {
      const calData = await calendarRes.json();
      if (calData.calendarEventId) {
        await serviceClient
          .from("meetings")
          .update({ calendar_event_id: calData.calendarEventId })
          .eq("id", meeting.id);
      }
    }
  } catch {
    // Calendar integration is optional
  }

  // Log activity
  await serviceClient.rpc("log_activity", {
    p_user_id: currentUser.id,
    p_activity_type: "meeting_scheduled",
    p_description: `Scheduled meeting "${title}"`,
  });

  // Notify participants
  if (participantUserIds?.length) {
    for (const userId of participantUserIds) {
      await serviceClient.rpc("create_notification", {
        p_user_id: userId,
        p_title: "New Meeting Scheduled",
        p_message: `You've been invited to: "${title}"`,
        p_type: "meeting_scheduled",
      });
    }
  }

  return NextResponse.json({ meeting });
}
