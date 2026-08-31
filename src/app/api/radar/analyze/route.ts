import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPABASE_URL = "https://qrouwtqsqrfeeeppyeru.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_vR9wivNa_fIb0QKmqua6Wg_H_7OPvUk";
const GEMINI_MODEL = process.env.RADAR_AI_MODEL ?? "gemini-2.5-flash-lite";
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

function responseSchema() {
  return {
    type: "object",
    properties: {
      results: {
        type: "array",
        items: {
          type: "object",
          properties: {
            candidate_id: { type: "string" },
            is_event: { type: "boolean" },
            title: { type: "string" },
            event_type: { type: "string", enum: [...EVENT_TYPES] },
            summary: { type: "string" },
            confidence: { type: "number", minimum: 0, maximum: 1 },
            reason: { type: "string" },
          },
          required: [
            "candidate_id",
            "is_event",
            "title",
            "event_type",
            "summary",
            "confidence",
            "reason",
          ],
        },
      },
    },
    required: ["results"],
  };
}

async function analyzeWithGemini(candidates: Candidate[]) {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("Gemini API is not configured. Add GEMINI_API_KEY to Vercel and redeploy.");
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

  const systemInstruction = [
    "You are the NOXA Radar event analyst for automotive and motorcycle culture.",
    "Analyze only the evidence supplied for each candidate. Never invent a date, place, organizer, or event claim.",
    "Your job is classification and editorial normalization, not publication.",
    "Relevant events include car meets, motorcycle meets, track days, drag, drift, rally, automotive shows, Cars & Coffee, group drives and automotive/moto festivals.",
    "Keep titles factual and concise. Preserve proper names. Normalize excessive uppercase when appropriate.",
    `event_type must be one of: ${EVENT_TYPES.join(", ")}.`,
    "confidence is from 0 to 1 and reflects confidence that the candidate is a real relevant public automotive/moto event and the normalization is supported by evidence.",
    "For summary, return an empty string when the supplied evidence is insufficient for a factual summary.",
  ].join(" ");

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: systemInstruction }],
      },
      contents: [
        {
          role: "user",
          parts: [{ text: JSON.stringify({ candidates: compactCandidates }) }],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: "application/json",
        responseSchema: responseSchema(),
      },
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error("Gemini Free Tier rate limit reached. Try AI analyze again later.");
    }
    if (response.status === 401 || response.status === 403) {
      throw new Error("Gemini API key is invalid or does not have access to the Gemini API.");
    }
    if (response.status === 404) {
      throw new Error(`Gemini model ${GEMINI_MODEL} is not available for this API key.`);
    }
    throw new Error(`Gemini API request failed (${response.status}).`);
  }

  const payload = await response.json() as {
    candidates?: Array<{
      content?: {
        parts?: Array<{ text?: string }>;
      };
    }>;
  };

  const content = payload.candidates?.[0]?.content?.parts
    ?.map((part) => part.text ?? "")
    .join("")
    .trim();

  if (!content) throw new Error("Gemini returned an empty analysis.");

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error("Gemini returned invalid JSON.");
  }

  const rows = parsed && typeof parsed === "object" && Array.isArray((parsed as { results?: unknown[] }).results)
    ? (parsed as { results: unknown[] }).results
    : [];
  const candidateIds = new Set(candidates.map((candidate) => candidate.id));

  return rows
    .map((row) => sanitizeResult(row, candidateIds))
    .filter((row): row is AnalysisResult => row !== null);
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
        ai_model: GEMINI_MODEL,
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
      return NextResponse.json({ ok: true, analyzed: 0, pending: 0, model: GEMINI_MODEL });
    }

    const results = await analyzeWithGemini(candidates);
    if (results.length === 0) {
      throw new Error("Gemini analysis did not return any valid candidate results.");
    }

    await Promise.all(results.map((result) => updateCandidate(accessToken, result)));

    return NextResponse.json({
      ok: true,
      analyzed: results.length,
      requested: candidates.length,
      model: GEMINI_MODEL,
      provider: "google-gemini",
    });
  } catch (error) {
    console.error("Radar AI analysis failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Radar AI analysis failed." },
      { status: 500 },
    );
  }
}
