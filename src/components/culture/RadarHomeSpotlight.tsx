import Link from "next/link";

import type { Locale } from "@/i18n/landing-copy";
import { isEventCurrentlyVisible } from "@/lib/meets/eventVisibility";

import styles from "./RadarHomeSpotlight.module.css";

const RADAR_SUPABASE_URL = "https://qrouwtqsqrfeeeppyeru.supabase.co";
const RADAR_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_vR9wivNa_fIb0QKmqua6Wg_H_7OPvUk";

const CATEGORY_LABELS: Record<string, string> = { car_meet: "CAR MEET", moto_meet: "MOTO MEET", track_day: "TRACK DAY", drag: "DRAG", drift: "DRIFT", rally: "RALLY", show: "AUTO SHOW", cars_and_coffee: "CARS & COFFEE", group_drive: "GROUP DRIVE", festival: "FESTIVAL", other: "EVENT" };

type RadarRow = { id: string; public_slug: string; title: string; event_type: string; starts_at: string; ends_at: string | null; timezone: string | null; city: string | null; location_text: string | null; country_code: string };

const copy = {
  en: { eyebrow: "THIS WEEKEND", weekendTitle: "This weekend in Greece.", fallbackTitle: "Upcoming meets.", weekendBody: "Pick a city. Pick a meet. Go.", fallbackBody: "Real events. Clear details. One place.", cta: "Explore Meets", empty: "No public events are listed right now." },
  el: { eyebrow: "ΑΥΤΟ ΤΟ ΣΑΒΒΑΤΟΚΥΡΙΑΚΟ", weekendTitle: "Αυτό το Σαββατοκύριακο στην Ελλάδα.", fallbackTitle: "Upcoming meets.", weekendBody: "Διάλεξε πόλη. Διάλεξε meet. Φύγαμε.", fallbackBody: "Πραγματικά events. Καθαρά στοιχεία. Σε ένα μέρος.", cta: "Δες τα Meets", empty: "Δεν υπάρχουν δημόσια events αυτή τη στιγμή." },
} as const;

function formatDate(value: string, timezone: string | null, locale: Locale) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale === "el" ? "el-GR" : "en-GB", { day: "numeric", month: "short", timeZone: timezone || "Europe/Athens" }).format(date);
}

function weekendWindow() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const day = today.getDay();
  const daysUntilSaturday = day === 6 ? 0 : (6 - day + 7) % 7;
  const start = new Date(today);
  start.setDate(start.getDate() + daysUntilSaturday);
  const end = new Date(start);
  end.setDate(end.getDate() + 2);
  return { start: start.getTime(), end: end.getTime() };
}

async function loadUpcoming(): Promise<RadarRow[]> {
  const query = new URLSearchParams({ select: "id,public_slug,title,event_type,starts_at,ends_at,timezone,city,location_text,country_code", status: "eq.published", order: "starts_at.asc", limit: "80" });
  try {
    const response = await fetch(`${RADAR_SUPABASE_URL}/rest/v1/radar_events?${query.toString()}`, { headers: { apikey: RADAR_SUPABASE_PUBLISHABLE_KEY }, next: { revalidate: 120 } });
    if (!response.ok) return [];
    const rows = await response.json() as RadarRow[];
    return rows.filter((row) => isEventCurrentlyVisible(row.starts_at, row.ends_at));
  } catch { return []; }
}

export async function RadarHomeSpotlight({ locale }: { locale: Locale }) {
  const all = await loadUpcoming();
  const { start, end } = weekendWindow();
  const weekend = all.filter((event) => { const value = new Date(event.starts_at).getTime(); return event.country_code === "GR" && value >= start && value < end; });
  const events = (weekend.length ? weekend : all).slice(0, 3);
  const text = copy[locale];
  const meetsHref = locale === "el" ? "/el/meets" : "/meets";
  const eventPrefix = locale === "el" ? "/el/meets" : "/meets";
  const cityCounts = weekend.reduce<Record<string, number>>((acc, event) => { const city = event.city?.trim(); if (city) acc[city] = (acc[city] ?? 0) + 1; return acc; }, {});
  const cityLine = Object.entries(cityCounts).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([city, count]) => `${city} ${count}`).join(" · ");

  return <section className={styles.section} aria-labelledby="live-radar-heading"><div className={styles.shell}>
    <div className={styles.heading}><div>
      <p className={styles.eyebrow}><span aria-hidden="true" />{weekend.length ? text.eyebrow : (locale === "el" ? "ΕΠΟΜΕΝΑ EVENTS" : "HAPPENING NEXT")}</p>
      <h2 id="live-radar-heading">{weekend.length ? text.weekendTitle : text.fallbackTitle}</h2>
      <p className={styles.body}>{weekend.length ? `${text.weekendBody}${cityLine ? ` · ${cityLine}` : ""}` : text.fallbackBody}</p>
    </div><Link className={styles.cta} href={meetsHref}>{text.cta} <span aria-hidden="true">→</span></Link></div>
    {events.length ? <div className={styles.grid}>{events.map((event) => <Link className={styles.card} href={`${eventPrefix}/${event.public_slug}`} key={event.id}>
      <div className={styles.cardTop}><span>{formatDate(event.starts_at, event.timezone, locale)}</span><span>{CATEGORY_LABELS[event.event_type] ?? "EVENT"}</span></div>
      <h3>{event.title}</h3><p>{event.city ?? event.location_text ?? event.country_code}</p><span className={styles.cardLink}>{locale === "el" ? "Δες το event" : "View event"} →</span>
    </Link>)}</div> : <div className={styles.empty}>{text.empty}</div>}
  </div></section>;
}
