import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const ALLOWED_ORIGINS = new Set([
  "https://noxastreetapp.com",
  "https://www.noxastreetapp.com",
]);
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const EMAIL_PATTERN = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const COUNTRY_PATTERN = /^[A-Z]{2}$/;
const REPORT_REASONS = new Set(["time", "location", "cancelled", "duplicate", "other"]);

type JsonObject = Record<string, unknown>;

function allowedOrigin(origin: string | null) {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.has(origin)) return true;
  try {
    const url = new URL(origin);
    if (url.protocol === "http:" && (url.hostname === "localhost" || url.hostname === "127.0.0.1")) return true;
    return url.protocol === "https:" && url.hostname.endsWith(".vercel.app") && url.hostname.startsWith("noxa-website-");
  } catch {
    return false;
  }
}

function cors(origin: string | null) {
  return {
    "Access-Control-Allow-Origin": allowedOrigin(origin) ? origin! : "https://noxastreetapp.com",
    "Access-Control-Allow-Headers": "content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
}

function json(data: unknown, status = 200, origin: string | null = null, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      ...cors(origin),
      ...extraHeaders,
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

function cleanText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return null;
  const normalized = value.trim().replace(/\s+/g, " ");
  return normalized ? normalized.slice(0, maxLength) : null;
}

async function readBody(req: Request, maxBytes: number): Promise<JsonObject | null> {
  const contentLength = Number(req.headers.get("content-length") || "0");
  if (Number.isFinite(contentLength) && contentLength > maxBytes) return null;
  try {
    const raw = await req.text();
    if (new TextEncoder().encode(raw).length > maxBytes) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as JsonObject : null;
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

async function rateLimited(req: Request, action: string, limit: number) {
  const fingerprint = await sha256(`${action}|${clientAddress(req)}|${req.headers.get("user-agent") ?? "unknown"}`);
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
      body: JSON.stringify({
        fingerprint,
        window_started_at: new Date(now).toISOString(),
        submission_count: 1,
        updated_at: new Date(now).toISOString(),
      }),
    });
    if (!insert.ok && insert.status !== 409) throw new Error("rate_limit_write_failed");
    return false;
  }

  const started = new Date(row.window_started_at).getTime();
  const expired = !Number.isFinite(started) || now - started >= RATE_LIMIT_WINDOW_MS;
  if (!expired && row.submission_count >= limit) return true;

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

function cleanupRateLimits() {
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  void rest(`radar_submission_rate_limits?updated_at=lt.${encodeURIComponent(cutoff)}`, { method: "DELETE" }).catch(() => undefined);
}

async function eventExists(eventId: string) {
  const params = new URLSearchParams({ select: "id", id: `eq.${eventId}`, status: "eq.published", limit: "1" });
  const response = await rest(`radar_events?${params}`);
  if (!response.ok) return false;
  const rows = await response.json() as Array<{ id: string }>;
  return rows.length > 0;
}

async function handleReport(req: Request, origin: string | null) {
  const payload = await readBody(req, 12_288);
  if (!payload) return json({ message: "Invalid request body." }, 400, origin);
  if (cleanText(payload.website, 200)) return json({ ok: true }, 200, origin);

  const eventId = cleanText(payload.eventId, 36);
  const reason = cleanText(payload.reason, 30);
  const details = cleanText(payload.details, 1_500);
  const email = cleanText(payload.email, 254)?.toLowerCase() ?? null;

  if (!eventId || !UUID_PATTERN.test(eventId)) return json({ message: "Invalid event." }, 400, origin);
  if (!reason || !REPORT_REASONS.has(reason)) return json({ message: "Choose a valid reason." }, 400, origin);
  if (email && !EMAIL_PATTERN.test(email)) return json({ message: "Enter a valid email or leave it blank." }, 400, origin);

  if (await rateLimited(req, "meet-report", 5)) {
    return json({ message: "Too many reports. Try again later." }, 429, origin, { "Retry-After": "900" });
  }
  if (!(await eventExists(eventId))) return json({ message: "Event not found." }, 404, origin);

  const response = await rest("event_correction_reports", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ event_id: eventId, reason, details, email, status: "new" }),
  });
  if (!response.ok) {
    console.error("Event correction report failed", response.status, (await response.text()).slice(0, 300));
    return json({ message: "Could not submit the report." }, 502, origin);
  }

  cleanupRateLimits();
  return json({ ok: true }, 200, origin);
}

