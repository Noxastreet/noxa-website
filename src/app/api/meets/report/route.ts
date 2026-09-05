import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMAIL_PATTERN = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
const ALLOWED_REASONS = new Set(["time", "location", "cancelled", "duplicate", "other"]);
const WINDOW_MS = 15 * 60 * 1000;
const LIMIT = 6;
const globalState = globalThis as typeof globalThis & { __noxaReportAttempts?: Map<string, number[]> };
const attempts = globalState.__noxaReportAttempts ?? new Map<string, number[]>();
globalState.__noxaReportAttempts = attempts;

function json(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

function clientKey(request: NextRequest) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}

function rateLimited(key: string) {
  const now = Date.now();
  const recent = (attempts.get(key) ?? []).filter((value) => value > now - WINDOW_MS);
  if (recent.length >= LIMIT) return true;
  recent.push(now);
  attempts.set(key, recent);
  return false;
}

function allowedOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return process.env.NODE_ENV !== "production";
  try {
    const host = new URL(origin).hostname.toLowerCase();
    return host === "noxastreetapp.com" || host.endsWith(".noxastreetapp.com") || host.endsWith(".vercel.app") || host === "localhost" || host === "127.0.0.1";
  } catch {
    return false;
  }
}

function supabaseConfig() {
  return {
    url: process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL,
    key:
      process.env.SUPABASE_PUBLISHABLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };
}

export async function POST(request: NextRequest) {
  if (!allowedOrigin(request)) return json({ error: "forbidden" }, 403);
  if (rateLimited(clientKey(request))) return json({ error: "rate_limited" }, 429);

  let payload: { eventId?: unknown; reason?: unknown; details?: unknown; email?: unknown };
  try {
    payload = await request.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  const eventId = typeof payload.eventId === "string" ? payload.eventId.trim() : "";
  const reason = typeof payload.reason === "string" ? payload.reason.trim() : "";
  const details = typeof payload.details === "string" ? payload.details.trim().slice(0, 800) : "";
  const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase().slice(0, 254) : "";

  if (!/^[0-9a-f-]{36}$/i.test(eventId) || !ALLOWED_REASONS.has(reason) || details.length < 3) return json({ error: "invalid_fields" }, 400);
  if (email && !EMAIL_PATTERN.test(email)) return json({ error: "invalid_email" }, 400);

  const { url: supabaseUrl, key: supabaseKey } = supabaseConfig();
  if (!supabaseUrl || !supabaseKey) {
    console.error("Meets report API is missing Supabase environment variables.");
    return json({ error: "service_unavailable" }, 503);
  }

  const response = await fetch(`${supabaseUrl}/rest/v1/event_correction_reports`, {
    method: "POST",
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({ event_id: eventId, reason, details, email: email || null, status: "new" }),
    cache: "no-store",
  }).catch(() => null);

  if (!response?.ok) return json({ error: "submission_failed" }, 503);
  return json({ ok: true }, 201);
}
