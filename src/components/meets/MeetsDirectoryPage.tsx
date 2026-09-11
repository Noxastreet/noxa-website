import { cookies, headers } from "next/headers";

import { isEventCurrentlyVisible } from "@/lib/meets/eventVisibility";

import { MeetsDirectory, type MeetsDirectoryEvent } from "./MeetsDirectory";

const SUPABASE_URL = "https://qrouwtqsqrfeeeppyeru.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_vR9wivNa_fIb0QKmqua6Wg_H_7OPvUk";

type InitialFilters = { country?: string; city?: string; type?: string; date?: string; q?: string };
type Row = {
  id: string;
  public_slug: string;
  country_code: string;
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
  organizer_name: string | null;
  source_name: string;
  featured: boolean;
  partner_badge: string | null;
  cover_image_url: string | null;
  cover_image_alt: string | null;
  cover_image_alt_el: string | null;
  latitude: number | null;
  longitude: number | null;
  location_precision: string | null;
};

function fallbackCountry(value: string | null) {
  if (!value) return "GR";
  const match = value.match(/[-_]([A-Za-z]{2})(?:[,;]|$)/);
  return match?.[1]?.toUpperCase() ?? "GR";
}

function savedCountry(value: string | undefined) {
  const code = value?.trim().toUpperCase();
  return code && /^[A-Z]{2}$/.test(code) ? code : null;
}

async function loadEventRows(): Promise<Row[]> {
  const query = new URLSearchParams({
    select: "id,public_slug,country_code,title,title_el,event_type,starts_at,ends_at,timezone,location_text,location_text_el,city,region,organizer_name,source_name,featured,partner_badge,cover_image_url,cover_image_alt,cover_image_alt_el,latitude,longitude,location_precision",
    status: "eq.published",
    order: "starts_at.asc",
    limit: "500",
  });
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/radar_events?${query}`, {
      headers: { apikey: SUPABASE_PUBLISHABLE_KEY },
      next: { revalidate: 60 },
    });
    if (!response.ok) return [];
    return await response.json() as Row[];
  } catch {
    return [];
  }
}

function localizeEvents(rows: Row[], locale: "en" | "el"): MeetsDirectoryEvent[] {
  return rows
    .filter((row) => isEventCurrentlyVisible(row.starts_at, row.ends_at))
    .map((row) => {
      const localizedTitle = locale === "el" ? row.title_el?.trim() || row.title : row.title;
      const localizedLocation = locale === "el" ? row.location_text_el?.trim() || row.location_text : row.location_text;
      const localizedCoverAlt = locale === "el" ? row.cover_image_alt_el?.trim() || row.cover_image_alt : row.cover_image_alt;

      return {
        id: row.id,
        slug: row.public_slug,
        countryCode: row.country_code,
        title: localizedTitle,
        eventType: row.event_type,
        startsAt: row.starts_at,
        endsAt: row.ends_at,
        timezone: row.timezone,
        location: localizedLocation ?? row.city ?? row.region ?? row.country_code,
        city: row.city ?? "",
        region: row.region ?? "",
        organizer: row.organizer_name ?? row.source_name,
        organizerProfileId: null,
        organizerSlug: null,
        featured: row.featured,
        partnerBadge: row.partner_badge,
        coverImageUrl: row.cover_image_url,
        coverImageAlt: localizedCoverAlt,
        latitude: row.latitude,
        longitude: row.longitude,
        locationPrecision: row.location_precision,
      };
    });
}

export async function MeetsDirectoryPage({ locale, initialFilters = {} }: { locale: "en" | "el"; initialFilters?: InitialFilters }) {
  const [requestHeaders, cookieStore, rows] = await Promise.all([
    headers(),
    cookies(),
    loadEventRows(),
  ]);
  const events = localizeEvents(rows, locale);
  const detectedCountryCode = savedCountry(cookieStore.get("noxa_country")?.value)
    ?? requestHeaders.get("x-vercel-ip-country")
    ?? fallbackCountry(requestHeaders.get("accept-language"));
  return <MeetsDirectory detectedCountryCode={detectedCountryCode} events={events} initialFilters={initialFilters} locale={locale} />;
}
