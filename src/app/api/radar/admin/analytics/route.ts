import { NextRequest } from "next/server";

import {
  RADAR_SUPABASE_PUBLISHABLE_KEY,
  RADAR_SUPABASE_URL,
} from "@/lib/radarSupabasePublic";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const NOXA_VERCEL_PROJECT_ID = "prj_icPI4DsBJxFZCLS8fRnJOcrSQVKV";
const NOXA_VERCEL_TEAM_ID = "team_wYte5DwaJLZLpToqxKPvAXfu";

const RANGE_DAYS = {
  "1d": 1,
  "7d": 7,
  "30d": 30,
  "90d": 90,
} as const;

type RangeKey = keyof typeof RANGE_DAYS;
type CountData = { pageviews: number; visitors: number };
type AggregateRow = Record<string, unknown> & {
  count?: number;
  visitors?: number;
  pageviews?: number;
};

type BreakdownItem = {
  label: string;
  count: number;
  visitors: number;
  path?: string;
  title?: string;
  city?: string | null;
};

type RadarEventLookupRow = {
  public_slug: string | null;
  title: string;
  city: string | null;
};

function json(body: unknown, init?: ResponseInit) {
  const headers = new Headers(init?.headers);
  headers.set("Cache-Control", "private, no-store, max-age=0");
  return Response.json(body, { ...init, headers });
}

function getBearer(request: NextRequest) {
  const authorization = request.headers.get("authorization") ?? "";
  return authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
}

function supabaseHeaders(accessToken: string) {
  return {
    apikey: RADAR_SUPABASE_PUBLISHABLE_KEY,
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };
}

async function verifyRadarAdmin(accessToken: string) {
  if (!accessToken) return false;

  const headers = supabaseHeaders(accessToken);
  const [userResponse, adminResponse] = await Promise.all([
    fetch(`${RADAR_SUPABASE_URL}/auth/v1/user`, { headers, cache: "no-store" }),
    fetch(`${RADAR_SUPABASE_URL}/rest/v1/rpc/radar_admin_status`, {
      method: "POST",
      headers,
      body: "{}",
      cache: "no-store",
    }),
  ]);

  if (!userResponse.ok || !adminResponse.ok) return false;
  return await adminResponse.json() === true;
}

function rangeSince(days: number, now: Date) {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1_000).toISOString();
}

function vercelBaseParams() {
  const projectId = process.env.VERCEL_PROJECT_ID ?? NOXA_VERCEL_PROJECT_ID;
  const teamId = process.env.VERCEL_ORG_ID ?? NOXA_VERCEL_TEAM_ID;
  return new URLSearchParams({ projectId, teamId });
}

async function vercelRequest(path: string, params: URLSearchParams) {
  const token = process.env.VERCEL_ANALYTICS_TOKEN;
  if (!token) throw new Error("VERCEL_ANALYTICS_TOKEN is not configured.");

  const response = await fetch(`https://api.vercel.com${path}?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Vercel Web Analytics API returned ${response.status}.`);
  }

  return response.json() as Promise<{ data?: unknown }>;
}

async function getCount(since?: string, until?: string): Promise<CountData> {
  const params = vercelBaseParams();
  if (since) params.set("since", since);
  if (until) params.set("until", until);
  const payload = await vercelRequest("/v1/query/web-analytics/visits/count", params);
  const data = (payload.data ?? {}) as Partial<CountData>;
  return {
    pageviews: Number(data.pageviews ?? 0),
    visitors: Number(data.visitors ?? 0),
  };
}

function normalizeBreakdown(rows: AggregateRow[], dimension: string): BreakdownItem[] {
  return rows
    .map((row) => {
      const rawLabel = row[dimension];
      const label = typeof rawLabel === "string" && rawLabel.trim() ? rawLabel.trim() : "Direct / unknown";
      return {
        label,
        count: Number(row.count ?? row.pageviews ?? 0),
        visitors: Number(row.visitors ?? 0),
      };
    })
    .filter((item) => Number.isFinite(item.count) && item.count > 0);
}

async function getBreakdown(
  dimension: string,
  since: string,
  until: string,
  limit = 12,
): Promise<BreakdownItem[]> {
  const params = vercelBaseParams();
  params.set("since", since);
  params.set("until", until);
  params.append("by", dimension);
  params.set("limit", String(limit));
  const payload = await vercelRequest("/v1/query/web-analytics/visits/aggregate", params);
  return normalizeBreakdown(Array.isArray(payload.data) ? payload.data as AggregateRow[] : [], dimension);
}

async function safeBreakdown(
  dimension: string,
  since: string,
  until: string,
  warnings: string[],
  limit?: number,
) {
  try {
    return await getBreakdown(dimension, since, until, limit);
  } catch (error) {
    warnings.push(dimension);
    console.warn("[founder-analytics] breakdown unavailable", {
      dimension,
      message: error instanceof Error ? error.message : "unknown",
    });
    return [];
  }
}

