export type PublicationQualityInput = {
  title?: string | null;
  eventType?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
  timezone?: string | null;
  locationText?: string | null;
  city?: string | null;
  countryCode?: string | null;
  organizerName?: string | null;
  sourceName?: string | null;
  sourceUrl?: string | null;
  summary?: string | null;
  titleEl?: string | null;
  summaryEl?: string | null;
  locationTextEl?: string | null;
  publicationSource?: string | null;
  coverImageUrl?: string | null;
  coverImageSourceUrl?: string | null;
  coverImageAlt?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  locationPrecision?: string | null;
};

export type PublicationQualityIssue = {
  code: string;
  label: string;
};

const SERVICE_SUMMARY_PATTERNS = [
  /review the original source before publishing/i,
  /official omae event announcement/i,
  /official\s+(?:α\.?\s*μοτ\.?\s*ο\.?\s*ε\.?|amotoe)\s+announcement/i,
  /this is an event reminder/i,
  /check the organizer['’]?s official details/i,
  /\b(?:placeholder|todo|tbd)\b/i,
];

const ANNOUNCEMENT_TITLE_SUFFIX = /\|\s*(?:αναγγελία|αναγγελια|announcement|δελτίο τύπου|δελτιο τυπου)\s*$/i;
const FEDERATION_SOURCE_NAMES = new Set(["omae", "amotoe", "α.μοτ.ο.ε.", "αμοτοε"]);

function clean(value: string | null | undefined) {
  return value?.trim() ?? "";
}

function validDate(value: string | null | undefined) {
  if (!clean(value)) return null;
  const date = new Date(value as string);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isHttpsUrl(value: string | null | undefined) {
  const normalized = clean(value);
  if (!normalized) return false;
  try {
    const url = new URL(normalized);
    return url.protocol === "https:" && Boolean(url.hostname);
  } catch {
    return false;
  }
}

function federationUsedAsOrganizer(input: PublicationQualityInput) {
  if (input.publicationSource !== "reviewed") return false;
  const organizer = clean(input.organizerName).toLocaleLowerCase();
  const source = clean(input.sourceName).toLocaleLowerCase();
  return Boolean(organizer && organizer === source && FEDERATION_SOURCE_NAMES.has(source));
}

export function publicationBlockers(input: PublicationQualityInput): PublicationQualityIssue[] {
  const issues: PublicationQualityIssue[] = [];
  const title = clean(input.title);
  const summary = clean(input.summary);
  const organizer = clean(input.organizerName);
  const location = clean(input.locationText) || clean(input.city);
  const start = validDate(input.startsAt);
  const end = validDate(input.endsAt);

  if (title.length < 4) issues.push({ code: "missing_title", label: "Add a real event title." });
  if (title.length > 220) issues.push({ code: "title_too_long", label: "Shorten the title to 220 characters or less." });
  if (ANNOUNCEMENT_TITLE_SUFFIX.test(title)) issues.push({ code: "announcement_title", label: "Remove announcement/press-release wording from the public title." });

  if (!start) issues.push({ code: "missing_start_time", label: "Add a verified start date and time." });
  if (!clean(input.timezone)) issues.push({ code: "missing_timezone", label: "Add the event timezone." });
  if (clean(input.endsAt) && !end) issues.push({ code: "invalid_end_time", label: "Fix the event end date and time." });
  if (start && end && end <= start) issues.push({ code: "end_before_start", label: "End time must be after start time." });

  if (!location) issues.push({ code: "missing_location", label: "Add the verified venue, route, or city." });
  if (organizer.length < 2) issues.push({ code: "missing_organizer", label: "Add the real event organizer." });
  if (federationUsedAsOrganizer(input)) issues.push({ code: "source_is_not_organizer", label: "The source federation is not enough; identify the actual organizer." });

  if (!isHttpsUrl(input.sourceUrl)) issues.push({ code: "invalid_source_url", label: "Add a valid HTTPS source URL." });

  if (summary.length < 80) issues.push({ code: "summary_too_short", label: "Add a factual public description with the important event details." });
  if (SERVICE_SUMMARY_PATTERNS.some((pattern) => pattern.test(summary))) {
    issues.push({ code: "service_summary", label: "Replace internal/placeholder text with a public event description." });
  }

  if (clean(input.coverImageUrl)) {
    if (!isHttpsUrl(input.coverImageUrl)) issues.push({ code: "invalid_cover_url", label: "Event cover must use a valid HTTPS URL." });
    if (!isHttpsUrl(input.coverImageSourceUrl)) issues.push({ code: "missing_cover_source", label: "Add the source page for the verified event image." });
    if (clean(input.coverImageAlt).length < 6) issues.push({ code: "missing_cover_alt", label: "Add accessible alt text for the event image." });
  }

  if (input.locationPrecision === "exact") {
    const hasLatitude = typeof input.latitude === "number" && Number.isFinite(input.latitude);
    const hasLongitude = typeof input.longitude === "number" && Number.isFinite(input.longitude);
    if (!hasLatitude || !hasLongitude) issues.push({ code: "exact_location_without_coordinates", label: "Exact location requires confirmed coordinates." });
  }

  return issues;
}

export function publicationWarnings(input: PublicationQualityInput): PublicationQualityIssue[] {
  const warnings: PublicationQualityIssue[] = [];

  if (clean(input.countryCode).toUpperCase() === "GR") {
    if (!clean(input.titleEl)) warnings.push({ code: "missing_greek_title", label: "Greek title is missing." });
    if (!clean(input.summaryEl)) warnings.push({ code: "missing_greek_summary", label: "Greek description is missing." });
    if (!clean(input.locationTextEl)) warnings.push({ code: "missing_greek_location", label: "Greek location text is missing." });
  }

  if (!clean(input.coverImageUrl)) warnings.push({ code: "no_verified_event_image", label: "No verified event-specific image is attached; NOXA fallback will be used." });
  if (input.locationPrecision !== "exact") warnings.push({ code: "map_unavailable", label: "Map stays hidden until exact coordinates are verified." });
  if (input.eventType === "other") warnings.push({ code: "generic_event_type", label: "Event type is still generic." });

  return warnings;
}

export function publicationReady(input: PublicationQualityInput) {
  return publicationBlockers(input).length === 0;
}
