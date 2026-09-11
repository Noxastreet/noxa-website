import type { MetadataRoute } from "next";

const SUPABASE_URL = "https://qrouwtqsqrfeeeppyeru.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_vR9wivNa_fIb0QKmqua6Wg_H_7OPvUk";
const SITE = "https://noxastreetapp.com";

async function loadEventSlugs() {
  const params = new URLSearchParams({ select: "public_slug", status: "eq.published", limit: "1000" });
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/radar_events?${params}`, {
      headers: { apikey: SUPABASE_PUBLISHABLE_KEY },
      next: { revalidate: 3600 },
    });
    if (!response.ok) return [];
    const rows = await response.json() as Array<{ public_slug: string | null }>;
    return rows.map((row) => row.public_slug).filter((value): value is string => Boolean(value));
  } catch {
    return [];
  }
}

async function loadOrganizerSlugs() {
  const params = new URLSearchParams({
    select: "slug",
    status: "eq.active",
    verified: "eq.true",
    limit: "1000",
  });
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/organizer_profiles?${params}`, {
      headers: { apikey: SUPABASE_PUBLISHABLE_KEY },
      next: { revalidate: 3600 },
    });
    if (!response.ok) return [];
    const rows = await response.json() as Array<{ slug: string | null }>;
    return rows.map((row) => row.slug).filter((value): value is string => Boolean(value));
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();
  const [eventSlugs, organizerSlugs] = await Promise.all([loadEventSlugs(), loadOrganizerSlugs()]);
  const page = (url: string, priority: number, changeFrequency: "daily" | "weekly" | "monthly" = "weekly") => ({
    url: `${SITE}${url}`,
    lastModified,
    changeFrequency,
    priority,
  });

  return [
    page("", 1),
    page("/el", .9),
    page("/meets", .95, "daily"),
    page("/el/meets", .92, "daily"),
    page("/meets/submit", .72, "monthly"),
    page("/el/meets/submit", .7, "monthly"),
    page("/communities", .9, "daily"),
    page("/el/communities", .86, "daily"),
    page("/communities/apply", .72, "monthly"),
    page("/el/communities/apply", .7, "monthly"),
    page("/organizers", .9, "daily"),
    page("/el/organizers", .86, "daily"),
    page("/organizers/apply", .72, "monthly"),
    page("/el/organizers/apply", .7, "monthly"),
    page("/business", .82, "weekly"),
    ...eventSlugs.flatMap((slug) => [
      page(`/meets/${slug}`, .74, "weekly"),
      page(`/el/meets/${slug}`, .7, "weekly"),
    ]),
    ...organizerSlugs.flatMap((slug) => [
      page(`/organizers/${slug}`, .72, "weekly"),
      page(`/el/organizers/${slug}`, .68, "weekly"),
    ]),
    page("/privacy", .4, "monthly"),
    page("/terms", .4, "monthly"),
  ];
}
