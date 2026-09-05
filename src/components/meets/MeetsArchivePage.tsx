import Link from "next/link";

import { NoxaLogo } from "@/components/brand/NoxaLogo";
import { isEventCurrentlyVisible } from "@/lib/meets/eventVisibility";

import styles from "./MeetsDirectory.module.css";

const SUPABASE_URL = "https://qrouwtqsqrfeeeppyeru.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_vR9wivNa_fIb0QKmqua6Wg_H_7OPvUk";

type Row = {
  id: string;
  public_slug: string;
  title: string;
  event_type: string;
  starts_at: string;
  ends_at: string | null;
  timezone: string | null;
  location_text: string | null;
  city: string | null;
  organizer_name: string | null;
  source_name: string;
};

const CATEGORY: Record<string, string> = {
  car_meet: "CAR MEET", moto_meet: "MOTO MEET", track_day: "TRACK DAY", drag: "DRAG", drift: "DRIFT", rally: "RALLY", show: "AUTO SHOW", cars_and_coffee: "CARS & COFFEE", group_drive: "GROUP DRIVE", festival: "FESTIVAL", other: "EVENT",
};

async function loadPastEvents() {
  const params = new URLSearchParams({
    select: "id,public_slug,title,event_type,starts_at,ends_at,timezone,location_text,city,organizer_name,source_name",
    status: "eq.published",
    order: "starts_at.desc",
    limit: "180",
  });
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/radar_events?${params.toString()}`, {
      headers: { apikey: SUPABASE_PUBLISHABLE_KEY },
      next: { revalidate: 300 },
    });
    if (!response.ok) return [] as Row[];
    const rows = await response.json() as Row[];
    return rows.filter((row) => !isEventCurrentlyVisible(row.starts_at, row.ends_at));
  } catch {
    return [] as Row[];
  }
}

function dateParts(row: Row, locale: "en" | "el") {
  const date = new Date(row.starts_at);
  const targetLocale = locale === "el" ? "el-GR" : "en-GB";
  const timeZone = row.timezone || "Europe/Athens";
  return {
    day: new Intl.DateTimeFormat(targetLocale, { day: "2-digit", timeZone }).format(date),
    month: new Intl.DateTimeFormat(targetLocale, { month: "short", timeZone }).format(date).replace(/\.$/, "").toUpperCase(),
    weekday: new Intl.DateTimeFormat(targetLocale, { weekday: "short", timeZone }).format(date).replace(/\.$/, "").toUpperCase(),
    time: new Intl.DateTimeFormat(targetLocale, { hour: "2-digit", minute: "2-digit", hour12: false, timeZone }).format(date),
  };
}

export async function MeetsArchivePage({ locale }: { locale: "en" | "el" }) {
  const events = await loadPastEvents();
  const base = locale === "el" ? "/el" : "";
  const t = locale === "el"
    ? { title: "Προηγούμενα events.", body: "Το αρχείο των meets και motorsport events που έχουν ολοκληρωθεί.", back: "Πίσω στα Meets", empty: "Δεν υπάρχουν προηγούμενα events ακόμα.", view: "Δες Event", past: "PAST EVENT" }
    : { title: "Past events.", body: "The archive of meets and motorsport events that have already finished.", back: "Back to Meets", empty: "No past events yet.", view: "View Event", past: "PAST EVENT" };

  return <div className={styles.page}>
    <header className={styles.header}>
      <Link className={styles.brand} href={base || "/"} aria-label="NOXA home"><NoxaLogo /></Link>
      <Link className={styles.addHeader} href={`${base}/meets`}>← {t.back}</Link>
    </header>
    <main>
      <section className={styles.hero}>
        <div className={styles.heroMedia} aria-hidden="true" /><div className={styles.heroShade} aria-hidden="true" />
        <div className={styles.shell}><p className={styles.eyebrow}>NOXA MEETS · ARCHIVE</p><h1>{t.title}</h1><p>{t.body}</p></div>
      </section>
      <section className={styles.feed}><div className={styles.shell}>
        <div className={styles.feedTop}><span>{t.past}</span><strong>{events.length} events</strong></div>
        {events.length ? <div className={styles.grid}>{events.map((event) => { const date = dateParts(event, locale); return <Link className={styles.card} href={`${base}/meets/${event.public_slug}`} key={event.id}>
          <div className={styles.cardTop}><div className={styles.dateBadge}><span>{date.weekday}</span><strong>{date.day}</strong><small>{date.month}</small></div><div className={styles.cardMeta}><span className={styles.time}>{date.time}</span><span className={styles.category}>{CATEGORY[event.event_type] ?? "EVENT"}</span></div></div>
          <div className={styles.badges}><span>{t.past}</span></div><h3>{event.title}</h3><p>{[event.location_text, event.city].filter(Boolean).join(" · ")}</p><small className={styles.organizer}>{event.organizer_name ?? event.source_name}</small><strong className={styles.cardLink}>{t.view} →</strong>
        </Link>; })}</div> : <div className={styles.empty}>{t.empty}</div>}
      </div></section>
    </main>
  </div>;
}
