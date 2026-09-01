export type CommunitySource = {
  id: string;
  name: string;
  url: string;
  country_code: string;
  trust_level: string;
};

export type CommunityCandidateInput = Record<string, unknown> & {
  original_url: string;
  starts_at: string | null;
  ends_at: string | null;
};

type ParsedDates = { startsAt: string; endsAt: string | null };

type FetchLike = typeof fetch;

const USER_AGENT = "NOXA-Radar/1.0 (+https://noxastreetapp.com/radar)";
const ENGLISH_MONTHS: Record<string, number> = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
  july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
};
const GREEK_MONTHS: Record<string, number> = {
  ιανουαριου: 1, φεβρουαριου: 2, μαρτιου: 3, απριλιου: 4,
  μαιου: 5, ιουνιου: 6, ιουλιου: 7, αυγουστου: 8,
  σεπτεμβριου: 9, οκτωβριου: 10, νοεμβριου: 11, δεκεμβριου: 12,
};

function stripAccents(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function normalizeTitle(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function plainText(html?: string) {
  if (!html) return "";
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;|&#8217;/g, "'")
    .replace(/&#8211;|&#8212;/g, "–")
    .replace(/&ndash;|&mdash;/gi, "–")
    .replace(/\s+/g, " ")
    .trim();
}

function datedIso(day: number, month: number, year: number, hourUtc: number) {
  const date = new Date(Date.UTC(year, month - 1, day, hourUtc, 0, 0));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return date.toISOString();
}

function isFutureRange(dates: ParsedDates, now: Date) {
  const reference = dates.endsAt ?? dates.startsAt;
  return new Date(reference).getTime() > now.getTime() - 15 * 60 * 1000;
}

export function parseEnglishUpcomingDate(text: string, now = new Date()): ParsedDates | null {
  const normalized = text.toLowerCase();
  const months = Object.keys(ENGLISH_MONTHS).join("|");
  const match = normalized.match(new RegExp(`(\\d{1,2})\\s+(${months})(?:\\s+(20\\d{2}))?`, "i"));
  if (!match) return null;
  const year = match[3] ? Number(match[3]) : now.getUTCFullYear();
  const startsAt = datedIso(Number(match[1]), ENGLISH_MONTHS[match[2].toLowerCase()], year, 6);
  if (!startsAt) return null;
  const dates = { startsAt, endsAt: null };
  return isFutureRange(dates, now) ? dates : null;
}

export function parseEnglishDateRange(text: string, now = new Date()): ParsedDates | null {
  const normalized = text.toLowerCase();
  const months = Object.keys(ENGLISH_MONTHS).join("|");
  const patterns = [
    new RegExp(`(${months})\\s+(\\d{1,2}),?\\s+(20\\d{2})`, "gi"),
    new RegExp(`(\\d{1,2})\\s+(${months})\\s+(20\\d{2})`, "gi"),
  ];
  const found: string[] = [];
  for (const pattern of patterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(normalized)) !== null) {
      const monthFirst = Number.isNaN(Number(match[1]));
      const month = ENGLISH_MONTHS[(monthFirst ? match[1] : match[2]).toLowerCase()];
      const day = Number(monthFirst ? match[2] : match[1]);
      const year = Number(match[3]);
      const iso = datedIso(day, month, year, 6);
      if (iso && !found.includes(iso)) found.push(iso);
    }
  }
  found.sort();
  if (!found.length) return null;
  const dates = { startsAt: found[0], endsAt: found.length > 1 ? found[found.length - 1].replace("T06:00:00.000Z", "T20:00:00.000Z") : null };
  return isFutureRange(dates, now) ? dates : null;
}

export function parseGreekEventDate(text: string, now = new Date()): ParsedDates | null {
  const normalized = stripAccents(text).toLowerCase();
  const months = Object.keys(GREEK_MONTHS).join("|");

  const crossMonth = normalized.match(new RegExp(`(\\d{1,2})\\s+(${months})\\s*[-–—]\\s*(\\d{1,2})\\s+(${months})\\s+(20\\d{2})`));
  if (crossMonth) {
    const year = Number(crossMonth[5]);
    const startsAt = datedIso(Number(crossMonth[1]), GREEK_MONTHS[crossMonth[2]], year, 6);
    const endsAt = datedIso(Number(crossMonth[3]), GREEK_MONTHS[crossMonth[4]], year, 20);
    if (startsAt) {
      const dates = { startsAt, endsAt };
      return isFutureRange(dates, now) ? dates : null;
    }
  }

  const sameMonth = normalized.match(new RegExp(`(\\d{1,2})\\s*(?:και|εως(?:\\s+τις)?|ως|[-–—])\\s*(\\d{1,2})\\s+(${months})\\s+(20\\d{2})`));
  if (sameMonth) {
    const year = Number(sameMonth[4]);
    const month = GREEK_MONTHS[sameMonth[3]];
    const startsAt = datedIso(Number(sameMonth[1]), month, year, 6);
    const endsAt = datedIso(Number(sameMonth[2]), month, year, 20);
    if (startsAt) {
      const dates = { startsAt, endsAt };
      return isFutureRange(dates, now) ? dates : null;
    }
  }

  const numericRange = normalized.match(/(\d{1,2})\/(\d{1,2})\s*[-–—]\s*(\d{1,2})\/(\d{1,2})\/(20\d{2})/);
  if (numericRange) {
    const year = Number(numericRange[5]);
    const startsAt = datedIso(Number(numericRange[1]), Number(numericRange[2]), year, 6);
    const endsAt = datedIso(Number(numericRange[3]), Number(numericRange[4]), year, 20);
    if (startsAt) {
      const dates = { startsAt, endsAt };
      return isFutureRange(dates, now) ? dates : null;
    }
  }

  const single = normalized.match(new RegExp(`(\\d{1,2})\\s+(${months})\\s+(20\\d{2})`));
  if (single) {
    const startsAt = datedIso(Number(single[1]), GREEK_MONTHS[single[2]], Number(single[3]), 6);
    if (startsAt) {
      const dates = { startsAt, endsAt: null };
      return isFutureRange(dates, now) ? dates : null;
    }
  }
  return null;
}

function confidence(source: CommunitySource, trusted: number, normal: number) {
  return source.trust_level === "trusted" ? trusted : normal;
}

function hellenicType(title: string) {
  const t = title.toLowerCase();
  if (/car\s*meet|meet-up|meetup/.test(t)) return "car_meet";
  if (/drive|road\s*trip|roadtrip|getaway|tour|off-road|weekend/.test(t)) return "group_drive";
  if (/festival/.test(t)) return "festival";
  if (/show|exhibition/.test(t)) return "show";
  return "other";
}

function clearlyOutsideGreece(title: string) {
  const t = title.toLowerCase();
  if (/franc(?:h)?orchamps/.test(t)) return true;
  return /\b(belgium|germany|france|italy|switzerland|austria|netherlands|monaco)\b/.test(t);
}

function syntheticHellenicUrl(listingUrl: string, title: string, startsAt: string) {
  const slug = normalizeTitle(title).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 70) || "event";
  const url = new URL(listingUrl);
  url.searchParams.set("noxa_event", `${startsAt.slice(0, 10)}-${slug}`);
  return url.toString();
}

