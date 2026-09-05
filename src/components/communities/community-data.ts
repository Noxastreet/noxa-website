import { isEventCurrentlyVisible } from "@/lib/meets/eventVisibility";

const WEBSITE_DATA_URL = "https://qrouwtqsqrfeeeppyeru.supabase.co";
const WEBSITE_DATA_PUBLISHABLE_KEY = "sb_publishable_vR9wivNa_fIb0QKmqua6Wg_H_7OPvUk";

export type CommunityFocus = "car" | "moto" | "mixed";

export type PublicCommunity = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  city: string | null;
  region: string | null;
  country_code: string;
  focus: CommunityFocus;
  scene_tags: string[];
  logo_url: string | null;
  cover_image_url: string | null;
  instagram_url: string | null;
  website_url: string | null;
  verified: boolean;
};

export type CommunityEvent = {
  id: string;
  public_slug: string;
  title: string;
  event_type: string;
  starts_at: string;
  ends_at: string | null;
  timezone: string;
  location_text: string | null;
  city: string | null;
  region: string | null;
  source_url: string;
};

export type CommunityOrganizer = {
  id: string;
  slug: string;
  name: string;
  organizer_type: string;
  verified: boolean;
  partner: boolean;
  partner_label: string | null;
};

async function publicDataFetch(path: string) {
  return fetch(`${WEBSITE_DATA_URL}${path}`, {
    headers: { apikey: WEBSITE_DATA_PUBLISHABLE_KEY },
    next: { revalidate: 120 },
  });
}

export async function loadPublishedCommunities(): Promise<PublicCommunity[]> {
  const params = new URLSearchParams({
    select: "id,slug,name,description,city,region,country_code,focus,scene_tags,logo_url,cover_image_url,instagram_url,website_url,verified",
    status: "eq.published",
    order: "verified.desc,name.asc",
    limit: "200",
  });
  try {
    const response = await publicDataFetch(`/rest/v1/communities?${params.toString()}`);
    if (!response.ok) return [];
    return await response.json() as PublicCommunity[];
  } catch { return []; }
}

export async function loadCommunityBySlug(slug: string): Promise<PublicCommunity | null> {
  const params = new URLSearchParams({
    select: "id,slug,name,description,city,region,country_code,focus,scene_tags,logo_url,cover_image_url,instagram_url,website_url,verified",
    slug: `eq.${slug}`,
    status: "eq.published",
    limit: "1",
  });
  try {
    const response = await publicDataFetch(`/rest/v1/communities?${params.toString()}`);
    if (!response.ok) return null;
    const rows = await response.json() as PublicCommunity[];
    return rows[0] ?? null;
  } catch { return null; }
}

export async function loadCommunityEvents(communityId: string): Promise<CommunityEvent[]> {
  const params = new URLSearchParams({
    select: "id,public_slug,title,event_type,starts_at,ends_at,timezone,location_text,city,region,source_url",
    community_id: `eq.${communityId}`,
    status: "eq.published",
    order: "starts_at.asc",
    limit: "40",
  });
  try {
    const response = await publicDataFetch(`/rest/v1/radar_events?${params.toString()}`);
    if (!response.ok) return [];
    const rows = await response.json() as CommunityEvent[];
    return rows.filter((event) => isEventCurrentlyVisible(event.starts_at, event.ends_at));
  } catch { return []; }
}

export async function loadCommunityOrganizers(communityId: string): Promise<CommunityOrganizer[]> {
  const params = new URLSearchParams({
    select: "id,slug,name,organizer_type,verified,partner,partner_label",
    community_id: `eq.${communityId}`,
    status: "eq.active",
    order: "verified.desc,name.asc",
    limit: "20",
  });
  try {
    const response = await publicDataFetch(`/rest/v1/organizer_profiles?${params.toString()}`);
    if (!response.ok) return [];
    return await response.json() as CommunityOrganizer[];
  } catch { return []; }
}
