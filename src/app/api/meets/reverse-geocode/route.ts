import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET(request: NextRequest) {
  const lat = Number(request.nextUrl.searchParams.get("lat"));
  const lon = Number(request.nextUrl.searchParams.get("lon"));

  if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    return json({ error: "invalid_coordinates" }, 400);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4500);

  try {
    const params = new URLSearchParams({
      lat: String(lat),
      lon: String(lon),
      format: "jsonv2",
      addressdetails: "1",
      zoom: "10",
    });
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params.toString()}`, {
      headers: {
        Accept: "application/json",
        "Accept-Language": "en",
        "User-Agent": "NOXA Meets/1.0 (https://noxastreetapp.com)",
      },
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) return json({ error: "lookup_failed" }, 502);
    const data = await response.json() as {
      address?: {
        city?: string;
        town?: string;
        village?: string;
        municipality?: string;
        county?: string;
        country_code?: string;
      };
    };
    const address = data.address ?? {};
    const city = address.city ?? address.town ?? address.village ?? address.municipality ?? address.county ?? null;
    const countryCode = address.country_code?.toUpperCase() ?? null;
    return json({ city, countryCode });
  } catch {
    return json({ error: "lookup_failed" }, 502);
  } finally {
    clearTimeout(timeout);
  }
}
