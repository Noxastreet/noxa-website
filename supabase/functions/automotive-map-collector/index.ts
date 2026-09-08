import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const OVERPASS_URLS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
] as const;
const GREECE_OSM_AREA_ID = 3600192307;
const MAX_SOURCE_BYTES = 900_000;
const MAX_DISCOVERED_HOSTS = 48;
const VERIFY_THRESHOLD = 0.98;
const BLOCKED_RETRY_MS = 20 * 60 * 60 * 1000;

type Actor = { kind: "admin" | "scheduler"; label: string };
type MapSource = {
  id: string;
  name: string;
  source_type: string;
  base_url: string;
  country_code: string;
  trust_level: "high" | "medium" | "low";
  active: boolean;
};
type Candidate = {
  id: string;
  source_id: string | null;
  external_key: string;
  status: "new" | "verified" | "blocked" | "published";
  automation_origin?: string;
  verification_attempted_at?: string | null;
};
type OverpassElement = {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat?: number; lon?: number };
  tags?: Record<string, string>;
};
type ClassifiedFeature = {
  featureType: "track" | "route" | "automotive_place";
  featureSubtype: string;
};
type Coordinate = { latitude: number; longitude: number };
type PageEvidence = {
  url: string;
  text: string;
  description: string | null;
  coordinates: Coordinate[];
  locationText: string | null;
  city: string | null;
  region: string | null;
};
type ProcessResult = { outcome: "verified" | "blocked" | "skipped" | "failed"; key: string; reason: string };

function serviceHeaders(extra: Record<string, string> = {}) {
  return {
    apikey: SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

async function rest(path: string, init: RequestInit = {}) {
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: { ...serviceHeaders(), ...(init.headers ?? {}) },
  });
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function validCronSecret(secret: string) {
  if (!secret) return false;
  const response = await rest("radar_internal_secrets?name=eq.radar_collector_cron_secret&select=secret_hash&limit=1");
  if (!response.ok) return false;
  const rows = await response.json() as Array<{ secret_hash: string }>;
  return Boolean(rows[0]?.secret_hash) && rows[0].secret_hash === await sha256(secret);
}

async function getUser(jwt: string) {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${jwt}` },
  });
  if (!response.ok) return null;
  return await response.json() as { id: string; email?: string };
}

async function isAdmin(userId: string) {
  const response = await rest(`radar_admins?user_id=eq.${encodeURIComponent(userId)}&select=role&limit=1`);
  if (!response.ok) return false;
  return ((await response.json()) as Array<{ role: string }>).length > 0;
}

async function authorize(req: Request): Promise<Actor | null> {
  const cronSecret = req.headers.get("x-radar-cron-secret")?.trim() ?? "";
  if (cronSecret && await validCronSecret(cronSecret)) return { kind: "scheduler", label: "scheduled map collector" };
  const auth = req.headers.get("Authorization") ?? "";
  const jwt = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!jwt) return null;
  const user = await getUser(jwt);
  if (!user || !(await isAdmin(user.id))) return null;
  return { kind: "admin", label: user.email ?? user.id };
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

function normalizeText(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9α-ω]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function slug(value: string) {
  return normalizeText(value).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "source";
}

function canonicalHost(raw: string) {
  try {
    return new URL(raw).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

function safePublicUrl(raw: string) {
  try {
    const input = /^[a-z][a-z0-9+.-]*:/i.test(raw.trim()) ? raw.trim() : `https://${raw.trim()}`;
    const url = new URL(input);
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) return null;
    const host = url.hostname.toLowerCase();
    if (!host || host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal")) return null;
    if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(host) || host.includes(":")) return null;
    return url;
  } catch {
    return null;
  }
}

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function pageText(html: string) {
  return decodeHtml(html)
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 30_000);
}

function metaDescription(html: string) {
  const patterns = [
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i,
    /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i,
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern)?.[1];
    if (match) return decodeHtml(match).replace(/\s+/g, " ").trim().slice(0, 900);
  }
  return null;
}

function validGreekCoordinate(latitude: number, longitude: number) {
  return Number.isFinite(latitude) && Number.isFinite(longitude) && latitude >= 34 && latitude <= 42.8 && longitude >= 18.5 && longitude <= 30.5;
}

