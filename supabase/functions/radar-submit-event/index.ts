import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const ALLOWED_ORIGINS = new Set([
  "https://noxastreetapp.com",
  "https://www.noxastreetapp.com",
]);
const EVENT_TYPES = new Set([
  "car_meet",
  "moto_meet",
  "track_day",
  "drag",
  "drift",
  "rally",
  "show",
  "cars_and_coffee",
  "group_drive",
  "festival",
  "karting",
  "dexterity",
  "other",
]);
const LIMIT = 5;
const WINDOW_MS = 24 * 60 * 60 * 1000;

type Submission = {
  title?: unknown;
  eventType?: unknown;
  startsAt?: unknown;
  countryCode?: unknown;
  city?: unknown;
  location?: unknown;
  organizerName?: unknown;
  sourceUrl?: unknown;
  summary?: unknown;
  website?: unknown;
  formStartedAt?: unknown;
};

function allowedOrigin(origin: string | null) {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.has(origin)) return true;
  try {
    const url = new URL(origin);
    return url.protocol === "https:" && url.hostname.endsWith(".vercel.app") && url.hostname.startsWith("noxa-website-");
  } catch {
    return false;
  }
}

function cors(origin: string | null) {
  return {
    "Access-Control-Allow-Origin": allowedOrigin(origin) ? origin! : "https://noxastreetapp.com",
    "Access-Control-Allow-Headers": "content-type, apikey",
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
      ...cors(origin),
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

function text(value: unknown, max: number) {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim().slice(0, max);
}

function normalizeSourceUrl(value: unknown) {
  const raw = text(value, 500);
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    url.hash = "";
    for (const key of Array.from(url.searchParams.keys())) {
      if (/^(utm_|fbclid$|igshid$|gclid$)/i.test(key)) url.searchParams.delete(key);
    }
    return url.toString();
  } catch {
    return null;
  }
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function clientAddress(req: Request) {
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || req.headers.get("cf-connecting-ip") || req.headers.get("x-real-ip") || "unknown";
}

async function rateLimited(req: Request) {
  const raw = `${clientAddress(req)}|${req.headers.get("user-agent") ?? "unknown"}`;
  const fingerprint = await sha256(raw);
  const query = `radar_submission_rate_limits?fingerprint=eq.${encodeURIComponent(fingerprint)}&select=window_started_at,submission_count&limit=1`;
  const response = await rest(query);
  if (!response.ok) throw new Error("rate_limit_read_failed");
  const rows = await response.json() as Array<{ window_started_at: string; submission_count: number }>;
  const row = rows[0];
  const now = Date.now();

  if (!row) {
    const insert = await rest("radar_submission_rate_limits", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ fingerprint, window_started_at: new Date(now).toISOString(), submission_count: 1, updated_at: new Date(now).toISOString() }),
    });
    if (!insert.ok) throw new Error("rate_limit_write_failed");
    return false;
  }

  const started = new Date(row.window_started_at).getTime();
  const expired = !Number.isFinite(started) || now - started >= WINDOW_MS;
  if (!expired && row.submission_count >= LIMIT) return true;

  const patch = await rest(`radar_submission_rate_limits?fingerprint=eq.${encodeURIComponent(fingerprint)}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify(expired
      ? { window_started_at: new Date(now).toISOString(), submission_count: 1, updated_at: new Date(now).toISOString() }
      : { submission_count: row.submission_count + 1, updated_at: new Date(now).toISOString() }),
  });
  if (!patch.ok) throw new Error("rate_limit_write_failed");
  return false;
}

async function alreadyKnown(sourceUrl: string) {
  const encoded = encodeURIComponent(sourceUrl);
  const [candidateResponse, eventResponse] = await Promise.all([
    rest(`radar_candidates?original_url=eq.${encoded}&select=id&limit=1`),
    rest(`radar_events?source_url=eq.${encoded}&select=id&limit=1`),
  ]);
  if (!candidateResponse.ok || !eventResponse.ok) throw new Error("duplicate_check_failed");
  const candidates = await candidateResponse.json() as Array<{ id: string }>;
  const events = await eventResponse.json() as Array<{ id: string }>;
  return candidates.length > 0 || events.length > 0;
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("Origin");
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(origin) });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405, origin);
  if (!allowedOrigin(origin)) return json({ error: "Origin not allowed" }, 403, origin);
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return json({ error: "Submission service is not configured" }, 500, origin);

  let body: Submission;
  try {
    body = await req.json() as Submission;
  } catch {
    return json({ error: "Invalid request" }, 400, origin);
  }

  if (text(body.website, 200)) return json({ ok: true, submitted: true }, 200, origin);

  const formStartedAt = Number(body.formStartedAt);
  const elapsed = Date.now() - formStartedAt;
  if (!Number.isFinite(formStartedAt) || elapsed < 1500 || elapsed > 2 * 60 * 60 * 1000) {
    return json({ error: "Please reopen the form and try again." }, 400, origin);
  }

  const title = text(body.title, 160);
  const eventType = text(body.eventType, 40);
  const countryCode = text(body.countryCode, 2).toUpperCase();
  const city = text(body.city, 100);
  const location = text(body.location, 180);
  const organizerName = text(body.organizerName, 120);
  const summary = text(body.summary, 700) || null;
  const sourceUrl = normalizeSourceUrl(body.sourceUrl);
  const startsAtRaw = typeof body.startsAt === "string" ? body.startsAt : "";
  const startsAt = new Date(startsAtRaw);
  const now = Date.now();
  const latestAllowed = now + 550 * 24 * 60 * 60 * 1000;

  if (title.length < 3) return json({ error: "Event name is required." }, 400, origin);
  if (!EVENT_TYPES.has(eventType)) return json({ error: "Choose a valid event type." }, 400, origin);
  if (countryCode !== "GR") return json({ error: "NOXA currently accepts public event submissions in Greece only." }, 400, origin);
  if (city.length < 2) return json({ error: "City is required." }, 400, origin);
  if (location.length < 2) return json({ error: "Location is required." }, 400, origin);
  if (organizerName.length < 2) return json({ error: "Organizer name is required." }, 400, origin);
  if (!sourceUrl) return json({ error: "Add a public source link for the event." }, 400, origin);
  if (Number.isNaN(startsAt.getTime()) || startsAt.getTime() < now - 15 * 60 * 1000 || startsAt.getTime() > latestAllowed) {
    return json({ error: "Choose a valid upcoming date and time." }, 400, origin);
  }

  try {
    if (await rateLimited(req)) return json({ error: "Too many submissions. Try again tomorrow." }, 429, origin);

    if (await alreadyKnown(sourceUrl)) {
      return json({ ok: true, submitted: false, duplicate: true, message: "This event is already in the NOXA review queue." }, 200, origin);
    }

    const insert = await rest("radar_candidates", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        source_id: null,
        original_url: sourceUrl,
        original_external_id: null,
        country_code: "GR",
        title,
        event_type: eventType,
        starts_at: startsAt.toISOString(),
        ends_at: null,
        timezone: "Europe/Athens",
        location_text: location,
        city,
        region: null,
        organizer_name: organizerName,
        organizer_url: sourceUrl,
        summary,
        ai_confidence: null,
        ai_reason: "Submitted through the public NOXA Meets event form. Human review is required before publication.",
        raw_payload: {
          provider: "public_submission",
          submitted_via: "https://noxastreetapp.com/meets/submit",
        },
        status: "new",
      }),
    });

    if (insert.status === 409) {
      return json({ ok: true, submitted: false, duplicate: true, message: "This event is already in the NOXA review queue." }, 200, origin);
    }
    if (!insert.ok) {
      console.error("Radar public submission insert failed", insert.status, (await insert.text()).slice(0, 300));
      return json({ error: "Could not submit this event right now." }, 500, origin);
    }

    const rows = await insert.json() as Array<{ id: string }>;
    void rest(`radar_submission_rate_limits?updated_at=lt.${encodeURIComponent(new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString())}`, { method: "DELETE" }).catch(() => undefined);
    return json({ ok: true, submitted: true, id: rows[0]?.id ?? null }, 201, origin);
  } catch (error) {
    console.error("Radar public submission failed", error);
    return json({ error: "Could not submit this event right now." }, 500, origin);
  }
});
