const SUPABASE_URL = "https://qrouwtqsqrfeeeppyeru.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_vR9wivNa_fIb0QKmqua6Wg_H_7OPvUk";

export type PublicOrganizer = {
  id: string | null;
  slug: string;
  name: string;
  organizerType: string | null;
  city: string | null;
  countryCode: string | null;
  instagramUrl: string | null;
  websiteUrl: string | null;
  verified: boolean;
  partner: boolean;
  partnerLabel: string | null;
  community: { slug: string; name: string } | null;
};

export type OrganizerEvent = {
  id: string; slug: string; title: string; eventType: string; startsAt: string; endsAt: string | null; timezone: string | null; location: string; city: string;
};

type ProfileRow = {
  id: string; slug: string; name: string; organizer_type: string; community_id: string | null; city: string | null; country_code: string | null; instagram_url: string | null; website_url: string | null; verified: boolean; partner: boolean | null; partner_label: string | null;
};
type EventRow = {
  id: string; public_slug: string; title: string; event_type: string; starts_at: string; ends_at: string | null; timezone: string | null; location_text: string | null; city: string | null; country_code: string; organizer_name: string | null; source_name: string; organizer_profile_id: string | null;
};

export function organizerSlug(value: string) {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase("el-GR")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "organizer";
}

async function getJson<T>(path: string): Promise<T | null> {
  try {
    const response = await fetch(`${SUPABASE_URL}${path}`, { headers: { apikey: SUPABASE_PUBLISHABLE_KEY }, next: { revalidate: 120 } });
    if (!response.ok) return null;
    return await response.json() as T;
  } catch { return null; }
}

export async function loadPublicOrganizer(slug: string): Promise<{ organizer: PublicOrganizer; events: OrganizerEvent[] } | null> {
  const profileParams = new URLSearchParams({ select: "id,slug,name,organizer_type,community_id,city,country_code,instagram_url,website_url,verified,partner,partner_label", slug: `eq.${slug}`, status: "eq.active", limit: "1" });
  const profiles = await getJson<ProfileRow[]>(`/rest/v1/organizer_profiles?${profileParams.toString()}`) ?? [];
  const profile = profiles[0] ?? null;

  const eventParams = new URLSearchParams({ select: "id,public_slug,title,event_type,starts_at,ends_at,timezone,location_text,city,country_code,organizer_name,source_name,organizer_profile_id", status: "eq.published", order: "starts_at.asc", limit: "500" });
  const allEvents = await getJson<EventRow[]>(`/rest/v1/radar_events?${eventParams.toString()}`) ?? [];
  const matching = allEvents.filter((event) => {
    if (profile && event.organizer_profile_id === profile.id) return true;
    return organizerSlug(event.organizer_name ?? event.source_name) === slug;
  });
  if (!profile && !matching.length) return null;

  const fallbackName = matching[0]?.organizer_name ?? matching[0]?.source_name ?? slug;
  let community: { slug: string; name: string } | null = null;
  if (profile?.community_id) {
    const params = new URLSearchParams({ select: "slug,name", id: `eq.${profile.community_id}`, status: "eq.published", limit: "1" });
    const rows = await getJson<Array<{ slug: string; name: string }>>(`/rest/v1/communities?${params.toString()}`) ?? [];
    community = rows[0] ?? null;
  }

  return {
    organizer: {
      id: profile?.id ?? null,
      slug,
      name: profile?.name ?? fallbackName,
      organizerType: profile?.organizer_type ?? null,
      city: profile?.city ?? matching.find((event) => event.city)?.city ?? null,
      countryCode: profile?.country_code ?? matching[0]?.country_code ?? null,
      instagramUrl: profile?.instagram_url ?? null,
      websiteUrl: profile?.website_url ?? null,
      verified: Boolean(profile?.verified),
      partner: Boolean(profile?.partner),
      partnerLabel: profile?.partner_label ?? null,
      community,
    },
    events: matching.map((event) => ({ id: event.id, slug: event.public_slug, title: event.title, eventType: event.event_type, startsAt: event.starts_at, endsAt: event.ends_at, timezone: event.timezone, location: event.location_text ?? event.city ?? event.country_code, city: event.city ?? "" })),
  };
}
