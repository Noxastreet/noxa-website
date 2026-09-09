export type EventFamily = "car" | "moto" | "motorsport";

export type DiscoveryEventLike = {
  id: string;
  city: string;
  eventType: string;
  latitude: number | null;
  longitude: number | null;
  locationPrecision: string | null;
};

export type GeoPoint = { latitude: number; longitude: number };

const MOTORSPORT_TYPES = new Set(["track_day", "drag", "drift", "rally", "karting", "dexterity"]);
const MOTO_TYPES = new Set(["moto_meet"]);

export function eventFamily(eventType: string): EventFamily {
  if (MOTO_TYPES.has(eventType)) return "moto";
  if (MOTORSPORT_TYPES.has(eventType)) return "motorsport";
  return "car";
}

export function hasExactPoint(event: DiscoveryEventLike) {
  return event.locationPrecision === "exact"
    && typeof event.latitude === "number"
    && Number.isFinite(event.latitude)
    && typeof event.longitude === "number"
    && Number.isFinite(event.longitude);
}

function radians(value: number) {
  return value * Math.PI / 180;
}

export function distanceKm(a: GeoPoint, b: GeoPoint) {
  const earthRadiusKm = 6371;
  const dLat = radians(b.latitude - a.latitude);
  const dLng = radians(b.longitude - a.longitude);
  const lat1 = radians(a.latitude);
  const lat2 = radians(b.latitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function eventDistanceKm(event: DiscoveryEventLike, point: GeoPoint) {
  if (!hasExactPoint(event)) return null;
  return distanceKm(point, { latitude: event.latitude as number, longitude: event.longitude as number });
}

export function buildNoxaMapHref(event: DiscoveryEventLike & { title?: string }, locale: "en" | "el" = "en") {
  if (!hasExactPoint(event)) return null;
  const query = new URLSearchParams({
    event: event.id,
    lat: String(event.latitude),
    lng: String(event.longitude),
  });
  if (event.title?.trim()) query.set("q", event.title.trim());
  return `${locale === "el" ? "/el" : ""}/map?${query.toString()}`;
}

export function rankRecommendations<T extends DiscoveryEventLike>({
  events,
  savedIds,
  selectedCity,
  selectedFamily,
  userLocation,
  excludeIds = [],
  limit = 4,
}: {
  events: T[];
  savedIds: string[];
  selectedCity?: string | null;
  selectedFamily?: EventFamily | "all" | null;
  userLocation?: GeoPoint | null;
  excludeIds?: string[];
  limit?: number;
}) {
  const savedSet = new Set(savedIds);
  const excluded = new Set(excludeIds);
  const savedEvents = events.filter((event) => savedSet.has(event.id));
  const cityAffinity = new Map<string, number>();
  const familyAffinity = new Map<EventFamily, number>();

  for (const event of savedEvents) {
    if (event.city) cityAffinity.set(event.city, (cityAffinity.get(event.city) ?? 0) + 1);
    const family = eventFamily(event.eventType);
    familyAffinity.set(family, (familyAffinity.get(family) ?? 0) + 1);
  }

  return events
    .filter((event) => !savedSet.has(event.id) && !excluded.has(event.id))
    .map((event) => {
      let score = 0;
      if (event.city) score += (cityAffinity.get(event.city) ?? 0) * 5;
      score += (familyAffinity.get(eventFamily(event.eventType)) ?? 0) * 4;
      if (selectedCity && selectedCity !== "all" && event.city === selectedCity) score += 4;
      if (selectedFamily && selectedFamily !== "all" && eventFamily(event.eventType) === selectedFamily) score += 3;
      if (userLocation) {
        const distance = eventDistanceKm(event, userLocation);
        if (distance !== null) {
          if (distance <= 25) score += 6;
          else if (distance <= 75) score += 4;
          else if (distance <= 150) score += 2;
        }
      }
      return { event, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(0, limit))
    .map(({ event }) => event);
}
