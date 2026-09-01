import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import {
  collectCarsCoffeeGreece,
  collectElmotoEvents,
  collectHellenicSpot,
} from "./communityAdapters.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const ALLOWED_ORIGIN = "https://noxastreetapp.com";

type Source = { id: string; name: string; platform: string; url: string; country_code: string; active: boolean; trust_level: string };
type TribeEvent = {
  id?: number | string; title?: string; description?: string; excerpt?: string;
  start_date?: string; end_date?: string; utc_start_date?: string; utc_end_date?: string;
  timezone?: string; url?: string;
  venue?: { venue?: string; city?: string; country?: string };
  organizer?: Array<{ organizer?: string; website?: string }> | { organizer?: string; website?: string };
  categories?: Array<{ name?: string; slug?: string }>;
};
type Actor = { kind: "admin" | "scheduler"; label: string };
type CandidateInput = Record<string, unknown> & { original_url: string; starts_at: string | null; ends_at: string | null };
type ExistingRecord = { title: string; country_code: string; event_type: string; starts_at: string | null; city: string | null; location_text: string | null };
type ParsedDates = { startsAt: string; endsAt: string | null };

function corsHeaders(origin: string | null) {
  return {
    "Access-Control-Allow-Origin": origin === ALLOWED_ORIGIN ? ALLOWED_ORIGIN : ALLOWED_ORIGIN,
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-radar-cron-secret",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
}
function json(data: unknown, status = 200, origin: string | null = null) {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...corsHeaders(origin) } });
}
function serviceHeaders(extra: Record<string, string> = {}) {
  return { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}`, "Content-Type": "application/json", ...extra };
}
async function rest(path: string, init: RequestInit = {}) {
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, { ...init, headers: { ...serviceHeaders(), ...(init.headers ?? {}) } });
}
async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
async function getUser(jwt: string) {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${jwt}` } });
  if (!response.ok) return null;
  return await response.json() as { id: string; email?: string };
}
async function isAdmin(userId: string) {
  const response = await rest(`radar_admins?user_id=eq.${encodeURIComponent(userId)}&select=role&limit=1`);
  if (!response.ok) return false;
  return ((await response.json()) as Array<{ role: string }>).length > 0;
}
async function validCronSecret(secret: string) {
  if (!secret) return false;
  const response = await rest("radar_internal_secrets?name=eq.radar_collector_cron_secret&select=secret_hash&limit=1");
  if (!response.ok) return false;
  const rows = await response.json() as Array<{ secret_hash: string }>;
  return Boolean(rows[0]?.secret_hash) && rows[0].secret_hash === await sha256(secret);
}
async function authorize(req: Request): Promise<Actor | null> {
  const cronSecret = req.headers.get("x-radar-cron-secret") ?? "";
  if (cronSecret && await validCronSecret(cronSecret)) return { kind: "scheduler", label: "scheduled collector" };
  const auth = req.headers.get("Authorization") ?? "";
  const jwt = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!jwt) return null;
  const user = await getUser(jwt);
  if (!user || !(await isAdmin(user.id))) return null;
  return { kind: "admin", label: user.email ?? user.id };
}