function coordinateKey(coordinate: Coordinate) {
  return `${coordinate.latitude.toFixed(6)},${coordinate.longitude.toFixed(6)}`;
}

function collectJsonLd(value: unknown, output: Record<string, unknown>[]) {
  if (Array.isArray(value)) {
    for (const item of value) collectJsonLd(item, output);
    return;
  }
  if (!value || typeof value !== "object") return;
  const row = value as Record<string, unknown>;
  output.push(row);
  for (const child of Object.values(row)) {
    if (child && typeof child === "object") collectJsonLd(child, output);
  }
}

function jsonLdObjects(html: string) {
  const objects: Record<string, unknown>[] = [];
  const regex = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  for (const match of html.matchAll(regex)) {
    try { collectJsonLd(JSON.parse(decodeHtml(match[1])), objects); } catch { /* malformed structured data */ }
  }
  return objects;
}

function numeric(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value === "string" && /^-?\d+(?:\.\d+)?$/.test(value.trim())) return Number(value);
  return null;
}

function extractCoordinates(html: string) {
  const result: Coordinate[] = [];
  const add = (latitude: number | null, longitude: number | null) => {
    if (latitude == null || longitude == null || !validGreekCoordinate(latitude, longitude)) return;
    result.push({ latitude, longitude });
  };

  for (const object of jsonLdObjects(html)) {
    add(numeric(object.latitude), numeric(object.longitude));
  }

  const decoded = decodeHtml(html);
  const directPatterns = [
    /["'](?:lat|latitude)["']\s*:\s*["']?(-?\d{2}\.\d+)["']?[\s\S]{0,180}?["'](?:lng|lon|longitude)["']\s*:\s*["']?(-?\d{2}\.\d+)["']?/gi,
    /@(-?\d{2}\.\d+),(-?\d{2}\.\d+)/g,
    /!3d(-?\d{2}\.\d+)!4d(-?\d{2}\.\d+)/g,
    /(?:[?&](?:q|query|center|ll)=)(-?\d{2}\.\d+)(?:%2C|,)(-?\d{2}\.\d+)/gi,
  ];
  for (const pattern of directPatterns) {
    for (const match of decoded.matchAll(pattern)) add(Number(match[1]), Number(match[2]));
  }

  const reversedPatterns = [
    /!2d(-?\d{2}\.\d+)!3d(-?\d{2}\.\d+)/g,
    /%212d(-?\d{2}\.\d+)%213d(-?\d{2}\.\d+)/gi,
  ];
  for (const pattern of reversedPatterns) {
    for (const match of decoded.matchAll(pattern)) add(Number(match[2]), Number(match[1]));
  }

  const unique = new Map<string, Coordinate>();
  for (const coordinate of result) unique.set(coordinateKey(coordinate), coordinate);
  return [...unique.values()].slice(0, 20);
}

function extractLocation(html: string) {
  for (const object of jsonLdObjects(html)) {
    const address = object.address;
    if (typeof address === "string" && address.trim()) {
      return { locationText: address.trim().slice(0, 500), city: null, region: null };
    }
    if (address && typeof address === "object" && !Array.isArray(address)) {
      const row = address as Record<string, unknown>;
      const street = typeof row.streetAddress === "string" ? row.streetAddress.trim() : "";
      const city = typeof row.addressLocality === "string" ? row.addressLocality.trim() : "";
      const region = typeof row.addressRegion === "string" ? row.addressRegion.trim() : "";
      const postal = typeof row.postalCode === "string" ? row.postalCode.trim() : "";
      const locationText = [street, postal, city, region].filter(Boolean).join(", ");
      if (locationText) return { locationText: locationText.slice(0, 500), city: city || null, region: region || null };
    }
  }
  return { locationText: null, city: null, region: null };
}

function distanceKm(a: Coordinate, b: Coordinate) {
  const toRad = (value: number) => value * Math.PI / 180;
  const earthKm = 6371;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return earthKm * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function chooseOfficialCoordinate(coordinates: Coordinate[], hint: Coordinate | null) {
  if (coordinates.length === 0) return null;
  if (!hint) return coordinates.length === 1 ? coordinates[0] : null;
  const sorted = [...coordinates].sort((a, b) => distanceKm(a, hint) - distanceKm(b, hint));
  return distanceKm(sorted[0], hint) <= 5 ? sorted[0] : null;
}

async function fetchOfficialPage(rawUrl: string): Promise<PageEvidence | null> {
  const initial = safePublicUrl(rawUrl);
  if (!initial) return null;
  const allowedHost = canonicalHost(initial.toString());
  let current = initial;

  for (let redirect = 0; redirect <= 2; redirect += 1) {
    try {
      const response = await fetch(current, {
        redirect: "manual",
        signal: AbortSignal.timeout(10_000),
        headers: { "User-Agent": "NOXA-Map-Collector/1.0 (+https://noxastreetapp.com/map)" },
      });
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        if (!location) return null;
        const next = safePublicUrl(new URL(location, current).toString());
        if (!next || canonicalHost(next.toString()) !== allowedHost) return null;
        current = next;
        continue;
      }
      if (!response.ok) return null;
      const length = Number(response.headers.get("content-length") ?? "0");
      if (length > MAX_SOURCE_BYTES) return null;
      const html = (await response.text()).slice(0, MAX_SOURCE_BYTES);
      const location = extractLocation(html);
      return {
        url: current.toString(),
        text: pageText(html),
        description: metaDescription(html),
        coordinates: extractCoordinates(html),
        ...location,
      };
    } catch {
      return null;
    }
  }
  return null;
}

const GENERIC_NAME_TOKENS = new Set([
  "greece", "greek", "track", "circuit", "racing", "race", "kart", "karting", "auto", "motor", "motorsport", "museum", "go",
]);

function pageMatchesName(name: string, text: string) {
  const tokens = normalizeText(name).split(" ").filter((token) => token.length >= 4 && !GENERIC_NAME_TOKENS.has(token));
  if (tokens.length === 0) return false;
  const normalizedPage = ` ${normalizeText(text)} `;
  const matches = tokens.filter((token) => normalizedPage.includes(` ${token} `) || normalizedPage.includes(token)).length;
  return matches >= 1 && matches / tokens.length >= 0.6;
}

function accessEvidence(feature: ClassifiedFeature, text: string) {
  const normalized = normalizeText(text);
  const publicWords = /book|booking|rent|rental|opening|open daily|schedule|hours|tickets|visit|arrive and drive|reservation|κρατη|ωραριο|ανοιχτ|εισιτη|επισκεπτ/.test(normalized);
  if (!publicWords) return null;
  if (feature.featureType === "track") {
    const drivingWords = /kart|drive|driving|track day|trackday|rental|race session|laps|οδηγ|πιστα/.test(normalized);
    if (!drivingWords) return null;
    return {
      publicAccess: "confirmed",
      drivingAccess: "conditional",
      notes: "Official venue website advertises public driving/karting access; availability can depend on hours, booking and venue rules.",
    };
  }
  if (feature.featureType === "automotive_place" && feature.featureSubtype === "automotive_museum") {
    return {
      publicAccess: "confirmed",
      drivingAccess: "not_applicable",
      notes: "Official venue website provides visitor/opening information.",
    };
  }
  return null;
}

function classifyFromTags(name: string, tags: Record<string, string>): ClassifiedFeature | null {
  const combined = normalizeText([
    name,
    tags.sport ?? "",
    tags.leisure ?? "",
    tags.tourism ?? "",
    tags.highway ?? "",
    tags.description ?? "",
    tags.operator ?? "",
    tags["name:en"] ?? "",
    tags["name:el"] ?? "",
  ].join(" "));

  if (tags.tourism === "museum" && /motor|automotive|automobile|car|vehicle|αυτοκ|αυτοκιν|οχημ|μοτο/.test(combined)) {
    return { featureType: "automotive_place", featureSubtype: "automotive_museum" };
  }

  const motorsportSignal = tags.highway === "raceway"
    || tags.leisure === "track"
    || /kart|karting|motorsport|motocross|motorcycle|motor racing|raceway|circuit|καρτ|μοτοκρος|πιστα/.test(combined);
  if (motorsportSignal) {
    if (/kart|karting|καρτ/.test(combined)) return { featureType: "track", featureSubtype: "kart_track" };
    if (/motocross|μοτοκρος/.test(combined)) return { featureType: "track", featureSubtype: "motocross_track" };
    return { featureType: "track", featureSubtype: "race_circuit" };
  }

  if (tags.route === "road" || (tags.scenic === "yes" && Boolean(tags.highway))) {
    return { featureType: "route", featureSubtype: "scenic_route" };
  }
  return null;
}

function classifyOfficialVenue(name: string, text: string): ClassifiedFeature | null {
  const combined = normalizeText(`${name} ${text.slice(0, 6000)}`);
  if (/museum|μουσει/.test(combined) && /motor|automotive|automobile|car|vehicle|αυτοκ|αυτοκιν|οχημ|μοτο/.test(combined)) {
    return { featureType: "automotive_place", featureSubtype: "automotive_museum" };
  }
  if (/kart|καρτ/.test(combined)) return { featureType: "track", featureSubtype: "kart_track" };
  if (/motocross|μοτοκρος/.test(combined)) return { featureType: "track", featureSubtype: "motocross_track" };
  if (/circuit|race track|racing circuit|motorsport|raceway|πιστα/.test(combined)) return { featureType: "track", featureSubtype: "race_circuit" };
  return null;
}

function hintFromElement(element: OverpassElement): Coordinate | null {
  const latitude = element.lat ?? element.center?.lat;
  const longitude = element.lon ?? element.center?.lon;
  return latitude != null && longitude != null && validGreekCoordinate(latitude, longitude) ? { latitude, longitude } : null;
}

function websiteFromTags(tags: Record<string, string>) {
  return tags.website ?? tags["contact:website"] ?? tags.url ?? tags["contact:url"] ?? "";
}

async function loadSources() {
  const response = await rest("automotive_map_sources?country_code=eq.GR&active=eq.true&select=id,name,source_type,base_url,country_code,trust_level,active");
  if (!response.ok) throw new Error(`Unable to load map sources (${response.status}).`);
  return await response.json() as MapSource[];
}

async function loadCandidates() {
  const response = await rest("automotive_map_candidates?select=id,source_id,external_key,status,automation_origin,verification_attempted_at");
  if (!response.ok) throw new Error(`Unable to load map candidates (${response.status}).`);
  return await response.json() as Candidate[];
}

async function createMediumSource(name: string, website: string, sourceType: string) {
  const response = await rest("automotive_map_sources", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      name,
      source_type: sourceType,
      base_url: website,
      country_code: "GR",
      trust_level: "medium",
      active: true,
      notes: "Automatically discovered from an OpenStreetMap website tag. The official page must independently match identity, geometry and access before any map publication.",
      verified_at: new Date().toISOString(),
    }),
  });
  if (!response.ok) throw new Error(`Unable to register discovered source (${response.status}).`);
  return (await response.json() as MapSource[])[0];
}

