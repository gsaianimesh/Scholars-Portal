export interface CalendarEvent {
  id: string;
  htmlLink: string;
  status: string;
  meetLink?: string;
}

export async function createCalendarEvent(params: {
  title: string;
  date: string;
  link?: string;
  agenda?: string;
  duration?: number; // minutes, default 60
  accessToken: string; // user's Google OAuth token from Supabase session
}): Promise<CalendarEvent | null> {
  const { accessToken } = params;
  const calendarId = "primary";

  if (!accessToken) {
    console.warn("No Google access token — skipping calendar event creation.");
    return null;
  }

  const startDate = new Date(params.date);
  const endDate = new Date(startDate.getTime() + (params.duration || 60) * 60 * 1000);

  const event: Record<string, any> = {
    summary: params.title,
    description: params.agenda || "",
    start: {
      dateTime: startDate.toISOString(),
      timeZone: "UTC",
    },
    end: {
      dateTime: endDate.toISOString(),
      timeZone: "UTC",
    },
  };

  // If no custom link provided, auto-create a Google Meet conference
  if (!params.link) {
    event.conferenceData = {
      createRequest: {
        requestId: `scholar-portal-${Date.now()}`,
        conferenceSolutionKey: { type: "hangoutsMeet" },
      },
    };
  } else {
    // Attach custom meeting link as a source
    event.source = { title: "Meeting Link", url: params.link };
  }

  const url = new URL(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`
  );
  // conferenceDataVersion=1 is required to create Google Meet links
  url.searchParams.set("conferenceDataVersion", "1");

  const response = await fetch(url.toString(), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(event),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error(`Google Calendar API error: ${response.status} - ${errText}`);
    return null;
  }

  const data = await response.json();
  return {
    id: data.id,
    htmlLink: data.htmlLink,
    status: data.status,
    meetLink: data.conferenceData?.entryPoints?.find(
      (ep: any) => ep.entryPointType === "video"
    )?.uri,
  };
}
