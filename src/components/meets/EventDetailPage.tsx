import Link from "next/link";
import { notFound } from "next/navigation";

import { DocumentLanguage } from "@/components/i18n/DocumentLanguage";
import { WebsiteHeader } from "@/components/navigation/WebsiteHeader";
import { loadOrganizerById } from "@/components/organizers/organizer-data";
import { isPastEvent } from "@/lib/meets/eventVisibility";

import { EventActions } from "./EventActions";
import styles from "./EventDetailPage.module.css";

const SUPABASE_URL = "https://qrouwtqsqrfeeeppyeru.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_vR9wivNa_fIb0QKmqua6Wg_H_7OPvUk";

const CATEGORY_LABELS: Record<"en" | "el", Record<string, string>> = {
  en: {
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
    karting: "KARTING",
    dexterity: "DEXTERITY",
    other: "EVENT",
  },
  el: {
    car_meet: "CAR MEET",
    moto_meet: "MOTO MEET",
    track_day: "TRACK DAY",
    drag: "DRAG RACING",
    drift: "DRIFT",
    rally: "ΡΑΛΛΥ",
    show: "AUTO SHOW",
    cars_and_coffee: "CARS & COFFEE",
    group_drive: "GROUP DRIVE",
    festival: "FESTIVAL",
    karting: "KARTING",
    dexterity: "ΔΕΞΙΟΤΕΧΝΙΑ",
    other: "EVENT",
  },
};

export type EventRow = {
  id: string;
  public_slug: string;
  title: string;
  title_el: string | null;
  event_type: string;
  starts_at: string;
  ends_at: string | null;
  timezone: string | null;
  location_text: string | null;
  location_text_el: string | null;
  city: string | null;
  region: string | null;
  country_code: string;
  organizer_name: string | null;
  organizer_url: string | null;
  organizer_profile_id: string | null;
  source_name: string;
  source_url: string;
  summary: string | null;
  summary_el: string | null;
  featured: boolean;
  partner_badge: string | null;
  cover_image_url: string | null;
  cover_image_source_url: string | null;
  cover_image_alt: string | null;
  cover_image_alt_el: string | null;
  latitude: number | null;
  longitude: number | null;
  location_precision: string | null;
};

export type LocalizedEventContent = {
  title: string;
  summary: string | null;
  locationText: string | null;
  coverImageAlt: string | null;
};

export function localizePublicEvent(event: EventRow, locale: "en" | "el"): LocalizedEventContent {
  if (locale === "el") {
    return {
      title: event.title_el?.trim() || event.title,
      summary: event.summary_el?.trim() || event.summary,
      locationText: event.location_text_el?.trim() || event.location_text,
      coverImageAlt: event.cover_image_alt_el?.trim() || event.cover_image_alt,
    };
  }

  return {
    title: event.title,
    summary: event.summary,
    locationText: event.location_text,
    coverImageAlt: event.cover_image_alt,
  };
}

