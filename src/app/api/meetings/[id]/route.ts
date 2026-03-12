import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";

// DELETE — cancel a meeting
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

  const { data: currentUser } = await serviceClient
    .from("users")
    .select("id")
    .eq("auth_id", authUser.id)
    .maybeSingle();
  if (!currentUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Verify the user owns the meeting (is the professor)
  const { data: prof } = await serviceClient
    .from("professors")
    .select("id")
    .eq("user_id", currentUser.id)
    .maybeSingle();
  if (!prof) {
    return NextResponse.json({ error: "Not a professor" }, { status: 403 });
  }

  const { data: meeting } = await serviceClient
    .from("meetings")
    .select("id, professor_id, meeting_title, calendar_event_id")
    .eq("id", params.id)
    .maybeSingle();

  if (!meeting || meeting.professor_id !== prof.id) {
    return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
  }

  // Try to delete from Google Calendar if there's a calendar event
  if (meeting.calendar_event_id) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.provider_token;
      if (token) {
        const calendarId = process.env.GOOGLE_CALENDAR_ID || "primary";
        await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(meeting.calendar_event_id)}`,
          { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
        );
      }
    } catch {
      // Calendar deletion is best-effort
    }
  }

  // Notify participants before deleting
  const { data: participants } = await serviceClient
    .from("meeting_participants")
    .select("user_id")
    .eq("meeting_id", params.id)
    .neq("user_id", currentUser.id);

  if (participants?.length) {
    for (const p of participants) {
      await serviceClient.rpc("create_notification", {
        p_user_id: p.user_id,
        p_title: "Meeting Cancelled",
        p_message: `The meeting "${meeting.meeting_title}" has been cancelled.`,
        p_type: "meeting_cancelled",
      });
    }
  }

  // Delete meeting (cascades to participants & action_items)
  await serviceClient.from("meetings").delete().eq("id", params.id);

  return NextResponse.json({ success: true });
}

// PATCH — reschedule a meeting
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerSupabaseClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { date } = body;
  if (!date) {
    return NextResponse.json({ error: "New date is required" }, { status: 400 });
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

  const { data: meeting } = await serviceClient
    .from("meetings")
    .select("id, professor_id, meeting_title, calendar_event_id")
    .eq("id", params.id)
    .maybeSingle();

  if (!meeting || meeting.professor_id !== prof.id) {
    return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
  }

  // Update Google Calendar event if present
  if (meeting.calendar_event_id) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.provider_token;
      if (token) {
        const calendarId = process.env.GOOGLE_CALENDAR_ID || "primary";
        const startTime = new Date(date).toISOString();
        const endTime = new Date(new Date(date).getTime() + 60 * 60 * 1000).toISOString();
        await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(meeting.calendar_event_id)}`,
          {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              start: { dateTime: startTime, timeZone: "UTC" },
              end: { dateTime: endTime, timeZone: "UTC" },
            }),
          }
        );
      }
    } catch {
      // Calendar update is best-effort
    }
  }

  // Update DB
  const { data: updated, error: updateError } = await serviceClient
    .from("meetings")
    .update({ meeting_date: date })
    .eq("id", params.id)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Notify participants about reschedule
  const { data: participants } = await serviceClient
    .from("meeting_participants")
    .select("user_id")
    .eq("meeting_id", params.id)
    .neq("user_id", currentUser.id);

  if (participants?.length) {
    for (const p of participants) {
      await serviceClient.rpc("create_notification", {
        p_user_id: p.user_id,
        p_title: "Meeting Rescheduled",
        p_message: `The meeting "${meeting.meeting_title}" has been rescheduled.`,
        p_type: "meeting_rescheduled",
      });
    }
  }

  return NextResponse.json({ meeting: updated });
}
