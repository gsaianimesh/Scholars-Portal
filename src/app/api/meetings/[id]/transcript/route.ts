import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";
import { fetchFathomTranscript } from "@/lib/services/fathom";

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
    .select("id, fathom_meeting_id")
    .eq("id", params.id)
    .single();

  if (!meeting) {
    return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
  }

  if (!meeting.fathom_meeting_id) {
    return NextResponse.json(
      { error: "No Fathom meeting ID linked to this meeting" },
      { status: 400 }
    );
  }

  try {
    const fathomData = await fetchFathomTranscript(meeting.fathom_meeting_id);

    // Save transcript to meeting
    await serviceClient
      .from("meetings")
      .update({ transcript: fathomData.transcript })
      .eq("id", params.id);

    return NextResponse.json({
      transcript: fathomData.transcript,
      duration: fathomData.duration,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch transcript" },
      { status: 500 }
    );
  }
}