function canonicalUrlKey(raw: string) {
  try {
    const url = new URL(raw);
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    let path = decodeURIComponent(url.pathname).toLowerCase().replace(/\/+/g, "/");
    path = path.replace(/^\/(en|el|gr|bg)(?=\/)/, "").replace(/\/$/, "");
    const noxaEvent = url.searchParams.get("noxa_event")?.trim().toLowerCase();
    return `${host}${path}${noxaEvent ? `?noxa_event=${encodeURIComponent(noxaEvent)}` : ""}`;
  } catch {
    return raw.trim().toLowerCase().replace(/\/$/, "");
  }
}
function normalizeTitle(value: string) { return value.replace(/\s+/g, " ").trim(); }
function classify(title: string) {
  const t = title.toLowerCase();
  if (/drag|dragster/.test(t)) return "drag";
  if (/drift/.test(t)) return "drift";
  if (/rally|rallye|baja|ράλλυ|ραλλυ/.test(t)) return "rally";
  if (/cars?\s*&\s*coffee|cars? and coffee/.test(t)) return "cars_and_coffee";
  if (/car meet|meet-up|meetup/.test(t)) return "car_meet";
  if (/festival/.test(t)) return "festival";
  if (/show/.test(t)) return "show";
  if (/track|road racing|race|motodays|ταχύτητα|ταχυτητα/.test(t)) return "track_day";
  if (/moto|motorcycle|bike/.test(t)) return "moto_meet";
  return "other";
}
function isRelevant(title: string) {
  const t = title.toLowerCase();
  if (/closed|under construction|scientific research|corporate event|αποτελέσματα|αποτελεσματα|συμμετοχές|συμμετοχες/.test(t)) return false;
  return /open track|free training|track\s*day|trackday|drag|dragster|drift|rally|ράλλυ|ραλλυ|ανάβαση|αναβαση|ταχύτητα|ταχυτητα|moto|motorcycle|road racing|race|motodays|car meet|cars?\s*&\s*coffee|cars? and coffee|automotive|motorsport/.test(t);
}
function isAmotoeRelevant(title: string) {
  const t = title.toLowerCase();
  return /dragster|trial|enduro|motocross|scramble|rally|rallye|baja|trailride|ταχυτ|αγων|αγών|πρωταθλ|κύπελλ|κυπελλ/.test(t);
}
function parseUtc(value?: string) {
  if (!value) return null;
  const cleaned = value.trim().replace(" ", "T");
  const withZone = /(?:Z|[+-]\d\d:?\d\d)$/.test(cleaned) ? cleaned : `${cleaned}Z`;
  const date = new Date(withZone);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}
