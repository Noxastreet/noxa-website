export const MAP_FEATURE_SUBTYPES = {
  track: [
    "race_circuit",
    "kart_track",
    "motocross_track",
    "offroad_park",
    "driving_center",
    "drag_strip",
    "other_track",
  ],
  route: ["scenic_route", "mountain_road", "touring_route", "offroad_route", "other_route"],
  automotive_place: [
    "photo_spot",
    "viewpoint",
    "automotive_museum",
    "meeting_venue",
    "garage",
    "tuning_shop",
    "club",
    "other_place",
  ],
} as const;

export const MAP_SOURCE_TYPES = [
  "official_venue",
  "government",
  "tourism_authority",
  "federation",
  "organizer",
  "club",
  "osm",
  "reliable_media",
  "community",
] as const;

export const MAP_SOURCE_TRUST_LEVELS = ["high", "medium", "low"] as const;
export const MAP_PUBLIC_ACCESS_STATUSES = ["confirmed", "conditional", "restricted", "unknown"] as const;
export const MAP_DRIVING_ACCESS_STATUSES = [
  "confirmed",
  "conditional",
  "restricted",
  "unknown",
  "not_applicable",
] as const;
export const MAP_CANDIDATE_STATUSES = ["new", "verified", "blocked", "published"] as const;

export type MapFeatureType = keyof typeof MAP_FEATURE_SUBTYPES;
export type MapFeatureSubtype = (typeof MAP_FEATURE_SUBTYPES)[MapFeatureType][number];
export type MapSourceType = (typeof MAP_SOURCE_TYPES)[number];
export type MapSourceTrustLevel = (typeof MAP_SOURCE_TRUST_LEVELS)[number];
export type MapPublicAccessStatus = (typeof MAP_PUBLIC_ACCESS_STATUSES)[number];
export type MapDrivingAccessStatus = (typeof MAP_DRIVING_ACCESS_STATUSES)[number];
export type MapCandidateStatus = (typeof MAP_CANDIDATE_STATUSES)[number];

export function isSubtypeForFeatureType(featureType: MapFeatureType, subtype: string) {
  return (MAP_FEATURE_SUBTYPES[featureType] as readonly string[]).includes(subtype);
}
