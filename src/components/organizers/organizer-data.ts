import { isPastEvent } from "@/lib/meets/eventVisibility";

const SUPABASE_URL = "https://qrouwtqsqrfeeeppyeru.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_vR9wivNa_fIb0QKmqua6Wg_H_7OPvUk";

export type PublicOrganizer = {
  id: string; slug: string; name: string; organizer_type: string; community_id: string | null; city: string | null; country_code: string; instagram_url: string | null; website_url: string | null; verified: boolean; partner: boolean; partner_label: string | null;
};
export type OrganizerEvent = { id: string; public_slug: string; title: string; event_type: string; starts_at: string; ends_at: string | null; timezone: string | null; location_text: string | null; city: string | null; region: string | null };
export type OrganizerCommunity = { id: string; slug: string; name: string; verified: boolean };

async function publicFetch(path: string) { return fetch(`${SUPABASE_URL}${path}`, { headers: { apikey: SUPABASE_PUBLISHABLE_KEY }, next: { revalidate: 120 } }); }
const organizerSelect = "id,slug,name,organizer_type,community_id,city,country_code,instagram_url,website_url,verified,partner,partner_label";

export async function loadPublicOrganizers(): Promise<PublicOrganizer[]> {
  const params = new URLSearchParams({ select: organizerSelect, status: "eq.active", verified: "eq.true", order: "partner.desc,name.asc", limit: "200" });
  try { const response = await publicFetch(`/rest/v1/organizer_profiles?${params}`); if (!response.ok) return []; return await response.json() as PublicOrganizer[]; } catch { return []; }
}
export async function loadOrganizerBySlug(slug: string): Promise<PublicOrganizer | null> {
  const params = new URLSearchParams({ select: organizerSelect, slug: `eq.${slug}`, status: "eq.active", verified: "eq.true", limit: "1" });
  try { const response = await publicFetch(`/rest/v1/organizer_profiles?${params}`); if (!response.ok) return null; const rows = await response.json() as PublicOrganizer[]; return rows[0] ?? null; } catch { return null; }
}
export async function loadOrganizerById(id: string): Promise<PublicOrganizer | null> {
  const params = new URLSearchParams({ select: organizerSelect, id: `eq.${id}`, status: "eq.active", verified: "eq.true", limit: "1" });
  try { const response = await publicFetch(`/rest/v1/organizer_profiles?${params}`); if (!response.ok) return null; const rows = await response.json() as PublicOrganizer[]; return rows[0] ?? null; } catch { return null; }
}
export async function loadOrganizerEvents(organizerId: string) {
  const params = new URLSearchParams({ select: "id,public_slug,title,event_type,starts_at,ends_at,timezone,location_text,city,region", organizer_profile_id: `eq.${organizerId}`, status: "eq.published", order: "starts_at.desc", limit: "100" });
  try {
    const response = await publicFetch(`/rest/v1/radar_events?${params}`);
    if (!response.ok) return { upcoming: [] as OrganizerEvent[], past: [] as OrganizerEvent[] };
    const rows = await response.json() as OrganizerEvent[];
    const upcoming = rows.filter((event) => !isPastEvent(event.starts_at, event.ends_at)).sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
    const past = rows.filter((event) => isPastEvent(event.starts_at, event.ends_at));
    return { upcoming, past };
  } catch { return { upcoming: [] as OrganizerEvent[], past: [] as OrganizerEvent[] }; }
}
export async function loadOrganizerCommunity(communityId: string | null): Promise<OrganizerCommunity | null> {
  if (!communityId) return null;
  const params = new URLSearchParams({ select: "id,slug,name,verified", id: `eq.${communityId}`, status: "eq.published", limit: "1" });
  try { const response = await publicFetch(`/rest/v1/communities?${params}`); if (!response.ok) return null; const rows = await response.json() as OrganizerCommunity[]; return rows[0] ?? null; } catch { return null; }
}
