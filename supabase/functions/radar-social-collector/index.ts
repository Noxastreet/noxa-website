import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const ALLOWED_ORIGIN = "https://noxastreetapp.com";
const UNSUPPORTED_MESSAGE = "Public Instagram/Facebook HTML collection is disabled. An official Meta API connection is required before this source can be collected automatically.";

type Actor = { kind: "admin" | "scheduler"; label: string };
type Source = {
  id: string;
  name: string;
  platform: "instagram" | "facebook";
};

function corsHeaders(origin: string | null) {
  return {
    "Access-Control-Allow-Origin": origin === ALLOWED_ORIGIN ? ALLOWED_ORIGIN : ALLOWED_ORIGIN,
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-radar-cron-secret",
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
      ...corsHeaders(origin),
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

async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function getUser(jwt: string) {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${jwt}` },
  });
  if (!response.ok) return null;
  return await response.json() as { id: string; email?: string };
}

async function isAdmin(userId: string) {
  const response = await rest(`radar_admins?user_id=eq.${encodeURIComponent(userId)}&select=role&limit=1`);
  if (!response.ok) return false;
  return ((await response.json()) as Array<{ role: string }>).length > 0;
}

async function validCronSecret(secret: string) {
  if (!secret) return false;
  const response = await rest("radar_internal_secrets?name=eq.radar_collector_cron_secret&select=secret_hash&limit=1");
  if (!response.ok) return false;
  const rows = await response.json() as Array<{ secret_hash: string }>;
  return Boolean(rows[0]?.secret_hash) && rows[0].secret_hash === await sha256(secret);
}

async function authorize(req: Request): Promise<Actor | null> {
  const cronSecret = req.headers.get("x-radar-cron-secret") ?? "";
  if (cronSecret && await validCronSecret(cronSecret)) {
    return { kind: "scheduler", label: "scheduled social collector" };
  }

  const auth = req.headers.get("Authorization") ?? "";
  const jwt = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!jwt) return null;
  const user = await getUser(jwt);
  if (!user || !(await isAdmin(user.id))) return null;
  return { kind: "admin", label: user.email ?? user.id };
}

async function recordUnsupportedSource(source: Source, runId: string, checkedAt: string) {
  const check = await rest("radar_source_checks", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      source_id: source.id,
      collector_run_id: runId,
      status: "unsupported",
      items_seen: 0,
      items_new: 0,
      error_message: UNSUPPORTED_MESSAGE,
    }),
  });
  if (!check.ok) {
    throw new Error(`Unable to record unsupported social source (${check.status})`);
  }

  const update = await rest(`radar_sources?id=eq.${encodeURIComponent(source.id)}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      last_checked_at: checkedAt,
      last_error: UNSUPPORTED_MESSAGE,
      updated_at: checkedAt,
    }),
  });
  if (!update.ok) {
    throw new Error(`Unable to update unsupported social source (${update.status})`);
  }
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("Origin");
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(origin) });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405, origin);
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return json({ error: "Social collector environment is not configured" }, 500, origin);

  const actor = await authorize(req);
  if (!actor) return json({ error: "Unauthorized" }, 401, origin);

  const runResponse = await rest("radar_collector_runs", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      status: "running",
      notes: actor.kind === "scheduler"
        ? "Scheduled social collector run"
        : `Manual social run by ${actor.label}`,
    }),
  });
  if (!runResponse.ok) return json({ error: "Unable to create social collector run" }, 500, origin);
  const [run] = await runResponse.json() as Array<{ id: string }>;
  if (!run?.id) return json({ error: "Unable to create social collector run" }, 500, origin);

  let sourcesChecked = 0;
  let unsupportedCount = 0;
  let errorCount = 0;

  try {
    const sourcesResponse = await rest(
      "radar_sources?active=eq.true&platform=in.(instagram,facebook)&select=id,name,platform&order=created_at.asc",
    );
    if (!sourcesResponse.ok) throw new Error("Unable to load social sources");
    const sources = await sourcesResponse.json() as Source[];

    for (const source of sources) {
      sourcesChecked += 1;
      const checkedAt = new Date().toISOString();
      try {
        await recordUnsupportedSource(source, run.id, checkedAt);
        unsupportedCount += 1;
      } catch (error) {
        errorCount += 1;
        const message = error instanceof Error ? error.message.slice(0, 500) : "Unknown social collector error";
        await rest("radar_source_checks", {
          method: "POST",
          headers: { Prefer: "return=minimal" },
          body: JSON.stringify({
            source_id: source.id,
            collector_run_id: run.id,
            status: "failed",
            items_seen: 0,
            items_new: 0,
            error_message: message,
          }),
        });
        await rest(`radar_sources?id=eq.${encodeURIComponent(source.id)}`, {
          method: "PATCH",
          headers: { Prefer: "return=minimal" },
          body: JSON.stringify({
            last_checked_at: checkedAt,
            last_error: message,
            updated_at: checkedAt,
          }),
        });
      }
    }

    const status = errorCount === 0 ? "success" : "partial";
    const notes = errorCount === 0
      ? `Social collection skipped safely: ${unsupportedCount} Meta source${unsupportedCount === 1 ? "" : "s"} require an official API connection.`
      : `Social collection skipped; ${errorCount} source record update${errorCount === 1 ? "" : "s"} failed.`;

    await rest(`radar_collector_runs?id=eq.${encodeURIComponent(run.id)}`, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        finished_at: new Date().toISOString(),
        status,
        sources_checked: sourcesChecked,
        candidates_created: 0,
        duplicates_skipped: 0,
        error_count: errorCount,
        notes,
      }),
    });

    return json({
      ok: true,
      runId: run.id,
      status,
      sourcesChecked,
      candidatesCreated: 0,
      duplicatesSkipped: 0,
      errorCount,
      unsupportedCount,
    }, 200, origin);
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 500) : "Social collector failed";
    await rest(`radar_collector_runs?id=eq.${encodeURIComponent(run.id)}`, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        finished_at: new Date().toISOString(),
        status: "failed",
        sources_checked: sourcesChecked,
        candidates_created: 0,
        duplicates_skipped: 0,
        error_count: errorCount + 1,
        notes: message,
      }),
    });
    return json({ error: message, runId: run.id }, 500, origin);
  }
});
