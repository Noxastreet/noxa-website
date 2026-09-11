import Link from "next/link";
import { notFound } from "next/navigation";

import { DocumentLanguage } from "@/components/i18n/DocumentLanguage";
import { WebsiteHeader } from "@/components/navigation/WebsiteHeader";
import { buildNoxaMapHref, eventFamily } from "@/lib/meets/discoveryPersonalization";
import { isEventCurrentlyVisible, isPastEvent } from "@/lib/meets/eventVisibility";

import discovery from "./EventDiscovery.module.css";
import { EventActions } from "./EventActions";
import styles from "./EventDetailPage.module.css";

const SUPABASE_URL = "https://qrouwtqsqrfeeeppyeru.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_vR9wivNa_fIb0QKmqua6Wg_H_7OPvUk";
const NOXA_EVENT_FALLBACK = "radial-gradient(circle at 78% 24%, rgba(200,16,46,.28), transparent 32%), linear-gradient(135deg,#111114 0%,#08080a 46%,#050505 100%)";
const NOXA_STORY_FALLBACK = "/media/noxa-story-fallback.jpg";

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

type RelatedEvent = Pick<EventRow,
  "id" | "public_slug" | "title" | "title_el" | "event_type" | "starts_at" | "ends_at" | "timezone" |
  "location_text" | "location_text_el" | "city" | "region" | "country_code" | "latitude" | "longitude" | "location_precision"
>;

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

