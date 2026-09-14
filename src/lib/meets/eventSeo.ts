const SITE = "https://noxastreetapp.com";
const FALLBACK_OG_IMAGE = `${SITE}/brand/noxa-og-preview.jpg`;
const MAX_META_DESCRIPTION = 155;

type EventSeoRecord = {
  public_slug: string;
  starts_at: string;
  ends_at: string | null;
  timezone: string | null;
  city: string | null;
  region: string | null;
  country_code: string;
  organizer_name: string | null;
  organizer_url: string | null;
  cover_image_url: string | null;
  latitude: number | null;
  longitude: number | null;
};

type EventSeoContent = {
  title: string;
  summary: string | null;
  locationText: string | null;
  coverImageAlt?: string | null;
};

function compact(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function truncate(value: string, max = MAX_META_DESCRIPTION) {
  const normalized = compact(value);
  if (normalized.length <= max) return normalized;
  const candidate = normalized.slice(0, max - 1);
  const lastSpace = candidate.lastIndexOf(" ");
  const safeCut = lastSpace >= Math.floor(max * 0.7) ? lastSpace : candidate.length;
  return `${candidate.slice(0, safeCut).trimEnd()}…`;
}

function formatSeoDate(event: EventSeoRecord, locale: "en" | "el") {
  return new Intl.DateTimeFormat(locale === "el" ? "el-GR" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: event.timezone || "Europe/Athens",
  }).format(new Date(event.starts_at));
}

export function eventPublicUrl(event: EventSeoRecord, locale: "en" | "el") {
  return `${SITE}${locale === "el" ? "/el" : ""}/meets/${event.public_slug}`;
}

export function eventOgImageUrl(event: EventSeoRecord) {
  return event.cover_image_url?.trim() || FALLBACK_OG_IMAGE;
}

export function buildEventSeoDescription(
  event: EventSeoRecord,
  content: EventSeoContent,
  locale: "en" | "el",
) {
  if (content.summary?.trim()) return truncate(content.summary);

  const location = compact(
    [content.locationText, event.city, event.region, event.country_code].filter(Boolean).join(", "),
  );
  const date = formatSeoDate(event, locale);
  const fallback = locale === "el"
    ? `${content.title} — ${location}, ${date}. Πληροφορίες event, τοποθεσία και επίσημη πηγή στο NOXA.`
    : `${content.title} — ${location}, ${date}. Event details, location and official source on NOXA.`;
  return truncate(fallback);
}

export function buildEventJsonLd(
  event: EventSeoRecord,
  content: EventSeoContent,
  locale: "en" | "el",
) {
  const locationName = compact(
    content.locationText?.trim()
      || [event.city, event.region, event.country_code].filter(Boolean).join(", ")
      || event.country_code,
  );
  const hasCoordinates = event.latitude !== null && event.longitude !== null;

  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: content.title,
    description: buildEventSeoDescription(event, content, locale),
    startDate: event.starts_at,
    ...(event.ends_at ? { endDate: event.ends_at } : {}),
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    url: eventPublicUrl(event, locale),
    image: [eventOgImageUrl(event)],
    inLanguage: locale === "el" ? "el-GR" : "en",
    location: {
      "@type": "Place",
      name: locationName,
      address: {
        "@type": "PostalAddress",
        ...(event.city ? { addressLocality: event.city } : {}),
        ...(event.region ? { addressRegion: event.region } : {}),
        addressCountry: event.country_code,
      },
      ...(hasCoordinates ? {
        geo: {
          "@type": "GeoCoordinates",
          latitude: event.latitude,
          longitude: event.longitude,
        },
      } : {}),
    },
    ...(event.organizer_name ? {
      organizer: {
        "@type": "Organization",
        name: event.organizer_name,
        ...(event.organizer_url ? { url: event.organizer_url } : {}),
      },
    } : {}),
  };
}

export function serializeJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