export async function loadPublicEvent(slug: string): Promise<EventRow | null> {
  const query = new URLSearchParams({
    select: "id,public_slug,title,title_el,event_type,starts_at,ends_at,timezone,location_text,location_text_el,city,region,country_code,organizer_name,organizer_url,organizer_profile_id,source_name,source_url,summary,summary_el,featured,partner_badge,cover_image_url,cover_image_source_url,cover_image_alt,cover_image_alt_el,latitude,longitude,location_precision",
    public_slug: `eq.${slug}`,
    status: "eq.published",
    limit: "1",
  });
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/radar_events?${query}`, {
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
  return new Intl.DateTimeFormat(locale === "el" ? "el-GR" : "en-GB", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timezone || "Europe/Athens",
  }).format(new Date(value));
}

function categoryLabel(eventType: string, locale: "en" | "el") {
  return CATEGORY_LABELS[locale][eventType] ?? CATEGORY_LABELS[locale].other;
}

export async function EventDetailPage({ slug, locale }: { slug: string; locale: "en" | "el" }) {
  const event = await loadPublicEvent(slug);
  if (!event) notFound();

  const content = localizePublicEvent(event, locale);
  const past = isPastEvent(event.starts_at, event.ends_at);
  const place = [content.locationText, event.city, event.region].filter(Boolean).join(" · ") || event.country_code;
  const organizer = event.organizer_name || event.source_name;
  const profile = event.organizer_profile_id ? await loadOrganizerById(event.organizer_profile_id) : null;
  const organizerUrl = event.organizer_url || event.source_url;
  const base = locale === "el" ? "/el" : "";
  const pastText = locale === "el" ? "ΟΛΟΚΛΗΡΩΜΕΝΟ EVENT" : "PAST EVENT";
  const hasCoverImage = Boolean(event.cover_image_url);
  const heroMediaStyle = event.cover_image_url ? { backgroundImage: `url(${JSON.stringify(event.cover_image_url)})` } : undefined;

  return (
    <div className={styles.page}>
      <DocumentLanguage locale={locale} />
      <a className="skip-link" href="#main-content">{locale === "el" ? "Μετάβαση στο περιεχόμενο" : "Skip to content"}</a>
      <WebsiteHeader locale={locale} path={`/meets/${slug}`} />
      <main id="main-content">
        <section className={`${styles.hero} ${past ? styles.pastHero : ""}`}>
          <div
            className={styles.heroMedia}
            style={heroMediaStyle}
            role={hasCoverImage ? "img" : undefined}
            aria-label={hasCoverImage ? content.coverImageAlt?.trim() || content.title : undefined}
            aria-hidden={hasCoverImage ? undefined : true}
          />
          <div className={styles.heroShade} aria-hidden="true" />
          <div className={styles.shell}>
            <Link className={styles.back} href={`${base}/meets`}>← {locale === "el" ? "Όλα τα events" : "All events"}</Link>
            <div className={styles.heroBadges}>
              {past ? <span className={styles.pastBadge}>{pastText}</span> : null}
              {event.featured ? <span className={styles.featuredBadge}>FEATURED</span> : null}
              {event.partner_badge ? <span className={styles.partnerBadge}>{event.partner_badge}</span> : null}
            </div>
            <p className={styles.category}>{categoryLabel(event.event_type, locale)}</p>
            <h1>{content.title}</h1>
            <p className={styles.heroMeta}>{formatDate(event.starts_at, event.timezone, locale)}</p>
            <p className={styles.heroPlace}>{place}</p>
            {hasCoverImage ? (
              event.cover_image_source_url ? (
                <a className={styles.imageCaption} href={event.cover_image_source_url} rel="noreferrer" target="_blank">
                  {locale === "el" ? "ΕΙΚΟΝΑ EVENT · ΠΗΓΗ ↗" : "EVENT IMAGE · SOURCE ↗"}
                </a>
              ) : <span className={styles.imageCaption}>{locale === "el" ? "ΕΙΚΟΝΑ EVENT" : "EVENT IMAGE"}</span>
            ) : <span className={styles.imageCaption}>{locale === "el" ? "NOXA CULTURE · ΕΝΔΕΙΚΤΙΚΗ ΦΩΤΟΓΡΑΦΙΑ" : "NOXA CULTURE · EDITORIAL IMAGE"}</span>}
          </div>
        </section>

        <section className={styles.content}>
          <div className={styles.shell}>
            <div className={styles.grid}>
              <div className={styles.mainColumn}>
                {!past ? (
                  <EventActions
                    eventId={event.id}
                    eventTitle={content.title}
                    startsAt={event.starts_at}
                    endsAt={event.ends_at}
                    location={place}
                    latitude={event.latitude}
                    longitude={event.longitude}
                    locationPrecision={event.location_precision}
                    locale={locale}
                  />
                ) : (
                  <div className={styles.archiveNotice}>
                    <strong>{pastText}</strong>
                    <p>{locale === "el" ? "Αυτό το event έχει ολοκληρωθεί. Η σελίδα παραμένει διαθέσιμη ως αρχείο." : "This event has ended. The page remains available as an archive."}</p>
                  </div>
                )}
                <section className={styles.block}>
                  <span>{locale === "el" ? "ΣΧΕΤΙΚΑ" : "ABOUT"}</span>
                  <p>{content.summary?.trim() || (locale === "el" ? "Δες τις επίσημες πληροφορίες του organizer." : "Check the organizer's official details.")}</p>
                </section>
                <section className={styles.block}>
                  <span>{locale === "el" ? "ΤΟΠΟΘΕΣΙΑ" : "LOCATION"}</span>
                  <strong>{place}</strong>
                </section>
              </div>
              <aside className={styles.organizerCard}>
                <span>{locale === "el" ? "ΔΙΟΡΓΑΝΩΤΗΣ" : "ORGANIZED BY"}</span>
                <h2>{organizer}</h2>
                {profile ? (
                  <Link href={`${base}/organizers/${profile.slug}`}>{locale === "el" ? "Προφίλ organizer" : "Organizer profile"} →</Link>
                ) : (
                  <a href={organizerUrl} rel="noreferrer" target="_blank">{locale === "el" ? "Επίσημη πηγή" : "Official source"} ↗</a>
                )}
                <small>{profile?.verified ? "VERIFIED ORGANIZER" : (locale === "el" ? "Οι τελικές λεπτομέρειες παραμένουν ευθύνη του organizer." : "Final event details remain the organizer's responsibility.")}</small>
              </aside>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
