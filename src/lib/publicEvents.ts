const SUPABASE_URL = "https://qrouwtqsqrfeeeppyeru.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_vR9wivNa_fIb0QKmqua6Wg_H_7OPvUk";

export type PublicEvent = {
  id: string;
  public_slug: string;
  country_code: string;
  title: string;
  event_type: string;
  starts_at: string;
  ends_at: string | null;
  timezone: string;
  location_text: string | null;
  city: string | null;
  region: string | null;
  organizer_name: string | null;
  organizer_url: string | null;
  source_name: string;
  source_url: string;
  summary: string | null;
  organizer_profile_id: string | null;
  community_id: string | null;
  publication_source: "reviewed" | "organizer";
};

export type PublicOrganizer = {
  id: string;
  slug: string;
  name: string;
  organizer_type: "community" | "team" | "company" | "page" | "group";
  verified: boolean;
};

export type PublicEventBundle = {
  event: PublicEvent;
  organizer: PublicOrganizer | null;
};

const EVENT_SELECT = [
  "id",
  "public_slug",
  "country_code",
  "title",
  "event_type",
  "starts_at",
  "ends_at",
  "timezone",
  "location_text",
  "city",
  "region",
  "organizer_name",
  "organizer_url",
  "source_name",
  "source_url",
  "summary",
  "organizer_profile_id",
  "community_id",
  "publication_source",
].join(",");

function headers() {
  return { apikey: SUPABASE_PUBLISHABLE_KEY };
}

export async function getPublicEventBySlug(slug: string): Promise<PublicEventBundle | null> {
  if (!/^[a-z0-9-]{3,96}$/.test(slug)) return null;

  const query = new URLSearchParams({
    select: EVENT_SELECT,
    public_slug: `eq.${slug}`,
    status: "eq.published",
    limit: "1",
  });

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/radar_events?${query.toString()}`, {
      headers: headers(),
      next: { revalidate: 60 },
    });
    if (!response.ok) return null;

    const rows = await response.json() as PublicEvent[];
    const event = rows[0];
    if (!event) return null;

    let organizer: PublicOrganizer | null = null;
    if (event.organizer_profile_id) {
      const organizerQuery = new URLSearchParams({
        select: "id,slug,name,organizer_type,verified",
        id: `eq.${event.organizer_profile_id}`,
        status: "eq.active",
        limit: "1",
      });
      const organizerResponse = await fetch(`${SUPABASE_URL}/rest/v1/organizer_profiles?${organizerQuery.toString()}`, {
        headers: headers(),
        next: { revalidate: 60 },
      });
      if (organizerResponse.ok) {
        const organizers = await organizerResponse.json() as PublicOrganizer[];
        organizer = organizers[0] ?? null;
      }
    }

    return { event, organizer };
  } catch {
    return null;
  }
}

export function eventTypeLabel(type: string) {
  const labels: Record<string, string> = {
    car_meet: "CAR MEET",
    moto_meet: "MOTO MEET",
    track_day: "TRACK DAY",
    drag: "DRAG RACING",
    drift: "DRIFT",
    rally: "RALLY",
    show: "AUTO SHOW",
    cars_and_coffee: "CARS & COFFEE",
    group_drive: "GROUP DRIVE",
    festival: "FESTIVAL",
    other: "EVENT",
  };
  return labels[type] ?? "EVENT";
}

export function formatEventDateTime(value: string, timezone: string, locale: "en" | "el") {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale === "el" ? "el-GR" : "en-GB", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timezone || "Europe/Athens",
  }).format(date);
}
