import { cookies, headers } from "next/headers";

import { isEventCurrentlyVisible } from "@/lib/meets/eventVisibility";

import { MeetsDirectory, type MeetsDirectoryEvent } from "./MeetsDirectory";

const SUPABASE_URL = "https://qrouwtqsqrfeeeppyeru.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_vR9wivNa_fIb0QKmqua6Wg_H_7OPvUk";

type InitialFilters = { country?: string; city?: string; type?: string; date?: string; q?: string };
type Row = {
  id: string; public_slug: string; country_code: string; title: string; event_type: string; starts_at: string; ends_at: string | null; timezone: string | null; location_text: string | null; city: string | null; region: string | null; organizer_name: string | null; source_name: string; featured: boolean; partner_badge: string | null;
};

function fallbackCountry(value: string | null) {
  if (!value) return "GR";
  const match = value.match(/[-_]([A-Za-z]{2})(?:[,;]|$)/);
  return match?.[1]?.toUpperCase() ?? "GR";
}
function savedCountry(value: string | undefined) { const code = value?.trim().toUpperCase(); return code && /^[A-Z]{2}$/.test(code) ? code : null; }

async function loadEvents(): Promise<MeetsDirectoryEvent[]> {
  const query = new URLSearchParams({
    select: "id,public_slug,country_code,title,event_type,starts_at,ends_at,timezone,location_text,city,region,organizer_name,source_name,featured,partner_badge",
    status: "eq.published", order: "starts_at.asc", limit: "500",
  });
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/radar_events?${query}`, { headers: { apikey: SUPABASE_PUBLISHABLE_KEY }, next: { revalidate: 60 } });
    if (!response.ok) return [];
    const rows = await response.json() as Row[];
    return rows.filter((row) => isEventCurrentlyVisible(row.starts_at, row.ends_at)).map((row) => ({
      id: row.id, slug: row.public_slug, countryCode: row.country_code, title: row.title, eventType: row.event_type, startsAt: row.starts_at, endsAt: row.ends_at, timezone: row.timezone, location: row.location_text ?? row.city ?? row.region ?? row.country_code, city: row.city ?? "", region: row.region ?? "", organizer: row.organizer_name ?? row.source_name, featured: row.featured, partnerBadge: row.partner_badge,
    }));
  } catch { return []; }
}

export async function MeetsDirectoryPage({ locale, initialFilters = {} }: { locale: "en" | "el"; initialFilters?: InitialFilters }) {
  const [requestHeaders, cookieStore, events] = await Promise.all([headers(), cookies(), loadEvents()]);
  const detectedCountryCode = savedCountry(cookieStore.get("noxa_country")?.value) ?? requestHeaders.get("x-vercel-ip-country") ?? fallbackCountry(requestHeaders.get("accept-language"));
  return <MeetsDirectory detectedCountryCode={detectedCountryCode} events={events} initialFilters={initialFilters} locale={locale} />;
}
