import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

const SOURCES = {
  hero: "https://images.pexels.com/videos/35716927/4k-cars-blue-car-car-aesthetics-car-show-35716927.jpeg?auto=compress&dpr=1&h=750&w=1260",
  heroFallback: "https://images.pexels.com/photos/17716197/pexels-photo-17716197.jpeg?auto=compress&cs=tinysrgb&w=1920",
  community: "https://images.pexels.com/photos/36421096/pexels-photo-36421096.jpeg?auto=compress&cs=tinysrgb&w=1400",
  organizer: "https://images.pexels.com/photos/10559704/pexels-photo-10559704.jpeg?auto=compress&cs=tinysrgb&w=1400",
  culture: "https://images.pexels.com/photos/16896020/pexels-photo-16896020/free-photo-of-cars-and-people-at-the-parking-lot-during-a-car-meet.jpeg?auto=compress&dpr=1&h=1080&w=1920",
} as const;

type AssetName = keyof typeof SOURCES;

export async function GET(request: NextRequest) {
  const asset = request.nextUrl.searchParams.get("asset") as AssetName | null;
  const source = asset ? SOURCES[asset] : undefined;

  if (!source) {
    return NextResponse.json({ error: "Unknown media asset" }, { status: 404 });
  }

  try {
    const upstream = await fetch(source, {
      headers: { Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8" },
      cache: "force-cache",
    });

    if (!upstream.ok || !upstream.body) {
      return NextResponse.json({ error: "Media unavailable" }, { status: 502 });
    }

    const headers = new Headers();
    headers.set("Content-Type", upstream.headers.get("content-type") || "image/jpeg");
    headers.set("Cache-Control", "public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000");
    headers.set("X-Content-Type-Options", "nosniff");

    return new Response(upstream.body, { status: 200, headers });
  } catch {
    return NextResponse.json({ error: "Media unavailable" }, { status: 502 });
  }
}
