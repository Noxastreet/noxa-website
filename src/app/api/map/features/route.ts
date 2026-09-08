import { NextRequest, NextResponse } from "next/server";

import {
  mapRowToGeoJsonFeature,
  parseMapBBox,
  parseMapLayers,
  parseMapLimit,
  type MapFeatureRow,
} from "@/lib/mapViewport";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPABASE_URL = "https://qrouwtqsqrfeeeppyeru.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_vR9wivNa_fIb0QKmqua6Wg_H_7OPvUk";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const bbox = parseMapBBox(url.searchParams.get("bbox"));
    const layers = parseMapLayers(url.searchParams.get("layers"));
    const limit = parseMapLimit(url.searchParams.get("limit"));
    const [minLng, minLat, maxLng, maxLat] = bbox;

    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/automotive_map_features_in_view`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_PUBLISHABLE_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        p_min_lng: minLng,
        p_min_lat: minLat,
        p_max_lng: maxLng,
        p_max_lat: maxLat,
        p_layers: layers,
        p_limit: limit,
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("Automotive map viewport query failed", response.status, await response.text());
      return NextResponse.json(
        { error: "Map data is temporarily unavailable." },
        { status: 502, headers: { "Cache-Control": "no-store" } },
      );
    }

    const rows = (await response.json()) as MapFeatureRow[];
    const features = rows.map(mapRowToGeoJsonFeature).filter((feature) => feature !== null);

    return NextResponse.json(
      {
        type: "FeatureCollection",
        features,
        meta: {
          bbox,
          layers,
          count: features.length,
          limit,
          capped: rows.length >= limit,
        },
      },
      {
        headers: {
          "Cache-Control": "public, max-age=20, stale-while-revalidate=40",
        },
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid map request.";
    return NextResponse.json(
      { error: message },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }
}
