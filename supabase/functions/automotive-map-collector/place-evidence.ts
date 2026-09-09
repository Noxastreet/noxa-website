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

function decodeBasicHtml(value: string) {
  return value
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function plainBlock(value: string) {
  return decodeBasicHtml(value)
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function shortHeadingLike(value: string) {
  const text = value.trim();
  return text.length > 0 && text.length <= 90 && !/[.!?;:]\s*$/.test(text);
}

export function tourismPlaceContext(name: string, text: string) {
  if (!text.trim()) return "";
  const lower = text.toLocaleLowerCase();
  const exact = name.trim().toLocaleLowerCase();
  let position = exact ? lower.indexOf(exact) : -1;

  if (position < 0) {
    const tokens = normalize(name)
      .split(" ")
      .filter((token) => token.length >= 5)
      .sort((a, b) => b.length - a.length);
    for (const token of tokens) {
      const rawPosition = lower.indexOf(token.toLocaleLowerCase());
      if (rawPosition >= 0) {
        position = rawPosition;
        break;
      }
    }
  }

  if (position < 0) return text.slice(0, 1_200);
  const start = Math.max(0, position - 320);
  const end = Math.min(text.length, position + Math.max(exact.length, 1) + 820);
  return text.slice(start, end);
}

export function tourismPlaceContextFromHtml(name: string, html: string) {
  const blocks: string[] = [];
  const blockPattern = /<(h[1-6]|p|li)\b[^>]*>([\s\S]*?)<\/\1>/gi;
  for (const match of html.matchAll(blockPattern)) {
    const text = plainBlock(match[2]);
    if (text) blocks.push(text);
    if (blocks.length >= 2_000) break;
  }
  if (blocks.length === 0) return "";

  const normalizedName = normalize(name);
  const tokens = normalizedName.split(" ").filter((token) => token.length >= 5);
  let index = blocks.findIndex((block) => normalize(block).includes(normalizedName));
  if (index < 0 && tokens.length > 0) {
    index = blocks.findIndex((block) => {
      const normalizedBlock = normalize(block);
      const matched = tokens.filter((token) => normalizedBlock.includes(token)).length;
      return matched >= Math.max(1, Math.ceil(tokens.length * 0.6));
    });
  }
  if (index < 0) return "";

  const selected: string[] = [blocks[index]];
  for (let offset = 1; offset <= 3 && index + offset < blocks.length; offset += 1) {
    const next = blocks[index + offset];
    if (shortHeadingLike(next)) break;
    selected.push(next);
    if (selected.join(" ").length >= 2_200) break;
  }
  return selected.join(" ").slice(0, 2_500);
}

export function classifyTourismPlace(
  name: string,
  text: string,
  preferredSubtype: TourismPlaceSubtype,
): TourismPlaceClassification {
  const normalized = normalize(`${name} ${text.slice(0, 20_000)}`);
  const scenicEvidence = /\bviewpoint\b|\blookout\b|\bvantage point\b|\bpanoramic view\b|\bpanoramic views\b|\b360 view\b|\b360 degree view\b|\boverlooking\b|\bbreathtaking view\b|\bstunning view\b|\bscenic view\b|θεα πανοραμ|πανοραμικ|σημειο θεας/.test(normalized);
  const photoEvidence = /\bphoto spot\b|\bphotography location\b|\bphotograph\b|\bphotographer\b|\bphotogenic\b|\bpostcard perfect\b|\bvisual delight\b|\bphoto viewpoint\b|\bsunset viewpoint\b|ιδανικ.{0,20}φωτογραφ|φωτογραφ/.test(normalized);

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

  const drivingEvidence = /\bby car\b|\bdrive up\b|\bdrive to\b|\broad to drive\b|\baccessible by road\b|\broad access\b|\bprivate car\b|\b4x4 vehicle\b|\bshort drive\b|\breach.{0,50}by car\b|\broad leads\b|οδικ.{0,30}προσβα|με αυτοκινητ/.test(normalized);
  const publicEvidence = /\bhow to get there\b|\bvisit\b|\bvisitors\b|\baccessible\b|\breach\b|\bopen\b|\bpublic\b|\bdrive\b|επισκεπτ|προσβα/.test(normalized);
  if (!drivingEvidence || !publicEvidence) return null;

  return {
    publicAccess: "confirmed",
    drivingAccess: "conditional",
    notes: "Official tourism source describes public road/car access to the scenic point; current signs, closures and local restrictions remain authoritative.",
  };
}
