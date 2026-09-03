import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const ALLOWED_ORIGINS = new Set([
  "https://noxastreetapp.com",
  "https://www.noxastreetapp.com",
]);
const FOCUS_VALUES = new Set(["car", "moto", "mixed"]);
const LIMIT = 3;
const WINDOW_MS = 24 * 60 * 60 * 1000;

type Submission = {
  communityName?: unknown;
  city?: unknown;
  region?: unknown;
  countryCode?: unknown;
  focus?: unknown;
  sceneTags?: unknown;
  instagramUrl?: unknown;
  websiteUrl?: unknown;
  about?: unknown;
  contactName?: unknown;
  contactEmail?: unknown;
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

function longText(value: unknown, max: number) {
  if (typeof value !== "string") return "";
  return value.replace(/\r\n/g, "\n").trim().slice(0, max);
}

function normalizeUrl(value: unknown) {
  const raw = text(value, 700);
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

function normalizeTags(value: unknown) {
  if (!Array.isArray(value)) return [];
  const tags = value
    .map((item) => text(item, 32))
    .filter((item) => item.length >= 2);
  return Array.from(new Set(tags)).slice(0, 16);
}

function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
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
  const query = `community_application_rate_limits?fingerprint=eq.${encodeURIComponent(fingerprint)}&select=window_started_at,submission_count&limit=1`;
  const response = await rest(query);
  if (!response.ok) throw new Error("rate_limit_read_failed");
  const rows = await response.json() as Array<{ window_started_at: string; submission_count: number }>;
  const row = rows[0];
  const now = Date.now();

  if (!row) {
    const insert = await rest("community_application_rate_limits", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        fingerprint,
        window_started_at: new Date(now).toISOString(),
        submission_count: 1,
        updated_at: new Date(now).toISOString(),
      }),
    });
    if (!insert.ok) throw new Error("rate_limit_write_failed");
    return false;
  }

  const started = new Date(row.window_started_at).getTime();
  const expired = !Number.isFinite(started) || now - started >= WINDOW_MS;
  if (!expired && row.submission_count >= LIMIT) return true;

  const patch = await rest(`community_application_rate_limits?fingerprint=eq.${encodeURIComponent(fingerprint)}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify(expired
      ? { window_started_at: new Date(now).toISOString(), submission_count: 1, updated_at: new Date(now).toISOString() }
      : { submission_count: row.submission_count + 1, updated_at: new Date(now).toISOString() }),
  });
  if (!patch.ok) throw new Error("rate_limit_write_failed");
  return false;
}

async function existsBy(field: "instagram_url" | "website_url", value: string) {
  const encoded = encodeURIComponent(value);
  const [applicationResponse, communityResponse] = await Promise.all([
    rest(`community_applications?${field}=eq.${encoded}&status=eq.pending&select=id&limit=1`),
    rest(`communities?${field}=eq.${encoded}&select=id&limit=1`),
  ]);
  if (!applicationResponse.ok || !communityResponse.ok) throw new Error("duplicate_check_failed");
  const applications = await applicationResponse.json() as Array<{ id: string }>;
  const communities = await communityResponse.json() as Array<{ id: string }>;
  return applications.length > 0 || communities.length > 0;
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("Origin");
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(origin) });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405, origin);
  if (!allowedOrigin(origin)) return json({ error: "Origin not allowed" }, 403, origin);
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return json({ error: "Application service is not configured" }, 500, origin);

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

  const communityName = text(body.communityName, 120);
  const city = text(body.city, 100);
  const region = text(body.region, 100) || null;
  const countryCode = text(body.countryCode, 2).toUpperCase();
  const focus = text(body.focus, 20);
  const sceneTags = normalizeTags(body.sceneTags);
  const instagramUrl = normalizeUrl(body.instagramUrl);
  const websiteUrl = normalizeUrl(body.websiteUrl);
  const about = longText(body.about, 2000);
  const contactName = text(body.contactName, 120);
  const contactEmail = text(body.contactEmail, 254).toLowerCase();

  if (communityName.length < 2) return json({ error: "Community name is required." }, 400, origin);
  if (city.length < 2) return json({ error: "City is required." }, 400, origin);
  if (!/^[A-Z]{2}$/.test(countryCode)) return json({ error: "Choose a valid country." }, 400, origin);
  if (!FOCUS_VALUES.has(focus)) return json({ error: "Choose Car, Moto or Mixed." }, 400, origin);
  if (!instagramUrl && !websiteUrl) return json({ error: "Add an Instagram page or website so NOXA can verify the community." }, 400, origin);
  if (about.length < 20) return json({ error: "Tell us a little more about the community." }, 400, origin);
  if (contactName.length < 2) return json({ error: "Contact name is required." }, 400, origin);
  if (!validEmail(contactEmail)) return json({ error: "Add a valid contact email." }, 400, origin);

  try {
    if (await rateLimited(req)) {
      return json({ error: "Too many applications. Try again tomorrow." }, 429, origin);
    }

    if ((instagramUrl && await existsBy("instagram_url", instagramUrl)) || (websiteUrl && await existsBy("website_url", websiteUrl))) {
      return json({
        ok: true,
        submitted: false,
        duplicate: true,
        message: "This community is already listed or waiting for review.",
      }, 200, origin);
    }

    const insert = await rest("community_applications", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        community_name: communityName,
        city,
        region,
        country_code: countryCode,
        focus,
        scene_tags: sceneTags,
        instagram_url: instagramUrl,
        website_url: websiteUrl,
        about,
        contact_name: contactName,
        contact_email: contactEmail,
        status: "pending",
      }),
    });

    if (!insert.ok) {
      console.error("Community application insert failed", insert.status, (await insert.text()).slice(0, 300));
      return json({ error: "Could not submit this application right now." }, 500, origin);
    }

    const rows = await insert.json() as Array<{ id: string }>;

    void rest(`community_application_rate_limits?updated_at=lt.${encodeURIComponent(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())}`, {
      method: "DELETE",
    }).catch(() => undefined);

    return json({ ok: true, submitted: true, id: rows[0]?.id ?? null }, 201, origin);
  } catch (error) {
    console.error("Community application failed", error);
    return json({ error: "Could not submit this application right now." }, 500, origin);
  }
});