function shouldRetry(candidate: Candidate) {
  if (candidate.status === "new") return true;
  if (candidate.status !== "blocked" || !candidate.automation_origin || candidate.automation_origin === "manual") return false;
  const attempted = candidate.verification_attempted_at ? new Date(candidate.verification_attempted_at).getTime() : 0;
  return attempted > 0 && Date.now() - attempted >= BLOCKED_RETRY_MS;
}

async function upsertCandidateBase(payload: Record<string, unknown>, existing: Candidate | undefined) {
  if (existing) {
    const response = await rest(`automotive_map_candidates?id=eq.${encodeURIComponent(existing.id)}`, {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({ ...payload, status: "new", block_reason: null, updated_at: new Date().toISOString() }),
    });
    if (!response.ok) throw new Error(`Unable to refresh map candidate (${response.status}).`);
    return (await response.json() as Candidate[])[0];
  }
  const response = await rest("automotive_map_candidates", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({ ...payload, status: "new" }),
  });
  if (!response.ok) throw new Error(`Unable to create map candidate (${response.status}).`);
  return (await response.json() as Candidate[])[0];
}

async function markBlocked(candidateId: string, reason: string, confidence: number) {
  const now = new Date().toISOString();
  const response = await rest(`automotive_map_candidates?id=eq.${encodeURIComponent(candidateId)}`, {
    method: "PATCH",
    body: JSON.stringify({
      status: "blocked",
      block_reason: reason.slice(0, 1500),
      verification_confidence: Math.max(0, Math.min(1, confidence)),
      verification_reason: reason.slice(0, 1500),
      verification_attempted_at: now,
      auto_publish_outcome: "blocked",
      auto_publish_reason: reason.slice(0, 1500),
      updated_at: now,
    }),
  });
  if (!response.ok) throw new Error(`Unable to block candidate (${response.status}).`);
}