async function getCityTarget(countryCode: string, city: string) {
  const params = new URLSearchParams({ select: "city,country_code", status: "eq.published", country_code: `eq.${countryCode}`, city: `eq.${city}`, limit: "1" });
  const response = await rest(`radar_events?${params}`);
  if (!response.ok) return null;
  const rows = await response.json() as Array<{ city: string | null; country_code: string }>;
  const row = rows[0];
  if (!row?.city) return null;
  return { type: "city" as const, key: `${row.country_code}:${row.city.toLocaleLowerCase("en-US")}`, label: row.city };
}

async function getOrganizerTarget(organizerId: string) {
  const params = new URLSearchParams({ select: "id,name", id: `eq.${organizerId}`, status: "eq.active", verified: "eq.true", limit: "1" });
  const response = await rest(`organizer_profiles?${params}`);
  if (!response.ok) return null;
  const rows = await response.json() as Array<{ id: string; name: string }>;
  const row = rows[0];
  return row ? { type: "organizer" as const, key: row.id, label: row.name } : null;
}

async function handleFollow(req: Request, origin: string | null) {
  const payload = await readBody(req, 8_192);
  if (!payload) return json({ message: "Invalid request body." }, 400, origin);
  if (cleanText(payload.website, 200)) return json({ ok: true }, 200, origin);

  const startedAt = typeof payload.startedAt === "number" ? payload.startedAt : Number.NaN;
  if (!Number.isFinite(startedAt) || Date.now() - startedAt < 800) return json({ message: "Please try again." }, 400, origin);

  const email = cleanText(payload.email, 254)?.toLowerCase() ?? null;
  if (!email || !EMAIL_PATTERN.test(email)) return json({ message: "Enter a valid email." }, 400, origin);
  if (payload.consent !== true) return json({ message: "Consent is required." }, 400, origin);
  const locale = payload.locale === "el" ? "el" : "en";

  let target: { type: "city" | "organizer"; key: string; label: string } | null = null;
  if (payload.targetType === "city") {
    const city = cleanText(payload.city, 120);
    const countryCode = cleanText(payload.countryCode, 2)?.toUpperCase() ?? null;
    if (!city || !countryCode || !COUNTRY_PATTERN.test(countryCode)) return json({ message: "Invalid city target." }, 400, origin);
    if (await rateLimited(req, "meet-follow", 6)) {
      return json({ message: "Too many requests. Try again later." }, 429, origin, { "Retry-After": "900" });
    }
    target = await getCityTarget(countryCode, city);
  } else if (payload.targetType === "organizer") {
    const organizerId = cleanText(payload.organizerId, 36);
    if (!organizerId || !UUID_PATTERN.test(organizerId)) return json({ message: "Invalid organizer target." }, 400, origin);
    if (await rateLimited(req, "meet-follow", 6)) {
      return json({ message: "Too many requests. Try again later." }, 429, origin, { "Retry-After": "900" });
    }
    target = await getOrganizerTarget(organizerId);
  } else {
    return json({ message: "Invalid follow target." }, 400, origin);
  }

  if (!target) return json({ message: "This follow target is not available." }, 404, origin);

  const response = await rest("meet_follow_subscriptions", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      email,
      target_type: target.type,
      target_key: target.key,
      target_label: target.label,
      locale,
      consent: true,
      active: true,
    }),
  });

  if (!response.ok && response.status !== 409) {
    console.error("Meet follow subscription failed", response.status, (await response.text()).slice(0, 300));
    return json({ message: "Could not save the subscription." }, 502, origin);
  }

  cleanupRateLimits();
  return json({ ok: true }, 200, origin);
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("Origin");
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(origin) });
  if (req.method !== "POST") return json({ message: "Method not allowed." }, 405, origin);
  if (!allowedOrigin(origin)) return json({ message: "Origin not allowed." }, 403, origin);
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return json({ message: "Service is not configured." }, 500, origin);

  const action = new URL(req.url).searchParams.get("action");
  try {
    if (action === "report") return await handleReport(req, origin);
    if (action === "follow") return await handleFollow(req, origin);
    return json({ message: "Unknown action." }, 404, origin);
  } catch (error) {
    console.error("Public meet action failed", action, error);
    return json({ message: "Could not complete this request." }, 500, origin);
  }
});
