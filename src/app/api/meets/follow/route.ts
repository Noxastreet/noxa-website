import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPABASE_URL = "https://qrouwtqsqrfeeeppyeru.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFyb3V3dHFzcXJmZWVlcHB5ZXJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgxODg0MTIsImV4cCI6MjEwMzc2NDQxMn0.3kGKL1D8WKSFbqNjJveVdIVe4IkoesUwCzgIzr7_Ppo";
const RESEND_API_URL = "https://api.resend.com/emails";
const EMAIL_PATTERN = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
const TARGET_TYPES = new Set(["city", "organizer"]);
const WINDOW_MS = 15 * 60 * 1000;
const LIMIT = 6;
const globalState = globalThis as typeof globalThis & { __noxaFollowAttempts?: Map<string, number[]> };
const attempts = globalState.__noxaFollowAttempts ?? new Map<string, number[]>();
globalState.__noxaFollowAttempts = attempts;

function json(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

function cleanText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return "";
  return value.trim().replace(/\s+/g, " ").slice(0, maxLength);
}

function escapeHtml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
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

async function confirmationEmail(email: string, targetLabel: string, locale: "en" | "el") {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.WAITLIST_FROM_EMAIL?.trim();
  if (!apiKey || !from || from.toLowerCase().includes("@resend.dev")) return;
  const greek = locale === "el";
  const subject = greek ? `NOXA follow αποθηκεύτηκε · ${targetLabel}` : `NOXA follow saved · ${targetLabel}`;
  const text = greek
    ? `Αποθηκεύσαμε την επιλογή σου για ${targetLabel}. Το NOXA θα χρησιμοποιεί αυτό το email μόνο για σχετικά event alerts και βασικές ενημερώσεις υπηρεσίας.`
    : `We saved your follow preference for ${targetLabel}. NOXA will use this email only for relevant event alerts and essential service updates.`;
  const safeLabel = escapeHtml(targetLabel);
  const safeText = escapeHtml(text);
  await fetch(RESEND_API_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [email],
      subject,
      text,
      html: `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#050505;color:#f5f5f7;padding:32px"><div style="max-width:620px;margin:auto;border:1px solid #242428;border-radius:20px;background:#0b0b0d;padding:28px"><div style="color:#e32c49;font-size:12px;font-weight:800;letter-spacing:.16em">NOXA MEETS</div><h1 style="font-size:28px;margin:12px 0;color:#fff">${greek ? "Η επιλογή αποθηκεύτηκε." : "Your follow is saved."}</h1><p style="color:#c7c7cc;line-height:1.65">${safeText}</p><p style="color:#8f9096">${safeLabel}</p></div></div>`,
    }),
    cache: "no-store",
  }).catch(() => undefined);
}

export async function POST(request: NextRequest) {
  if (!allowedOrigin(request)) return json({ error: "forbidden" }, 403);
  if (rateLimited(clientKey(request))) return json({ error: "rate_limited" }, 429);

  let payload: { email?: unknown; consent?: unknown; targetType?: unknown; targetKey?: unknown; targetLabel?: unknown; locale?: unknown };
  try {
    payload = await request.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  const email = cleanText(payload.email, 254).toLowerCase();
  const targetType = cleanText(payload.targetType, 20);
  const targetKey = cleanText(payload.targetKey, 160);
  const targetLabel = cleanText(payload.targetLabel, 160);
  const locale = payload.locale === "el" ? "el" : "en";
  const consent = payload.consent === true;

  if (!EMAIL_PATTERN.test(email) || !TARGET_TYPES.has(targetType) || !targetKey || !targetLabel || !consent) return json({ error: "invalid_fields" }, 400);

  const endpoint = new URL(`${SUPABASE_URL}/rest/v1/meet_follow_subscriptions`);
  endpoint.searchParams.set("on_conflict", "email,target_type,target_key");
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      Prefer: "resolution=ignore-duplicates,return=minimal",
    },
    body: JSON.stringify({ email, target_type: targetType, target_key: targetKey, target_label: targetLabel, locale, consent: true, active: true }),
    cache: "no-store",
  }).catch(() => null);

  if (!response?.ok) return json({ error: "subscription_failed" }, 503);
  void confirmationEmail(email, targetLabel, locale);
  return json({ ok: true }, 201);
}