async function loadRelatedEvents(event: EventRow): Promise<RelatedEvent[]> {
  const query = new URLSearchParams({
    select: "id,public_slug,title,title_el,event_type,starts_at,ends_at,timezone,location_text,location_text_el,city,region,country_code,latitude,longitude,location_precision",
    status: "eq.published",
    country_code: `eq.${event.country_code}`,
    order: "starts_at.asc",
    limit: "80",
  });
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/radar_events?${query}`, {
      headers: { apikey: SUPABASE_PUBLISHABLE_KEY },
      next: { revalidate: 60 },
    });
    if (!response.ok) return [];
    const rows = await response.json() as RelatedEvent[];
    const currentFamily = eventFamily(event.event_type);
    return rows
      .filter((row) => row.id !== event.id && isEventCurrentlyVisible(row.starts_at, row.ends_at))
      .map((row) => {
        let score = 0;
        if (event.city && row.city === event.city) score += 5;
        if (eventFamily(row.event_type) === currentFamily) score += 4;
        if (event.region && row.region === event.region) score += 2;
        return { row, score };
      })
      .sort((a, b) => b.score - a.score || new Date(a.row.starts_at).getTime() - new Date(b.row.starts_at).getTime())
      .filter(({ score }) => score > 0)
      .slice(0, 4)
      .map(({ row }) => row);
  } catch {
    return [];
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

function localizedRelated(event: RelatedEvent, locale: "en" | "el") {
  return {
    title: locale === "el" ? event.title_el?.trim() || event.title : event.title,
    location: locale === "el" ? event.location_text_el?.trim() || event.location_text : event.location_text,
  };
}

export async function EventDetailPage({ slug, locale }: { slug: string; locale: "en" | "el" }) {
  const event = await loadPublicEvent(slug);
  if (!event) notFound();

  const related = await loadRelatedEvents(event);
  const content = localizePublicEvent(event, locale);
  const past = isPastEvent(event.starts_at, event.ends_at);
  const place = [content.locationText, event.city, event.region].filter(Boolean).join(" · ") || event.country_code;
  const base = locale === "el" ? "/el" : "";
  const pastText = locale === "el" ? "ΟΛΟΚΛΗΡΩΜΕΝΟ EVENT" : "PAST EVENT";
  const category = categoryLabel(event.event_type, locale);
  const hasCoverImage = Boolean(event.cover_image_url);
  const heroMediaStyle = {
    backgroundImage: event.cover_image_url ? `url(${JSON.stringify(event.cover_image_url)})` : NOXA_EVENT_FALLBACK,
  };
  const mapHref = buildNoxaMapHref({
    id: event.id,
    title: content.title,
    city: event.city ?? "",
    eventType: event.event_type,
    latitude: event.latitude,
    longitude: event.longitude,
    locationPrecision: event.location_precision,
  }, locale);
  const directionsHref = mapHref && event.latitude !== null && event.longitude !== null
    ? `https://www.google.com/maps/search/?api=1&query=${event.latitude},${event.longitude}`
    : null;

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
            <p className={styles.category}>{category}</p>
            <h1>{content.title}</h1>
            <p className={styles.heroMeta}>{formatDate(event.starts_at, event.timezone, locale)}</p>
            <p className={styles.heroPlace}>{place}</p>
            {hasCoverImage ? (
              event.cover_image_source_url ? (
                <a className={styles.imageCaption} href={event.cover_image_source_url} rel="noreferrer" target="_blank">
                  {locale === "el" ? "ΕΙΚΟΝΑ EVENT · ΠΗΓΗ ↗" : "EVENT IMAGE · SOURCE ↗"}
                </a>
              ) : <span className={styles.imageCaption}>{locale === "el" ? "ΕΙΚΟΝΑ EVENT" : "EVENT IMAGE"}</span>
            ) : <span className={styles.imageCaption}>NOXA MEETS</span>}
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
                    eventCategory={category}
                    startsAt={event.starts_at}
                    endsAt={event.ends_at}
                    timezone={event.timezone}
                    location={place}
                    coverImageUrl={event.cover_image_url || NOXA_STORY_FALLBACK}
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
                  <p>{content.summary?.trim() || (locale === "el" ? "Δες τις επίσημες πληροφορίες της εκδήλωσης." : "Check the official event details.")}</p>
                </section>
                <section className={styles.block}>
                  <span>{locale === "el" ? "ΤΟΠΟΘΕΣΙΑ" : "LOCATION"}</span>
                  <strong>{place}</strong>
                  {mapHref ? <div className={discovery.locationActions}>
                    <Link href={mapHref}>{locale === "el" ? "Άνοιγμα στο NOXA Map" : "Open in NOXA Map"} →</Link>
                    {directionsHref ? <a href={directionsHref} target="_blank" rel="noreferrer">{locale === "el" ? "Οδηγίες" : "Directions"} ↗</a> : null}
                  </div> : null}
                </section>
              </div>
              <aside className={discovery.sideStack}>
                <div className={styles.organizerCard}>
                  <span>{locale === "el" ? "ΠΗΓΗ" : "SOURCE"}</span>
                  <h2>{locale === "el" ? "Επίσημες πληροφορίες event" : "Official event information"}</h2>
                  <a href={event.source_url} rel="noreferrer" target="_blank">{locale === "el" ? "Άνοιγμα πηγής" : "Open source"} ↗</a>
                  <small>{locale === "el" ? "Έλεγξε την επίσημη πηγή για τις τελευταίες αλλαγές." : "Check the official source for the latest changes."}</small>
                </div>
              </aside>
            </div>

            {related.length ? (
              <section className={discovery.related} aria-labelledby="related-events-title">
                <div className={discovery.relatedHeader}>
                  <div><span>{locale === "el" ? "ΣΥΝΕΧΙΣΕ ΤΗΝ ΑΝΑΚΑΛΥΨΗ" : "KEEP DISCOVERING"}</span><h2 id="related-events-title">{locale === "el" ? "Παρόμοια upcoming events." : "More events like this."}</h2></div>
                  <p>{locale === "el" ? "Προτάσεις με βάση την πόλη, την περιοχή και τον τύπο του event." : "Suggestions based on this event’s city, region and event type."}</p>
                </div>
                <div className={discovery.relatedGrid}>
                  {related.map((candidate) => {
                    const localized = localizedRelated(candidate, locale);
                    return <Link className={discovery.relatedCard} href={`${base}/meets/${candidate.public_slug}`} key={candidate.id}>
                      <span>{categoryLabel(candidate.event_type, locale)}</span>
                      <h3>{localized.title}</h3>
                      <p>{localized.location || candidate.city || candidate.region || candidate.country_code}</p>
                    </Link>;
                  })}
                </div>
              </section>
            ) : null}
          </div>
        </section>
      </main>
    </div>
  );
}
