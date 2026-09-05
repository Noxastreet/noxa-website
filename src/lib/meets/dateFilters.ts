export type MeetDateFilter = "today" | "tomorrow" | "weekend" | "month" | "all";

type DateParts = { year: number; month: number; day: number };

function dateParts(value: Date, timeZone: string): DateParts {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone,
  });
  const parts = formatter.formatToParts(value);
  const read = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value ?? 0);
  return { year: read("year"), month: read("month"), day: read("day") };
}

function serialDay(parts: DateParts) {
  return Math.floor(Date.UTC(parts.year, parts.month - 1, parts.day) / 86_400_000);
}

function weekday(parts: DateParts) {
  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day)).getUTCDay();
}

export function isSameLocalDay(value: string, now: Date, timeZone: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  return serialDay(dateParts(date, timeZone)) === serialDay(dateParts(now, timeZone));
}

export function isThisWeekend(value: string, now: Date, timeZone: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;

  const current = dateParts(now, timeZone);
  const currentWeekday = weekday(current);
  const currentSerial = serialDay(current);
  const daysUntilFriday = currentWeekday >= 5 ? -(currentWeekday - 5) : 5 - currentWeekday;
  const fridaySerial = currentSerial + daysUntilFriday;
  const eventSerial = serialDay(dateParts(date, timeZone));

  return eventSerial >= fridaySerial && eventSerial <= fridaySerial + 2;
}

export function matchesDateFilter(
  startsAt: string,
  filter: MeetDateFilter,
  timeZone = "Europe/Athens",
  now = new Date(),
) {
  const start = new Date(startsAt);
  if (Number.isNaN(start.getTime())) return false;
  if (filter === "all") return true;

  const startParts = dateParts(start, timeZone);
  const nowParts = dateParts(now, timeZone);
  const deltaDays = serialDay(startParts) - serialDay(nowParts);

  if (filter === "today") return deltaDays === 0;
  if (filter === "tomorrow") return deltaDays === 1;
  if (filter === "weekend") return isThisWeekend(startsAt, now, timeZone);
  return startParts.year === nowParts.year && startParts.month === nowParts.month;
}

export function eventDiscoveryState(
  startsAt: string,
  endsAt: string | null,
  timeZone = "Europe/Athens",
  now = new Date(),
): "happening" | "today" | "weekend" | null {
  const nowMs = now.getTime();
  const startMs = new Date(startsAt).getTime();
  const endMs = endsAt ? new Date(endsAt).getTime() : startMs + 3 * 60 * 60 * 1000;
  if (Number.isFinite(startMs) && Number.isFinite(endMs) && startMs <= nowMs && endMs >= nowMs) return "happening";
  if (matchesDateFilter(startsAt, "today", timeZone, now)) return "today";
  if (matchesDateFilter(startsAt, "weekend", timeZone, now)) return "weekend";
  return null;
}

export type DiscoveryQuery = { country: string; city: string; type: string; date: string; q: string };
export type DiscoveryEvent = { title: string; organizer: string; city: string; eventType: string; startsAt: string; timezone: string | null };
const DISCOVERY_MOTORSPORT = new Set(["track_day", "drag", "drift", "rally"]);
const DISCOVERY_MOTO = new Set(["moto_meet"]);

export function buildDiscoveryQuery(state: DiscoveryQuery) {
  const params = new URLSearchParams();
  if (state.country) params.set("country", state.country);
  if (state.city && state.city !== "all") params.set("city", state.city);
  if (state.type && state.type !== "all") params.set("type", state.type);
  if (state.date && state.date !== "all") params.set("date", state.date);
  if (state.q.trim()) params.set("q", state.q.trim());
  return params.toString();
}

function matchesDiscoveryType(eventType: string, type: string) {
  if (type === "all") return true;
  if (type === "moto") return DISCOVERY_MOTO.has(eventType);
  if (type === "motorsport") return DISCOVERY_MOTORSPORT.has(eventType);
  return !DISCOVERY_MOTO.has(eventType) && !DISCOVERY_MOTORSPORT.has(eventType);
}

export function matchesDiscoveryEvent(event: DiscoveryEvent, state: DiscoveryQuery, locale: "en" | "el", now = new Date()) {
  if (!matchesDiscoveryType(event.eventType, state.type)) return false;
  if (state.city !== "all" && event.city !== state.city) return false;
  if (!matchesDateFilter(event.startsAt, state.date as MeetDateFilter, event.timezone || "Europe/Athens", now)) return false;
  const query = state.q.trim().toLocaleLowerCase(locale === "el" ? "el-GR" : "en-US");
  if (!query) return true;
  return [event.title, event.organizer, event.city].join(" ").toLocaleLowerCase(locale === "el" ? "el-GR" : "en-US").includes(query);
}
