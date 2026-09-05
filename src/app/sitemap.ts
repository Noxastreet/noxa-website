import type { MetadataRoute } from "next";

const SUPABASE_URL = "https://qrouwtqsqrfeeeppyeru.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_vR9wivNa_fIb0QKmqua6Wg_H_7OPvUk";
const SITE = "https://noxastreetapp.com";

async function loadSlugs(table: "radar_events" | "organizer_profiles", field: "public_slug" | "slug") {
  const params = new URLSearchParams({ select: field, limit: "1000" });
  if (table === "radar_events") params.set("status", "eq.published");
  else { params.set("status", "eq.active"); params.set("verified", "eq.true"); }
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, { headers: { apikey: SUPABASE_PUBLISHABLE_KEY }, next: { revalidate: 3600 } });
    if (!response.ok) return [];
    const rows = await response.json() as Array<Record<string, string | null>>;
    return rows.map((row) => row[field]).filter((value): value is string => Boolean(value));
  } catch { return []; }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();
  const [eventSlugs, organizerSlugs] = await Promise.all([loadSlugs("radar_events", "public_slug"), loadSlugs("organizer_profiles", "slug")]);
  const page = (url: string, priority: number, changeFrequency: "daily" | "weekly" | "monthly" = "weekly") => ({ url: `${SITE}${url}`, lastModified, changeFrequency, priority });
  return [
    page("", 1), page("/el", .9),
    page("/meets", .95, "daily"), page("/el/meets", .92, "daily"),
    page("/meets/submit", .72, "monthly"), page("/el/meets/submit", .7, "monthly"),
    page("/communities", .9, "daily"), page("/el/communities", .86, "daily"),
    page("/communities/apply", .72, "monthly"), page("/el/communities/apply", .7, "monthly"),
    page("/organizers", .86, "daily"), page("/el/organizers", .82, "daily"),
    ...eventSlugs.flatMap((slug) => [page(`/meets/${slug}`, .74, "weekly"), page(`/el/meets/${slug}`, .7, "weekly")]),
    ...organizerSlugs.flatMap((slug) => [page(`/organizers/${slug}`, .72, "weekly"), page(`/el/organizers/${slug}`, .68, "weekly")]),
    page("/privacy", .4, "monthly"), page("/terms", .4, "monthly"),
  ];
}
