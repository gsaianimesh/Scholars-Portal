import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { fetchFathomRecordingData } from "@/lib/services/fathom";

// Fathom webhook payload types
interface FathomWebhookPayload {
  title: string;
  meeting_title: string | null;
  recording_id: number;
  url: string;
  share_url: string;
  created_at: string;
  scheduled_start_time: string;
  scheduled_end_time: string;
  recording_start_time: string;
  recording_end_time: string;
  calendar_invitees_domains_type: "only_internal" | "one_or_more_external";
  transcript_language: string;
  calendar_invitees: {
    name: string;
    email: string;
    email_domain: string;
    is_external: boolean;
  }[];
  recorded_by: {
    name: string;
    email: string;
    email_domain: string;
    team: string;
  };
  transcript?: { speaker: { display_name: string }; text: string; timestamp: string }[] | null;
  default_summary?: { text: string } | null;
  action_items?: { text: string; assignee?: string }[] | null;
}

export async function POST(request: NextRequest) {
  try {
    console.log("[Fathom Webhook] Received webhook");

    // Verify webhook signature (optional but recommended)
    const webhookId = request.headers.get("webhook-id");
    const webhookTimestamp = request.headers.get("webhook-timestamp");
    const webhookSignature = request.headers.get("webhook-signature");

    console.log(`[Fathom Webhook] ID: ${webhookId}, Timestamp: ${webhookTimestamp}`);

    const payload: FathomWebhookPayload = await request.json();
    console.log(`[Fathom Webhook] Recording ID: ${payload.recording_id}, Title: ${payload.title}`);

    const serviceClient = createServiceRoleClient();

    // Find matching meeting by scheduled time (within 30 min window)
    const scheduledTime = new Date(payload.scheduled_start_time);
    const timeWindowStart = new Date(scheduledTime.getTime() - 30 * 60 * 1000).toISOString();
    const timeWindowEnd = new Date(scheduledTime.getTime() + 30 * 60 * 1000).toISOString();

    const { data: meetings } = await serviceClient
      .from("meetings")
      .select("id, meeting_title, meeting_date, professor_id")
      .gte("meeting_date", timeWindowStart)
      .lte("meeting_date", timeWindowEnd);

    if (!meetings || meetings.length === 0) {
      console.log("[Fathom Webhook] No matching meeting found in database");
      // Still return 200 to acknowledge receipt
      return NextResponse.json({ status: "no_match", message: "No matching meeting found" });
    }

    // Find the best match (could match by title similarity if multiple meetings)
    let matchedMeeting = meetings[0];
    if (meetings.length > 1) {
      // Try to match by title
      const titleMatch = meetings.find(
        (m: { meeting_title?: string }) =>
          m.meeting_title?.toLowerCase().includes(payload.title.toLowerCase()) ||
          payload.title.toLowerCase().includes(m.meeting_title?.toLowerCase() || "")
      );
      if (titleMatch) {
        matchedMeeting = titleMatch;
      }
    }

    console.log(`[Fathom Webhook] Matched meeting: ${matchedMeeting.id} (${matchedMeeting.meeting_title})`);

    // Try to get the professor's API key
    let apiKey = process.env.FATHOM_API_KEY;
    if (matchedMeeting.professor_id) {
      const { data: prof } = await serviceClient
        .from("professors")
        .select("fathom_api_key")
        .eq("id", matchedMeeting.professor_id)
        .maybeSingle();
      
      if (prof?.fathom_api_key) {
        apiKey = prof.fathom_api_key;
      }
    }

    let transcript = "";
    let summary = "";

    // Use webhook payload data if available
    if (payload.transcript && payload.transcript.length > 0) {
      transcript = payload.transcript
        .map((item) => `[${item.timestamp}] ${item.speaker.display_name}: ${item.text}`)
        .join("\n");
    }

    if (payload.default_summary) {
      // Handle the object structure if it exists: { text: "...", markdown_formatted: "..." }
      if (typeof payload.default_summary === 'object' && payload.default_summary !== null) {
        summary = (payload.default_summary as any).markdown_formatted || (payload.default_summary as any).text || JSON.stringify(payload.default_summary);
      } else if (typeof payload.default_summary === 'string') {
        // Just in case it's stringified JSON
        try {
          const parsed = JSON.parse(payload.default_summary);
          summary = parsed.markdown_formatted || parsed.text || payload.default_summary;
        } catch {
          summary = payload.default_summary;
        }
      }
    }

    // If not in payload, fetch from API
    if ((!transcript || !summary) && apiKey) {
      console.log("[Fathom Webhook] Fetching data from Fathom API...");
      try {
        const fathomData = await fetchFathomRecordingData(String(payload.recording_id), apiKey);
        if (!transcript) transcript = fathomData.transcript;
        if (!summary) summary = fathomData.summary;
      } catch (err) {
        console.error("[Fathom Webhook] Failed to fetch from API:", err);
      }
    }

    // Update the meeting with transcript, summary, and fathom_meeting_id
    const { error: updateError } = await serviceClient
      .from("meetings")
      .update({
        fathom_meeting_id: String(payload.recording_id),
        transcript,
        summary,
      })
      .eq("id", matchedMeeting.id);

    if (updateError) {
      console.error("[Fathom Webhook] Failed to update meeting:", updateError);
      return NextResponse.json({ status: "error", message: updateError.message }, { status: 500 });
    }

    // Create action items if provided
    if (payload.action_items && payload.action_items.length > 0) {
      const actionItems = payload.action_items.map((item) => ({
        meeting_id: matchedMeeting.id,
        description: item.text,
        assignee_name: item.assignee || "unassigned",
        status: "pending",
      }));

      await serviceClient.from("action_items").insert(actionItems);
    }

    console.log(`[Fathom Webhook] Successfully updated meeting ${matchedMeeting.id}`);

    return NextResponse.json({
      status: "success",
      meeting_id: matchedMeeting.id,
    });
  } catch (error: any) {
    console.error("[Fathom Webhook] Error:", error);
    // Return 200 to prevent Fathom from retrying (unless you want retries)
    return NextResponse.json({ status: "error", message: error.message }, { status: 200 });
  }
}
