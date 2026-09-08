import { radarCandidateQualityIssues, type RadarQualityCandidate } from "./radarQuality.ts";

export const RADAR_EVENT_TYPES = [
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

export type RadarEventType = (typeof RADAR_EVENT_TYPES)[number];
export type EnrichmentOutcome = "verified" | "review_required" | "rejected" | "failed";

export function clampEnrichmentConfidence(value: unknown) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0.5;
  return Math.max(0, Math.min(1, numeric));
}

export function cleanEnrichmentText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim().slice(0, maxLength);
}

export function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export function sameTrustedSource(originalUrl: string, sourceUrl: string | null | undefined) {
  if (!sourceUrl) return false;
  try {
    const original = new URL(originalUrl);
    const source = new URL(sourceUrl);
    if (!["https:", "http:"].includes(original.protocol) || !["https:", "http:"].includes(source.protocol)) return false;
    const originalHost = original.hostname.toLowerCase().replace(/^www\./, "");
    const sourceHost = source.hostname.toLowerCase().replace(/^www\./, "");
    return originalHost === sourceHost || originalHost.endsWith(`.${sourceHost}`) || sourceHost.endsWith(`.${originalHost}`);
  } catch {
    return false;
  }
}

export function decideEnrichmentOutcome(input: {
  isEvent: boolean;
  confidence: number;
  sourceVerified: boolean;
  candidate: RadarQualityCandidate;
}): { outcome: EnrichmentOutcome; issues: ReturnType<typeof radarCandidateQualityIssues> } {
  const issues = radarCandidateQualityIssues(input.candidate);
  if (!input.isEvent && input.confidence >= 0.85) return { outcome: "rejected", issues };
  if (input.isEvent && input.sourceVerified && input.confidence >= 0.92 && issues.length === 0) {
    return { outcome: "verified", issues };
  }
  return { outcome: "review_required", issues };
}
