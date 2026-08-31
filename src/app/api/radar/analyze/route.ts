import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPABASE_URL = "https://qrouwtqsqrfeeeppyeru.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_vR9wivNa_fIb0QKmqua6Wg_H_7OPvUk";
const AI_GATEWAY_URL = "https://ai-gateway.vercel.sh/v1/chat/completions";
const AI_MODEL = process.env.RADAR_AI_MODEL ?? "openai/gpt-5.4";
const MAX_BATCH = 16;

const EVENT_TYPES = [
  "car_meet",
  "moto_meet",
  "track_day",
  "drag",
  "drift",
  "rally",
  "show",
  "cars_and_coffee",
  "group_drive",
  "festival",
  "other",
] as const;

type EventType = (typeof EVENT_TYPES)[number];

type Candidate = {
  id: string;
  title: string;
  country_code: string;
  event_type: EventType;
  starts_at: string | null;
  ends_at: string | null;
  timezone: string | null;
  location_text: string | null;
  city: string | null;
  region: string | null;
  organizer_name: string | null;
  summary: string | null;
  original_url: string;
  raw_payload: unknown;
};

type AnalysisResult = {
  candidate_id: string;
  is_event: boolean;
  title: string;
  event_type: EventType;
  summary: string | null;
  confidence: number;
  reason: string;
};

function supabaseHeaders(accessToken: string) {
  return {
    apikey: SUPABASE_PUBLISHABLE_KEY,
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };
}

function bearerToken(request: NextRequest) {
  const header = request.headers.get("authorization") ?? "";
  return header.startsWith("Bearer ") ? header.slice(7).trim() : "";
}

async function authorizedAdmin(accessToken: string) {
  const [userResponse, adminResponse] = await Promise.all([
    fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: supabaseHeaders(accessToken),
      cache: "no-store",
    }),
    fetch(`${SUPABASE_URL}/rest/v1/rpc/radar_admin_status`, {
      method: "POST",
      headers: supabaseHeaders(accessToken),
      body: "{}",
      cache: "no-store",
    }),
  ]);

  if (!userResponse.ok || !adminResponse.ok) return false;
  return (await adminResponse.json()) === true;
}

