export type RadarQualityIssueCode =
  | "missing_title"
  | "placeholder_title"
  | "missing_start"
  | "invalid_start"
  | "invalid_end"
  | "missing_timezone"
  | "missing_location"
  | "missing_organizer"
  | "source_as_organizer"
  | "missing_summary"
  | "short_summary"
  | "placeholder_summary"
  | "invalid_source_url"
  | "invalid_country"
  | "outside_greece"
  | "moto_only_event";

export type RadarQualityCandidate = {
  title: string;
  event_type?: string | null;
  country_code: string;
  starts_at: string | null;
  ends_at?: string | null;
  timezone: string | null;
  location_text: string | null;
  city: string | null;
  organizer_name: string | null;
  summary?: string | null;
  original_url: string;
};

const SOURCE_ONLY_ORGANIZERS = new Set([
  "noxaradar",
  "omae",
  "amotoe",
  "αμοτοε",
]);

const ISSUE_LABELS: Record<RadarQualityIssueCode, string> = {
  missing_title: "missing event title",
  placeholder_title: "placeholder title",
  missing_start: "missing start date/time",
  invalid_start: "invalid start date/time",
  invalid_end: "end must be after start",
  missing_timezone: "missing timezone",
  missing_location: "missing city/location",
  missing_organizer: "missing organizer",
  source_as_organizer: "source/federation is not the verified organizer",
  missing_summary: "missing factual summary",
  short_summary: "summary is too short",
  placeholder_summary: "summary is a collector placeholder",
  invalid_source_url: "invalid source URL",
  invalid_country: "invalid country code",
  outside_greece: "event is outside Greece",
  moto_only_event: "motorcycle-only event is outside the NOXA website scope",
};

const MOTO_ONLY_TEXT = /(^|[^a-z0-9α-ωάέήίόύώϊΐϋΰ])(moto(?:[\s-]?(?:meet(?:ing)?|days?|expo|rally))?|motocross|motorcycles?|motorbikes?|vespa|scooters?|enduro|supermoto|motogp|bikeit|bikers?)(?=$|[^a-z0-9α-ωάέήίόύώϊΐϋΰ])/i;
const GREEK_MOTO_TEXT = /(μοτοσυκλ|μοτοκρ[οό]ς)/i;

function normalizedKey(value: string | null | undefined) {
  return (value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9α-ω]+/g, "");
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function isPlaceholderSummary(value: string) {
  const normalized = value.trim().toLowerCase();
  return normalized === "this is an event reminder" ||
    normalized.includes("review the original source before publishing") ||
    normalized.startsWith("official omae event announcement") ||
    normalized.startsWith("official α.μοτ.ο.ε. announcement") ||
    normalized.startsWith("official amotoe announcement");
}

export function isMotoOnlyRadarEvent(candidate: Pick<RadarQualityCandidate, "event_type" | "title" | "summary" | "organizer_name" | "original_url">) {
  if (candidate.event_type === "moto_meet") return true;

  let hostname = "";
  try {
    hostname = new URL(candidate.original_url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    // Invalid URLs are handled separately by the Quality Gate.
  }
  if (hostname === "amotoe.org" || hostname.endsWith(".amotoe.org")) return true;

  const evidence = [candidate.title, candidate.summary, candidate.organizer_name, candidate.original_url]
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .join(" ");

  return MOTO_ONLY_TEXT.test(evidence) || GREEK_MOTO_TEXT.test(evidence);
}

export function radarCandidateQualityIssues(candidate: RadarQualityCandidate): RadarQualityIssueCode[] {
  const issues: RadarQualityIssueCode[] = [];
  const title = candidate.title.trim();
  const summary = candidate.summary?.trim() ?? "";
  const organizer = candidate.organizer_name?.trim() ?? "";

  if (!title) issues.push("missing_title");
  else if (/^(tbd|to be announced|untitled|event reminder|coming soon)$/i.test(title)) issues.push("placeholder_title");

  if (!candidate.starts_at) {
    issues.push("missing_start");
  } else {
    const startsAt = new Date(candidate.starts_at);
    if (Number.isNaN(startsAt.getTime())) issues.push("invalid_start");
    if (candidate.ends_at) {
      const endsAt = new Date(candidate.ends_at);
      if (Number.isNaN(endsAt.getTime()) || (!Number.isNaN(startsAt.getTime()) && endsAt <= startsAt)) {
        issues.push("invalid_end");
      }
    }
  }

  if (!candidate.timezone?.trim()) issues.push("missing_timezone");
  if (!candidate.city?.trim() && !candidate.location_text?.trim()) issues.push("missing_location");

  if (!organizer) issues.push("missing_organizer");
  else if (SOURCE_ONLY_ORGANIZERS.has(normalizedKey(organizer))) issues.push("source_as_organizer");

  if (!summary) issues.push("missing_summary");
  else if (isPlaceholderSummary(summary)) issues.push("placeholder_summary");
  else if (summary.length < 32) issues.push("short_summary");

  if (!isHttpUrl(candidate.original_url)) issues.push("invalid_source_url");
  if (!/^[A-Z]{2}$/.test(candidate.country_code)) issues.push("invalid_country");
  else if (candidate.country_code !== "GR") issues.push("outside_greece");

  if (isMotoOnlyRadarEvent(candidate)) issues.push("moto_only_event");

  return issues;
}

export function radarQualityIssueLabel(issue: RadarQualityIssueCode) {
  return ISSUE_LABELS[issue];
}

export function radarQualityIssueSummary(issues: RadarQualityIssueCode[]) {
  return issues.map(radarQualityIssueLabel).join(" · ");
}
