import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";

import { RadarCountryGate } from "@/components/radar/RadarCountryGate";
import type { RadarEvent } from "@/components/radar/radarEvents";

const RADAR_SUPABASE_URL = "https://qrouwtqsqrfeeeppyeru.supabase.co";
const RADAR_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_vR9wivNa_fIb0QKmqua6Wg_H_7OPvUk";

export const metadata: Metadata = {
  title: "NOXA — Automotive events by country",
  description:
    "Discover public automotive and motorcycle gatherings by country with NOXA.",
  alternates: {
    canonical: "https://noxastreetapp.com/radar",
  },
};

type RadarEventRow = {
  id: string;
  country_code: string;
  title: string;
  event_type: string;
  starts_at: string;
  ends_at: string | null;
  timezone: string;
  location_text: string | null;
  city: string | null;
  region: string | null;
  source_name: string;
  source_url: string;
  summary: string | null;
  status: string;
};

const CATEGORY_LABELS: Record<string, string> = {
  car_meet: "CAR MEET",
  moto_meet: "MOTO MEET",
  track_day: "TRACK DAY",
  drag: "DRAG RACING",
  drift: "DRIFT",
  rally: "RALLY",
  show: "AUTO SHOW",
  cars_and_coffee: "CARS & COFFEE",
  group_drive: "GROUP DRIVE",
  festival: "FESTIVAL",
  other: "EVENT",
};

function fallbackCountryFromLanguage(value: string | null) {
  if (!value) return "GR";
  const match = value.match(/[-_]([A-Za-z]{2})(?:[,;]|$)/);
  return match?.[1]?.toUpperCase() ?? "GR";
}

function eventCategory(eventType: string) {
  return CATEGORY_LABELS[eventType] ?? "EVENT";
}

function dateParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return {
    day: value("day"),
    month: value("month"),
    year: value("year"),
    hour: value("hour"),
    minute: value("minute"),
  };
}

function fullMonth(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat("en", { timeZone, month: "long" }).format(date);
}

function sameCalendarDate(a: ReturnType<typeof dateParts>, b: ReturnType<typeof dateParts>) {
  return a.day === b.day && a.month === b.month && a.year === b.year;
}

function formatEventDate(row: RadarEventRow) {
  const timeZone = row.timezone || "UTC";
  const start = new Date(row.starts_at);
  const end = row.ends_at ? new Date(row.ends_at) : null;
  const startParts = dateParts(start, timeZone);
  const endParts = end ? dateParts(end, timeZone) : null;
  const startMonthLong = fullMonth(start, timeZone);
  const startDay = String(Number(startParts.day));
  const startMonthShort = startParts.month.toUpperCase();

  let dateLabel = `${startDay} ${startMonthShort}`;
  let dateDetail = `${startDay} ${startMonthLong} ${startParts.year}`;

  if (end && endParts && !sameCalendarDate(startParts, endParts)) {
    const endDay = String(Number(endParts.day));
    const endMonthLong = fullMonth(end, timeZone);
    if (startParts.month === endParts.month && startParts.year === endParts.year) {
      dateLabel = `${startDay}–${endDay} ${startMonthShort}`;
      dateDetail = `${startDay}–${endDay} ${startMonthLong} ${startParts.year}`;
    } else {
      dateLabel = `${startDay} ${startMonthShort} – ${endDay} ${endParts.month.toUpperCase()}`;
      dateDetail = `${startDay} ${startMonthLong} ${startParts.year} – ${endDay} ${endMonthLong} ${endParts.year}`;
    }
    return { dateLabel, dateDetail };
  }

  const durationMs = end ? end.getTime() - start.getTime() : 0;
  const hasUsefulTime =
    !(startParts.hour === "00" && startParts.minute === "00") &&
    (!end || durationMs < 20 * 60 * 60 * 1000);

  if (hasUsefulTime) {
    const startTime = `${startParts.hour}:${startParts.minute}`;
    if (endParts) {
      dateDetail += ` · ${startTime}–${endParts.hour}:${endParts.minute}`;
    } else {
      dateDetail += ` · ${startTime}`;
    }
  }

  return { dateLabel, dateDetail };
}

function toRadarEvent(row: RadarEventRow): RadarEvent {
  const { dateLabel, dateDetail } = formatEventDate(row);
  const category = eventCategory(row.event_type);
  const location = row.location_text ?? row.city ?? row.region ?? row.country_code;
  const city = row.city ?? "";

  return {
    id: row.id,
    countryCode: row.country_code,
    eventType: row.event_type,
    title: row.title,
    category,
    dateLabel,
    dateDetail,
    location,
    city,
    description:
      row.summary?.trim() ||
      `Public ${category.toLowerCase()} listed by ${row.source_name}.`,
    sourceName: row.source_name,
    sourceUrl: row.source_url,
  };
}

async function loadPublishedEvents(): Promise<RadarEvent[]> {
  const query = new URLSearchParams({
    select:
      "id,country_code,title,event_type,starts_at,ends_at,timezone,location_text,city,region,source_name,source_url,summary,status",
    status: "eq.published",
    order: "starts_at.asc",
    limit: "500",
  });

  try {
    const response = await fetch(
      `${RADAR_SUPABASE_URL}/rest/v1/radar_events?${query.toString()}`,
      {
        headers: {
          apikey: RADAR_SUPABASE_PUBLISHABLE_KEY,
        },
        next: { revalidate: 60 },
      },
    );

    if (!response.ok) {
      console.error("NOXA Radar events request failed", response.status);
      return [];
    }

    const rows = (await response.json()) as RadarEventRow[];
    const now = Date.now() - 15 * 60 * 1000;

    return rows
      .filter((row) => {
        const lastRelevantMoment = new Date(row.ends_at ?? row.starts_at).getTime();
        return Number.isFinite(lastRelevantMoment) && lastRelevantMoment >= now;
      })
      .map(toRadarEvent);
  } catch (error) {
    console.error("NOXA Radar events request failed", error);
    return [];
  }
}

export default async function RadarPage() {
  const [requestHeaders, events] = await Promise.all([
    headers(),
    loadPublishedEvents(),
  ]);
  const detectedCountryCode =
    requestHeaders.get("x-vercel-ip-country") ??
    fallbackCountryFromLanguage(requestHeaders.get("accept-language"));

  return (
    <>
      <RadarCountryGate detectedCountryCode={detectedCountryCode} events={events} />
      <Link
        href="/radar/submit"
        className="fixed bottom-[max(18px,env(safe-area-inset-bottom))] right-4 z-20 inline-flex min-h-12 items-center justify-center rounded-full border border-[#e32c49]/55 bg-[#c8102e] px-5 text-sm font-bold text-white shadow-[0_12px_38px_rgba(0,0,0,.42)] transition-transform active:scale-[.98]"
      >
        Submit event <span className="ml-2" aria-hidden="true">＋</span>
      </Link>
    </>
  );
}