async function markVerified(candidateId: string, confidence: number, reason: string) {
  const now = new Date().toISOString();
  const response = await rest(`automotive_map_candidates?id=eq.${encodeURIComponent(candidateId)}`, {
    method: "PATCH",
    body: JSON.stringify({
      status: "verified",
      block_reason: null,
      verified_at: now,
      verification_confidence: confidence,
      verification_reason: reason,
      verification_attempted_at: now,
      auto_publish_outcome: null,
      auto_publish_reason: null,
      updated_at: now,
    }),
  });
  if (!response.ok) {
    const detail = (await response.text()).slice(0, 700);
    throw new Error(`Quality Gate rejected verified candidate (${response.status}): ${detail}`);
  }
}

async function buildCandidate(input: {
  externalKey: string;
  origin: "source_registry" | "osm_discovery";
  source: MapSource;
  title: string;
  feature: ClassifiedFeature;
  page: PageEvidence | null;
  hint: Coordinate | null;
  existing?: Candidate;
}): Promise<ProcessResult> {
  const { externalKey, origin, source, title, feature, page, hint, existing } = input;
  if (existing && !shouldRetry(existing)) return { outcome: "skipped", key: externalKey, reason: `existing_${existing.status}` };

  if (feature.featureType === "route") {
    const candidate = await upsertCandidateBase({
      external_key: externalKey,
      automation_origin: origin,
      feature_type: "route",
      feature_subtype: feature.featureSubtype,
      title,
      country_code: "GR",
      source_id: source.id,
      source_url: source.base_url,
      public_access_status: "unknown",
      driving_access_status: "unknown",
      tags: ["auto-map", `discovery:${origin}`],
    }, existing);
    const reason = "Automated route discovery is allowed, but publication is blocked until an authoritative route geometry and driving-access source are available.";
    await markBlocked(candidate.id, reason, 0.65);
    return { outcome: "blocked", key: externalKey, reason };
  }

  if (!page) {
    const candidate = await upsertCandidateBase({
      external_key: externalKey,
      automation_origin: origin,
      feature_type: feature.featureType,
      feature_subtype: feature.featureSubtype,
      title,
      country_code: "GR",
      source_id: source.id,
      source_url: source.base_url,
      public_access_status: "unknown",
      driving_access_status: "unknown",
      tags: ["auto-map", `discovery:${origin}`],
    }, existing);
    const reason = "Official source page could not be verified safely.";
    await markBlocked(candidate.id, reason, 0.45);
    return { outcome: "blocked", key: externalKey, reason };
  }

  const nameMatch = pageMatchesName(title, page.text);
  const officialCoordinate = chooseOfficialCoordinate(page.coordinates, hint);
  const access = accessEvidence(feature, page.text);
  let confidence = 0.55;
  if (nameMatch) confidence += 0.2;
  if (officialCoordinate) confidence += 0.15;
  if (access) confidence += 0.1;
  confidence = Math.min(1, confidence);

  const candidate = await upsertCandidateBase({
    external_key: externalKey,
    automation_origin: origin,
    feature_type: feature.featureType,
    feature_subtype: feature.featureSubtype,
    title,
    summary: page.description,
    country_code: "GR",
    city: page.city,
    region: page.region,
    location_text: page.locationText,
    latitude: officialCoordinate?.latitude ?? null,
    longitude: officialCoordinate?.longitude ?? null,
    geometry_source_url: officialCoordinate ? page.url : null,
    source_id: source.id,
    source_url: page.url,
    public_access_status: access?.publicAccess ?? "unknown",
    driving_access_status: access?.drivingAccess ?? "unknown",
    access_notes: access?.notes ?? null,
    access_source_url: access ? page.url : null,
    access_verified_at: access ? new Date().toISOString() : null,
    tags: ["auto-map", `discovery:${origin}`, `subtype:${feature.featureSubtype}`],
    verification_confidence: confidence,
    verification_reason: "Automated official-source verification in progress.",
    verification_attempted_at: new Date().toISOString(),
  }, existing);

  if (!nameMatch || !officialCoordinate || !access || confidence < VERIFY_THRESHOLD) {
    const failures = [
      !nameMatch ? "identity_not_confirmed" : null,
      !officialCoordinate ? "official_exact_coordinates_missing" : null,
      !access ? "public_access_not_confirmed" : null,
    ].filter(Boolean);
    const reason = `Automatic verification blocked: ${failures.join(",") || "confidence_below_threshold"}.`;
    await markBlocked(candidate.id, reason, confidence);
    return { outcome: "blocked", key: externalKey, reason };
  }

  const reason = "Official website identity, exact coordinate and public-access evidence verified; automation confidence >= 0.98.";
  try {
    await markVerified(candidate.id, confidence, reason);
    return { outcome: "verified", key: externalKey, reason };
  } catch (error) {
    const reasonText = error instanceof Error ? error.message : "Quality Gate rejected automatic verification.";
    await markBlocked(candidate.id, reasonText, confidence);
    return { outcome: "blocked", key: externalKey, reason: reasonText };
  }
}

