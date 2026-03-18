import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";
import { fetchFathomRecordingData, listFathomMeetings, FathomMeeting } from "@/lib/services/fathom";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log("[Transcript API] Starting transcript fetch...");
    const { id } = await params;
    console.log(`[Transcript API] Meeting ID: ${id}`);

    const supabase = createServerSupabaseClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.log(`[Transcript API] Authenticated user: ${authUser.id}`);

    const serviceClient = createServiceRoleClient();

    // Fetch meeting details including date
    const { data: meeting } = await serviceClient
      .from("meetings")
      .select("id, fathom_meeting_id, meeting_date, meeting_title, professor_id")
      .eq("id", id)
      .maybeSingle();

    if (!meeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    // Get professor's API key
    const { data: prof } = await serviceClient
      .from("professors")
      .select("fathom_api_key")
      .eq("id", meeting.professor_id)
      .maybeSingle();

    const apiKey = prof?.fathom_api_key;
    if (!apiKey && !process.env.FATHOM_API_KEY) {
      return NextResponse.json({ error: "Fathom API Key not configured for this professor" }, { status: 400 });
    }

    let fathomMeetingId = meeting.fathom_meeting_id;

    // If no Fathom ID is linked, try to find a matching recording
    if (!fathomMeetingId) {
      console.log(`[Transcript API] No Fathom ID for meeting ${meeting.id}. Searching for match...`);
      try {
        // Look for meetings starting 1 hour before scheduled time
        const searchAfter = new Date(new Date(meeting.meeting_date).getTime() - 60 * 60 * 1000).toISOString();
        const calls = await listFathomMeetings(searchAfter, apiKey);

        // Find the best match:
        // 1. Time must be within +/- 30 mins of schedule
        // 2. Title similarity is a bonus but time is key
        const scheduledTime = new Date(meeting.meeting_date).getTime();

        const bestMatch = calls.find((call: FathomMeeting) => {
          const callTime = new Date(call.date).getTime();
          const timeDiff = Math.abs(callTime - scheduledTime);
          // 30 minute tolerance window
          return timeDiff <= 30 * 60 * 1000;
        });

        if (bestMatch) {
          console.log(`[Transcript API] Found Fathom match: ${bestMatch.id} (${bestMatch.title})`);
          fathomMeetingId = bestMatch.id;

          // Link it in DB
          await serviceClient
            .from("meetings")
            .update({ fathom_meeting_id: fathomMeetingId })
            .eq("id", id);
        } else {
          console.warn(`[Transcript API] No matching Fathom recording found for ${meeting.meeting_date}`);
          return NextResponse.json(
            { error: "No matching recording found in Fathom yet. Ensure the meeting has ended and processed." },
            { status: 404 }
          );
        }
      } catch (err: any) {
        console.error("Fathom search failed:", err);
        return NextResponse.json({ error: "Failed to search Fathom recordings" }, { status: 500 });
      }
    }

    // Fetch both transcript and summary from Fathom
    console.log(`[Transcript API] Fetching transcript and summary for Fathom ID: ${fathomMeetingId}`);
    const { transcript, summary } = await fetchFathomRecordingData(fathomMeetingId, apiKey);
    console.log(`[Transcript API] Successfully fetched transcript and summary`);

    // Save both transcript and summary to meeting
    const { error: updateError } = await serviceClient
      .from("meetings")
      .update({
        transcript,
        summary
      })
      .eq("id", id);

    if (updateError) {
      console.error(`[Transcript API] Failed to save data to DB:`, updateError);
      return NextResponse.json(
        { error: `Failed to save data: ${updateError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      transcript,
      summary,
    });
  } catch (error: any) {
    console.error(`[Transcript API] Error:`, error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch transcript", details: String(error) },
      { status: 500 }
    );
  }
}
