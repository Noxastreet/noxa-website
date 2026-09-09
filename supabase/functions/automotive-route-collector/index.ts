import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const MAX_PAGE_BYTES = 900_000;
const MAX_KML_BYTES = 500_000;
const VERIFY_THRESHOLD = 0.98;

const ROUTES = [
  {
    externalKey: "visitgreece-amyntaio-lakes-light",
    sourceBaseUrl: "https://www.visitgreece.gr/",
    pageUrl: "https://www.visitgreece.gr/en/routes/amyntaio-between-the-lakes-and-the-light/",
    expectedTitle: "Amyntaio: Between the Lakes and the Light",
    featureSubtype: "scenic_route",
    startPoint: "Amyntaio",
    endPoint: "Panagitsa",
  },
] as const;

const OFFROAD_DISCOVERY = [
  {
    externalKey: "visitgreece-grevena-jeep-safari",
    sourceBaseUrl: "https://www.visitgreece.gr/",
    pageUrl: "https://www.visitgreece.gr/el/inspirations/jeep-safari-in-grevena",
    title: "Jeep safari in Grevena",
    city: "Grevena",
    locationText: "Grevena / Vasilitsa area",
    featureSubtype: "offroad_route",
  },
] as const;

type Source = {
  id: string;
  name: string;
  base_url: string;
  country_code: string;
  trust_level: "high" | "medium" | "low";
  active: boolean;
  verified_at: string;
};

type Candidate = {
  id: string;
  external_key: string;
  status: "new" | "verified" | "blocked" | "published";
};

type RouteGeometry =
  | { type: "LineString"; coordinates: number[][] }
  | { type: "MultiLineString"; coordinates: number[][][] };

type Result = { outcome: "verified" | "blocked" | "skipped" | "failed"; key: string; reason: string };

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

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
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
    const url = new URL(raw);
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) return null;
    const host = url.hostname.toLowerCase();
    if (!host || host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) return null;
    if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(host) || host.includes(":")) return null;
    return url;
  } catch {
    return null;
  }
}

