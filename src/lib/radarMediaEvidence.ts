import { sameTrustedSource } from "./radarEnrichment.ts";

export type RadarMediaLocationEvidence = {
  coverImageUrl: string | null;
  coverImageAlt: string | null;
  coverImageAltEl: string | null;
  latitude: number | null;
  longitude: number | null;
  locationPrecision: "unknown" | "exact";
  outcome: "verified" | "partial" | "none";
  reason: string;
};

type JsonRecord = Record<string, unknown>;

function htmlDecode(value: string) {
  return value
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&#039;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function clean(value: unknown, maxLength = 500) {
  return typeof value === "string" ? htmlDecode(value).replace(/\s+/g, " ").trim().slice(0, maxLength) : "";
}

function asRecord(value: unknown): JsonRecord | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as JsonRecord : null;
}

function nodeTypes(node: JsonRecord) {
  const value = node["@type"];
  if (typeof value === "string") return [value.toLowerCase()];
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string").map((item) => item.toLowerCase());
  return [];
}

function flattenJsonLd(value: unknown, output: JsonRecord[] = []): JsonRecord[] {
  if (Array.isArray(value)) {
    for (const item of value) flattenJsonLd(item, output);
    return output;
  }
  const record = asRecord(value);
  if (!record) return output;
  output.push(record);
  const graph = record["@graph"];
  if (graph) flattenJsonLd(graph, output);
  return output;
}

function jsonLdNodes(html: string) {
  const nodes: JsonRecord[] = [];
  const pattern = /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  let count = 0;
  while ((match = pattern.exec(html)) !== null && count < 20) {
    count += 1;
    const body = match[1].trim();
    if (!body || body.length > 250_000) continue;
    try {
      flattenJsonLd(JSON.parse(body), nodes);
    } catch {
      // Ignore malformed JSON-LD. Never execute or interpret it as instructions.
    }
  }
  return nodes;
}

function safeResolvedUrl(raw: unknown, baseUrl: string, sourceUrl: string) {
  const text = clean(raw, 2_000);
  if (!text) return null;
  try {
    const url = new URL(text, baseUrl);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    if (!sameTrustedSource(url.toString(), sourceUrl)) return null;
    return url.toString();
  } catch {
    return null;
  }
}

function suspiciousImage(url: string) {
  try {
    const path = decodeURIComponent(new URL(url).pathname).toLowerCase();
    return /(?:^|[\/_\-.])(logo|favicon|icon|avatar|placeholder|default|fallback|no[-_ ]?image)(?:[\/_\-.]|$)/.test(path);
  } catch {
    return true;
  }
}

function imageFromValue(value: unknown): { url: unknown; alt: string } | null {
  if (typeof value === "string") return { url: value, alt: "" };
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = imageFromValue(item);
      if (found) return found;
    }
    return null;
  }
  const record = asRecord(value);
  if (!record) return null;
  const url = record.url ?? record.contentUrl ?? record["@id"];
  const alt = clean(record.caption ?? record.name ?? record.description, 300);
  return url ? { url, alt } : null;
}

function numberValue(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value.trim());
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function exactGeoFromEvent(event: JsonRecord) {
  const locations = Array.isArray(event.location) ? event.location : [event.location];
  for (const rawLocation of locations) {
    const location = asRecord(rawLocation);
    if (!location) continue;
    const geo = asRecord(location.geo);
    if (!geo || !nodeTypes(geo).includes("geocoordinates")) continue;
    const latitude = numberValue(geo.latitude);
    const longitude = numberValue(geo.longitude);
    if (latitude == null || longitude == null) continue;
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) continue;
    return { latitude, longitude };
  }
  return null;
}

function metaEntries(html: string) {
  const entries = new Map<string, string>();
  const tags = html.match(/<meta\b[^>]*>/gi) ?? [];
  for (const tag of tags.slice(0, 300)) {
    const attrs = new Map<string, string>();
    const pattern = /([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(tag)) !== null) {
      attrs.set(match[1].toLowerCase(), htmlDecode(match[2] ?? match[3] ?? match[4] ?? ""));
    }
    const key = (attrs.get("property") ?? attrs.get("name") ?? "").toLowerCase();
    const content = attrs.get("content")?.trim() ?? "";
    if (key && content && !entries.has(key)) entries.set(key, content);
  }
  return entries;
}

function titleKey(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9α-ω]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function titleMatches(candidateTitle: string, pageTitle: string) {
  const candidateWords = new Set(titleKey(candidateTitle).split(" ").filter((word) => word.length >= 4));
  const pageWords = new Set(titleKey(pageTitle).split(" ").filter((word) => word.length >= 4));
  if (candidateWords.size === 0 || pageWords.size === 0) return false;
  let shared = 0;
  for (const word of candidateWords) if (pageWords.has(word)) shared += 1;
  return shared >= Math.min(2, candidateWords.size);
}

export function extractRadarMediaLocationEvidence(input: {
  html: string;
  pageUrl: string;
  sourceUrl: string;
  title: string;
  titleEl?: string | null;
}): RadarMediaLocationEvidence {
  const nodes = jsonLdNodes(input.html);
  const events = nodes.filter((node) => nodeTypes(node).includes("event"));
  const meta = metaEntries(input.html);

  let imageUrl: string | null = null;
  let imageAlt = "";
  let imageEvidence = "";

  for (const event of events) {
    const image = imageFromValue(event.image);
    if (!image) continue;
    const resolved = safeResolvedUrl(image.url, input.pageUrl, input.sourceUrl);
    if (!resolved || suspiciousImage(resolved)) continue;
    imageUrl = resolved;
    imageAlt = image.alt;
    imageEvidence = "Event JSON-LD image";
    break;
  }

  if (!imageUrl) {
    const pageTitle = meta.get("og:title") ?? "";
    const rawImage = meta.get("og:image") ?? meta.get("twitter:image") ?? "";
    if (rawImage && titleMatches(input.title, pageTitle)) {
      const resolved = safeResolvedUrl(rawImage, input.pageUrl, input.sourceUrl);
      if (resolved && !suspiciousImage(resolved)) {
        imageUrl = resolved;
        imageAlt = clean(meta.get("og:image:alt") ?? meta.get("twitter:image:alt") ?? "", 300);
        imageEvidence = "matching event page social image";
      }
    }
  }

  let geo: { latitude: number; longitude: number } | null = null;
  for (const event of events) {
    geo = exactGeoFromEvent(event);
    if (geo) break;
  }

  const hasImage = Boolean(imageUrl);
  const hasGeo = Boolean(geo);
  const outcome = hasImage && hasGeo ? "verified" : (hasImage || hasGeo ? "partial" : "none");
  const reasons: string[] = [];
  if (hasImage) reasons.push(`official event image from ${imageEvidence}`);
  else reasons.push("no high-confidence event-specific image found");
  if (hasGeo) reasons.push("exact coordinates from Event.location GeoCoordinates");
  else reasons.push("no exact structured coordinates found");

  const fallbackAlt = `${input.title} — official event image`.slice(0, 300);
  const fallbackAltEl = `${input.titleEl?.trim() || input.title} — επίσημη εικόνα εκδήλωσης`.slice(0, 300);

  return {
    coverImageUrl: imageUrl,
    coverImageAlt: imageUrl ? (imageAlt || fallbackAlt) : null,
    coverImageAltEl: imageUrl ? fallbackAltEl : null,
    latitude: geo?.latitude ?? null,
    longitude: geo?.longitude ?? null,
    locationPrecision: geo ? "exact" : "unknown",
    outcome,
    reason: reasons.join("; "),
  };
}
