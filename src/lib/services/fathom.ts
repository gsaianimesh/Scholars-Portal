export interface FathomTranscript {
  id: string;
  title: string;
  transcript: string;
  duration: number;
  date: string;
}

export async function fetchFathomTranscript(
  fathomMeetingId: string
): Promise<FathomTranscript> {
  const apiKey = process.env.FATHOM_API_KEY;
  if (!apiKey) {
    throw new Error("FATHOM_API_KEY is not configured");
  }

  const response = await fetch(
    `https://api.fathom.video/v1/calls/${encodeURIComponent(fathomMeetingId)}`,
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Fathom API error: ${response.status} - ${errText}`);
  }

  const data = await response.json();

  return {
    id: data.id,
    title: data.title || "",
    transcript: data.transcript || "",
    duration: data.duration || 0,
    date: data.date || "",
  };
}

export async function listFathomMeetings(
  after?: string
): Promise<FathomTranscript[]> {
  const apiKey = process.env.FATHOM_API_KEY;
  if (!apiKey) {
    throw new Error("FATHOM_API_KEY is not configured");
  }

  const url = new URL("https://api.fathom.video/v1/calls");
  if (after) {
    url.searchParams.set("after", after);
  }

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Fathom API error: ${response.status} - ${errText}`);
  }

  const data = await response.json();
  return (data.calls || []).map((call: any) => ({
    id: call.id,
    title: call.title || "",
    transcript: call.transcript || "",
    duration: call.duration || 0,
    date: call.date || "",
  }));
}
