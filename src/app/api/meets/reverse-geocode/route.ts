import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WINDOW_MS = 15 * 60 * 1000;
const LIMIT = 4;
const CACHE_MS = 6 * 60 * 60 * 1000;

type CachedLocation = { city: string | null; countryCode: string | null; expiresAt: number };
type GlobalState = typeof globalThis & {
  __noxaGeocodeAttempts?: Map<string, number[]>;
  __noxaGeocodeCache?: Map<string, CachedLocation>;
  __noxaNominatimLastCall?: number;
};

const state = globalThis as GlobalState;
state.__noxaGeocodeAttempts ??= new Map<string, number[]>();
state.__noxaGeocodeCache ??= new Map<string, CachedLocation>();

function json(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "private, max-age=300" } });
}

function clientKey(request: NextRequest) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}

function rateLimited(key: string) {
  const now = Date.now();
  const attempts = state.__noxaGeocodeAttempts!;
  const recent = (attempts.get(key) ?? []).filter((value) => value > now - WINDOW_MS);
  if (recent.length >= LIMIT) {
    attempts.set(key, recent);
    return true;
  }
  recent.push(now);
  attempts.set(key, recent);
  return false;
}

async function respectProviderRateLimit() {
  const last = state.__noxaNominatimLastCall ?? 0;
  const wait = Math.max(0, 1100 - (Date.now() - last));
  if (wait) await new Promise((resolve) => setTimeout(resolve, wait));
  state.__noxaNominatimLastCall = Date.now();
}

export async function GET(request: NextRequest) {
  const lat = Number(request.nextUrl.searchParams.get("lat"));
  const lon = Number(request.nextUrl.searchParams.get("lon"));
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) return json({ error: "invalid_coordinates" }, 400);
  if (rateLimited(clientKey(request))) return json({ error: "rate_limited" }, 429);

  const cacheKey = `${lat.toFixed(3)},${lon.toFixed(3)}`;
  const cached = state.__noxaGeocodeCache!.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return json({ city: cached.city, countryCode: cached.countryCode });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4500);
  try {
    await respectProviderRateLimit();
    const params = new URLSearchParams({ lat: String(lat), lon: String(lon), format: "jsonv2", addressdetails: "1", zoom: "10" });
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params.toString()}`, {
      headers: { Accept: "application/json", "Accept-Language": "en", "User-Agent": "NOXA Meets/1.0 (https://noxastreetapp.com)" },
      cache: "no-store",
      signal: controller.signal,
    });
    if (!response.ok) return json({ error: "lookup_failed" }, 502);
    const data = await response.json() as { address?: { city?: string; town?: string; village?: string; municipality?: string; county?: string; country_code?: string } };
    const address = data.address ?? {};
    const city = address.city ?? address.town ?? address.village ?? address.municipality ?? address.county ?? null;
    const countryCode = address.country_code?.toUpperCase() ?? null;
    state.__noxaGeocodeCache!.set(cacheKey, { city, countryCode, expiresAt: Date.now() + CACHE_MS });
    return json({ city, countryCode });
  } catch {
    return json({ error: "lookup_failed" }, 502);
  } finally {
    clearTimeout(timeout);
  }
}
