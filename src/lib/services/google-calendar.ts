export interface CalendarEvent {
  id: string;
  htmlLink: string;
  status: string;
}

export async function createCalendarEvent(params: {
  title: string;
  date: string;
  link?: string;
  agenda?: string;
  duration?: number; // minutes, default 60
}): Promise<CalendarEvent | null> {
  const accessToken = process.env.GOOGLE_CALENDAR_ACCESS_TOKEN;
  const calendarId = process.env.GOOGLE_CALENDAR_ID || "primary";

  if (!accessToken) {
    console.warn("Google Calendar not configured — skipping calendar event creation.");
    return null;
  }

  const startDate = new Date(params.date);
  const endDate = new Date(startDate.getTime() + (params.duration || 60) * 60 * 1000);

  const event = {
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
    conferenceData: params.link
      ? undefined
      : undefined,
    source: params.link
      ? { title: "Meeting Link", url: params.link }
      : undefined,
  };

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    }
  );

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
  };
}
