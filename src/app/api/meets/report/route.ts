import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPABASE_URL = "https://qrouwtqsqrfeeeppyeru.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFyb3V3dHFzcXJmZWVlcHB5ZXJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgxODg0MTIsImV4cCI6MjEwMzc2NDQxMn0.3kGKL1D8WKSFbqNjJveVdIVe4IkoesUwCzgIzr7_Ppo";
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

  const response = await fetch(`${SUPABASE_URL}/rest/v1/event_correction_reports`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({ event_id: eventId, reason, details, email: email || null, status: "new" }),
    cache: "no-store",
  }).catch(() => null);

  if (!response?.ok) return json({ error: "submission_failed" }, 503);
  return json({ ok: true }, 201);
}
