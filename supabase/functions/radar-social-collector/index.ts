import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const ALLOWED_ORIGIN = "https://noxastreetapp.com";
const USER_AGENT = "NOXA-Radar/1.0 (+https://noxastreetapp.com/radar)";

type Source = {
  id: string;
  name: string;
  platform: "instagram" | "facebook";
  url: string;
  country_code: string;
  active: boolean;
  trust_level: string;
};

type Actor = { kind: "admin" | "scheduler"; label: string };
type CandidateInput = Record<string, unknown> & {
  original_url: string;
  starts_at: string | null;
  ends_at: string | null;
};
type ExistingRecord = {
  title: string;
  country_code: string;
  event_type: string;
  starts_at: string | null;
  city: string | null;
  location_text: string | null;
};
type ParsedDates = { startsAt: string; endsAt: string | null };
type SocialDocument = {
  url: string;
  title: string;
  description: string;
  text: string;
  startsAt: string | null;
  endsAt: string | null;
};

class SocialAccessBlockedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SocialAccessBlockedError";
  }
}

function corsHeaders(origin: string | null) {
  return {
    "Access-Control-Allow-Origin": origin === ALLOWED_ORIGIN ? ALLOWED_ORIGIN : ALLOWED_ORIGIN,
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-radar-cron-secret",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
}

function json(data: unknown, status = 200, origin: string | null = null) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      ...corsHeaders(origin),
    },
  });
}

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
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
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

async function validCronSecret(secret: string) {
  if (!secret) return false;
  const response = await rest("radar_internal_secrets?name=eq.radar_collector_cron_secret&select=secret_hash&limit=1");
  if (!response.ok) return false;
  const rows = await response.json() as Array<{ secret_hash: string }>;
  return Boolean(rows[0]?.secret_hash) && rows[0].secret_hash === await sha256(secret);
}

async function authorize(req: Request): Promise<Actor | null> {
  const cronSecret = req.headers.get("x-radar-cron-secret") ?? "";
  if (cronSecret && await validCronSecret(cronSecret)) {
    return { kind: "scheduler", label: "scheduled social collector" };
  }

  const auth = req.headers.get("Authorization") ?? "";
  const jwt = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!jwt) return null;
  const user = await getUser(jwt);
  if (!user || !(await isAdmin(user.id))) return null;
  return { kind: "admin", label: user.email ?? user.id };
}

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, "\"")
    .replace(/&#39;|&#039;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#x2F;/gi, "/")
    .replace(/\\u0026/gi, "&")
    .replace(/\\u002F/gi, "/")
    .replace(/\\\//g, "/");
}

function plainText(html: string) {
  return decodeHtml(html)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function metaContent(html: string, key: string) {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = [
    new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']*)["'][^>]*>`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${escaped}["'][^>]*>`, "i"),
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return decodeHtml(match[1]).replace(/\s+/g, " ").trim();
  }
  return "";
}

function titleTag(html: string) {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match?.[1] ? plainText(match[1]) : "";
}

function jsonLdDates(html: string) {
  const scripts = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi) ?? [];
  for (const script of scripts.slice(0, 8)) {
    const body = script.replace(/^<script[^>]*>/i, "").replace(/<\/script>$/i, "").trim();
    try {
      const parsed = JSON.parse(decodeHtml(body));
      const nodes = Array.isArray(parsed) ? parsed : [parsed];
      for (const node of nodes) {
        if (!node || typeof node !== "object") continue;
        const startDate = typeof node.startDate === "string" ? node.startDate : null;
        const endDate = typeof node.endDate === "string" ? node.endDate : null;
        if (startDate) return { startDate, endDate };
      }
    } catch {
      // Ignore malformed or unrelated JSON-LD.
    }
  }
  return null;
}

