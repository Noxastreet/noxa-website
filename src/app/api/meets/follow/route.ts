import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPABASE_URL = "https://qrouwtqsqrfeeeppyeru.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_vR9wivNa_fIb0QKmqua6Wg_H_7OPvUk";
const MAX_BODY_BYTES = 8_192;
const MIN_FORM_TIME_MS = 800;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1_000;
const RATE_LIMIT_MAX_REQUESTS = 6;
const EMAIL_PATTERN = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
const COUNTRY_PATTERN = /^[A-Z]{2}$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const globalRateLimit = globalThis as typeof globalThis & { __noxaMeetFollowAttempts?: Map<string, number[]> };
const attempts = globalRateLimit.__noxaMeetFollowAttempts ?? new Map<string, number[]>();
globalRateLimit.__noxaMeetFollowAttempts = attempts;

type Payload = {
  email?: unknown;
  consent?: unknown;
  locale?: unknown;
  targetType?: unknown;
  city?: unknown;
  countryCode?: unknown;
  organizerId?: unknown;
  website?: unknown;
  startedAt?: unknown;
};

function json(body: Record<string, unknown>, status = 200, headers?: Record<string, string>) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store", ...(headers ?? {}) } });
}

function cleanText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return null;
  const normalized = value.trim().replace(/\s+/g, " ");
  return normalized ? normalized.slice(0, maxLength) : null;
}

function clientKey(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  const ua = request.headers.get("user-agent")?.slice(0, 120) || "unknown";
  return `${ip}:${ua}`;
}

function allowedOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return process.env.NODE_ENV !== "production";
  try {
    const host = new URL(origin).hostname.toLowerCase();
    const previewHost = process.env.VERCEL_URL?.toLowerCase();
    return host === "noxastreetapp.com" || host.endsWith(".noxastreetapp.com") || host === "localhost" || host === "127.0.0.1" || Boolean(previewHost && host === previewHost);
  } catch {
    return false;
  }
}

function consumeRateLimit(key: string) {
  const now = Date.now();
  const recent = (attempts.get(key) ?? []).filter((time) => time > now - RATE_LIMIT_WINDOW_MS);
  if (recent.length >= RATE_LIMIT_MAX_REQUESTS) {
    attempts.set(key, recent);
    return { allowed: false, retryAfter: Math.max(1, Math.ceil((RATE_LIMIT_WINDOW_MS - (now - recent[0])) / 1000)) };
  }
  recent.push(now);
  attempts.set(key, recent);
  return { allowed: true, retryAfter: 0 };
}

async function readJson(request: NextRequest): Promise<Payload | null> {
  const contentLength = Number(request.headers.get("content-length") || "0");
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) return null;
  try {
    const text = await request.text();
    if (new TextEncoder().encode(text).length > MAX_BODY_BYTES) return null;
    return JSON.parse(text) as Payload;
  } catch {
    return null;
  }
}

async function getCityTarget(countryCode: string, city: string) {
  const params = new URLSearchParams({
    select: "city,country_code",
    status: "eq.published",
    country_code: `eq.${countryCode}`,
    city: `eq.${city}`,
    limit: "1",
  });
  const response = await fetch(`${SUPABASE_URL}/rest/v1/radar_events?${params}`, { headers: { apikey: SUPABASE_PUBLISHABLE_KEY }, cache: "no-store" });
  if (!response.ok) return null;
  const rows = await response.json() as Array<{ city: string | null; country_code: string }>;
  const row = rows[0];
  if (!row?.city) return null;
  return { key: `${row.country_code}:${row.city.toLocaleLowerCase("en-US")}`, label: row.city };
}

async function getOrganizerTarget(organizerId: string) {
  const params = new URLSearchParams({
    select: "id,name",
    id: `eq.${organizerId}`,
    status: "eq.active",
    verified: "eq.true",
    limit: "1",
  });
  const response = await fetch(`${SUPABASE_URL}/rest/v1/organizer_profiles?${params}`, { headers: { apikey: SUPABASE_PUBLISHABLE_KEY }, cache: "no-store" });
  if (!response.ok) return null;
  const rows = await response.json() as Array<{ id: string; name: string }>;
  const row = rows[0];
  return row ? { key: row.id, label: row.name } : null;
}

export async function POST(request: NextRequest) {
  if (!allowedOrigin(request)) return json({ message: "Origin not allowed." }, 403);
  const rate = consumeRateLimit(clientKey(request));
  if (!rate.allowed) return json({ message: "Too many requests. Try again later." }, 429, { "Retry-After": String(rate.retryAfter) });

  const payload = await readJson(request);
  if (!payload) return json({ message: "Invalid request body." }, 400);
  if (cleanText(payload.website, 200)) return json({ ok: true });

  const startedAt = typeof payload.startedAt === "number" ? payload.startedAt : Number.NaN;
  if (!Number.isFinite(startedAt) || Date.now() - startedAt < MIN_FORM_TIME_MS) return json({ message: "Please try again." }, 400);

  const email = cleanText(payload.email, 254)?.toLowerCase() ?? null;
  if (!email || !EMAIL_PATTERN.test(email)) return json({ message: "Enter a valid email." }, 400);
  if (payload.consent !== true) return json({ message: "Consent is required." }, 400);
  const locale = payload.locale === "el" ? "el" : "en";

  let target: { type: "city" | "organizer"; key: string; label: string } | null = null;
  if (payload.targetType === "city") {
    const city = cleanText(payload.city, 120);
    const countryCode = cleanText(payload.countryCode, 2)?.toUpperCase() ?? null;
    if (!city || !countryCode || !COUNTRY_PATTERN.test(countryCode)) return json({ message: "Invalid city target." }, 400);
    const resolved = await getCityTarget(countryCode, city);
    if (resolved) target = { type: "city", ...resolved };
  } else if (payload.targetType === "organizer") {
    const organizerId = cleanText(payload.organizerId, 36);
    if (!organizerId || !UUID_PATTERN.test(organizerId)) return json({ message: "Invalid organizer target." }, 400);
    const resolved = await getOrganizerTarget(organizerId);
    if (resolved) target = { type: "organizer", ...resolved };
  }

  if (!target) return json({ message: "This follow target is not available." }, 404);

  const response = await fetch(`${SUPABASE_URL}/rest/v1/meet_follow_subscriptions`, {
    method: "POST",
    headers: { apikey: SUPABASE_PUBLISHABLE_KEY, "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify({ email, target_type: target.type, target_key: target.key, target_label: target.label, locale, consent: true, active: true }),
    cache: "no-store",
  });

  if (response.ok || response.status === 409) return json({ ok: true });
  console.error("Meet follow subscription failed", { status: response.status, body: (await response.text()).slice(0, 400) });
  return json({ message: "Could not save the subscription." }, 502);
}
