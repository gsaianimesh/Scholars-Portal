import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";
import { deleteCalendarEvent, updateCalendarEvent } from "@/lib/services/google-calendar";

// DELETE — cancel a meeting
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
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

  console.log(`[Meeting API DELETE] Checking ownership for Meeting: ${params.id}, Prof: ${prof.id}`);

  const { data: meeting } = await serviceClient
    .from("meetings")
    .select("id, professor_id, meeting_title, calendar_event_id")
    .eq("id", params.id)
    .maybeSingle();

  if (!meeting) {
     console.error(`[Meeting API DELETE] Meeting ${params.id} NOT FOUND in DB`);
     return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
  }

  if (meeting.professor_id !== prof.id) {
     console.error(`[Meeting API DELETE] Ownership Mismatch! Meeting Owner: ${meeting.professor_id}, Current Prof: ${prof.id}`);
     return NextResponse.json({ error: "Not authorized to modify this meeting" }, { status: 403 });
  }

  // Delete from Google Calendar if linked
  if (meeting.calendar_event_id && session?.provider_token) {
    await deleteCalendarEvent({
      eventId: meeting.calendar_event_id,
      accessToken: session.provider_token,
    });
  }

  // Notify participants before deleting from DB
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

  // Delete meeting (cascades to participants & action_items via DB constraints)
  const { error } = await serviceClient.from("meetings").delete().eq("id", params.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

// PATCH — reschedule a meeting
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
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

  console.log(`[Meeting API PATCH] Rescheduling Meeting: ${params.id}, Prof: ${prof.id}`);

  const { data: meeting } = await serviceClient
    .from("meetings")
    .select("id, professor_id, meeting_title, calendar_event_id")
    .eq("id", params.id)
    .maybeSingle();

  if (!meeting) {
     console.error(`[Meeting API PATCH] Meeting ${params.id} NOT FOUND`);
     return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
  }

  if (meeting.professor_id !== prof.id) {
     console.error(`[Meeting API PATCH] Ownership Mismatch! Meeting Owner: ${meeting.professor_id}, Current Prof: ${prof.id}`);
     // Returning 404 to avoid leaking existence, or 403
     return NextResponse.json({ error: "Meeting not found or unauthorized" }, { status: 404 }); 
  }

  // Update Google Calendar event if present
  if (meeting.calendar_event_id && session?.provider_token) {
    try {
      await updateCalendarEvent({
        eventId: meeting.calendar_event_id,
        accessToken: session.provider_token,
        date: date,
        duration: 60, // Default duration since DB doesn't store it yet
      });
    } catch (calError: any) {
      console.error("Google Calendar update failed:", calError);
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
    const formattedDate = new Date(date).toLocaleString();
    for (const p of participants) {
      await serviceClient.rpc("create_notification", {
        p_user_id: p.user_id,
        p_title: "Meeting Rescheduled",
        p_message: `The meeting "${meeting.meeting_title}" has been moved to ${formattedDate}.`,
        p_type: "meeting_rescheduled",
      });
    }
  }

  return NextResponse.json({ meeting: updated });
}
