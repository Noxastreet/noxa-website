import Link from "next/link";
import { notFound } from "next/navigation";

import { NoxaLogo } from "@/components/brand/NoxaLogo";
import { FollowPrompt } from "@/components/meets/FollowPrompt";
import { organizerSlug } from "@/components/organizers/public-organizer-data";
import { isEventCurrentlyVisible } from "@/lib/meets/eventVisibility";

import { EventActions } from "./EventActions";
import styles from "./EventDetailPage.module.css";

const SUPABASE_URL = "https://qrouwtqsqrfeeeppyeru.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_vR9wivNa_fIb0QKmqua6Wg_H_7OPvUk";

const CATEGORY_LABELS: Record<string, string> = { car_meet: "CAR MEET", moto_meet: "MOTO MEET", track_day: "TRACK DAY", drag: "DRAG RACING", drift: "DRIFT", rally: "RALLY", show: "AUTO SHOW", cars_and_coffee: "CARS & COFFEE", group_drive: "GROUP DRIVE", festival: "FESTIVAL", other: "EVENT" };

type EventRow = {
  id: string; public_slug: string; title: string; event_type: string; starts_at: string; ends_at: string | null; timezone: string | null; location_text: string | null; city: string | null; region: string | null; country_code: string; organizer_name: string | null; organizer_url: string | null; source_name: string; source_url: string; summary: string | null; organizer_profile_id: string | null; community_id: string | null; featured: boolean | null; partner_badge: string | null;
};
type OrganizerProfile = { slug: string; name: string; verified: boolean; partner: boolean | null; partner_label: string | null; instagram_url: string | null; website_url: string | null };
type CommunityLink = { slug: string; name: string; verified: boolean };

async function publicFetch<T>(path: string): Promise<T | null> {
  try {
    const response = await fetch(`${SUPABASE_URL}${path}`, { headers: { apikey: SUPABASE_PUBLISHABLE_KEY }, next: { revalidate: 60 } });
    if (!response.ok) return null;
    return await response.json() as T;
  } catch { return null; }
}

export async function loadPublicEvent(slug: string): Promise<EventRow | null> {
  const query = new URLSearchParams({ select: "id,public_slug,title,event_type,starts_at,ends_at,timezone,location_text,city,region,country_code,organizer_name,organizer_url,source_name,source_url,summary,organizer_profile_id,community_id,featured,partner_badge", public_slug: `eq.${slug}`, status: "eq.published", limit: "1" });
  const rows = await publicFetch<EventRow[]>(`/rest/v1/radar_events?${query.toString()}`);
  return rows?.[0] ?? null;
}

async function loadOrganizerProfile(id: string | null) {
  if (!id) return null;
  const query = new URLSearchParams({ select: "slug,name,verified,partner,partner_label,instagram_url,website_url", id: `eq.${id}`, status: "eq.active", limit: "1" });
  const rows = await publicFetch<OrganizerProfile[]>(`/rest/v1/organizer_profiles?${query.toString()}`);
  return rows?.[0] ?? null;
}

async function loadCommunity(id: string | null) {
  if (!id) return null;
  const query = new URLSearchParams({ select: "slug,name,verified", id: `eq.${id}`, status: "eq.published", limit: "1" });
  const rows = await publicFetch<CommunityLink[]>(`/rest/v1/communities?${query.toString()}`);
  return rows?.[0] ?? null;
}

function formatDate(value: string, timezone: string | null, locale: "en" | "el") {
  return new Intl.DateTimeFormat(locale === "el" ? "el-GR" : "en-GB", { weekday: "short", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: timezone || "Europe/Athens" }).format(new Date(value));
}
function category(type: string) { return CATEGORY_LABELS[type] ?? "EVENT"; }

