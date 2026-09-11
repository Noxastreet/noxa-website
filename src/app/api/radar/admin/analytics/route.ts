import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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
};

function json(body: unknown, init?: ResponseInit) {
  return Response.json(body, {
    ...init,
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      ...(init?.headers ?? {}),
    },
  });
}

function getBearer(request: NextRequest) {
  const authorization = request.headers.get("authorization") ?? "";
  return authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
}

async function verifyRadarAdmin(accessToken: string) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!supabaseUrl || !publishableKey || !accessToken) return false;

  const headers = {
    apikey: publishableKey,
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };

  const [userResponse, adminResponse] = await Promise.all([
    fetch(`${supabaseUrl}/auth/v1/user`, { headers, cache: "no-store" }),
    fetch(`${supabaseUrl}/rest/v1/rpc/radar_admin_status`, {
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
  const projectId = process.env.VERCEL_PROJECT_ID;
  const teamId = process.env.VERCEL_ORG_ID;
  if (!projectId) throw new Error("VERCEL_PROJECT_ID is unavailable.");

  const params = new URLSearchParams({ projectId });
  if (teamId) params.set("teamId", teamId);
  return params;
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
    warnings.push(`${dimension}: ${error instanceof Error ? error.message : "unavailable"}`);
    return [];
  }
}

export async function GET(request: NextRequest) {
  const accessToken = getBearer(request);
  if (!(await verifyRadarAdmin(accessToken))) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.VERCEL_ANALYTICS_TOKEN) {
    return json({
      error: "Founder Analytics is not configured yet.",
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
    const [last24h, last7d, last30d, allTime, countries, pages, referrers, devices, browsers, operatingSystems] = await Promise.all([
      getCount(rangeSince(1, now), until),
      getCount(rangeSince(7, now), until),
      getCount(rangeSince(30, now), until),
      getCount(),
      safeBreakdown("country", since, until, warnings, 12),
      safeBreakdown("requestPath", since, until, warnings, 100),
      safeBreakdown("referrer", since, until, warnings, 12),
      safeBreakdown("deviceType", since, until, warnings, 12),
      safeBreakdown("browserName", since, until, warnings, 12),
      safeBreakdown("osName", since, until, warnings, 12),
    ]);

    const topPages = pages.slice(0, 15);
    const topEventPages = pages
      .filter((item) => item.label.startsWith("/meets/") && item.label !== "/meets/submit")
      .slice(0, 10);

    return json({
      generatedAt: until,
      range,
      rangeSince: since,
      counts: { last24h, last7d, last30d, allTime },
      breakdowns: {
        countries,
        referrers,
        devices,
        browsers,
        operatingSystems,
        topPages,
        topEventPages,
      },
      warnings,
    });
  } catch (error) {
    return json({
      error: "Unable to load Vercel Web Analytics.",
      detail: error instanceof Error ? error.message : "Unknown analytics error.",
    }, { status: 502 });
  }
}
