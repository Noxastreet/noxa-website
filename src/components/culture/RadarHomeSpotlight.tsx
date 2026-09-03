import Link from "next/link";

import type { Locale } from "@/i18n/landing-copy";

import styles from "./RadarHomeSpotlight.module.css";

const RADAR_SUPABASE_URL = "https://qrouwtqsqrfeeeppyeru.supabase.co";
const RADAR_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_vR9wivNa_fIb0QKmqua6Wg_H_7OPvUk";

const CATEGORY_LABELS: Record<string, string> = {
  car_meet: "CAR MEET",
  moto_meet: "MOTO MEET",
  track_day: "TRACK DAY",
  drag: "DRAG",
  drift: "DRIFT",
  rally: "RALLY",
  show: "AUTO SHOW",
  cars_and_coffee: "CARS & COFFEE",
  group_drive: "GROUP DRIVE",
  festival: "FESTIVAL",
  other: "EVENT",
};

type RadarRow = {
  id: string;
  public_slug: string;
  title: string;
  event_type: string;
  starts_at: string;
  ends_at: string | null;
  timezone: string | null;
  city: string | null;
  location_text: string | null;
  country_code: string;
};

const copy = {
  en: {
    eyebrow: "HAPPENING NEXT",
    title: "Upcoming meets.",
    body: "Real events. Clear details. One place.",
    cta: "View all Meets",
    empty: "No public events are listed right now.",
  },
  el: {
    eyebrow: "ΕΠΟΜΕΝΑ EVENTS",
    title: "Upcoming meets.",
    body: "Πραγματικά events. Καθαρά στοιχεία. Σε ένα μέρος.",
    cta: "Δες όλα τα Meets",
    empty: "Δεν υπάρχουν δημόσια events αυτή τη στιγμή.",
  },
} as const;

function formatDate(value: string, timezone: string | null, locale: Locale) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale === "el" ? "el-GR" : "en-GB", {
    day: "numeric",
    month: "short",
    timeZone: timezone || "Europe/Athens",
  }).format(date);
}

function categoryLabel(type: string) {
  return CATEGORY_LABELS[type] ?? "EVENT";
}

async function loadUpcoming(): Promise<RadarRow[]> {
  const query = new URLSearchParams({
    select: "id,public_slug,title,event_type,starts_at,ends_at,timezone,city,location_text,country_code",
    status: "eq.published",
    order: "starts_at.asc",
    limit: "16",
  });

  try {
    const response = await fetch(`${RADAR_SUPABASE_URL}/rest/v1/radar_events?${query.toString()}`, {
      headers: { apikey: RADAR_SUPABASE_PUBLISHABLE_KEY },
      next: { revalidate: 120 },
    });

    if (!response.ok) return [];
    const rows = await response.json() as RadarRow[];
    const now = Date.now() - 15 * 60 * 1000;
    return rows
      .filter((row) => {
        const relevant = new Date(row.ends_at ?? row.starts_at).getTime();
        return Number.isFinite(relevant) && relevant >= now;
      })
      .slice(0, 3);
  } catch {
    return [];
  }
}

export async function RadarHomeSpotlight({ locale }: { locale: Locale }) {
  const events = await loadUpcoming();
  const text = copy[locale];
  const meetsHref = locale === "el" ? "/el/meets" : "/meets";
  const eventPrefix = locale === "el" ? "/el/meets" : "/meets";

  return (
    <section className={styles.section} aria-labelledby="live-radar-heading">
      <div className={styles.shell}>
        <div className={styles.heading}>
          <div>
            <p className={styles.eyebrow}><span aria-hidden="true" />{text.eyebrow}</p>
            <h2 id="live-radar-heading">{text.title}</h2>
            <p className={styles.body}>{text.body}</p>
          </div>
          <Link className={styles.cta} href={meetsHref}>
            {text.cta} <span aria-hidden="true">→</span>
          </Link>
        </div>

        {events.length ? (
          <div className={styles.grid}>
            {events.map((event) => (
              <Link className={styles.card} href={`${eventPrefix}/${event.public_slug}`} key={event.id}>
                <div className={styles.cardTop}>
                  <span>{formatDate(event.starts_at, event.timezone, locale)}</span>
                  <span>{categoryLabel(event.event_type)}</span>
                </div>
                <h3>{event.title}</h3>
                <p>{event.city ?? event.location_text ?? event.country_code}</p>
                <span className={styles.cardLink}>{locale === "el" ? "Δες το event" : "View event"} →</span>
              </Link>
            ))}
          </div>
        ) : (
          <div className={styles.empty}>{text.empty}</div>
        )}
      </div>
    </section>
  );
}