async function collectRegistrySources(sources: MapSource[], candidates: Candidate[]) {
  const candidatesBySource = new Map(
    candidates.filter((candidate) => candidate.source_id).map((candidate) => [candidate.source_id as string, candidate]),
  );
  const eligible = sources.filter((source) =>
    source.active && source.trust_level === "high" && source.source_type === "official_venue"
  );
  const results: ProcessResult[] = [];

  for (const source of eligible.slice(0, 12)) {
    const existing = candidatesBySource.get(source.id);
    const externalKey = existing?.external_key ?? `auto-${slug(canonicalHost(source.base_url))}`.slice(0, 119);
    if (existing && !shouldRetry(existing)) {
      results.push({ outcome: "skipped", key: externalKey, reason: `existing_${existing.status}` });
      continue;
    }

    const page = await fetchOfficialPage(source.base_url);
    const feature = page ? classifyOfficialVenue(source.name, page.text) : classifyOfficialVenue(source.name, source.name);
    if (!feature) {
      results.push({ outcome: "skipped", key: externalKey, reason: "source_not_classifiable" });
      continue;
    }
    results.push(await buildCandidate({
      externalKey,
      origin: "source_registry",
      source,
      title: source.name,
      feature,
      page,
      hint: null,
      existing,
    }));
  }
  return results;
}