export async function EventDetailPage({ slug, locale }: { slug: string; locale: "en" | "el" }) {
  const event = await loadPublicEvent(slug);
  if (!event) notFound();

  const [profile, community] = await Promise.all([loadOrganizerProfile(event.organizer_profile_id), loadCommunity(event.community_id)]);
  const isPast = !isEventCurrentlyVisible(event.starts_at, event.ends_at);
  const place = [event.location_text, event.city, event.region].filter(Boolean).join(" · ") || event.country_code;
  const organizer = profile?.name || event.organizer_name || event.source_name;
  const organizerPublicSlug = profile?.slug || organizerSlug(organizer);
  const organizerUrl = event.organizer_url || profile?.website_url || event.source_url;
  const mapQuery = [event.location_text, event.city, event.region, event.country_code].filter(Boolean).join(", ");
  const base = locale === "el" ? "/el" : "";
  const t = locale === "el" ? {
    past: "ΤΟ EVENT ΟΛΟΚΛΗΡΩΘΗΚΕ", featured: "FEATURED", about: "ΣΧΕΤΙΚΑ", location: "ΤΟΠΟΘΕΣΙΑ", organizer: "ΔΙΟΡΓΑΝΩΤΗΣ", official: "Επίσημη πηγή", community: "COMMUNITY", cityAlert: "ALERT ΠΟΛΗΣ", responsibility: "Οι τελικές λεπτομέρειες παραμένουν ευθύνη του organizer.", fallback: "Δες τις επίσημες πληροφορίες του organizer πριν ξεκινήσεις.",
  } : {
    past: "PAST EVENT", featured: "FEATURED", about: "ABOUT", location: "LOCATION", organizer: "ORGANIZED BY", official: "Official source", community: "COMMUNITY", cityAlert: "CITY ALERT", responsibility: "Final event details remain the organizer's responsibility.", fallback: "Check the organizer's official details before travelling.",
  };

  return <div className={styles.page}>
    <header className={styles.header}><Link className={styles.brand} href={base || "/"} aria-label="NOXA home"><NoxaLogo /></Link><Link className={styles.back} href={`${base}/meets`}>← Meets</Link></header>
    <main>
      <section className={styles.hero}><div className={styles.heroMedia} aria-hidden="true" /><div className={styles.heroShade} aria-hidden="true" /><div className={styles.shell}>
        <div className={styles.heroBadges}><span>{category(event.event_type)}</span>{isPast ? <span className={styles.pastBadge}>{t.past}</span> : null}{event.featured ? <span>{t.featured}</span> : null}{event.partner_badge ? <span>{event.partner_badge}</span> : null}</div>
        <h1>{event.title}</h1><p className={styles.heroMeta}>{formatDate(event.starts_at, event.timezone, locale)}</p><p className={styles.heroPlace}>{place}</p>
      </div></section>

      <section className={styles.content}><div className={styles.shell}><div className={styles.grid}>
        <div className={styles.mainColumn}>
          <EventActions eventId={event.id} eventTitle={event.title} eventType={event.event_type} startsAt={event.starts_at} endsAt={event.ends_at} timezone={event.timezone} locationLabel={place} organizerName={organizer} locale={locale} mapQuery={mapQuery} isPast={isPast} />
          {!isPast && event.city ? <section className={styles.block}><span>{t.cityAlert}</span><FollowPrompt targetType="city" targetKey={`${event.country_code}:${event.city.toLowerCase()}`} targetLabel={event.city} locale={locale} compact /></section> : null}
          <section className={styles.block}><span>{t.about}</span><p>{event.summary?.trim() || t.fallback}</p></section>
          <section className={styles.block}><span>{t.location}</span><strong>{place}</strong></section>
          {community ? <section className={styles.block}><span>{t.community}</span><Link className={styles.entityLink} href={`${base}/communities/${community.slug}`}>{community.name}{community.verified ? " ✓" : ""} →</Link></section> : null}
        </div>

        <aside className={styles.organizerCard}>
          <span>{t.organizer}</span><div className={styles.organizerBadges}>{profile?.verified ? <b>VERIFIED</b> : null}{profile?.partner ? <b>{profile.partner_label || "NOXA PARTNER"}</b> : null}</div>
          <h2><Link href={`${base}/organizers/${organizerPublicSlug}`}>{organizer}</Link></h2>
          <FollowPrompt targetType="organizer" targetKey={organizerPublicSlug} targetLabel={organizer} locale={locale} compact />
          <a href={organizerUrl} rel="noreferrer" target="_blank">{t.official} ↗</a>{profile?.instagram_url ? <a href={profile.instagram_url} rel="noreferrer" target="_blank">Instagram ↗</a> : null}<small>{t.responsibility}</small>
        </aside>
      </div></div></section>
    </main>
  </div>;
}
