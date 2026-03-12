import { NextRequest, NextResponse } from "next/server";
import { createCalendarEvent } from "@/lib/services/google-calendar";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { title, date, link, agenda, accessToken } = body;

  if (!title || !date) {
    return NextResponse.json({ error: "Title and date required" }, { status: 400 });
  }

  if (!accessToken) {
    // No Google token — calendar integration not available for this user
    return NextResponse.json({ calendarEventId: null, meetLink: null });
  }

  try {
    const event = await createCalendarEvent({ title, date, link, agenda, accessToken });

    if (event) {
      return NextResponse.json({
        calendarEventId: event.id,
        htmlLink: event.htmlLink,
        meetLink: event.meetLink || null,
      });
    }

    return NextResponse.json({ calendarEventId: null, meetLink: null });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create calendar event" },
      { status: 500 }
    );
  }
}