async function fetchBounded(rawUrl: string, allowedHost: string, maxBytes: number) {
  const initial = safePublicUrl(rawUrl);
  if (!initial || canonicalHost(initial.toString()) !== allowedHost) return null;
  let current = initial;

  for (let redirect = 0; redirect <= 2; redirect += 1) {
    try {
      const response = await fetch(current, {
        redirect: "manual",
        signal: AbortSignal.timeout(15_000),
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; NOXA-Route-Collector/1.1; +https://noxastreetapp.com/map)",
          Accept: "text/html,application/xml,text/xml;q=0.9,*/*;q=0.5",
        },
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
      const declaredLength = Number(response.headers.get("content-length") ?? "0");
      if (declaredLength > maxBytes) return null;
      const text = (await response.text()).slice(0, maxBytes);
      return { url: current.toString(), text };
    } catch {
      return null;
    }
  }
  return null;
}

function normalizeEmbedded(value: string) {
  return value
    .replace(/\\u003c/gi, "<")
    .replace(/\\u003e/gi, ">")
    .replace(/\\u0026/gi, "&")
    .replace(/\\\//g, "/")
    .replace(/\\"/g, '"')
    .replace(/&amp;/gi, "&");
}

function metaDescription(html: string) {
  const normalized = normalizeEmbedded(html);
  for (const pattern of [
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i,
  ]) {
    const match = normalized.match(pattern)?.[1];
    if (match) return match.replace(/\s+/g, " ").trim().slice(0, 900);
  }
  return null;
}

function routePageEvidence(html: string, expectedTitle: string) {
  const normalized = normalizeEmbedded(html);
  const lower = normalized.toLowerCase();
  const titleOk = lower.includes(expectedTitle.toLowerCase());
  const roadOk = /["']route_type["']\s*:\s*["']road["']/i.test(normalized);
  const kmlUrl = normalized.match(/https:\/\/cdn\.visitgreece\.gr\/[^"'\\\s<>]+\.kml/i)?.[0] ?? null;
  const routeLength = normalized.match(/["']route_length["']\s*:\s*["']([^"']+)["']/i)?.[1]?.trim() ?? null;
  return { titleOk, roadOk, kmlUrl, routeLength, description: metaDescription(normalized) };
}

function offroadPageEvidence(html: string) {
  const normalized = normalizeEmbedded(html);
  const lower = normalized.toLowerCase();
  const titleOk = lower.includes("jeep safari") && (lower.includes("grevena") || lower.includes("γρεβεν"));
  const offroadOk = lower.includes("off road") || lower.includes("off-road");
  const fourByFourOk = lower.includes("4x4") || lower.includes("4×4") || lower.includes("τετρακίν");
  const dirtRoadOk = lower.includes("χωματόδρο") || lower.includes("dirt road") || lower.includes("forest road");
  const authoritativeGeometryUrl = normalized.match(/https:\/\/[^"'\\\s<>]+\.(?:kml|gpx)(?:\?[^"'\\\s<>]*)?/i)?.[0] ?? null;
  return {
    titleOk,
    offroadOk,
    fourByFourOk,
    dirtRoadOk,
    authoritativeGeometryUrl,
    description: metaDescription(normalized),
  };
}

function validGreekCoordinate(latitude: number, longitude: number) {
  return Number.isFinite(latitude) && Number.isFinite(longitude)
    && latitude >= 34 && latitude <= 42.8 && longitude >= 18.5 && longitude <= 30.5;
}

function parseKmlGeometry(kml: string): RouteGeometry | null {
  const lines: number[][][] = [];
  const linePattern = /<LineString\b[\s\S]*?<coordinates>([\s\S]*?)<\/coordinates>[\s\S]*?<\/LineString>/gi;
  for (const match of kml.matchAll(linePattern)) {
    const coordinates: number[][] = [];
    for (const token of match[1].trim().split(/\s+/)) {
      const [longitudeText, latitudeText] = token.split(",");
      const longitude = Number(longitudeText);
      const latitude = Number(latitudeText);
      if (!validGreekCoordinate(latitude, longitude)) return null;
      const previous = coordinates.at(-1);
      if (!previous || previous[0] !== longitude || previous[1] !== latitude) coordinates.push([longitude, latitude]);
      if (coordinates.length > 20_000) return null;
    }
    if (coordinates.length >= 2) lines.push(coordinates);
  }
  if (lines.length === 0) return null;
  if (lines.length === 1) return { type: "LineString", coordinates: lines[0] };
  return { type: "MultiLineString", coordinates: lines };
}

function geometryBbox(geometry: RouteGeometry) {
  const points = geometry.type === "LineString" ? geometry.coordinates : geometry.coordinates.flat();
  if (points.length < 2) return null;
  let minLng = points[0][0]; let maxLng = points[0][0];
  let minLat = points[0][1]; let maxLat = points[0][1];
  for (const [lng, lat] of points) {
    minLng = Math.min(minLng, lng); maxLng = Math.max(maxLng, lng);
    minLat = Math.min(minLat, lat); maxLat = Math.max(maxLat, lat);
  }
  return { minLng, minLat, maxLng, maxLat };
}

async function loadSource(baseUrl: string) {
  const response = await rest(`automotive_map_sources?base_url=eq.${encodeURIComponent(baseUrl)}&select=id,name,base_url,country_code,trust_level,active,verified_at&limit=1`);
  if (!response.ok) throw new Error(`Unable to load route source (${response.status}).`);
  return (await response.json() as Source[])[0] ?? null;
}

async function loadCandidate(externalKey: string) {
  const response = await rest(`automotive_map_candidates?external_key=eq.${encodeURIComponent(externalKey)}&select=id,external_key,status&limit=1`);
  if (!response.ok) throw new Error(`Unable to load route candidate (${response.status}).`);
  return (await response.json() as Candidate[])[0] ?? null;
}

async function upsertCandidate(existing: Candidate | null, payload: Record<string, unknown>) {
  if (existing) {
    const response = await rest(`automotive_map_candidates?id=eq.${encodeURIComponent(existing.id)}`, {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({ ...payload, status: "new", block_reason: null, updated_at: new Date().toISOString() }),
    });
    if (!response.ok) throw new Error(`Unable to refresh route candidate (${response.status}): ${(await response.text()).slice(0, 500)}`);
    return (await response.json() as Candidate[])[0];
  }
  const response = await rest("automotive_map_candidates", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({ ...payload, status: "new" }),
  });
  if (!response.ok) throw new Error(`Unable to create route candidate (${response.status}): ${(await response.text()).slice(0, 500)}`);
  return (await response.json() as Candidate[])[0];
}

async function markBlocked(candidateId: string, reason: string, confidence: number) {
  const now = new Date().toISOString();
  const response = await rest(`automotive_map_candidates?id=eq.${encodeURIComponent(candidateId)}`, {
    method: "PATCH",
    body: JSON.stringify({
      status: "blocked",
      block_reason: reason.slice(0, 1500),
      verification_confidence: confidence,
      verification_reason: reason.slice(0, 1500),
      verification_attempted_at: now,
      auto_publish_outcome: "blocked",
      auto_publish_reason: reason.slice(0, 1500),
      updated_at: now,
    }),
  });
  if (!response.ok) throw new Error(`Unable to block route candidate (${response.status}).`);
}

async function markVerified(candidateId: string, reason: string) {
  const now = new Date().toISOString();
  const response = await rest(`automotive_map_candidates?id=eq.${encodeURIComponent(candidateId)}`, {
    method: "PATCH",
    body: JSON.stringify({
      status: "verified",
      verified_at: now,
      verification_confidence: 1,
      verification_reason: reason,
      verification_attempted_at: now,
      auto_publish_outcome: null,
      auto_publish_reason: null,
      updated_at: now,
    }),
  });
  if (!response.ok) throw new Error(`Route Quality Gate rejected verification (${response.status}): ${(await response.text()).slice(0, 700)}`);
}

async function processRoute(route: typeof ROUTES[number]): Promise<Result> {
  const existing = await loadCandidate(route.externalKey);
  if (existing?.status === "published") return { outcome: "skipped", key: route.externalKey, reason: "existing_published" };

  const source = await loadSource(route.sourceBaseUrl);
  if (!source || !source.active || source.country_code !== "GR" || source.trust_level !== "high" || !source.verified_at) {
    return { outcome: "failed", key: route.externalKey, reason: "high_trust_tourism_source_not_registered" };
  }

  const pageHost = canonicalHost(route.pageUrl);
  const page = await fetchBounded(route.pageUrl, pageHost, MAX_PAGE_BYTES);
  const pageEvidence = page ? routePageEvidence(page.text, route.expectedTitle) : null;
  const basePayload = {
    external_key: route.externalKey,
    automation_origin: "source_registry",
    feature_type: "route",
    feature_subtype: route.featureSubtype,
    title: route.expectedTitle,
    country_code: "GR",
    city: route.startPoint,
    location_text: `${route.startPoint} → ${route.endPoint}`,
    source_id: source.id,
    source_url: page?.url ?? route.pageUrl,
    public_access_status: "unknown",
    driving_access_status: "unknown",
    tags: ["auto-map", "route:official-tourism", "route:road"],
  };

  if (!page || !pageEvidence?.titleOk || !pageEvidence.roadOk || !pageEvidence.kmlUrl) {
    const candidate = await upsertCandidate(existing, basePayload);
    const failures = [
      !page ? "official_page_unavailable" : null,
      page && !pageEvidence?.titleOk ? "identity_not_confirmed" : null,
      page && !pageEvidence?.roadOk ? "official_road_classification_missing" : null,
      page && !pageEvidence?.kmlUrl ? "authoritative_kml_missing" : null,
    ].filter(Boolean).join(",");
    const reason = `Automatic route verification blocked: ${failures}.`;
    await markBlocked(candidate.id, reason, 0.55);
    return { outcome: "blocked", key: route.externalKey, reason };
  }

  const kmlHost = canonicalHost(pageEvidence.kmlUrl);
  if (kmlHost !== "cdn.visitgreece.gr") {
    const candidate = await upsertCandidate(existing, basePayload);
    const reason = "Automatic route verification blocked: KML host is not the official Visit Greece CDN.";
    await markBlocked(candidate.id, reason, 0.65);
    return { outcome: "blocked", key: route.externalKey, reason };
  }

  const kml = await fetchBounded(pageEvidence.kmlUrl, kmlHost, MAX_KML_BYTES);
  const geometry = kml ? parseKmlGeometry(kml.text) : null;
  const bbox = geometry ? geometryBbox(geometry) : null;
  if (!kml || !geometry || !bbox) {
    const candidate = await upsertCandidate(existing, basePayload);
    const reason = "Automatic route verification blocked: authoritative KML LineString could not be validated.";
    await markBlocked(candidate.id, reason, 0.75);
    return { outcome: "blocked", key: route.externalKey, reason };
  }

  const reason = "Official tourism authority route page identifies a Road route and supplies authoritative KML LineString geometry; public road driving remains conditional on current closures, signs and local rules.";
  const candidate = await upsertCandidate(existing, {
    ...basePayload,
    summary: pageEvidence.description,
    geometry_geojson: geometry,
    bbox_min_lng: bbox.minLng,
    bbox_min_lat: bbox.minLat,
    bbox_max_lng: bbox.maxLng,
    bbox_max_lat: bbox.maxLat,
    geometry_source_url: kml.url,
    public_access_status: "confirmed",
    driving_access_status: "conditional",
    access_notes: `${reason}${pageEvidence.routeLength ? ` Official route length: ${pageEvidence.routeLength}.` : ""}`,
    access_source_url: page.url,
    access_verified_at: new Date().toISOString(),
    verification_confidence: 1,
    verification_reason: reason,
    verification_attempted_at: new Date().toISOString(),
  });

  try {
    await markVerified(candidate.id, reason);
    return { outcome: "verified", key: route.externalKey, reason };
  } catch (error) {
    const reasonText = error instanceof Error ? error.message : "Route Quality Gate rejected verification.";
    await markBlocked(candidate.id, reasonText, VERIFY_THRESHOLD);
    return { outcome: "blocked", key: route.externalKey, reason: reasonText };
  }
}

async function processOffroadDiscovery(route: typeof OFFROAD_DISCOVERY[number]): Promise<Result> {
  const existing = await loadCandidate(route.externalKey);
  if (existing?.status === "published" || existing?.status === "verified") {
    return { outcome: "skipped", key: route.externalKey, reason: `existing_${existing.status}` };
  }

  const source = await loadSource(route.sourceBaseUrl);
  if (!source || !source.active || source.country_code !== "GR" || source.trust_level !== "high" || !source.verified_at) {
    return { outcome: "failed", key: route.externalKey, reason: "high_trust_tourism_source_not_registered" };
  }

  const pageHost = canonicalHost(route.pageUrl);
  const page = await fetchBounded(route.pageUrl, pageHost, MAX_PAGE_BYTES);
  const evidence = page ? offroadPageEvidence(page.text) : null;
  const evidenceConfirmed = Boolean(evidence?.titleOk && evidence.offroadOk && evidence.fourByFourOk);

  const candidate = await upsertCandidate(existing, {
    external_key: route.externalKey,
    automation_origin: "source_registry",
    feature_type: "route",
    feature_subtype: route.featureSubtype,
    title: route.title,
    country_code: "GR",
    city: route.city,
    location_text: route.locationText,
    summary: evidence?.description ?? null,
    source_id: source.id,
    source_url: page?.url ?? route.pageUrl,
    public_access_status: "unknown",
    driving_access_status: "unknown",
    tags: ["auto-map", "route:official-tourism", "route:offroad", "4x4"],
  });

  const failures = [
    !page ? "official_page_unavailable" : null,
    page && !evidenceConfirmed ? "offroad_identity_not_confirmed" : null,
    evidenceConfirmed && !evidence?.authoritativeGeometryUrl ? "authoritative_geometry_missing" : null,
    evidenceConfirmed && evidence?.authoritativeGeometryUrl ? "offroad_geometry_adapter_not_verified" : null,
    "current_public_driving_access_not_verified",
  ].filter(Boolean).join(",");

  const reason = evidenceConfirmed
    ? `Automatic off-road route verification blocked: ${failures}. Official tourism authority confirms 4x4/off-road use, but NOXA will not synthesize route geometry or assume current access.`
    : `Automatic off-road route verification blocked: ${failures}.`;
  await markBlocked(candidate.id, reason, evidenceConfirmed ? 0.9 : 0.5);
  return { outcome: "blocked", key: route.externalKey, reason };
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json({ error: "METHOD_NOT_ALLOWED" }, 405);
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return json({ error: "SERVER_CONFIGURATION_ERROR" }, 500);
  const secret = req.headers.get("x-radar-cron-secret")?.trim() ?? "";
  if (!(await validCronSecret(secret))) return json({ error: "UNAUTHORIZED" }, 401);

  const results: Result[] = [];
  for (const route of ROUTES) {
    try {
      results.push(await processRoute(route));
    } catch (error) {
      results.push({ outcome: "failed", key: route.externalKey, reason: error instanceof Error ? error.message : "route_processing_failed" });
    }
  }
  for (const route of OFFROAD_DISCOVERY) {
    try {
      results.push(await processOffroadDiscovery(route));
    } catch (error) {
      results.push({ outcome: "failed", key: route.externalKey, reason: error instanceof Error ? error.message : "offroad_discovery_failed" });
    }
  }

  const count = (outcome: Result["outcome"]) => results.filter((result) => result.outcome === outcome).length;
  return json({
    ok: true,
    processed: results.length,
    verified: count("verified"),
    blocked: count("blocked"),
    skipped: count("skipped"),
    failed: count("failed"),
    results,
  });
});
