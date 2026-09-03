import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const ALLOWED_ORIGINS = new Set([
  "https://noxastreetapp.com",
  "https://www.noxastreetapp.com",
]);
const KINDS = new Set(["view", "share", "map_click"]);
const SOURCES = new Set(["noxa", "instagram", "google", "facebook", "tiktok", "direct", "other"]);

type MetricBody = {
  eventId?: unknown;
  kind?: unknown;
  source?: unknown;
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

async function rpc(name: string, body: unknown) {
  return fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: serviceHeaders(),
    body: JSON.stringify(body),
  });
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function clientAddress(req: Request) {
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || req.headers.get("cf-connecting-ip") || req.headers.get("x-real-ip") || "unknown";
}

function bucketStart(kind: string) {
  const bucketMs = kind === "view" ? 30 * 60 * 1000 : 60 * 1000;
  const value = Math.floor(Date.now() / bucketMs) * bucketMs;
  return new Date(value).toISOString();
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("Origin");
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(origin) });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405, origin);
  if (!allowedOrigin(origin)) return json({ error: "Origin not allowed" }, 403, origin);
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return json({ error: "Tracking service is not configured" }, 500, origin);

  let body: MetricBody;
  try {
    body = await req.json() as MetricBody;
  } catch {
    return json({ error: "Invalid request" }, 400, origin);
  }

  const eventId = typeof body.eventId === "string" ? body.eventId.trim() : "";
  const kind = typeof body.kind === "string" ? body.kind.trim() : "";
  const sourceCandidate = typeof body.source === "string" ? body.source.trim() : "direct";
  const source = SOURCES.has(sourceCandidate) ? sourceCandidate : "other";

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(eventId)) {
    return json({ error: "Invalid event" }, 400, origin);
  }
  if (!KINDS.has(kind)) return json({ error: "Invalid metric" }, 400, origin);

  try {
    const fingerprint = await sha256(`${clientAddress(req)}|${req.headers.get("user-agent") ?? "unknown"}`);
    const limiter = await rest("event_metric_rate_limits", {
      method: "POST",
      headers: { Prefer: "return=minimal,resolution=ignore-duplicates" },
      body: JSON.stringify({
        event_id: eventId,
        fingerprint_hash: fingerprint,
        metric_kind: kind,
        bucket_start: bucketStart(kind),
      }),
    });

    if (!limiter.ok) {
      console.error("Event metric limiter failed", limiter.status, (await limiter.text()).slice(0, 240));
      return json({ ok: false }, 500, origin);
    }

    const duplicate = limiter.status === 200;
    if (duplicate) return json({ ok: true, counted: false }, 200, origin);

    const recorded = await rpc("record_event_metric", {
      p_event_id: eventId,
      p_kind: kind,
      p_source: source,
    });

    if (!recorded.ok) {
      console.error("Event metric write failed", recorded.status, (await recorded.text()).slice(0, 240));
      return json({ ok: false }, 500, origin);
    }

    void rest(`event_metric_rate_limits?created_at=lt.${encodeURIComponent(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString())}`, {
      method: "DELETE",
    }).catch(() => undefined);

    return json({ ok: true, counted: true }, 200, origin);
  } catch (error) {
    console.error("Event metric tracking failed", error);
    return json({ ok: false }, 500, origin);
  }
});
