import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPABASE_URL = "https://qrouwtqsqrfeeeppyeru.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_vR9wivNa_fIb0QKmqua6Wg_H_7OPvUk";
const MAX_BODY_BYTES = 12_288;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1_000;
const RATE_LIMIT_MAX_REQUESTS = 5;
const EMAIL_PATTERN = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const REASONS = new Set(["time", "location", "cancelled", "duplicate", "other"]);

const globalRateLimit = globalThis as typeof globalThis & { __noxaMeetReportAttempts?: Map<string, number[]> };
const attempts = globalRateLimit.__noxaMeetReportAttempts ?? new Map<string, number[]>();
globalRateLimit.__noxaMeetReportAttempts = attempts;

type Payload = { eventId?: unknown; reason?: unknown; details?: unknown; email?: unknown; website?: unknown };

function json(body: Record<string, unknown>, status = 200, headers?: Record<string, string>) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store", ...(headers ?? {}) } });
}

function cleanText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return null;
  const normalized = value.trim().replace(/\s+/g, " ");
  return normalized ? normalized.slice(0, maxLength) : null;
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

function consumeRateLimit(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  const key = `${ip}:${request.headers.get("user-agent")?.slice(0, 100) || "unknown"}`;
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

async function eventExists(eventId: string) {
  const params = new URLSearchParams({ select: "id", id: `eq.${eventId}`, status: "eq.published", limit: "1" });
  const response = await fetch(`${SUPABASE_URL}/rest/v1/radar_events?${params}`, { headers: { apikey: SUPABASE_PUBLISHABLE_KEY }, cache: "no-store" });
  if (!response.ok) return false;
  const rows = await response.json() as Array<{ id: string }>;
  return rows.length > 0;
}

export async function POST(request: NextRequest) {
  if (!allowedOrigin(request)) return json({ message: "Origin not allowed." }, 403);
  const rate = consumeRateLimit(request);
  if (!rate.allowed) return json({ message: "Too many reports. Try again later." }, 429, { "Retry-After": String(rate.retryAfter) });

  const contentLength = Number(request.headers.get("content-length") || "0");
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) return json({ message: "Request too large." }, 413);

  let payload: Payload;
  try {
    const text = await request.text();
    if (new TextEncoder().encode(text).length > MAX_BODY_BYTES) return json({ message: "Request too large." }, 413);
    payload = JSON.parse(text) as Payload;
  } catch {
    return json({ message: "Invalid request body." }, 400);
  }

  if (cleanText(payload.website, 200)) return json({ ok: true });
  const eventId = cleanText(payload.eventId, 36);
  const reason = cleanText(payload.reason, 30);
  const details = cleanText(payload.details, 1_500);
  const email = cleanText(payload.email, 254)?.toLowerCase() ?? null;

  if (!eventId || !UUID_PATTERN.test(eventId)) return json({ message: "Invalid event." }, 400);
  if (!reason || !REASONS.has(reason)) return json({ message: "Choose a valid reason." }, 400);
  if (email && !EMAIL_PATTERN.test(email)) return json({ message: "Enter a valid email or leave it blank." }, 400);
  if (!(await eventExists(eventId))) return json({ message: "Event not found." }, 404);

  const response = await fetch(`${SUPABASE_URL}/rest/v1/event_correction_reports`, {
    method: "POST",
    headers: { apikey: SUPABASE_PUBLISHABLE_KEY, "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify({ event_id: eventId, reason, details, email, status: "new" }),
    cache: "no-store",
  });

  if (response.ok) return json({ ok: true });
  console.error("Event correction report failed", { status: response.status, body: (await response.text()).slice(0, 400) });
  return json({ message: "Could not submit the report." }, 502);
}
