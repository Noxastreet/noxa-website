import { eventInterval } from "./eventVisibility.ts";

export type MeetDateFilter = "today" | "tomorrow" | "weekend" | "month" | "all";

type DateParts = { year: number; month: number; day: number };

type LocalDayInterval = { startSerial: number; endSerial: number };

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

function localDayInterval(startsAt: string, endsAt: string | null, timeZone: string): LocalDayInterval | null {
  const interval = eventInterval(startsAt, endsAt);
  if (!interval) return null;
  return {
    startSerial: serialDay(dateParts(new Date(interval.startMs), timeZone)),
    endSerial: serialDay(dateParts(new Date(interval.endMs), timeZone)),
  };
}

export function isSameLocalDay(value: string, now: Date, timeZone: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  return serialDay(dateParts(date, timeZone)) === serialDay(dateParts(now, timeZone));
}

export function isThisWeekend(
  startsAt: string,
  now: Date,
  timeZone: string,
  endsAt: string | null = null,
) {
  const interval = localDayInterval(startsAt, endsAt, timeZone);
  if (!interval) return false;

  const current = dateParts(now, timeZone);
  const currentWeekday = weekday(current);
  const currentSerial = serialDay(current);
  const fridaySerial = currentSerial + (currentWeekday === 0 ? -2 : 5 - currentWeekday);

  return interval.startSerial <= fridaySerial + 2 && interval.endSerial >= fridaySerial;
}

export function matchesDateFilter(
  startsAt: string,
  filter: MeetDateFilter,
  timeZone = "Europe/Athens",
  now = new Date(),
  endsAt: string | null = null,
) {
  const interval = localDayInterval(startsAt, endsAt, timeZone);
  if (!interval) return false;
  if (filter === "all") return true;

  const nowParts = dateParts(now, timeZone);
  const nowSerial = serialDay(nowParts);

  if (filter === "today") return interval.startSerial <= nowSerial && interval.endSerial >= nowSerial;
  if (filter === "tomorrow") {
    const tomorrowSerial = nowSerial + 1;
    return interval.startSerial <= tomorrowSerial && interval.endSerial >= tomorrowSerial;
  }
  if (filter === "weekend") return isThisWeekend(startsAt, now, timeZone, endsAt);

  const monthStart = serialDay({ year: nowParts.year, month: nowParts.month, day: 1 });
  const nextMonthStart = nowParts.month === 12
    ? serialDay({ year: nowParts.year + 1, month: 1, day: 1 })
    : serialDay({ year: nowParts.year, month: nowParts.month + 1, day: 1 });
  return interval.startSerial < nextMonthStart && interval.endSerial >= monthStart;
}

export function eventDiscoveryState(
  startsAt: string,
  endsAt: string | null,
  timeZone = "Europe/Athens",
  now = new Date(),
): "happening" | "today" | "weekend" | null {
  const interval = eventInterval(startsAt, endsAt);
  const nowMs = now.getTime();
  if (interval && interval.startMs <= nowMs && interval.endMs >= nowMs) return "happening";
  if (matchesDateFilter(startsAt, "today", timeZone, now, endsAt)) return "today";
  if (matchesDateFilter(startsAt, "weekend", timeZone, now, endsAt)) return "weekend";
  return null;
}

export type DiscoveryQuery = { country: string; city: string; type: string; date: string; q: string };
export type DiscoveryEvent = { title: string; organizer: string; city: string; eventType: string; startsAt: string; endsAt?: string | null; timezone: string | null };
const DISCOVERY_MOTORSPORT = new Set(["track_day", "drag", "drift", "rally", "karting", "dexterity"]);
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
  if (!matchesDateFilter(event.startsAt, state.date as MeetDateFilter, event.timezone || "Europe/Athens", now, event.endsAt ?? null)) return false;
  const query = state.q.trim().toLocaleLowerCase(locale === "el" ? "el-GR" : "en-US");
  if (!query) return true;
  return [event.title, event.organizer, event.city].join(" ").toLocaleLowerCase(locale === "el" ? "el-GR" : "en-US").includes(query);
}