async function fetchOverpass(query: string) {
  let lastError: Error | null = null;
  for (const url of OVERPASS_URLS) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "NOXA-Map-Collector/1.2 (+https://noxastreetapp.com/map)",
        },
        body: new URLSearchParams({ data: query }),
        signal: AbortSignal.timeout(16_000),
      });
      if (!response.ok) {
        lastError = new Error(`Overpass discovery failed (${response.status}).`);
        continue;
      }
      const payload = await response.json() as { elements?: OverpassElement[] };
      return payload.elements ?? [];
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Overpass discovery unavailable");
    }
  }
  throw lastError ?? new Error("Overpass discovery unavailable");
}

async function loadOverpassElements() {
  // Greece relation 192307 maps to Overpass area 3600192307. Using the stable
  // area id preserves the exact country boundary without repeating an expensive
  // ISO relation lookup in every split query.
  const queries = [
    `[out:json][timeout:12];
      area(${GREECE_OSM_AREA_ID})->.gr;
      (
        nwr(area.gr)["sport"~"kart|karting|motorsport|motocross|motorcycle|motor racing",i];
        nwr(area.gr)["highway"="raceway"];
      );
      out center tags qt;`,
    `[out:json][timeout:12];
      area(${GREECE_OSM_AREA_ID})->.gr;
      nwr(area.gr)["tourism"="museum"]["name"~"motor|car|auto|automobile|vehicle|αυτοκ|αυτοκιν|οχημ|μοτο",i];
      out center tags qt;`,
  ];
  const settled = await Promise.allSettled(queries.map((query) => fetchOverpass(query)));
  const fulfilled = settled.filter((result): result is PromiseFulfilledResult<OverpassElement[]> => result.status === "fulfilled");
  if (fulfilled.length === 0) {
    const firstFailure = settled.find((result): result is PromiseRejectedResult => result.status === "rejected");
    throw firstFailure?.reason instanceof Error ? firstFailure.reason : new Error("Overpass discovery unavailable");
  }
  const unique = new Map<string, OverpassElement>();
  for (const result of fulfilled) {
    for (const element of result.value) unique.set(`${element.type}:${element.id}`, element);
  }
  return [...unique.values()];
}