function datedIso(day: number, month: number, year: number, hourUtc: number) {
  const fullYear = year < 100 ? 2000 + year : year;
  const date = new Date(Date.UTC(fullYear, month - 1, day, hourUtc, 0, 0));
  if (date.getUTCFullYear() !== fullYear || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return date.toISOString();
}
function parseDatesFromTitle(title: string): ParsedDates | null {
  const crossMonth = title.match(/(\d{1,2})\/(\d{1,2})\s*[-–—]\s*(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (crossMonth) {
    const year = Number(crossMonth[5]);
    const startsAt = datedIso(Number(crossMonth[1]), Number(crossMonth[2]), year, 6);
    const endsAt = datedIso(Number(crossMonth[3]), Number(crossMonth[4]), year, 20);
    return startsAt ? { startsAt, endsAt } : null;
  }
  const sameMonth = title.match(/(\d{1,2})\s*[-–—]\s*(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (sameMonth) {
    const year = Number(sameMonth[4]);
    const month = Number(sameMonth[3]);
    const startsAt = datedIso(Number(sameMonth[1]), month, year, 6);
    const endsAt = datedIso(Number(sameMonth[2]), month, year, 20);
    return startsAt ? { startsAt, endsAt } : null;
  }
  const single = title.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (single) {
    const startsAt = datedIso(Number(single[1]), Number(single[2]), Number(single[3]), 6);
    return startsAt ? { startsAt, endsAt: null } : null;
  }
  return null;
}

const GREEK_MONTHS: Record<string, number> = {
  "ιανουαριου": 1, "φεβρουαριου": 2, "μαρτιου": 3, "απριλιου": 4,
  "μαιου": 5, "ιουνιου": 6, "ιουλιου": 7, "αυγουστου": 8,
  "σεπτεμβριου": 9, "οκτωβριου": 10, "νοεμβριου": 11, "δεκεμβριου": 12,
};
function stripAccents(value: string) { return value.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); }
function parseGreekTextDate(text: string): ParsedDates | null {
  const normalized = stripAccents(text).toLowerCase();
  const monthNames = Object.keys(GREEK_MONTHS).join("|");
  const rangePattern = new RegExp(`(?:απο\\s+τις?\\s+)?(\\d{1,2})\\s*(?:και|εως(?:\\s+τις)?|ως|[-–—])\\s*(\\d{1,2})\\s+(${monthNames})\\s+(20\\d{2})`);
  const range = normalized.match(rangePattern);
  if (range) {
    const month = GREEK_MONTHS[range[3]];
    const year = Number(range[4]);
    const startsAt = datedIso(Number(range[1]), month, year, 6);
    const endsAt = datedIso(Number(range[2]), month, year, 20);
    if (startsAt) return { startsAt, endsAt };
  }
  const singlePattern = new RegExp(`(\\d{1,2})\\s+(${monthNames})\\s+(20\\d{2})`);
  const single = normalized.match(singlePattern);
  if (single) {
    const startsAt = datedIso(Number(single[1]), GREEK_MONTHS[single[2]], Number(single[3]), 6);
    if (startsAt) return { startsAt, endsAt: null };
  }
  return null;
}
function organizerOf(event: TribeEvent) {
  const value = event.organizer;
  return Array.isArray(value) ? value[0]?.organizer ?? null : value?.organizer ?? null;
}
function organizerUrlOf(event: TribeEvent) {
  const value = event.organizer;
  return Array.isArray(value) ? value[0]?.website ?? null : value?.website ?? null;
}
function plainText(html?: string) {
  if (!html) return null;
  const text = html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ").replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&")
    .replace(/&#8211;|&#8212;/g, "–").replace(/&#038;/g, "&").replace(/&quot;/g, "\"")
    .replace(/&#8217;|&#039;/g, "'").replace(/\s+/g, " ").trim();
  return text ? text.slice(0, 5000) : null;
}
function notExpired(item: CandidateInput) {
  const reference = item.ends_at ?? item.starts_at;
  if (!reference) return true;
  return new Date(reference).getTime() > Date.now() - 15 * 60 * 1000;
}

const TOKEN_STOP = new Set(["the", "and", "by", "of", "at", "in", "for", "event", "race", "αγωνας", "αγωνα", "αγων", "κυπελλο", "πανελληνιο", "δελτιο", "τυπου"]);
function semanticText(value: string) {
  return stripAccents(value).toLowerCase()
    .replace(/πρωταθλημα/g, " championship ").replace(/πρωταθληματος/g, " championship ")
    .replace(/σερρες|σερρων/g, " serres ").replace(/ελλαδος|ελληνικο|ελληνικη/g, " greek ")
    .replace(/αυτοκινητ[^\s]*/g, " automotive ").replace(/μοτοσυκλετ[^\s]*/g, " motorcycle ")
    .replace(/[^a-z0-9α-ω]+/g, " ").replace(/\s+/g, " ").trim();
}
function titleTokens(value: string) {
  return new Set(semanticText(value).split(" ").filter((token) => token.length >= 3 && !TOKEN_STOP.has(token) && !/^\d+$/.test(token)));
}
function tokenOverlap(a: string, b: string) {
  const left = titleTokens(a); const right = titleTokens(b);
  if (!left.size || !right.size) return { shared: 0, score: 0 };
  let shared = 0; for (const token of left) if (right.has(token)) shared += 1;
  const union = new Set([...left, ...right]).size;
  return { shared, score: union ? shared / union : 0 };
}
function utcDay(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}
function normalizePlace(value: unknown) { return typeof value === "string" ? semanticText(value).replace(/\s+/g, " ") : ""; }
function semanticDuplicate(item: CandidateInput, records: ExistingRecord[]) {
  const itemTitle = String(item.title ?? ""); const itemCountry = String(item.country_code ?? "");
  const itemType = String(item.event_type ?? "other"); const itemDay = utcDay(item.starts_at);
  const itemCity = normalizePlace(item.city); const itemLocation = normalizePlace(item.location_text);
  if (!itemDay || !itemTitle) return false;
  return records.some((record) => {
    if (record.country_code !== itemCountry || utcDay(record.starts_at) !== itemDay) return false;
    if (record.event_type !== itemType && record.event_type !== "other" && itemType !== "other") return false;
    const overlap = tokenOverlap(itemTitle, record.title);
    const recordCity = normalizePlace(record.city); const recordLocation = normalizePlace(record.location_text);
    const samePlace = Boolean((itemCity && recordCity && itemCity === recordCity) || (itemLocation && recordLocation && (itemLocation.includes(recordLocation) || recordLocation.includes(itemLocation))));
    if (overlap.shared >= 3 && overlap.score >= 0.35) return true;
    if (samePlace && overlap.shared >= 2 && overlap.score >= 0.25) return true;
    if (samePlace && itemType !== "other" && itemType === record.event_type && overlap.shared >= 1) return true;
    return false;
  });
}
function cityFromText(value: string) {
  const t = semanticText(value);
  if (/\bserres\b/.test(t)) return "Serres";
  if (/λαμια|lamia/.test(t)) return "Lamia";
  if (/αγρινι|agrinio/.test(t)) return "Agrinio";
  if (/ιτεα|itea/.test(t)) return "Itea";
  if (/αιδηψ|edips/.test(t)) return "Edipsos";
  if (/κατσανοχωρ|katsanochor/.test(t)) return "Katsanochoria";
  if (/ζακυνθ|zakynth/.test(t)) return "Zakynthos";
  if (/αιγειρ|aigeir/.test(t)) return "Aigeira";
  if (/\bδεθ\b|θεσσαλονικ|thessalonik/.test(t)) return "Thessaloniki";
  return null;
}

async function collectTribeEvents(source: Source) {
  const base = new URL(source.url); const today = new Date(); const end = new Date(today.getTime() + 45 * 86400000);
  const endpoint = `${base.origin}/wp-json/tribe/events/v1/events?start_date=${encodeURIComponent(`${today.toISOString().slice(0, 10)} 00:00:00`)}&end_date=${encodeURIComponent(`${end.toISOString().slice(0, 10)} 23:59:59`)}&per_page=60`;
  const response = await fetch(endpoint, { headers: { "User-Agent": "NOXA-Radar/1.0 (+https://noxastreetapp.com/radar)" }, signal: AbortSignal.timeout(15000) });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Events API returned ${response.status}`);
  const payload = await response.json() as { events?: TribeEvent[] } | TribeEvent[];
  const events = Array.isArray(payload) ? payload : (payload.events ?? []);
  return events.map((event) => ({ event, title: normalizeTitle(event.title ?? "") })).filter(({ title }) => title && isRelevant(title)).slice(0, 40).map(({ event, title }): CandidateInput => {
    const startsAt = parseUtc(event.utc_start_date) ?? parseUtc(event.start_date); const endsAt = parseUtc(event.utc_end_date) ?? parseUtc(event.end_date);
    return {
      source_id: source.id, original_url: event.url ?? `${base.origin}/?event=${event.id ?? crypto.randomUUID()}`, original_external_id: event.id == null ? null : String(event.id),
      country_code: source.country_code, title, event_type: classify(title), starts_at: startsAt, ends_at: endsAt,
      timezone: event.timezone || (source.country_code === "GR" ? "Europe/Athens" : null),
      location_text: event.venue?.venue || (base.hostname.includes("serrescircuit") ? "Serres Racing Circuit" : null),
      city: event.venue?.city || (base.hostname.includes("serrescircuit") ? "Serres" : null), region: base.hostname.includes("serrescircuit") ? "Central Macedonia" : null,
      organizer_name: organizerOf(event) || source.name, organizer_url: organizerUrlOf(event), summary: (plainText(event.excerpt || event.description) ?? "").slice(0, 700) || null,
      ai_confidence: source.trust_level === "trusted" ? 0.94 : 0.82, ai_reason: "Structured event extracted from the official source feed and classified with deterministic NOXA Radar relevance rules. LLM enrichment has not yet run for this candidate.",
      raw_payload: { provider: "tribe_events_v1", external_id: event.id ?? null, categories: event.categories ?? [], source_name: source.name }, status: "new",
    };
  }).filter(notExpired);
}

async function collectAmotoeAnnouncements(source: Source) {
  const base = new URL(source.url);
  const response = await fetch(base.origin + "/", { headers: { "User-Agent": "NOXA-Radar/1.0 (+https://noxastreetapp.com/radar)" }, signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error(`AMOTOE homepage returned ${response.status}`);
  const html = await response.text(); const links: Array<{ href: string; title: string }> = [];
  const linkPattern = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi; let match: RegExpExecArray | null;
  while ((match = linkPattern.exec(html)) !== null) {
    const title = normalizeTitle(plainText(match[2]) ?? "");
    if (!title || title.length < 8 || title.length > 240) continue;
    const dates = parseDatesFromTitle(title); if (!dates || !isAmotoeRelevant(title)) continue;
    let href: string; try { href = new URL(match[1], base.origin).toString(); } catch { continue; }
    if (!href.startsWith(base.origin)) continue; links.push({ href, title });
  }
  const unique = new Map<string, { href: string; title: string }>(); for (const link of links) unique.set(canonicalUrlKey(link.href), link);
  return Array.from(unique.values()).slice(0, 40).map((link): CandidateInput | null => {
    const dates = parseDatesFromTitle(link.title); if (!dates) return null; const city = cityFromText(link.title);
    return {
      source_id: source.id, original_url: link.href, original_external_id: null, country_code: source.country_code, title: link.title, event_type: classify(link.title),
      starts_at: dates.startsAt, ends_at: dates.endsAt, timezone: "Europe/Athens", location_text: city, city, region: null,
      organizer_name: source.name, organizer_url: source.url, summary: "Official Α.ΜΟΤ.Ο.Ε. announcement with an explicit event date in the published title.",
      ai_confidence: source.trust_level === "trusted" ? 0.9 : 0.8, ai_reason: "Official federation announcement; date extracted deterministically from the title. Missing facts are intentionally left for review/AI enrichment.",
      raw_payload: { provider: "amotoe_homepage_links", source_name: source.name, source_title: link.title }, status: "new",
    };
  }).filter((item): item is CandidateInput => item !== null).filter(notExpired);
}

async function collectOmaeAnnouncements(source: Source) {
  const base = new URL(source.url); const listingUrl = new URL("/index.php/nea-deltia-typou", base.origin).toString();
  const response = await fetch(listingUrl, { headers: { "User-Agent": "NOXA-Radar/1.0 (+https://noxastreetapp.com/radar)" }, signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error(`OMAE news page returned ${response.status}`);
  const html = await response.text(); const links: Array<{ href: string; title: string }> = [];
  const linkPattern = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi; let match: RegExpExecArray | null;
  while ((match = linkPattern.exec(html)) !== null) {
    const title = normalizeTitle((plainText(match[2]) ?? "").slice(0, 260));
    if (!title || title.length < 12 || !isRelevant(title)) continue;
    let href: string; try { href = new URL(match[1], base.origin).toString(); } catch { continue; }
    if (!href.startsWith(base.origin) || href === listingUrl) continue; links.push({ href, title });
  }
  const unique = new Map<string, { href: string; title: string }>(); for (const link of links) unique.set(canonicalUrlKey(link.href), link);
  const selected = Array.from(unique.values()).slice(0, 16);
  const rows = await Promise.all(selected.map(async (link): Promise<CandidateInput | null> => {
    try {
      const articleResponse = await fetch(link.href, { headers: { "User-Agent": "NOXA-Radar/1.0 (+https://noxastreetapp.com/radar)" }, signal: AbortSignal.timeout(12000) });
      if (!articleResponse.ok) return null;
      const articleHtml = await articleResponse.text(); const text = plainText(articleHtml) ?? "";
      const dates = parseDatesFromTitle(link.title) ?? parseGreekTextDate(text.slice(0, 5500)); if (!dates) return null;
      const city = cityFromText(`${link.title} ${text.slice(0, 1800)}`);
      return {
        source_id: source.id, original_url: link.href, original_external_id: null, country_code: source.country_code,
        title: link.title.replace(/\s*[|\-–—]\s*Δελτίο Τύπου.*$/i, "").trim(), event_type: classify(link.title), starts_at: dates.startsAt, ends_at: dates.endsAt,
        timezone: "Europe/Athens", location_text: city, city, region: null, organizer_name: source.name, organizer_url: source.url,
        summary: "Official OMAE event announcement. Review the original source before publishing.",
        ai_confidence: source.trust_level === "trusted" ? 0.9 : 0.8, ai_reason: "Future event extracted from an official ΟΜΑΕ article. Date comes from the article/title; no missing date or place is invented.",
        raw_payload: { provider: "omae_news_article", source_name: source.name, source_title: link.title }, status: "new",
      };
    } catch { return null; }
  }));
  return rows.filter((item): item is CandidateInput => item !== null).filter(notExpired);
}

async function collectSource(source: Source) {
  if (source.platform !== "website") return { unsupported: true, items: [] as CandidateInput[] };
  const host = new URL(source.url).hostname.toLowerCase().replace(/^www\./, "");
  if (host === "amotoe.org") return { unsupported: false, items: await collectAmotoeAnnouncements(source) };
  if (host === "omae-epa.gr") return { unsupported: false, items: await collectOmaeAnnouncements(source) };
  if (host === "hellenicspot.gr") return { unsupported: false, items: await collectHellenicSpot(source) };
  if (host === "cars.coffee") return { unsupported: false, items: await collectCarsCoffeeGreece(source) };
  if (host === "elmoto.gr") return { unsupported: false, items: await collectElmotoEvents(source) };
  const tribeItems = await collectTribeEvents(source);
  return tribeItems ? { unsupported: false, items: tribeItems } : { unsupported: true, items: [] as CandidateInput[] };
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("Origin");
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(origin) });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405, origin);
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return json({ error: "Collector environment is not configured" }, 500, origin);
  const actor = await authorize(req); if (!actor) return json({ error: "Unauthorized" }, 401, origin);
  const runResponse = await rest("radar_collector_runs", { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify({ status: "running", notes: actor.kind === "scheduler" ? "Scheduled collector run" : `Manual run by ${actor.label}` }) });
  if (!runResponse.ok) return json({ error: "Unable to create collector run" }, 500, origin);
  const [run] = await runResponse.json() as Array<{ id: string }>;
  let sourcesChecked = 0, candidatesCreated = 0, duplicatesSkipped = 0, errorCount = 0;
  try {
    const sourcesResponse = await rest("radar_sources?active=eq.true&select=id,name,platform,url,country_code,active,trust_level&order=created_at.asc");
    if (!sourcesResponse.ok) throw new Error("Unable to load sources");
    const sources = await sourcesResponse.json() as Source[];
    const existingCandidatesResponse = await rest("radar_candidates?select=original_url,title,country_code,event_type,starts_at,city,location_text");
    const existingEventsResponse = await rest("radar_events?select=source_url,title,country_code,event_type,starts_at,city,location_text");
    const candidateRows = existingCandidatesResponse.ok ? await existingCandidatesResponse.json() as Array<ExistingRecord & { original_url: string }> : [];
    const eventRows = existingEventsResponse.ok ? await existingEventsResponse.json() as Array<ExistingRecord & { source_url: string }> : [];
    const existingCandidates = new Set(candidateRows.map((r) => canonicalUrlKey(r.original_url)));
    const existingEvents = new Set(eventRows.map((r) => canonicalUrlKey(r.source_url)));
    const semanticRecords: ExistingRecord[] = [...candidateRows, ...eventRows];
    for (const source of sources) {
      sourcesChecked += 1; const checkedAt = new Date().toISOString();
      try {
        const result = await collectSource(source);
        if (result.unsupported) {
          await rest("radar_source_checks", { method: "POST", body: JSON.stringify({ source_id: source.id, collector_run_id: run.id, status: "unsupported", items_seen: 0, items_new: 0 }) });
          await rest(`radar_sources?id=eq.${encodeURIComponent(source.id)}`, { method: "PATCH", body: JSON.stringify({ last_checked_at: checkedAt, last_error: "Collector adapter not implemented for this source", updated_at: checkedAt }) });
          continue;
        }
        let sourceNew = 0;
        for (const item of result.items) {
          const key = canonicalUrlKey(item.original_url);
          if (!key || existingCandidates.has(key) || existingEvents.has(key) || semanticDuplicate(item, semanticRecords)) { duplicatesSkipped += 1; continue; }
          const insert = await rest("radar_candidates", { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify(item) });
          if (insert.ok) {
            candidatesCreated += 1; sourceNew += 1; existingCandidates.add(key);
            semanticRecords.push({ title: String(item.title ?? ""), country_code: String(item.country_code ?? ""), event_type: String(item.event_type ?? "other"), starts_at: item.starts_at, city: typeof item.city === "string" ? item.city : null, location_text: typeof item.location_text === "string" ? item.location_text : null });
          } else if (insert.status === 409) duplicatesSkipped += 1;
          else throw new Error(`Candidate insert failed (${insert.status}): ${(await insert.text()).slice(0, 200)}`);
        }
        await rest("radar_source_checks", { method: "POST", body: JSON.stringify({ source_id: source.id, collector_run_id: run.id, status: sourceNew > 0 ? "success" : "no_change", items_seen: result.items.length, items_new: sourceNew }) });
        await rest(`radar_sources?id=eq.${encodeURIComponent(source.id)}`, { method: "PATCH", body: JSON.stringify({ last_checked_at: checkedAt, last_success_at: checkedAt, last_error: null, updated_at: checkedAt }) });
      } catch (error) {
        errorCount += 1; const message = error instanceof Error ? error.message.slice(0, 500) : "Unknown collector error";
        await rest("radar_source_checks", { method: "POST", body: JSON.stringify({ source_id: source.id, collector_run_id: run.id, status: "failed", items_seen: 0, items_new: 0, error_message: message }) });
        await rest(`radar_sources?id=eq.${encodeURIComponent(source.id)}`, { method: "PATCH", body: JSON.stringify({ last_checked_at: checkedAt, last_error: message, updated_at: checkedAt }) });
      }
    }
    const status = errorCount === 0 ? "success" : (errorCount < sourcesChecked ? "partial" : "failed");
    await rest(`radar_collector_runs?id=eq.${encodeURIComponent(run.id)}`, { method: "PATCH", body: JSON.stringify({ finished_at: new Date().toISOString(), status, sources_checked: sourcesChecked, candidates_created: candidatesCreated, duplicates_skipped: duplicatesSkipped, error_count: errorCount }) });
    return json({ ok: true, runId: run.id, status, sourcesChecked, candidatesCreated, duplicatesSkipped, errorCount }, 200, origin);
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 500) : "Collector failed";
    await rest(`radar_collector_runs?id=eq.${encodeURIComponent(run.id)}`, { method: "PATCH", body: JSON.stringify({ finished_at: new Date().toISOString(), status: "failed", sources_checked: sourcesChecked, candidates_created: candidatesCreated, duplicates_skipped: duplicatesSkipped, error_count: errorCount + 1, notes: message }) });
    return json({ error: message, runId: run.id }, 500, origin);
  }
});
