import Link from "next/link";
import { notFound } from "next/navigation";

import { NoxaLogo } from "@/components/brand/NoxaLogo";
import { isEventCurrentlyVisible } from "@/lib/meets/eventVisibility";

import { EventActions } from "./EventActions";
import styles from "./EventDetailPage.module.css";

const SUPABASE_URL = "https://qrouwtqsqrfeeeppyeru.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_vR9wivNa_fIb0QKmqua6Wg_H_7OPvUk";

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

type EventRow = {
  id: string;
  public_slug: string;
  title: string;
  event_type: string;
  starts_at: string;
  ends_at: string | null;
  timezone: string | null;
  location_text: string | null;
  city: string | null;
  region: string | null;
  country_code: string;
  organizer_name: string | null;
  organizer_url: string | null;
  source_name: string;
  source_url: string;
  summary: string | null;
};

export async function loadPublicEvent(slug: string): Promise<EventRow | null> {
  const query = new URLSearchParams({
    select: "id,public_slug,title,event_type,starts_at,ends_at,timezone,location_text,city,region,country_code,organizer_name,organizer_url,source_name,source_url,summary",
    public_slug: `eq.${slug}`,
    status: "eq.published",
    limit: "1",
  });
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/radar_events?${query.toString()}`, {
      headers: { apikey: SUPABASE_PUBLISHABLE_KEY },
      next: { revalidate: 60 },
    });
    if (!response.ok) return null;
    const rows = await response.json() as EventRow[];
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

function formatDate(value: string, timezone: string | null, locale: "en" | "el") {
  const date = new Date(value);
  return new Intl.DateTimeFormat(locale === "el" ? "el-GR" : "en-GB", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timezone || "Europe/Athens",
  }).format(date);
}

function category(type: string) {
  return CATEGORY_LABELS[type] ?? "EVENT";
}

export async function EventDetailPage({ slug, locale }: { slug: string; locale: "en" | "el" }) {
  const event = await loadPublicEvent(slug);
  if (!event || !isEventCurrentlyVisible(event.starts_at, event.ends_at)) notFound();

  const place = [event.location_text, event.city, event.region].filter(Boolean).join(" · ") || event.country_code;
  const organizer = event.organizer_name || event.source_name;
  const organizerUrl = event.organizer_url || event.source_url;
  const mapQuery = [event.location_text, event.city, event.region, event.country_code].filter(Boolean).join(", ");
  const backHref = locale === "el" ? "/el/meets" : "/meets";

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link className={styles.brand} href={locale === "el" ? "/el" : "/"} aria-label="NOXA home">
          <NoxaLogo />
        </Link>
        <Link className={styles.back} href={backHref}>← Meets</Link>
      </header>

      <main>
        <section className={styles.hero}>
          <div className={styles.heroMedia} aria-hidden="true" />
          <div className={styles.heroShade} aria-hidden="true" />
          <div className={styles.shell}>
            <p className={styles.category}>{category(event.event_type)}</p>
            <h1>{event.title}</h1>
            <p className={styles.heroMeta}>{formatDate(event.starts_at, event.timezone, locale)}</p>
            <p className={styles.heroPlace}>{place}</p>
          </div>
        </section>

        <section className={styles.content}>
          <div className={styles.shell}>
            <div className={styles.grid}>
              <div className={styles.mainColumn}>
                <EventActions eventId={event.id} eventTitle={event.title} locale={locale} mapQuery={mapQuery} />

                <section className={styles.block}>
                  <span>{locale === "el" ? "ΣΧΕΤΙΚΑ" : "ABOUT"}</span>
                  <p>{event.summary?.trim() || (locale === "el" ? "Δες τις επίσημες πληροφορίες του organizer πριν ξεκινήσεις." : "Check the organizer's official details before travelling.")}</p>
                </section>

                <section className={styles.block}>
                  <span>{locale === "el" ? "ΤΟΠΟΘΕΣΙΑ" : "LOCATION"}</span>
                  <strong>{place}</strong>
                </section>
              </div>

              <aside className={styles.organizerCard}>
                <span>{locale === "el" ? "ΔΙΟΡΓΑΝΩΤΗΣ" : "ORGANIZED BY"}</span>
                <h2>{organizer}</h2>
                <a href={organizerUrl} rel="noreferrer" target="_blank">{locale === "el" ? "Επίσημη πηγή" : "Official source"} ↗</a>
                <small>{locale === "el" ? "Οι τελικές λεπτομέρειες παραμένουν ευθύνη του organizer." : "Final event details remain the organizer's responsibility."}</small>
              </aside>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
