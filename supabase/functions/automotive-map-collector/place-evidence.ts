export type TourismPlaceSubtype = "viewpoint" | "photo_spot";

export type TourismPlaceClassification = {
  subtype: TourismPlaceSubtype | null;
  reason: "scenic_evidence_missing" | null;
  scenicEvidence: boolean;
  photoEvidence: boolean;
};

export type TourismPlaceAccess = {
  publicAccess: "confirmed";
  drivingAccess: "conditional";
  notes: string;
};

function normalize(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9α-ω]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function classifyTourismPlace(
  name: string,
  text: string,
  preferredSubtype: TourismPlaceSubtype,
): TourismPlaceClassification {
  const normalized = normalize(`${name} ${text.slice(0, 20_000)}`);
  const scenicEvidence = /\bviewpoint\b|\blookout\b|\bvantage point\b|\bpanoramic view\b|\bpanoramic views\b|\b360 view\b|\b360 degree view\b|\boverlooking\b|\bbreathtaking view\b|\bstunning view\b|\bscenic view\b|\bθεα πανοραμ|\bπανοραμικ|\bσημειο θεας\b/.test(normalized);
  const photoEvidence = /\bphoto spot\b|\bphotography location\b|\bphotograph\b|\bphotographer\b|\bphotogenic\b|\bpostcard perfect\b|\bvisual delight\b|\bphoto viewpoint\b|\bsunset viewpoint\b|\bιδανικ.{0,20}φωτογραφ|\bφωτογραφ/.test(normalized);

  if (!scenicEvidence) {
    return { subtype: null, reason: "scenic_evidence_missing", scenicEvidence, photoEvidence };
  }

  return {
    subtype: preferredSubtype === "photo_spot" && photoEvidence ? "photo_spot" : "viewpoint",
    reason: null,
    scenicEvidence,
    photoEvidence,
  };
}

export function tourismPlaceAccessEvidence(text: string): TourismPlaceAccess | null {
  const normalized = normalize(text.slice(0, 30_000));
  const walkingOnly = /only reach.{0,80}on foot|only reachable.{0,50}on foot|access.{0,40}only.{0,30}on foot|can only.{0,40}walk|only access.{0,50}hiking|προσβαση.{0,50}μονο.{0,30}πεζ/.test(normalized);
  const trailheadOnly = /starting point.{0,180}(?:by car|drive|private car)|parking area.{0,120}(?:trail|path|hike|walk)/.test(normalized)
    && /\bhiking\b|\btrail\b|\bpath begins\b|\bwalk\b/.test(normalized);
  if (walkingOnly || trailheadOnly) return null;

  const drivingEvidence = /\bby car\b|\bdrive up\b|\bdrive to\b|\broad to drive\b|\baccessible by road\b|\broad access\b|\bprivate car\b|\b4x4 vehicle\b|\bshort drive\b|\breach.{0,50}by car\b|\broad leads\b|\bοδικ.{0,30}προσβα|\bμε αυτοκινητ/.test(normalized);
  const publicEvidence = /\bhow to get there\b|\bvisit\b|\bvisitors\b|\baccessible\b|\breach\b|\bopen\b|\bpublic\b|\bdrive\b|\bεπισκεπτ|\bπροσβα/.test(normalized);
  if (!drivingEvidence || !publicEvidence) return null;

  return {
    publicAccess: "confirmed",
    drivingAccess: "conditional",
    notes: "Official tourism source describes public road/car access to the scenic point; current signs, closures and local restrictions remain authoritative.",
  };
}
