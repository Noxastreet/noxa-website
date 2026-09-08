export const MAP_LAYERS = ["events", "tracks", "routes", "places"] as const;

export type MapLayer = (typeof MAP_LAYERS)[number];
export type MapBBox = [number, number, number, number];

type Geometry = {
  type: string;
  coordinates?: unknown;
  geometries?: unknown;
};

export type MapFeatureRow = {
  feature_id: string;
  layer: MapLayer;
  feature_kind: "event" | "map_feature";
  title: string;
  title_el: string | null;
  feature_type: string;
  latitude: number | null;
  longitude: number | null;
  geometry_geojson: unknown;
  bbox_min_lat: number | null;
  bbox_min_lng: number | null;
  bbox_max_lat: number | null;
  bbox_max_lng: number | null;
  country_code: string;
  city: string | null;
  region: string | null;
  location_text: string | null;
  location_text_el: string | null;
  cover_image_url: string | null;
  href: string | null;
  starts_at: string | null;
  ends_at: string | null;
  source_url: string;
};

export type MapGeoJsonFeature = {
  type: "Feature";
  id: string;
  geometry: Geometry;
  properties: {
    layer: MapLayer;
    kind: "event" | "map_feature";
    title: string;
    titleEl: string | null;
    featureType: string;
    countryCode: string;
    city: string | null;
    region: string | null;
    location: string | null;
    locationEl: string | null;
    coverImageUrl: string | null;
    href: string | null;
    startsAt: string | null;
    endsAt: string | null;
    sourceUrl: string;
  };
};

export function parseMapBBox(raw: string | null): MapBBox {
  if (!raw) throw new Error("bbox is required");
  const parts = raw.split(",").map((value) => Number(value.trim()));
  if (parts.length !== 4 || parts.some((value) => !Number.isFinite(value))) {
    throw new Error("bbox must be minLng,minLat,maxLng,maxLat");
  }

  const [minLng, minLat, maxLng, maxLat] = parts;
  if (minLng < -180 || maxLng > 180 || minLat < -90 || maxLat > 90) {
    throw new Error("bbox is outside valid coordinate ranges");
  }
  if (minLng >= maxLng || minLat >= maxLat) {
    throw new Error("bbox minimums must be smaller than maximums");
  }
  if (maxLng - minLng > 40 || maxLat - minLat > 25) {
    throw new Error("bbox is too large; request the visible viewport only");
  }
  return [minLng, minLat, maxLng, maxLat];
}

export function parseMapLayers(raw: string | null): MapLayer[] {
  if (!raw?.trim()) return [...MAP_LAYERS];
  const requested = [...new Set(raw.split(",").map((value) => value.trim()).filter(Boolean))];
  if (requested.length === 0) return [...MAP_LAYERS];
  for (const layer of requested) {
    if (!(MAP_LAYERS as readonly string[]).includes(layer)) {
      throw new Error(`unsupported map layer: ${layer}`);
    }
  }
  return requested as MapLayer[];
}

export function parseMapLimit(raw: string | null) {
  if (!raw?.trim()) return 250;
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < 1) throw new Error("limit must be a positive integer");
  return Math.min(parsed, 500);
}

function isGeometry(value: unknown): value is Geometry {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const geometry = value as Record<string, unknown>;
  return typeof geometry.type === "string" && geometry.type.length > 0;
}

function isFiniteCoordinate(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function mapRowToGeoJsonFeature(row: MapFeatureRow): MapGeoJsonFeature | null {
  let geometry: Geometry | null = null;
  if (isGeometry(row.geometry_geojson)) {
    geometry = row.geometry_geojson;
  } else if (isFiniteCoordinate(row.latitude) && isFiniteCoordinate(row.longitude)) {
    geometry = { type: "Point", coordinates: [row.longitude, row.latitude] };
  }
  if (!geometry) return null;

  return {
    type: "Feature",
    id: row.feature_id,
    geometry,
    properties: {
      layer: row.layer,
      kind: row.feature_kind,
      title: row.title,
      titleEl: row.title_el,
      featureType: row.feature_type,
      countryCode: row.country_code,
      city: row.city,
      region: row.region,
      location: row.location_text,
      locationEl: row.location_text_el,
      coverImageUrl: row.cover_image_url,
      href: row.href,
      startsAt: row.starts_at,
      endsAt: row.ends_at,
      sourceUrl: row.source_url,
    },
  };
}
