import { NextRequest, NextResponse } from "next/server";

import { sameTrustedSource } from "../../../../lib/radarEnrichment";
import { extractRadarMediaLocationEvidence } from "../../../../lib/radarMediaEvidence";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPABASE_URL = "https://qrouwtqsqrfeeeppyeru.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_vR9wivNa_fIb0QKmqua6Wg_H_7OPvUk";
const MAX_BATCH = 8;
const MAX_SOURCE_BYTES = 1_000_000;

type Candidate = {
  id: string;
  title: string;
  title_el: string | null;
  original_url: string;
  source_url: string | null;
  trust_level: string | null;
};

function headers() {
  return { apikey: SUPABASE_PUBLISHABLE_KEY, "Content-Type": "application/json" };
}

function cronSecret(request: NextRequest) {
  return request.headers.get("x-radar-cron-secret")?.trim() ?? "";
}

async function loadBatch(secret: string) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/radar_media_location_batch`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ p_secret: secret, p_limit: MAX_BATCH }),
    cache: "no-store",
  });
  if (response.status === 401 || response.status === 403) throw new Error("UNAUTHORIZED");
  if (!response.ok) throw new Error(`Unable to load media/location batch (${response.status}).`);
  return await response.json() as Candidate[];
}

async function markFailed(secret: string, candidateId: string, reason: string) {
  await fetch(`${SUPABASE_URL}/rest/v1/rpc/radar_mark_media_location_failed`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ p_secret: secret, p_candidate_id: candidateId, p_reason: reason.slice(0, 1500) }),
    cache: "no-store",
  });
}

async function processCandidate(secret: string, candidate: Candidate) {
  if (candidate.trust_level !== "trusted" || !candidate.source_url || !sameTrustedSource(candidate.original_url, candidate.source_url)) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/radar_apply_media_location`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        p_secret: secret,
        p_candidate_id: candidate.id,
        p_cover_image_url: null,
        p_cover_image_source_url: null,
        p_cover_image_alt: null,
        p_cover_image_alt_el: null,
        p_latitude: null,
        p_longitude: null,
        p_location_precision: "unknown",
        p_outcome: "none",
        p_reason: "No trusted canonical source is available for automatic media/location verification.",
      }),
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`Unable to save no-evidence result (${response.status}).`);
    return "none" as const;
  }

  try {
    const sourceResponse = await fetch(candidate.original_url, {
      headers: { "User-Agent": "NOXA-Radar-Media-Enricher/1.0 (+https://noxastreetapp.com/radar)" },
      cache: "no-store",
      redirect: "manual",
      signal: AbortSignal.timeout(4_000),
    });
    if (!sourceResponse.ok) throw new Error(`Official source returned ${sourceResponse.status}.`);

    const contentType = sourceResponse.headers.get("content-type")?.toLowerCase() ?? "";
    if (!contentType.includes("text/html")) throw new Error("Official source is not an HTML page.");
    const contentLength = Number(sourceResponse.headers.get("content-length") ?? "0");
    if (Number.isFinite(contentLength) && contentLength > MAX_SOURCE_BYTES) throw new Error("Official source page is too large.");

    const html = await sourceResponse.text();
    if (html.length > MAX_SOURCE_BYTES) throw new Error("Official source page is too large.");

    const evidence = extractRadarMediaLocationEvidence({
      html,
      pageUrl: candidate.original_url,
      sourceUrl: candidate.source_url,
      title: candidate.title,
      titleEl: candidate.title_el,
    });

    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/radar_apply_media_location`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        p_secret: secret,
        p_candidate_id: candidate.id,
        p_cover_image_url: evidence.coverImageUrl,
        p_cover_image_source_url: evidence.coverImageUrl ? candidate.original_url : null,
        p_cover_image_alt: evidence.coverImageAlt,
        p_cover_image_alt_el: evidence.coverImageAltEl,
        p_latitude: evidence.latitude,
        p_longitude: evidence.longitude,
        p_location_precision: evidence.locationPrecision,
        p_outcome: evidence.outcome,
        p_reason: evidence.reason,
      }),
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`Unable to save media/location evidence (${response.status}).`);
    return evidence.outcome;
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Media/location enrichment failed.";
    await markFailed(secret, candidate.id, reason);
    return "failed" as const;
  }
}

export async function POST(request: NextRequest) {
  const secret = cronSecret(request);
  if (!secret) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const candidates = await loadBatch(secret);
    if (candidates.length === 0) return NextResponse.json({ ok: true, processed: 0 });

    const outcomes = await Promise.all(candidates.map((candidate) => processCandidate(secret, candidate)));
    const counts = outcomes.reduce<Record<string, number>>((acc, outcome) => {
      acc[outcome] = (acc[outcome] ?? 0) + 1;
      return acc;
    }, {});

    return NextResponse.json({ ok: true, processed: candidates.length, outcomes: counts });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Radar media/location enrichment failed", error);
    return NextResponse.json({ error: "Radar media/location enrichment failed." }, { status: 500 });
  }
}