function parseIso(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function datedIso(day: number, month: number, year: number, hourUtc = 7) {
  const fullYear = year < 100 ? 2000 + year : year;
  const date = new Date(Date.UTC(fullYear, month - 1, day, hourUtc, 0, 0));
  if (date.getUTCFullYear() !== fullYear || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return date.toISOString();
}

function stripAccents(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

const GREEK_MONTHS: Record<string, number> = {
  ιανουαριου: 1, φεβρουαριου: 2, μαρτιου: 3, απριλιου: 4,
  μαιου: 5, ιουνιου: 6, ιουλιου: 7, αυγουστου: 8,
  σεπτεμβριου: 9, οκτωβριου: 10, νοεμβριου: 11, δεκεμβριου: 12,
};

const EN_MONTHS: Record<string, number> = {
  january: 1, jan: 1, february: 2, feb: 2, march: 3, mar: 3, april: 4, apr: 4,
  may: 5, june: 6, jun: 6, july: 7, jul: 7, august: 8, aug: 8,
  september: 9, sep: 9, sept: 9, october: 10, oct: 10, november: 11, nov: 11,
  december: 12, dec: 12,
};

function parseExplicitEventDates(text: string): ParsedDates | null {
  const normalized = stripAccents(text).toLowerCase();

  const numericRange = normalized.match(/(\d{1,2})[\/.\-](\d{1,2})[\/.\-](20\d{2})\s*(?:-|–|—|to|εως|ως)\s*(\d{1,2})[\/.\-](\d{1,2})[\/.\-](20\d{2})/);
  if (numericRange) {
    const startsAt = datedIso(Number(numericRange[1]), Number(numericRange[2]), Number(numericRange[3]));
    const endsAt = datedIso(Number(numericRange[4]), Number(numericRange[5]), Number(numericRange[6]), 20);
    if (startsAt) return { startsAt, endsAt };
  }

  const sameMonthRange = normalized.match(/(\d{1,2})\s*(?:-|–|—)\s*(\d{1,2})[\/.\-](\d{1,2})[\/.\-](20\d{2})/);
  if (sameMonthRange) {
    const startsAt = datedIso(Number(sameMonthRange[1]), Number(sameMonthRange[3]), Number(sameMonthRange[4]));
    const endsAt = datedIso(Number(sameMonthRange[2]), Number(sameMonthRange[3]), Number(sameMonthRange[4]), 20);
    if (startsAt) return { startsAt, endsAt };
  }

  const numeric = normalized.match(/(?:^|\D)(\d{1,2})[\/.\-](\d{1,2})[\/.\-](20\d{2})(?:\D|$)/);
  if (numeric) {
    const startsAt = datedIso(Number(numeric[1]), Number(numeric[2]), Number(numeric[3]));
    if (startsAt) return { startsAt, endsAt: null };
  }

  const greekMonths = Object.keys(GREEK_MONTHS).join("|");
  const greekRange = normalized.match(new RegExp(`(\\d{1,2})\\s*(?:-|–|—|και|εως|ως)\\s*(\\d{1,2})\\s+(${greekMonths})\\s+(20\\d{2})`));
  if (greekRange) {
    const month = GREEK_MONTHS[greekRange[3]];
    const startsAt = datedIso(Number(greekRange[1]), month, Number(greekRange[4]));
    const endsAt = datedIso(Number(greekRange[2]), month, Number(greekRange[4]), 20);
    if (startsAt) return { startsAt, endsAt };
  }

  const greekSingle = normalized.match(new RegExp(`(\\d{1,2})\\s+(${greekMonths})\\s+(20\\d{2})`));
  if (greekSingle) {
    const startsAt = datedIso(Number(greekSingle[1]), GREEK_MONTHS[greekSingle[2]], Number(greekSingle[3]));
    if (startsAt) return { startsAt, endsAt: null };
  }

  const englishMonths = Object.keys(EN_MONTHS).join("|");
  const englishMonthFirst = normalized.match(new RegExp(`(${englishMonths})\\s+(\\d{1,2})(?:st|nd|rd|th)?[,\\s]+(20\\d{2})`));
  if (englishMonthFirst) {
    const startsAt = datedIso(Number(englishMonthFirst[2]), EN_MONTHS[englishMonthFirst[1]], Number(englishMonthFirst[3]));
    if (startsAt) return { startsAt, endsAt: null };
  }

  const englishDayFirst = normalized.match(new RegExp(`(\\d{1,2})(?:st|nd|rd|th)?\\s+(${englishMonths})[,\\s]+(20\\d{2})`));
  if (englishDayFirst) {
    const startsAt = datedIso(Number(englishDayFirst[1]), EN_MONTHS[englishDayFirst[2]], Number(englishDayFirst[3]));
    if (startsAt) return { startsAt, endsAt: null };
  }

  return null;
}

function semanticText(value: string) {
  return stripAccents(value)
    .toLowerCase()
    .replace(/[^a-z0-9α-ω]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function classify(value: string) {
  const t = semanticText(value);
  if (/\bdrag(?:ster)?\b/.test(t)) return "drag";
  if (/\bdrift\b/.test(t)) return "drift";
  if (/\brally\b|\bραλλυ\b|\bbaja\b/.test(t)) return "rally";
  if (/cars?\s+(?:and|&)\s+coffee|coffee\s+(?:and|&)\s+cars?/.test(t)) return "cars_and_coffee";
  if (/moto\s*meet|motorcycle\s*meet|bike\s*meet|μοτοσυκλετ|μηχαν/.test(t)) return "moto_meet";
  if (/track\s*day|trackday|circuit|motodays/.test(t)) return "track_day";
  if (/car\s*meet|meetup|meet\s*up|συναντησ|jdm\s*meet|tuning\s*meet|stance\s*meet/.test(t)) return "car_meet";
  if (/auto\s*show|car\s*show|motor\s*show|εκθεση/.test(t)) return "show";
  if (/festival/.test(t)) return "festival";
  return "other";
}

function isRelevant(value: string) {
  const t = semanticText(value);
  if (/giveaway|διαγωνισμ|for sale|πωλειται|classified/.test(t)) return false;
  return /car\s*meet|meetup|meet\s*up|συναντησ|cars?\s+(?:and|&)\s+coffee|coffee\s+(?:and|&)\s+cars?|jdm|tuning|stance|automotive|motorsport|moto\s*meet|motorcycle\s*meet|bike\s*meet|μοτοσυκλετ|μηχαν|track\s*day|trackday|drag|drift|rally|ραλλυ|baja|auto\s*show|car\s*show|motor\s*show|εκθεση/.test(t);
}

function cityFromText(value: string) {
  const t = semanticText(value);
  const rules: Array<[RegExp, string]> = [
    [/αθην|athens/, "Athens"], [/πειραι|piraeus/, "Piraeus"], [/θεσσαλονικ|thessalonik|\bδεθ\b/, "Thessaloniki"],
    [/serres|σερρε|σερρων/, "Serres"], [/πατρα|patras?/, "Patras"], [/λαρισ|larisa|larissa/, "Larissa"],
    [/βολο|volos/, "Volos"], [/ιωαννιν|ioannina/, "Ioannina"], [/καβαλ|kavala/, "Kavala"],
    [/αλεξανδρουπολ|alexandroupol/, "Alexandroupoli"], [/κομοτην|komotini/, "Komotini"], [/ξανθ|xanthi/, "Xanthi"],
    [/δραμα|drama/, "Drama"], [/κοζαν|kozani/, "Kozani"], [/τρικαλ|trikala/, "Trikala"], [/λαμια|lamia/, "Lamia"],
    [/αγρινι|agrinio/, "Agrinio"], [/ηρακλει|heraklion/, "Heraklion"], [/χανι|chania/, "Chania"],
    [/ρεθυμν|rethymno/, "Rethymno"], [/καλαματ|kalamata/, "Kalamata"], [/κορινθ|corinth/, "Corinth"],
    [/ζακυνθ|zakynth/, "Zakynthos"], [/αιγειρ|aigeir/, "Aigeira"], [/ιτεα|itea/, "Itea"],
  ];
  for (const [pattern, city] of rules) if (pattern.test(t)) return city;
  return null;
}

function canonicalUrlKey(raw: string) {
  try {
    const url = new URL(raw);
    const host = url.hostname.toLowerCase().replace(/^www\./, "").replace(/^m\./, "");
    let path = decodeURIComponent(url.pathname).toLowerCase().replace(/\/+$/, "");
    if (host.endsWith("instagram.com")) {
      const match = path.match(/^\/(p|reel|tv)\/([^/]+)/);
      if (match) path = `/${match[1]}/${match[2]}`;
    }
    if (host.endsWith("facebook.com")) {
      const event = path.match(/^\/events\/([^/]+)/);
      if (event) path = `/events/${event[1]}`;
    }
    return `${host}${path}`;
  } catch {
    return raw.trim().toLowerCase().replace(/\/$/, "");
  }
}

const TOKEN_STOP = new Set(["the", "and", "with", "from", "event", "meet", "meeting", "official", "instagram", "facebook"]);
function titleTokens(value: string) {
  return new Set(semanticText(value).split(" ").filter((token) => token.length >= 3 && !TOKEN_STOP.has(token) && !/^\d+$/.test(token)));
}

function tokenOverlap(a: string, b: string) {
  const left = titleTokens(a);
  const right = titleTokens(b);
  if (!left.size || !right.size) return { shared: 0, score: 0 };
  let shared = 0;
  for (const token of left) if (right.has(token)) shared += 1;
  const union = new Set([...left, ...right]).size;
  return { shared, score: union ? shared / union : 0 };
}

function utcDay(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}

function semanticDuplicate(item: CandidateInput, records: ExistingRecord[]) {
  const itemTitle = String(item.title ?? "");
  const itemCountry = String(item.country_code ?? "");
  const itemType = String(item.event_type ?? "other");
  const itemDay = utcDay(item.starts_at);
  const itemCity = semanticText(typeof item.city === "string" ? item.city : "");
  if (!itemTitle) return false;

  return records.some((record) => {
    if (record.country_code !== itemCountry) return false;
    if (itemDay && utcDay(record.starts_at) && itemDay !== utcDay(record.starts_at)) return false;
    if (record.event_type !== itemType && record.event_type !== "other" && itemType !== "other") return false;
    const overlap = tokenOverlap(itemTitle, record.title);
    const sameCity = Boolean(itemCity && record.city && itemCity === semanticText(record.city));
    if (overlap.shared >= 3 && overlap.score >= 0.35) return true;
    if (sameCity && overlap.shared >= 2 && overlap.score >= 0.25) return true;
    return false;
  });
}

function looksConcreteSocialUrl(platform: Source["platform"], raw: string) {
  try {
    const url = new URL(raw);
    const path = url.pathname.toLowerCase();
    if (platform === "instagram") return /^\/(p|reel|tv)\//.test(path);
    return /^\/events\/[^/]+/.test(path) || /\/posts\//.test(path) || /\/permalink\.php/.test(path);
  } catch {
    return false;
  }
}

function normalizeSocialUrl(platform: Source["platform"], href: string, baseUrl: string) {
  try {
    const decoded = decodeHtml(href.trim());
    const url = new URL(decoded, baseUrl);
    const host = url.hostname.toLowerCase().replace(/^www\./, "").replace(/^m\./, "");
    if (platform === "instagram" && host !== "instagram.com") return null;
    if (platform === "facebook" && host !== "facebook.com") return null;
    url.hash = "";
    for (const key of ["utm_source", "utm_medium", "utm_campaign", "fbclid", "igshid"]) url.searchParams.delete(key);
    return url.toString();
  } catch {
    return null;
  }
}

function discoverSocialLinks(platform: Source["platform"], html: string, baseUrl: string) {
  const decoded = decodeHtml(html);
  const found = new Map<string, string>();
  const patterns = platform === "instagram"
    ? [/(?:https?:\/\/(?:www\.)?instagram\.com)?\/(?:p|reel|tv)\/[A-Za-z0-9_-]+\/?/gi]
    : [/(?:https?:\/\/(?:www\.|m\.)?facebook\.com)?\/events\/[0-9A-Za-z._-]+\/?/gi,
       /(?:https?:\/\/(?:www\.|m\.)?facebook\.com)?\/[A-Za-z0-9._-]+\/posts\/[0-9A-Za-z._-]+\/?/gi];

  for (const pattern of patterns) {
    for (const match of decoded.matchAll(pattern)) {
      const normalized = normalizeSocialUrl(platform, match[0], baseUrl);
      if (!normalized) continue;
      found.set(canonicalUrlKey(normalized), normalized);
      if (found.size >= 12) return Array.from(found.values());
    }
  }
  return Array.from(found.values());
}

function cleanSocialTitle(platform: Source["platform"], rawTitle: string, description: string, sourceName: string) {
  let title = rawTitle
    .replace(/\s*[|·-]\s*(Instagram|Facebook)\s*$/i, "")
    .replace(/^Instagram\s*$/i, "")
    .replace(/^Facebook\s*$/i, "")
    .trim();

  if (platform === "instagram") {
    const caption = description.match(/on Instagram:\s*[“\"']?([\s\S]+?)[”\"']?$/i)?.[1]?.trim();
    if ((!title || !isRelevant(title)) && caption) title = caption;
  }

  if ((!title || title.length < 5 || !isRelevant(title)) && description && isRelevant(description)) {
    title = description;
  }

  title = title.replace(/\s+/g, " ").trim();
  if (title.length > 180) title = `${title.slice(0, 177).trim()}…`;
  return title || `${sourceName} public event post`;
}

async function fetchSocialDocument(platform: Source["platform"], rawUrl: string, sourceName: string): Promise<SocialDocument | null> {
  const response = await fetch(rawUrl, {
    headers: { "User-Agent": USER_AGENT, Accept: "text/html,application/xhtml+xml" },
    redirect: "follow",
    signal: AbortSignal.timeout(15000),
  });

  if ([401, 403, 429].includes(response.status)) {
    throw new SocialAccessBlockedError(`Public ${platform} page is not accessible without login (${response.status})`);
  }
  if (!response.ok) throw new Error(`${platform} page returned ${response.status}`);

  const finalUrl = response.url || rawUrl;
  if (/\/login\/?/i.test(new URL(finalUrl).pathname)) {
    throw new SocialAccessBlockedError(`Public ${platform} page redirected to login`);
  }

  const html = await response.text();
  const visible = plainText(html).slice(0, 9000);
  if (/log in to (instagram|facebook)|you must log in|συνδεθειτε|συνδεση στο facebook/i.test(visible.slice(0, 1800))) {
    throw new SocialAccessBlockedError(`Public ${platform} page requires login`);
  }

  const ogTitle = metaContent(html, "og:title") || titleTag(html);
  const description = metaContent(html, "og:description") || metaContent(html, "description");
  const eventStart = parseIso(metaContent(html, "event:start_time"));
  const eventEnd = parseIso(metaContent(html, "event:end_time"));
  const ldDates = jsonLdDates(html);
  const startsAt = eventStart ?? parseIso(ldDates?.startDate) ?? parseExplicitEventDates(`${ogTitle} ${description} ${visible.slice(0, 4500)}`)?.startsAt ?? null;
  const endsAt = eventEnd ?? parseIso(ldDates?.endDate) ?? parseExplicitEventDates(`${ogTitle} ${description} ${visible.slice(0, 4500)}`)?.endsAt ?? null;
  const title = cleanSocialTitle(platform, ogTitle, description, sourceName);

  return { url: finalUrl, title, description, text: visible, startsAt, endsAt };
}

function toCandidate(source: Source, document: SocialDocument): CandidateInput | null {
  const combined = `${document.title} ${document.description} ${document.text.slice(0, 4000)}`;
  if (!isRelevant(combined)) return null;

  const city = cityFromText(combined);
  const eventType = classify(combined);
  const summary = (document.description || document.text).replace(/\s+/g, " ").trim().slice(0, 700) || null;
  const confidence = document.startsAt ? (source.trust_level === "trusted" ? 0.86 : 0.76) : 0.58;

  return {
    source_id: source.id,
    original_url: document.url,
    original_external_id: null,
    country_code: source.country_code,
    title: document.title,
    event_type: eventType,
    starts_at: document.startsAt,
    ends_at: document.endsAt,
    timezone: source.country_code === "GR" ? "Europe/Athens" : null,
    location_text: city,
    city,
    region: null,
    organizer_name: source.name,
    organizer_url: source.url,
    summary,
    ai_confidence: confidence,
    ai_reason: document.startsAt
      ? `Public ${source.platform} event/post. Event date was present in public page metadata or explicit event text; final details require admin review.`
      : `Public ${source.platform} event/post appears relevant, but no explicit event year/date was found. Kept in Review and cannot be approved until a date is confirmed.`,
    raw_payload: {
      provider: `public_${source.platform}_html`,
      source_name: source.name,
      public_url: document.url,
      has_explicit_event_date: Boolean(document.startsAt),
    },
    status: document.startsAt ? "new" : "needs_review",
  };
}

async function collectSocialSource(source: Source) {
  const root = await fetchSocialDocument(source.platform, source.url, source.name);
  if (!root) return [] as CandidateInput[];

  const urls = looksConcreteSocialUrl(source.platform, source.url)
    ? [root.url]
    : discoverSocialLinks(source.platform, root.text, root.url);

  if (!urls.length && !looksConcreteSocialUrl(source.platform, source.url)) return [] as CandidateInput[];

  const documents: SocialDocument[] = [];
  if (urls.length === 1 && canonicalUrlKey(urls[0]) === canonicalUrlKey(root.url)) {
    documents.push(root);
  } else {
    for (const url of urls.slice(0, 8)) {
      try {
        const document = await fetchSocialDocument(source.platform, url, source.name);
        if (document) documents.push(document);
      } catch {
        // One inaccessible post must not fail the whole organizer source.
      }
    }
  }

  const unique = new Map<string, CandidateInput>();
  for (const document of documents) {
    const candidate = toCandidate(source, document);
    if (!candidate) continue;
    unique.set(canonicalUrlKey(candidate.original_url), candidate);
  }
  return Array.from(unique.values());
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("Origin");
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(origin) });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405, origin);
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return json({ error: "Social collector environment is not configured" }, 500, origin);

  const actor = await authorize(req);
  if (!actor) return json({ error: "Unauthorized" }, 401, origin);

  const runResponse = await rest("radar_collector_runs", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      status: "running",
      notes: actor.kind === "scheduler" ? "Scheduled social collector run" : `Manual social run by ${actor.label}`,
    }),
  });
  if (!runResponse.ok) return json({ error: "Unable to create social collector run" }, 500, origin);
  const [run] = await runResponse.json() as Array<{ id: string }>;

  let sourcesChecked = 0;
  let candidatesCreated = 0;
  let duplicatesSkipped = 0;
  let unsupportedSources = 0;
  let errorCount = 0;

  try {
    const sourcesResponse = await rest("radar_sources?active=eq.true&platform=in.(instagram,facebook)&select=id,name,platform,url,country_code,active,trust_level&order=created_at.asc");
    if (!sourcesResponse.ok) throw new Error("Unable to load social sources");
    const sources = await sourcesResponse.json() as Source[];

    const existingCandidatesResponse = await rest("radar_candidates?select=original_url,title,country_code,event_type,starts_at,city,location_text");
    const existingEventsResponse = await rest("radar_events?select=source_url,title,country_code,event_type,starts_at,city,location_text");
    const candidateRows = existingCandidatesResponse.ok ? await existingCandidatesResponse.json() as Array<ExistingRecord & { original_url: string }> : [];
    const eventRows = existingEventsResponse.ok ? await existingEventsResponse.json() as Array<ExistingRecord & { source_url: string }> : [];
    const existingCandidates = new Set(candidateRows.map((row) => canonicalUrlKey(row.original_url)));
    const existingEvents = new Set(eventRows.map((row) => canonicalUrlKey(row.source_url)));
    const semanticRecords: ExistingRecord[] = [...candidateRows, ...eventRows];

    for (const source of sources) {
      sourcesChecked += 1;
      const checkedAt = new Date().toISOString();
      try {
        const items = await collectSocialSource(source);
        let sourceNew = 0;
        for (const item of items) {
          const key = canonicalUrlKey(item.original_url);
          if (!key || existingCandidates.has(key) || existingEvents.has(key) || semanticDuplicate(item, semanticRecords)) {
            duplicatesSkipped += 1;
            continue;
          }

          const insert = await rest("radar_candidates", {
            method: "POST",
            headers: { Prefer: "return=minimal" },
            body: JSON.stringify(item),
          });
          if (insert.ok) {
            candidatesCreated += 1;
            sourceNew += 1;
            existingCandidates.add(key);
            semanticRecords.push({
              title: String(item.title ?? ""),
              country_code: String(item.country_code ?? ""),
              event_type: String(item.event_type ?? "other"),
              starts_at: item.starts_at,
              city: typeof item.city === "string" ? item.city : null,
              location_text: typeof item.location_text === "string" ? item.location_text : null,
            });
          } else if (insert.status === 409) {
            duplicatesSkipped += 1;
          } else {
            throw new Error(`Social candidate insert failed (${insert.status}): ${(await insert.text()).slice(0, 180)}`);
          }
        }

        await rest("radar_source_checks", {
          method: "POST",
          body: JSON.stringify({
            source_id: source.id,
            collector_run_id: run.id,
            status: sourceNew > 0 ? "success" : "no_change",
            items_seen: items.length,
            items_new: sourceNew,
          }),
        });
        await rest(`radar_sources?id=eq.${encodeURIComponent(source.id)}`, {
          method: "PATCH",
          body: JSON.stringify({
            last_checked_at: checkedAt,
            last_success_at: checkedAt,
            last_error: null,
            updated_at: checkedAt,
          }),
        });
      } catch (error) {
        const message = error instanceof Error ? error.message.slice(0, 500) : "Unknown social collector error";
        if (error instanceof SocialAccessBlockedError) {
          unsupportedSources += 1;
          await rest("radar_source_checks", {
            method: "POST",
            body: JSON.stringify({
              source_id: source.id,
              collector_run_id: run.id,
              status: "unsupported",
              items_seen: 0,
              items_new: 0,
              error_message: message,
            }),
          });
          await rest(`radar_sources?id=eq.${encodeURIComponent(source.id)}`, {
            method: "PATCH",
            body: JSON.stringify({ last_checked_at: checkedAt, last_error: message, updated_at: checkedAt }),
          });
          continue;
        }

        errorCount += 1;
        await rest("radar_source_checks", {
          method: "POST",
          body: JSON.stringify({
            source_id: source.id,
            collector_run_id: run.id,
            status: "failed",
            items_seen: 0,
            items_new: 0,
            error_message: message,
          }),
        });
        await rest(`radar_sources?id=eq.${encodeURIComponent(source.id)}`, {
          method: "PATCH",
          body: JSON.stringify({ last_checked_at: checkedAt, last_error: message, updated_at: checkedAt }),
        });
      }
    }

    const status = errorCount === 0 ? "success" : (errorCount < Math.max(1, sourcesChecked) ? "partial" : "failed");
    await rest(`radar_collector_runs?id=eq.${encodeURIComponent(run.id)}`, {
      method: "PATCH",
      body: JSON.stringify({
        finished_at: new Date().toISOString(), status, sources_checked: sourcesChecked,
        candidates_created: candidatesCreated, duplicates_skipped: duplicatesSkipped, error_count: errorCount,
      }),
    });

    return json({ ok: true, runId: run.id, status, sourcesChecked, candidatesCreated, duplicatesSkipped, unsupportedSources, errorCount }, 200, origin);
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 500) : "Social collector failed";
    await rest(`radar_collector_runs?id=eq.${encodeURIComponent(run.id)}`, {
      method: "PATCH",
      body: JSON.stringify({
        finished_at: new Date().toISOString(), status: "failed", sources_checked: sourcesChecked,
        candidates_created: candidatesCreated, duplicates_skipped: duplicatesSkipped,
        error_count: errorCount + 1, notes: message,
      }),
    });
    return json({ error: message, runId: run.id }, 500, origin);
  }
});
