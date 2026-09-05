export type CalendarEvent = {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string | null;
  location: string;
};

export function toCalendarStamp(value: string) {
  return new Date(value).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

export function escapeIcs(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

function calendarEndIso(event: CalendarEvent) {
  const start = new Date(event.startsAt).getTime();
  if (event.endsAt) { const end = new Date(event.endsAt).getTime(); if (Number.isFinite(end) && end >= start) return new Date(end).toISOString(); }
  return new Date(start + 3 * 60 * 60 * 1000).toISOString();
}

export function buildIcsCalendar(event: CalendarEvent, url: string, now = new Date()) {
  const endIso = calendarEndIso(event);
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//NOXA//Meets//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${event.id}@noxastreetapp.com`,
    `DTSTAMP:${toCalendarStamp(now.toISOString())}`,
    `DTSTART:${toCalendarStamp(event.startsAt)}`,
    `DTEND:${toCalendarStamp(endIso)}`,
    `SUMMARY:${escapeIcs(event.title)}`,
    `LOCATION:${escapeIcs(event.location)}`,
    `DESCRIPTION:${escapeIcs(`NOXA Meets · ${url}`)}`,
    `URL:${url}`,
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}

export function buildGoogleCalendarUrl(event: CalendarEvent, url: string) {
  const endIso = calendarEndIso(event);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${toCalendarStamp(event.startsAt)}/${toCalendarStamp(endIso)}`,
    details: `NOXA Meets · ${url}`,
    location: event.location,
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}