async function loadPendingCandidates(accessToken: string) {
  const select = [
    "id",
    "title",
    "country_code",
    "event_type",
    "starts_at",
    "ends_at",
    "timezone",
    "location_text",
    "city",
    "region",
    "organizer_name",
    "summary",
    "original_url",
    "raw_payload",
  ].join(",");

  const query = new URLSearchParams({
    select,
    status: "in.(new,needs_review)",
    ai_analyzed_at: "is.null",
    order: "created_at.asc",
    limit: String(MAX_BATCH),
  });

  const response = await fetch(`${SUPABASE_URL}/rest/v1/radar_candidates?${query}`, {
    headers: supabaseHeaders(accessToken),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Unable to load Radar candidates (${response.status}).`);
  }

  return (await response.json()) as Candidate[];
}

function clampConfidence(value: unknown) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0.5;
  return Math.max(0, Math.min(1, number));
}

function sanitizeResult(value: unknown, candidateIds: Set<string>): AnalysisResult | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const candidateId = typeof row.candidate_id === "string" ? row.candidate_id : "";
  const title = typeof row.title === "string" ? row.title.trim().slice(0, 220) : "";
  const eventType = typeof row.event_type === "string" && EVENT_TYPES.includes(row.event_type as EventType)
    ? row.event_type as EventType
    : "other";
  const reason = typeof row.reason === "string" ? row.reason.trim().slice(0, 800) : "AI analysis completed.";
  const summary = typeof row.summary === "string" && row.summary.trim()
    ? row.summary.trim().slice(0, 900)
    : null;

  if (!candidateIds.has(candidateId) || !title) return null;

  return {
    candidate_id: candidateId,
    is_event: row.is_event !== false,
    title,
    event_type: eventType,
    summary,
    confidence: clampConfidence(row.confidence),
    reason,
  };
}

function gatewayCredential(request: NextRequest) {
  const apiKey = process.env.AI_GATEWAY_API_KEY?.trim();
  if (apiKey) return { token: apiKey, source: "api_key" as const };

  // Vercel injects the OIDC token into the Node.js Function request context.
  // Reading the request-scoped value avoids depending only on a static env snapshot.
  const requestOidcToken = request.headers.get("x-vercel-oidc-token")?.trim();
  if (requestOidcToken) return { token: requestOidcToken, source: "request_oidc" as const };

  const environmentOidcToken = process.env.VERCEL_OIDC_TOKEN?.trim();
  if (environmentOidcToken) return { token: environmentOidcToken, source: "environment_oidc" as const };

  return null;
}

async function analyzeWithGateway(request: NextRequest, candidates: Candidate[]) {
  const credential = gatewayCredential(request);

  if (!credential) {
    throw new Error(
      "Vercel AI Gateway authentication is unavailable: no API key or request-scoped OIDC token was provided to this Function.",
    );
  }

  const compactCandidates = candidates.map((candidate) => ({
    candidate_id: candidate.id,
    title: candidate.title,
    country_code: candidate.country_code,
    current_event_type: candidate.event_type,
    starts_at: candidate.starts_at,
    ends_at: candidate.ends_at,
    timezone: candidate.timezone,
    location_text: candidate.location_text,
    city: candidate.city,
    region: candidate.region,
    organizer_name: candidate.organizer_name,
    summary: candidate.summary,
    original_url: candidate.original_url,
    raw_payload: candidate.raw_payload,
  }));

  const system = [
    "You are the NOXA Radar event analyst for automotive and motorcycle culture.",
    "Analyze only the evidence supplied for each candidate. Never invent a date, place, organizer, or event claim.",
    "Your job is classification and editorial normalization, not publication.",
    "Relevant events include car meets, motorcycle meets, track days, drag, drift, rally, automotive shows, Cars & Coffee, group drives and automotive/moto festivals.",
    "Keep titles factual and concise. Preserve proper names. Normalize excessive uppercase when appropriate.",
    `event_type must be one of: ${EVENT_TYPES.join(", ")}.`,
    "confidence is from 0 to 1 and reflects confidence that the candidate is a real relevant public automotive/moto event and the normalization is supported by evidence.",
    "Return JSON only, with shape: {\"results\":[{\"candidate_id\":string,\"is_event\":boolean,\"title\":string,\"event_type\":string,\"summary\":string|null,\"confidence\":number,\"reason\":string}]}.",
  ].join(" ");

  const response = await fetch(AI_GATEWAY_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${credential.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: AI_MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: JSON.stringify({ candidates: compactCandidates }) },
      ],
      stream: false,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`AI Gateway returned ${response.status}${body ? `: ${body.slice(0, 240)}` : ""}`);
  }

  const payload = await response.json() as {
    choices?: Array<{ message?: { content?: string | null } }>;
  };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new Error("AI Gateway returned an empty analysis.");

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error("AI Gateway returned invalid JSON.");
  }

  const rows = parsed && typeof parsed === "object" && Array.isArray((parsed as { results?: unknown[] }).results)
    ? (parsed as { results: unknown[] }).results
    : [];
  const candidateIds = new Set(candidates.map((candidate) => candidate.id));
  return {
    results: rows
      .map((row) => sanitizeResult(row, candidateIds))
      .filter((row): row is AnalysisResult => row !== null),
    credentialSource: credential.source,
  };
}

async function updateCandidate(accessToken: string, result: AnalysisResult) {
  const reason = result.is_event
    ? result.reason
    : `AI flagged this candidate as potentially not relevant. ${result.reason}`;

  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/radar_candidates?id=eq.${encodeURIComponent(result.candidate_id)}`,
    {
      method: "PATCH",
      headers: supabaseHeaders(accessToken),
      body: JSON.stringify({
        title: result.title,
        event_type: result.event_type,
        summary: result.summary,
        ai_confidence: result.confidence,
        ai_reason: reason,
        ai_analyzed_at: new Date().toISOString(),
        ai_model: AI_MODEL,
        status: "new",
        updated_at: new Date().toISOString(),
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`Unable to save AI analysis for candidate ${result.candidate_id}.`);
  }
}

export async function POST(request: NextRequest) {
  const accessToken = bearerToken(request);
  if (!accessToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!(await authorizedAdmin(accessToken))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const candidates = await loadPendingCandidates(accessToken);
    if (candidates.length === 0) {
      return NextResponse.json({ ok: true, analyzed: 0, pending: 0, model: AI_MODEL });
    }

    const analysis = await analyzeWithGateway(request, candidates);
    if (analysis.results.length === 0) {
      throw new Error("AI analysis did not return any valid candidate results.");
    }

    await Promise.all(analysis.results.map((result) => updateCandidate(accessToken, result)));

    return NextResponse.json({
      ok: true,
      analyzed: analysis.results.length,
      requested: candidates.length,
      model: AI_MODEL,
      authentication: analysis.credentialSource,
    });
  } catch (error) {
    console.error("Radar AI analysis failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Radar AI analysis failed." },
      { status: 500 },
    );
  }
}