async function collectOsmDiscoveries(sources: MapSource[], candidates: Candidate[]) {
  const elements = await loadOverpassElements();
  const sourceByHost = new Map(
    sources.map((source) => [canonicalHost(source.base_url), source] as const).filter(([host]) => Boolean(host)),
  );
  const candidateByKey = new Map(candidates.map((candidate) => [candidate.external_key, candidate]));
  const candidateSourceIds = new Set(candidates.map((candidate) => candidate.source_id).filter((id): id is string => Boolean(id)));

  const discoveries = new Map<string, { element: OverpassElement; name: string; website: string; feature: ClassifiedFeature }>();
  for (const element of elements) {
    const tags = element.tags ?? {};
    const name = tags.name?.trim();
    const website = safePublicUrl(websiteFromTags(tags))?.toString();
    const feature = name ? classifyFromTags(name, tags) : null;
    if (!name || !website || !feature) continue;
    const host = canonicalHost(website);
    if (!host || discoveries.has(host)) continue;
    discoveries.set(host, { element, name, website, feature });
    if (discoveries.size >= MAX_DISCOVERED_HOSTS) break;
  }

  const items = [...discoveries.values()];
  const results: ProcessResult[] = [];
  for (let offset = 0; offset < items.length; offset += 4) {
    const batch = items.slice(offset, offset + 4);
    const batchResults = await Promise.all(batch.map(async ({ element, name, website, feature }) => {
      const host = canonicalHost(website);
      const externalKey = `auto-osm-${element.type}-${element.id}`.slice(0, 119);
      let source = sourceByHost.get(host);
      try {
        if (!source) {
          source = await createMediumSource(name, website, feature.featureType === "route" ? "organizer" : "official_venue");
          sourceByHost.set(host, source);
        }
        if (source.trust_level === "low" || !source.active) {
          return { outcome: "blocked", key: externalKey, reason: "source_not_trusted" } as ProcessResult;
        }
        if (source.source_type === "official_venue" && candidateSourceIds.has(source.id)) {
          return { outcome: "skipped", key: externalKey, reason: "official_venue_source_already_tracked" } as ProcessResult;
        }
        const existing = candidateByKey.get(externalKey);
        if (existing && !shouldRetry(existing)) {
          return { outcome: "skipped", key: externalKey, reason: `existing_${existing.status}` } as ProcessResult;
        }
        const page = feature.featureType === "route" ? null : await fetchOfficialPage(website);
        const result = await buildCandidate({ externalKey, origin: "osm_discovery", source, title: name, feature, page, hint: hintFromElement(element), existing });
        if (source.source_type === "official_venue" && result.outcome !== "failed") candidateSourceIds.add(source.id);
        return result;
      } catch (error) {
        return { outcome: "failed", key: externalKey, reason: error instanceof Error ? error.message : "discovery_failed" } as ProcessResult;
      }
    }));
    results.push(...batchResults);
  }
  return results;
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json({ error: "METHOD_NOT_ALLOWED" }, 405);
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return json({ error: "SERVER_CONFIGURATION_ERROR" }, 500);
  const actor = await authorize(req);
  if (!actor) return json({ error: "UNAUTHORIZED" }, 401);

  try {
    const [sources, candidates] = await Promise.all([loadSources(), loadCandidates()]);
    const registryResults = await collectRegistrySources(sources, candidates);
    let osmResults: ProcessResult[] = [];
    try {
      osmResults = await collectOsmDiscoveries(sources, candidates);
    } catch (error) {
      osmResults = [{
        outcome: "failed",
        key: "osm-discovery",
        reason: error instanceof Error ? error.message : "OSM discovery unavailable",
      }];
    }
    const results = [...registryResults, ...osmResults];
    const count = (outcome: ProcessResult["outcome"]) => results.filter((result) => result.outcome === outcome).length;
    return json({
      ok: true,
      actor: actor.kind,
      processed: results.length,
      verified: count("verified"),
      blocked: count("blocked"),
      skipped: count("skipped"),
      failed: count("failed"),
      results: results.slice(0, 40),
    });
  } catch (error) {
    return json({ error: "MAP_COLLECTOR_FAILED", detail: error instanceof Error ? error.message : "Unknown error" }, 500);
  }
});