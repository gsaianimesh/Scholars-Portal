import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { fetchFathomRecordingData } from "@/lib/services/fathom";
import { extractActionItems } from "@/lib/services/ai-summarization";

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

    const webhookId = request.headers.get("webhook-id");
    const webhookTimestamp = request.headers.get("webhook-timestamp");
    const webhookSignature = request.headers.get("webhook-signature");

    if (!webhookSignature) {
      return NextResponse.json({ error: "Missing webhook signature" }, { status: 401 });
    }

    // Get the prof_id from the query string to look up their specific secret
    const url = new URL(request.url);
    const profId = url.searchParams.get("prof_id");
    if (!profId) {
      return NextResponse.json({ error: "Missing prof_id in webhook URL" }, { status: 400 });
    }

    const serviceClient = createServiceRoleClient();

    // Look up secret
    const { data: prof } = await serviceClient
      .from("professors")
      .select("fathom_webhook_secret, fathom_api_key, user_id")
      .eq("id", profId)
      .maybeSingle();

    if (!prof || !prof.fathom_webhook_secret) {
      return NextResponse.json({ error: "Webhook secret not configured for this professor" }, { status: 401 });
    }
    
    // Look up professor user preferences
    const { data: userPrefs } = await serviceClient
      .from("users")
      .select("auto_meeting_sync, ai_insights, auto_task_gen, email_notifs")
      .eq("id", prof.user_id)
      .maybeSingle();
      
    // Default to true if somehow null
    const prefs = {
      autoMeetingSync: userPrefs?.auto_meeting_sync !== false, // Use true as default unless explicitly false
      aiInsights: userPrefs?.ai_insights !== false,
      autoTaskGen: userPrefs?.auto_task_gen !== false,
      emailNotifs: userPrefs?.email_notifs !== false,
    };

    if (!prefs.autoMeetingSync) {
      console.log(`[Fathom Webhook] Auto-meeting sync is disabled for prof ${profId}. Skipping.`);
      return NextResponse.json({ success: true, message: "Sync paused by user preference" });
    }

    // Read the raw body as text for signature verification
    const rawBody = await request.text();

    // The signature format is usually "v1,<base64_encoded_hash>"
    const parts = webhookSignature.split(",");
    if (parts.length !== 2 || parts[0] !== "v1") {
      return NextResponse.json({ error: "Invalid signature format" }, { status: 401 });
    }

    const incomingSignature = parts[1];
    
    // Hash the raw body with the user's secret
    const expectedSignature = crypto
      .createHmac("sha256", prof.fathom_webhook_secret)
      .update(rawBody)
      .digest("base64");

    // Cryptographic constant-time comparison to prevent timing attacks
    if (incomingSignature.length !== expectedSignature.length || !crypto.timingSafeEqual(Buffer.from(incomingSignature), Buffer.from(expectedSignature))) {
      console.error("[Fathom Webhook] Signature verification failed");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    console.log(`[Fathom Webhook] Signature verified. ID: ${webhookId}, Timestamp: ${webhookTimestamp}`);

    const payload: FathomWebhookPayload = JSON.parse(rawBody);
    console.log(`[Fathom Webhook] Recording ID: ${payload.recording_id}, Title: ${payload.title}`);

    // Find matching meeting by scheduled time (within a generous 6 hour window for impromptu meetings)
    const baseTime = payload.scheduled_start_time || payload.recording_start_time || payload.created_at;
    const scheduledTime = new Date(baseTime);
    const timeWindowStart = new Date(scheduledTime.getTime() - 6 * 60 * 60 * 1000).toISOString();
    const timeWindowEnd = new Date(scheduledTime.getTime() + 6 * 60 * 60 * 1000).toISOString();

    const { data: meetings } = await serviceClient
      .from("meetings")
      .select("id, meeting_title, meeting_date, professor_id")
      .gte("meeting_date", timeWindowStart)
      .lte("meeting_date", timeWindowEnd);

    if (!meetings || meetings.length === 0) {
      console.log("[Fathom Webhook] No matching meeting found in database");
      // Still return 200 to acknowledge receipt
      return NextResponse.json({ status: "no_match", message: "No matching meeting found within 6 hours" });
    }

    // Find the closest match in time
    let matchedMeeting = meetings[0];
    let smallestTimeDiff = Infinity;
    
    for (const m of meetings) {
      const diff = Math.abs(new Date(m.meeting_date).getTime() - scheduledTime.getTime());
      
      // If it's a direct title match, boost its priority drastically by artificially reducing the diff
      const isTitleMatch = m.meeting_title?.toLowerCase().includes(payload.title.toLowerCase()) || 
                           payload.title.toLowerCase().includes(m.meeting_title?.toLowerCase() || "");
                           
      const finalDiff = isTitleMatch ? diff / 10 : diff;
      
      if (finalDiff < smallestTimeDiff) {
        smallestTimeDiff = finalDiff;
        matchedMeeting = m;
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

    // Extract action items directly from AI summary and transcript
    let extractedActionItems: any[] = [];
    if ((transcript || summary) && prefs.autoTaskGen) {
      try {
        console.log("[Fathom Webhook] Extracting action items using Groq AI...");
        const aiResult = await extractActionItems(transcript, summary, matchedMeeting.agenda, new Date().toISOString());
        if (aiResult.actionItems && aiResult.actionItems.length > 0) {
          extractedActionItems = aiResult.actionItems;
        }
      } catch (err) {
        console.error("[Fathom Webhook] Failed to extract AI action items:", err);
      }
    } else if (!prefs.autoTaskGen) {
      console.log(`[Fathom Webhook] Auto-task generation is disabled for prof ${profId}. Skipping action item extraction.`);
    }

    if (extractedActionItems.length > 0) {
      const { data: profUsr } = await serviceClient.from("professors").select("user_id").eq("id", matchedMeeting.professor_id).single();
      const createdBy = profUsr?.user_id;

      // Fetch participants for matching
      const { data: participants } = await serviceClient.from("meeting_participants").select("user_id").eq("meeting_id", matchedMeeting.id);
      const userIds = participants?.map((p: any) => p.user_id) || [];
      let scholarsData: any[] = [];
      if (userIds.length > 0) {
        const { data: schData } = await serviceClient.from("scholars").select("id, user_id, users(name, email)").in("user_id", userIds);
        scholarsData = schData || [];
      } else {
        // Fallback: get all scholars for this professor if no participants mapped yet
        const { data: allScholars } = await serviceClient.from("scholars").select("id, user_id, users(name, email)").eq("professor_id", matchedMeeting.professor_id);
        scholarsData = allScholars || [];
      }

      if (createdBy) {
        for (const item of extractedActionItems) {
          const taskInsert = {
            title: item.title || "Action Item",
            description: item.description || "",
            created_by: createdBy,
            professor_id: matchedMeeting.professor_id,
            deadline: item.dueDate || null,
            status: "not_started",
            meeting_id: matchedMeeting.id,
            is_auto_generated: true
          };
          
          const { data: task, error: errr } = await serviceClient.from("tasks").insert(taskInsert).select().single();
          
          if (task && !errr) {
             let assignedScholars = scholarsData;
             
             if (item.assignee && item.assignee.toLowerCase() !== 'unassigned') {
                 const assigneeLower = String(item.assignee).toLowerCase();
                 const assigneeMatch = scholarsData.filter((s: any) => 
                     s.users?.name?.toLowerCase().includes(assigneeLower) ||
                     s.users?.email?.toLowerCase().includes(assigneeLower)
                 );
                 if (assigneeMatch.length > 0) {
                     assignedScholars = assigneeMatch;
                 }
             }

             for (const sch of assignedScholars) {
                await serviceClient.from("task_assignments").insert({
                   task_id: task.id,
                   scholar_id: sch.id,
                   status: "not_started"
                });
             }
          }
        }
      }
    }
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