function normalizeReferrer(label: string) {
  const value = label.trim().toLowerCase();
  if (!value || value === "direct / unknown" || value === "direct") return "Прямой переход";
  if (value.includes("instagram")) return "Instagram";
  if (value.includes("google")) return "Google";
  if (value.includes("t.me") || value.includes("telegram")) return "Telegram";
  if (value.includes("facebook") || value.includes("fb.com")) return "Facebook";
  return "Другие сайты";
}

function groupReferrers(items: BreakdownItem[]) {
  const grouped = new Map<string, BreakdownItem>();
  for (const item of items) {
    const label = normalizeReferrer(item.label);
    const current = grouped.get(label);
    if (current) {
      current.count += item.count;
      current.visitors += item.visitors;
    } else {
      grouped.set(label, { ...item, label });
    }
  }
  return Array.from(grouped.values()).sort((a, b) => b.count - a.count);
}

function eventSlugFromPath(path: string) {
  const match = path.match(/^\/meets\/([^/?#]+)\/?(?:[?#].*)?$/);
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

async function getRadarEventLookup(accessToken: string) {
  const response = await fetch(
    `${RADAR_SUPABASE_URL}/rest/v1/radar_events?select=public_slug,title,city&status=eq.published&public_slug=not.is.null&limit=1000`,
    {
      headers: supabaseHeaders(accessToken),
      cache: "no-store",
    },
  );
  if (!response.ok) throw new Error(`Radar event lookup returned ${response.status}.`);
  const rows = await response.json() as RadarEventLookupRow[];
  return new Map(
    rows
      .filter((row): row is RadarEventLookupRow & { public_slug: string } => Boolean(row.public_slug))
      .map((row) => [row.public_slug, row] as const),
  );
}

function enrichPages(items: BreakdownItem[], eventLookup: Map<string, RadarEventLookupRow>) {
  return items.map((item) => {
    const slug = eventSlugFromPath(item.label);
    const event = slug ? eventLookup.get(slug) : null;
    return {
      ...item,
      path: item.label,
      ...(event ? { title: event.title, city: event.city } : {}),
    };
  });
}

export async function GET(request: NextRequest) {
  const accessToken = getBearer(request);
  if (!(await verifyRadarAdmin(accessToken))) {
    return json({
      error: "Сессия истекла. Войдите снова.",
      code: "RADAR_ADMIN_SESSION_INVALID",
    }, { status: 401 });
  }

  if (!process.env.VERCEL_ANALYTICS_TOKEN) {
    return json({
      error: "Аналитика пока не настроена.",
      code: "VERCEL_ANALYTICS_TOKEN_MISSING",
    }, { status: 503 });
  }

  const rawRange = request.nextUrl.searchParams.get("range") ?? "7d";
  const range: RangeKey = rawRange in RANGE_DAYS ? rawRange as RangeKey : "7d";
  const now = new Date();
  const until = now.toISOString();
  const since = rangeSince(RANGE_DAYS[range], now);
  const warnings: string[] = [];

  try {
    const selectedCountPromise = range === "90d"
      ? getCount(since, until)
      : Promise.resolve<CountData | null>(null);

    const [last24h, last7d, last30d, allTime, selected90d, countries, pages, referrers, devices, browsers, operatingSystems] = await Promise.all([
      getCount(rangeSince(1, now), until),
      getCount(rangeSince(7, now), until),
      getCount(rangeSince(30, now), until),
      getCount(),
      selectedCountPromise,
      safeBreakdown("country", since, until, warnings, 12),
      safeBreakdown("requestPath", since, until, warnings, 100),
      safeBreakdown("referrer", since, until, warnings, 20),
      safeBreakdown("deviceType", since, until, warnings, 12),
      safeBreakdown("browserName", since, until, warnings, 12),
      safeBreakdown("osName", since, until, warnings, 12),
    ]);

    const selected = range === "1d"
      ? last24h
      : range === "7d"
        ? last7d
        : range === "30d"
          ? last30d
          : selected90d ?? { pageviews: 0, visitors: 0 };

    let eventLookup = new Map<string, RadarEventLookupRow>();
    try {
      eventLookup = await getRadarEventLookup(accessToken);
    } catch (error) {
      warnings.push("radar_events");
      console.warn("[founder-analytics] event lookup unavailable", {
        message: error instanceof Error ? error.message : "unknown",
      });
    }

    const enrichedPages = enrichPages(pages, eventLookup);
    const topPages = enrichedPages.slice(0, 15);
    const topEventPages = enrichedPages
      .filter((item) => item.path?.startsWith("/meets/") && item.path !== "/meets/submit")
      .slice(0, 10);

    return json({
      generatedAt: until,
      range,
      rangeSince: since,
      counts: { selected, last24h, last7d, last30d, allTime },
      breakdowns: {
        countries,
        referrers: groupReferrers(referrers),
        devices,
        browsers,
        operatingSystems,
        topPages,
        topEventPages,
      },
      warnings,
    });
  } catch (error) {
    console.error("[founder-analytics] Vercel analytics request failed", {
      message: error instanceof Error ? error.message : "unknown",
    });
    return json({
      error: "Аналитика временно недоступна.",
      code: "ANALYTICS_PROVIDER_UNAVAILABLE",
    }, { status: 502 });
  }
}
