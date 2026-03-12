import { NextRequest, NextResponse } from "next/server";
import { createCalendarEvent } from "@/lib/services/google-calendar";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { meetingId, title, date, link, agenda } = body;

  if (!title || !date) {
    return NextResponse.json({ error: "Title and date required" }, { status: 400 });
  }

  try {
    const event = await createCalendarEvent({ title, date, link, agenda });

    if (event) {
      return NextResponse.json({ calendarEventId: event.id, htmlLink: event.htmlLink });
    }

    return NextResponse.json({ calendarEventId: null });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create calendar event" },
      { status: 500 }
    );
  }
}