export function parseHellenicUpcomingHtml(html: string, source: CommunitySource, now = new Date()): CommunityCandidateInput[] {
  const text = plainText(html);
  const start = text.toLowerCase().indexOf("upcoming events");
  if (start < 0) return [];
  const tail = text.slice(start);
  const endCandidates = [" Archive ", " Featured ", " Latest Showcase "].map((marker) => tail.indexOf(marker)).filter((index) => index > 0);
  const section = tail.slice(0, endCandidates.length ? Math.min(...endCandidates) : Math.min(tail.length, 5000));
  const months = Object.keys(ENGLISH_MONTHS).join("|");
  const pattern = new RegExp(`Upcoming Event\\s+(.{3,180}?)\\s+(\\d{1,2}\\s+(?:${months})(?:\\s+20\\d{2})?)`, "gi");
  const listingUrl = new URL("/events/list/", new URL(source.url).origin).toString();
  const items: CommunityCandidateInput[] = [];
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(section)) !== null) {
    const title = normalizeTitle(match[1].replace(/^[#\-*]+\s*/, ""));
    const dates = parseEnglishUpcomingDate(match[2], now);
    if (!dates || clearlyOutsideGreece(title)) continue;
    const eventType = hellenicType(title);
    if (eventType === "other") continue;
    items.push({
      source_id: source.id,
      original_url: syntheticHellenicUrl(listingUrl, title, dates.startsAt),
      original_external_id: null,
      country_code: source.country_code,
      title,
      event_type: eventType,
      starts_at: dates.startsAt,
      ends_at: dates.endsAt,
      timezone: "Europe/Athens",
      location_text: null,
      city: null,
      region: null,
      organizer_name: source.name,
      organizer_url: source.url,
      summary: "Public upcoming event announced by Hellenic Spot. Detailed location may require member access and is intentionally not inferred.",
      ai_confidence: confidence(source, 0.9, 0.8),
      ai_reason: "Title and public date were extracted from Hellenic Spot's Upcoming Events section. No hidden member-only details were accessed or invented.",
      raw_payload: { provider: "hellenic_spot_upcoming", source_name: source.name, public_date_label: match[2] },
      status: "new",
    });
  }
  return items;
}

export async function collectHellenicSpot(source: CommunitySource, fetchImpl: FetchLike = fetch, now = new Date()) {
  const listingUrl = new URL("/events/list/", new URL(source.url).origin).toString();
  const response = await fetchImpl(listingUrl, { headers: { "User-Agent": USER_AGENT }, signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error(`Hellenic Spot events page returned ${response.status}`);
  return parseHellenicUpcomingHtml(await response.text(), source, now);
}

function firstHeading(html: string) {
  const match = html.match(/<h[1-4]\b[^>]*>([\s\S]*?)<\/h[1-4]>/i);
  return normalizeTitle(plainText(match?.[1] ?? ""));
}

function carsCoffeeLocation(text: string) {
  const match = text.match(/\bWhere\s+(.{2,120}?)(?=\s+(?:Organized by|Add to favourites|Stats of the Event|Join the Event|Summary)\b)/i);
  if (!match) return null;
  const value = normalizeTitle(match[1]).replace(/\bStart\b|\bFinish\b/gi, " ").replace(/\s+/g, " ").trim();
  return value && value.length <= 120 ? value : null;
}

export async function collectCarsCoffeeGreece(source: CommunitySource, fetchImpl: FetchLike = fetch, now = new Date()) {
  const base = new URL(source.url);
  const countryUrl = new URL("/greece", base.origin).toString();
  const response = await fetchImpl(countryUrl, { headers: { "User-Agent": USER_AGENT }, signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error(`Cars & Coffee Greece page returned ${response.status}`);
  const html = await response.text();
  const links: string[] = [];
  const pattern = /<a\b[^>]*href=["']([^"']*\/find-events\/[^"'?#]+)["'][^>]*>/gi;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(html)) !== null) {
    try {
      const href = new URL(match[1], base.origin).toString();
      if (new URL(href).origin === base.origin && !links.includes(href)) links.push(href);
    } catch { /* ignore malformed links */ }
  }
  if (!links.length) return [];

  const rows = await Promise.all(links.slice(0, 20).map(async (href): Promise<CommunityCandidateInput | null> => {
    try {
      const detail = await fetchImpl(href, { headers: { "User-Agent": USER_AGENT }, signal: AbortSignal.timeout(12000) });
      if (!detail.ok) return null;
      const detailHtml = await detail.text();
      const text = plainText(detailHtml);
      const dates = parseEnglishDateRange(text, now);
      if (!dates) return null;
      const title = firstHeading(detailHtml) || "Cars & Coffee Greece";
      const location = carsCoffeeLocation(text);
      return {
        source_id: source.id,
        original_url: href,
        original_external_id: null,
        country_code: source.country_code,
        title,
        event_type: "cars_and_coffee",
        starts_at: dates.startsAt,
        ends_at: dates.endsAt,
        timezone: "Europe/Athens",
        location_text: location,
        city: null,
        region: null,
        organizer_name: source.name,
        organizer_url: source.url,
        summary: "Official Cars & Coffee event page for Greece. Only explicit public event facts are imported.",
        ai_confidence: confidence(source, 0.95, 0.84),
        ai_reason: "Future event date was parsed from an official Cars & Coffee detail page linked from the Greece page.",
        raw_payload: { provider: "cars_coffee_greece", source_name: source.name },
        status: "new",
      };
    } catch { return null; }
  }));
  return rows.filter((item): item is CommunityCandidateInput => item !== null);
}

function elmotoRelevant(title: string, text: string) {
  const value = stripAccents(`${title} ${text.slice(0, 1800)}`).toLowerCase();
  if (/γενικ[ηης]\s+συνελευ|οδικ[ηης]\s+ασφαλει|ημεριδα|σεμιναρι/.test(value)) return false;
  return /συναντηση\s+μοτοσυκλετισ|μοτοσυκλετιστικ[ηης]\s+συναντηση|moto\s*meet|motorcycle\s*meet|μοτοπαρε|μοτολεσχ|εκδρομικ/.test(value);
}

function elmotoLocation(text: string) {
  const normalized = stripAccents(text).toLowerCase();
  if (/ροβι/.test(normalized)) return "Rovies, Evia";
  if (/καλαμπακ/.test(normalized)) return "Kalabaka";
  return null;
}

export async function collectElmotoEvents(source: CommunitySource, fetchImpl: FetchLike = fetch, now = new Date()) {
  const base = new URL(source.url);
  const listingUrl = new URL("/category/events/", base.origin).toString();
  const response = await fetchImpl(listingUrl, { headers: { "User-Agent": USER_AGENT }, signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error(`ELMOTO events page returned ${response.status}`);
  const html = await response.text();
  const links: Array<{ href: string; title: string }> = [];
  const headingPattern = /<h[1-4]\b[^>]*>[\s\S]*?<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>[\s\S]*?<\/h[1-4]>/gi;
  let match: RegExpExecArray | null;
  while ((match = headingPattern.exec(html)) !== null) {
    const title = normalizeTitle(plainText(match[2]));
    if (!title || title.length < 8 || title.length > 220) continue;
    try {
      const href = new URL(match[1], base.origin).toString();
      if (new URL(href).origin !== base.origin) continue;
      if (!links.some((item) => item.href === href)) links.push({ href, title });
    } catch { /* ignore malformed links */ }
  }

  const rows = await Promise.all(links.slice(0, 16).map(async (link): Promise<CommunityCandidateInput | null> => {
    try {
      const article = await fetchImpl(link.href, { headers: { "User-Agent": USER_AGENT }, signal: AbortSignal.timeout(12000) });
      if (!article.ok) return null;
      const articleHtml = await article.text();
      const text = plainText(articleHtml);
      if (!elmotoRelevant(link.title, text)) return null;
      const dates = parseGreekEventDate(text.slice(0, 6500), now);
      if (!dates) return null;
      const location = elmotoLocation(text.slice(0, 3000));
      return {
        source_id: source.id,
        original_url: link.href,
        original_external_id: null,
        country_code: source.country_code,
        title: link.title,
        event_type: "moto_meet",
        starts_at: dates.startsAt,
        ends_at: dates.endsAt,
        timezone: "Europe/Athens",
        location_text: location,
        city: location?.split(",")[0] ?? null,
        region: location?.includes("Evia") ? "Central Greece" : null,
        organizer_name: source.name,
        organizer_url: source.url,
        summary: "Official ΕΛΜΟΤΟ motorcycle gathering announcement. Administrative meetings and road-safety seminars are excluded.",
        ai_confidence: confidence(source, 0.93, 0.82),
        ai_reason: "A future motorcycle gathering and explicit event date were extracted from the official ΕΛΜΟΤΟ Events category/article.",
        raw_payload: { provider: "elmoto_events_category", source_name: source.name, source_title: link.title },
        status: "new",
      };
    } catch { return null; }
  }));
  return rows.filter((item): item is CommunityCandidateInput => item !== null);
}
