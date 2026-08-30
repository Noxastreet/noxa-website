import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 8_192;
const MIN_FORM_TIME_MS = 1_500;
const MAX_FORM_TIME_MS = 24 * 60 * 60 * 1_000;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1_000;
const RATE_LIMIT_MAX_REQUESTS = 5;
const EMAIL_PATTERN = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
const WAITLIST_NOTIFICATION_EMAIL = "noxastreetapp@gmail.com";

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

type WaitlistNotification = {
  email: string;
  city: string | null;
  locale: "en" | "el";
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  referrer: string | null;
  submittedAt: string;
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

function escapeHtml(value: string | null): string {
  if (!value) return "—";
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
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

async function sendWaitlistNotification(data: WaitlistNotification): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.warn(
      "Waitlist notification email was not sent because RESEND_API_KEY is not configured.",
    );
    return false;
  }

  const from =
    process.env.WAITLIST_FROM_EMAIL ?? "NOXA Waitlist <onboarding@resend.dev>";

  const html = `
    <!doctype html>
    <html>
      <body style="margin:0;background:#050505;color:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
        <div style="max-width:680px;margin:0 auto;padding:40px 20px;">
          <div style="border:1px solid #242428;border-radius:20px;overflow:hidden;background:#0b0b0d;">
            <div style="padding:28px 30px;border-bottom:1px solid #242428;background:linear-gradient(135deg,#13070a,#0b0b0d);">
              <div style="font-size:12px;letter-spacing:.18em;font-weight:800;color:#e32c49;">NOXA · NEW EARLY ACCESS LEAD</div>
              <h1 style="margin:12px 0 0;font-size:28px;line-height:1.2;color:#ffffff;">Новая заявка с noxastreetapp.com</h1>
            </div>
            <div style="padding:30px;">
              <table role="presentation" style="width:100%;border-collapse:collapse;font-size:15px;line-height:1.6;">
                <tr><td style="padding:10px 0;color:#8d8d93;width:155px;vertical-align:top;">Email</td><td style="padding:10px 0;color:#ffffff;font-weight:700;">${escapeHtml(data.email)}</td></tr>
                <tr><td style="padding:10px 0;color:#8d8d93;vertical-align:top;">City</td><td style="padding:10px 0;color:#ffffff;">${escapeHtml(data.city)}</td></tr>
                <tr><td style="padding:10px 0;color:#8d8d93;vertical-align:top;">Language</td><td style="padding:10px 0;color:#ffffff;">${data.locale === "el" ? "Greek" : "English"}</td></tr>
                <tr><td style="padding:10px 0;color:#8d8d93;vertical-align:top;">Submitted</td><td style="padding:10px 0;color:#ffffff;">${escapeHtml(data.submittedAt)}</td></tr>
                <tr><td style="padding:10px 0;color:#8d8d93;vertical-align:top;">UTM source</td><td style="padding:10px 0;color:#ffffff;">${escapeHtml(data.utmSource)}</td></tr>
                <tr><td style="padding:10px 0;color:#8d8d93;vertical-align:top;">UTM medium</td><td style="padding:10px 0;color:#ffffff;">${escapeHtml(data.utmMedium)}</td></tr>
                <tr><td style="padding:10px 0;color:#8d8d93;vertical-align:top;">UTM campaign</td><td style="padding:10px 0;color:#ffffff;">${escapeHtml(data.utmCampaign)}</td></tr>
                <tr><td style="padding:10px 0;color:#8d8d93;vertical-align:top;">UTM content</td><td style="padding:10px 0;color:#ffffff;">${escapeHtml(data.utmContent)}</td></tr>
                <tr><td style="padding:10px 0;color:#8d8d93;vertical-align:top;">Referrer</td><td style="padding:10px 0;color:#ffffff;word-break:break-word;">${escapeHtml(data.referrer)}</td></tr>
                <tr><td style="padding:10px 0;color:#8d8d93;vertical-align:top;">Consent</td><td style="padding:10px 0;color:#ffffff;">Confirmed</td></tr>
              </table>
              <div style="margin-top:24px;padding:18px;border-radius:14px;background:#111114;border:1px solid #242428;color:#b7b7bc;font-size:13px;line-height:1.6;">
                Заявка уже сохранена в Supabase. Это письмо — уведомление для быстрого ответа и контроля новых early-access лидов.
              </div>
            </div>
            <div style="padding:18px 30px;border-top:1px solid #242428;color:#66666c;font-size:11px;letter-spacing:.08em;">
              NOXA · AUTOMOTIVE CULTURE
            </div>
          </div>
        </div>
      </body>
    </html>`;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [WAITLIST_NOTIFICATION_EMAIL],
        reply_to: data.email,
        subject: `NOXA · New early-access lead${data.city ? ` · ${data.city}` : ""}`,
        html,
        text: [
          "NOXA · New early-access lead",
          `Email: ${data.email}`,
          `City: ${data.city ?? "—"}`,
          `Language: ${data.locale}`,
          `Submitted: ${data.submittedAt}`,
          `UTM source: ${data.utmSource ?? "—"}`,
          `UTM medium: ${data.utmMedium ?? "—"}`,
          `UTM campaign: ${data.utmCampaign ?? "—"}`,
          `UTM content: ${data.utmContent ?? "—"}`,
          `Referrer: ${data.referrer ?? "—"}`,
          "Consent: Confirmed",
        ].join("\n"),
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      const body = await response.text();
      console.error("Waitlist notification email failed", {
        status: response.status,
        body: body.slice(0, 500),
      });
      return false;
    }

    return true;
  } catch (error) {
    console.error("Waitlist notification email threw an error", error);
    return false;
  }
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
  const locale = payload.locale === "el" ? "el" : "en";
  const submittedAt = new Date().toISOString();
  const utmSource = cleanText(payload.utmSource, 120);
  const utmMedium = cleanText(payload.utmMedium, 120);
  const utmCampaign = cleanText(payload.utmCampaign, 120);
  const utmContent = cleanText(payload.utmContent, 120);
  const referrer = cleanText(payload.referrer, 500);

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
      consented_at: submittedAt,
      locale,
      utm_source: utmSource,
      utm_medium: utmMedium,
      utm_campaign: utmCampaign,
      utm_content: utmContent,
      referrer,
    }),
    cache: "no-store",
  });

  if (response.ok) {
    const notificationSent = await sendWaitlistNotification({
      email,
      city,
      locale,
      utmSource,
      utmMedium,
      utmCampaign,
      utmContent,
      referrer,
      submittedAt,
    });

    return json({ ok: true, alreadyJoined: false, notificationSent }, 201);
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
