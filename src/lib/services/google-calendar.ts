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
  attendeeEmails?: string[]; // emails to invite via Google Calendar
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

  // Add attendees so they get email invites
  if (params.attendeeEmails?.length) {
    event.attendees = params.attendeeEmails.map((email: string) => ({ email }));
  }

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
  // Send email invites to all attendees
  url.searchParams.set("sendUpdates", "all");

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

export async function deleteCalendarEvent(params: {
  eventId: string;
  accessToken: string;
}): Promise<boolean> {
  const { eventId, accessToken } = params;
  const calendarId = "primary";

  if (!accessToken || !eventId) return false;

  const url = new URL(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`
  );
  // Send email notifications to attendees
  url.searchParams.set("sendUpdates", "all");

  const response = await fetch(url.toString(), {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    if (response.status === 410) return true; // Already deleted
    console.error(`Failed to delete Google Calendar event: ${response.status}`);
    return false;
  }

  return true;
}

export async function updateCalendarEvent(params: {
  eventId: string;
  accessToken: string;
  title?: string;
  date?: string;
  duration?: number;
  agenda?: string;
}): Promise<boolean> {
  const { eventId, accessToken } = params;
  const calendarId = "primary";

  if (!accessToken || !eventId) return false;

  const patchBody: any = {};
  if (params.title) patchBody.summary = params.title;
  if (params.agenda) patchBody.description = params.agenda;
  
  if (params.date) {
    const startDate = new Date(params.date);
    const endDate = new Date(startDate.getTime() + (params.duration || 60) * 60 * 1000);
    patchBody.start = { dateTime: startDate.toISOString() };
    patchBody.end = { dateTime: endDate.toISOString() };
  }

  const url = new URL(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`
  );
  // Send email notifications to attendees for updates
  url.searchParams.set("sendUpdates", "all");

  const response = await fetch(url.toString(), {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(patchBody),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error(`Failed to update Google Calendar event: ${response.status} ${err}`);
    return false;
  }

  return true;
}
