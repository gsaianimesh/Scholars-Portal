const FATHOM_API_BASE = "https://api.fathom.ai/external/v1";

export interface FathomMeeting {
  id: string;
  title: string;
  transcript: string;
  summary: string;
  duration: number;
  date: string;
}

export interface FathomTranscriptItem {
  speaker: {
    display_name: string;
    matched_calendar_invitee_email?: string;
  };
  text: string;
  timestamp: string;
}

export async function fetchFathomTranscript(
  recordingId: string,
  overrideApiKey?: string
): Promise<string> {
  const apiKey = overrideApiKey || process.env.FATHOM_API_KEY;
  if (!apiKey) {
    throw new Error("FATHOM_API_KEY is not configured and no override provided");
  }

  const response = await fetch(
    `${FATHOM_API_BASE}/recordings/${encodeURIComponent(recordingId)}/transcript`,
    {
      headers: {
        "X-Api-Key": apiKey,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Fathom API error: ${response.status} - ${errText}`);
  }

  const data = await response.json();

  // Convert transcript array to a readable string
  const transcriptItems: FathomTranscriptItem[] = data.transcript || [];
  const transcriptText = transcriptItems
    .map((item) => `[${item.timestamp}] ${item.speaker.display_name}: ${item.text}`)
    .join("\n");

  return transcriptText;
}

export async function fetchFathomSummary(
  recordingId: string,
  overrideApiKey?: string
): Promise<string> {
  const apiKey = overrideApiKey || process.env.FATHOM_API_KEY;
  if (!apiKey) {
    throw new Error("FATHOM_API_KEY is not configured and no override provided");
  }

  const response = await fetch(
    `${FATHOM_API_BASE}/recordings/${encodeURIComponent(recordingId)}/summary`,
    {
      headers: {
        "X-Api-Key": apiKey,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Fathom API error: ${response.status} - ${errText}`);
  }

  const data = await response.json();
  
  if (data.summary) {
    if (typeof data.summary === 'object') {
      return data.summary.markdown_formatted || data.summary.text || JSON.stringify(data.summary);
    }
    if (typeof data.summary === 'string') {
      try {
        const parsed = JSON.parse(data.summary);
        return parsed.markdown_formatted || parsed.text || data.summary;
      } catch {
        return data.summary;
      }
    }
  }
  
  return "";
}

export async function fetchFathomRecordingData(
  recordingId: string,
  overrideApiKey?: string
): Promise<{ transcript: string; summary: string }> {
  // Fetch both transcript and summary in parallel
  const [transcript, summary] = await Promise.all([
    fetchFathomTranscript(recordingId, overrideApiKey),
    fetchFathomSummary(recordingId, overrideApiKey),
  ]);

  return { transcript, summary };
}

export async function listFathomMeetings(
  after?: string,
  overrideApiKey?: string
): Promise<FathomMeeting[]> {
  const apiKey = overrideApiKey || process.env.FATHOM_API_KEY;
  if (!apiKey) {
    throw new Error("FATHOM_API_KEY is not configured and no override provided");
  }

  const url = new URL(`${FATHOM_API_BASE}/meetings`);
  if (after) {
    url.searchParams.set("created_after", after);
  }
  // Include transcript so we can access it if needed
  url.searchParams.set("include_transcript", "false");

  const response = await fetch(url.toString(), {
    headers: {
      "X-Api-Key": apiKey,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Fathom API error: ${response.status} - ${errText}`);
  }

  const data = await response.json();
  return (data.items || []).map((meeting: any) => ({
    id: String(meeting.recording_id),
    title: meeting.title || meeting.meeting_title || "",
    transcript: "",
    duration: 0,
    date: meeting.recording_start_time || meeting.created_at || "",
  }));
}

// Keep the old type name as an alias for backwards compatibility
export type FathomTranscript = FathomMeeting;

// Webhook management functions
export async function registerFathomWebhook(
  webhookUrl: string,
  apiKey: string
): Promise<{ id: string; url: string; secret?: string }> {
  // Try to list existing webhooks to avoid duplicates
  try {
    const existingWebhooks = await listFathomWebhooks(apiKey);
    const existing = existingWebhooks.find((wh: any) => wh.url === webhookUrl || wh.destination_url === webhookUrl);
    if (existing) {
      console.log(`[Fathom Service] Webhook already exists for ${webhookUrl}`);
      return { id: existing.id, url: existing.url || existing.destination_url, secret: existing.secret };
    }
  } catch (err) {
    console.warn("[Fathom Service] Failed to check existing webhooks, proceeding with registration: " + (err instanceof Error ? err.message : String(err)));
  }

  const response = await fetch(`${FATHOM_API_BASE}/webhooks`, {
    method: "POST",
    headers: {
      "X-Api-Key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      destination_url: webhookUrl,
      triggered_for: [
        "my_recordings"
      ],
      include_transcript: true,
      include_summary: true,
      include_action_items: true,
      include_crm_matches: false,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    const cleanError = errText.includes('<!DOCTYPE html>') ? 'Fathom API Endpoint Not Found' : errText.slice(0, 100);
    throw new Error(`Fathom webhook registration failed: ${response.status} - ${cleanError}`);
  }

  const data = await response.json();
  return { id: data.id, url: data.url || data.destination_url, secret: data.secret };
}

export async function deleteFathomWebhook(
  webhookId: string,
  apiKey: string
): Promise<void> {
  const response = await fetch(`${FATHOM_API_BASE}/webhooks/${webhookId}`, {
    method: "DELETE",
    headers: {
      "X-Api-Key": apiKey,
    },
  });

  if (!response.ok && response.status !== 404) {
    const errText = await response.text();
    throw new Error(`Fathom webhook deletion failed: ${response.status} - ${errText}`);
  }
}

export async function listFathomWebhooks(
  apiKey: string
): Promise<any[]> {
  const response = await fetch(`${FATHOM_API_BASE}/webhooks`, {
    headers: {
      "X-Api-Key": apiKey,
    },
  });

  if (!response.ok) {
    const errText = await response.text();
    const cleanError = errText.includes('<!DOCTYPE html>') ? 'Fathom API Endpoint Not Found Configuration Error' : errText.slice(0, 100);
    throw new Error(`Fathom webhooks list failed: ${response.status} - ${cleanError}`);
  }

  const data = await response.json();
  return data.items || data || [];
}
