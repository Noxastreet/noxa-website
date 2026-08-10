import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 8_192;
const MIN_FORM_TIME_MS = 1_500;
const MAX_FORM_TIME_MS = 24 * 60 * 60 * 1_000;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1_000;
const RATE_LIMIT_MAX_REQUESTS = 5;
const EMAIL_PATTERN = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

const globalRateLimit = globalThis as typeof globalThis & {
  __noxaWaitlistAttempts?: Map<string, number[]>;
};

const attempts =
  globalRateLimit.__noxaWaitlistAttempts ?? new Map<string, number[]>();

globalRateLimit.__noxaWaitlistAttempts = attempts;

type WaitlistPayload = {
  email?: unknown;
  city?: unknown;
  consent?: unknown;
  website?: unknown;
  startedAt?: unknown;
  locale?: unknown;
  utmSource?: unknown;
  utmMedium?: unknown;
  utmCampaign?: unknown;
  utmContent?: unknown;
  referrer?: unknown;
};

function json(
  body: Record<string, unknown>,
  status = 200,
  headers?: HeadersInit,
) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      ...headers,
    },
  });
}

function cleanText(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null;

  const normalized = value.trim().replace(/\s+/g, " ");
  if (!normalized) return null;

  return normalized.slice(0, maxLength);
}

function getClientKey(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const ip =
    forwardedFor?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const userAgent = request.headers.get("user-agent")?.slice(0, 120) || "unknown";

  return `${ip}:${userAgent}`;
}

function isAllowedOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");

  if (!origin) return process.env.NODE_ENV !== "production";

  try {
    const hostname = new URL(origin).hostname.toLowerCase();

    return (
      hostname === "noxastreetapp.com" ||
      hostname.endsWith(".noxastreetapp.com") ||
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname.endsWith(".vercel.app")
    );
  } catch {
    return false;
  }
}

function consumeRateLimit(clientKey: string): {
  allowed: boolean;
  retryAfterSeconds: number;
} {
  const now = Date.now();
  const cutoff = now - RATE_LIMIT_WINDOW_MS;
  const recent = (attempts.get(clientKey) ?? []).filter(
    (timestamp) => timestamp > cutoff,
  );

  if (recent.length >= RATE_LIMIT_MAX_REQUESTS) {
    const retryAfterMs = RATE_LIMIT_WINDOW_MS - (now - recent[0]);

    attempts.set(clientKey, recent);
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1_000)),
    };
  }

  recent.push(now);
  attempts.set(clientKey, recent);

  return { allowed: true, retryAfterSeconds: 0 };
}

export async function POST(request: NextRequest) {
  if (!isAllowedOrigin(request)) {
    return json({ ok: false, code: "origin_not_allowed" }, 403);
  }

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    return json({ ok: false, code: "payload_too_large" }, 413);
  }

  let payload: WaitlistPayload;

  try {
    payload = (await request.json()) as WaitlistPayload;
  } catch {
    return json({ ok: false, code: "invalid_json" }, 400);
  }

  // Honeypot fields should remain empty for real users. Return a neutral success
  // response so automated submitters receive no useful feedback.
  if (cleanText(payload.website, 200)) {
    return json({ ok: true });
  }

  const startedAt = Number(payload.startedAt);
  const elapsed = Date.now() - startedAt;

  if (
    !Number.isFinite(startedAt) ||
    elapsed < MIN_FORM_TIME_MS ||
    elapsed > MAX_FORM_TIME_MS
  ) {
    return json({ ok: false, code: "invalid_submission_timing" }, 400);
  }

  const rateLimit = consumeRateLimit(getClientKey(request));
  if (!rateLimit.allowed) {
    return json(
      { ok: false, code: "rate_limited" },
      429,
      { "Retry-After": String(rateLimit.retryAfterSeconds) },
    );
  }

  const email = cleanText(payload.email, 254)?.toLowerCase() ?? "";
  const city = cleanText(payload.city, 80);
  const consent = payload.consent === true;
  const locale =
    payload.locale === "el" || payload.locale === "ru"
      ? payload.locale
      : "en";

  if (!EMAIL_PATTERN.test(email)) {
    return json({ ok: false, code: "invalid_email" }, 400);
  }

  if (!consent) {
    return json({ ok: false, code: "consent_required" }, 400);
  }

  const supabaseUrl =
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("Waitlist API is missing Supabase environment variables.");
    return json({ ok: false, code: "service_unavailable" }, 503);
  }

  const response = await fetch(`${supabaseUrl}/rest/v1/prelaunch_waitlist`, {
    method: "POST",
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      email,
      city,
      interests: [],
      consent: true,
      consented_at: new Date().toISOString(),
      locale,
      utm_source: cleanText(payload.utmSource, 120),
      utm_medium: cleanText(payload.utmMedium, 120),
      utm_campaign: cleanText(payload.utmCampaign, 120),
      utm_content: cleanText(payload.utmContent, 120),
      referrer: cleanText(payload.referrer, 500),
    }),
    cache: "no-store",
  });

  if (response.ok) {
    return json({ ok: true, alreadyJoined: false }, 201);
  }

  const errorText = await response.text();
  const isDuplicate =
    response.status === 409 ||
    errorText.includes("23505") ||
    errorText.toLowerCase().includes("duplicate");

  if (isDuplicate) {
    return json({ ok: true, alreadyJoined: true });
  }

  console.error("Supabase waitlist insert failed", {
    status: response.status,
    body: errorText.slice(0, 500),
  });

  return json({ ok: false, code: "submission_failed" }, 502);
}
