import { google } from "googleapis";
import { auth } from "../auth/[...nextauth]/route";
import { NextResponse } from "next/server";

/** Ensure RFC 3339 for Google Calendar: add timezone if missing (Z or ±HH:MM). */
function toRfc3339(s: string): string {
  if (/[zZ]$|[-+]\d{2}:?\d{2}$/.test(s.trim())) return s;
  const o = -new Date().getTimezoneOffset();
  const sign = o >= 0 ? "+" : "-";
  const h = String(Math.floor(Math.abs(o) / 60)).padStart(2, "0");
  const m = String(Math.abs(o) % 60).padStart(2, "0");
  return `${s.trim()}${sign}${h}:${m}`;
}

export async function POST(req: Request) {
  // 1. Check if user is logged in (NextAuth v5: use auth() instead of getServerSession)
  const session = await auth();
  if (!session || !session.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Get the shifts from the client (the ones you didn't delete)
  const { shifts } = await req.json();

  // 3. Setup Google Calendar Client
  const oauth2 = new google.auth.OAuth2();
  oauth2.setCredentials({ access_token: session.accessToken });
  const calendar = google.calendar({ version: "v3", auth: oauth2 });

  let addedCount = 0;

  // 4. Loop through and add them
  for (const shift of shifts) {
    try {
      await calendar.events.insert({
        calendarId: "primary", // "primary" means your main calendar
        requestBody: {
          summary: shift.summary || "Work", // Default title if missing
          start: { dateTime: toRfc3339(shift.start) },
          end: { dateTime: toRfc3339(shift.end) },
        },
      });
      addedCount++;
    } catch (error) {
      console.error("Error adding shift:", error);
      // We continue loop even if one fails
    }
  }

  return NextResponse.json({ success: true, added: addedCount });
}