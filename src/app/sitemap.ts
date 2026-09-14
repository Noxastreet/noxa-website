import type { MetadataRoute } from "next";

import { isEventCurrentlyVisible } from "@/lib/meets/eventVisibility";

const SUPABASE_URL = "https://qrouwtqsqrfeeeppyeru.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_vR9wivNa_fIb0QKmqua6Wg_H_7OPvUk";
const SITE = "https://noxastreetapp.com";

type EventSitemapRow = {
  public_slug: string | null;
  starts_at: string;
  ends_at: string | null;
  updated_at: string | null;
};

async function loadVisibleEvents(): Promise<EventSitemapRow[]> {
  const params = new URLSearchParams({
    select: "public_slug,starts_at,ends_at,updated_at",
    status: "eq.published",
    limit: "1000",
  });

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/radar_events?${params}`, {
      headers: { apikey: SUPABASE_PUBLISHABLE_KEY },
      next: { revalidate: 3600 },
    });
    if (!response.ok) return [];

    const rows = await response.json() as EventSitemapRow[];
    return rows.filter((row) => Boolean(row.public_slug) && isEventCurrentlyVisible(row.starts_at, row.ends_at));
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const events = await loadVisibleEvents();
  type SitemapEntry = MetadataRoute.Sitemap[number];

  const page = (
    url: string,
    priority: number,
    changeFrequency: "daily" | "weekly" | "monthly" = "weekly",
  ): SitemapEntry => ({
    url: `${SITE}${url}`,
    changeFrequency,
    priority,
  });

  const eventPage = (
    url: string,
    priority: number,
    updatedAt: string | null,
  ): SitemapEntry => {
    const parsedUpdatedAt = updatedAt ? new Date(updatedAt) : null;
    const hasValidUpdatedAt = parsedUpdatedAt !== null && Number.isFinite(parsedUpdatedAt.getTime());

    return {
      url: `${SITE}${url}`,
      changeFrequency: "weekly",
      priority,
      ...(hasValidUpdatedAt ? { lastModified: parsedUpdatedAt } : {}),
    };
  };

  return [
    page("", 1),
    page("/el", .9),
    page("/meets", .98, "daily"),
    page("/el/meets", .95, "daily"),
    page("/map", .94, "daily"),
    page("/el/map", .91, "daily"),
    page("/meets/submit", .72, "monthly"),
    page("/el/meets/submit", .7, "monthly"),
    ...events.flatMap((event) => {
      const slug = event.public_slug;
      if (!slug) return [];

      return [
        eventPage(`/meets/${slug}`, .78, event.updated_at),
        eventPage(`/el/meets/${slug}`, .74, event.updated_at),
      ];
    }),
    page("/privacy", .4, "monthly"),
    page("/delete-account", .4, "monthly"),
    page("/terms", .4, "monthly"),
  ];
}
