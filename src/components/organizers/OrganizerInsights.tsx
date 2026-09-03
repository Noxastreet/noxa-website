"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import styles from "./OrganizerInsights.module.css";

const SUPABASE_URL = "https://qrouwtqsqrfeeeppyeru.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_vR9wivNa_fIb0QKmqua6Wg_H_7OPvUk";
const SESSION_KEY = "noxa-organizer-session-v1";

type Session = { accessToken: string; refreshToken: string; expiresAt: number; email: string; userId: string };
type Membership = { organizer_id: string; role: string; status: string };
type Organizer = { id: string; name: string; verified: boolean; status: string };
type EventRow = { id: string; public_slug: string; organizer_profile_id: string; title: string; status: string; starts_at: string };
type MetricRow = {
  event_id: string;
  views: number;
  shares: number;
  map_clicks: number;
  source_noxa: number;
  source_instagram: number;
  source_google: number;
  source_facebook: number;
  source_tiktok: number;
  source_direct: number;
  source_other: number;
};
type EventMetric = MetricRow;

function headers(token?: string) {
  return {
    apikey: SUPABASE_PUBLISHABLE_KEY,
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function readSession(): Session | null {
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) as Session : null;
  } catch {
    return null;
  }
}

async function refreshSession(session: Session): Promise<Session | null> {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ refresh_token: session.refreshToken }),
  });
  if (!response.ok) return null;
  const payload = await response.json() as { access_token: string; refresh_token: string; expires_in: number; user: { id: string; email?: string } };
  if (!payload.user.email) return null;
  const next = {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token,
    expiresAt: Date.now() + (payload.expires_in || 3600) * 1000,
    email: payload.user.email,
    userId: payload.user.id,
  };
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(next));
  return next;
}

function sumMetrics(rows: MetricRow[]): EventMetric {
  return rows.reduce<EventMetric>((total, row) => ({
    event_id: row.event_id,
    views: total.views + row.views,
    shares: total.shares + row.shares,
    map_clicks: total.map_clicks + row.map_clicks,
    source_noxa: total.source_noxa + row.source_noxa,
    source_instagram: total.source_instagram + row.source_instagram,
    source_google: total.source_google + row.source_google,
    source_facebook: total.source_facebook + row.source_facebook,
    source_tiktok: total.source_tiktok + row.source_tiktok,
    source_direct: total.source_direct + row.source_direct,
    source_other: total.source_other + row.source_other,
  }), {
    event_id: rows[0]?.event_id ?? "",
    views: 0,
    shares: 0,
    map_clicks: 0,
    source_noxa: 0,
    source_instagram: 0,
    source_google: 0,
    source_facebook: 0,
    source_tiktok: 0,
    source_direct: 0,
    source_other: 0,
  });
}

function formatDate(value: string, locale: "en" | "el") {
  return new Intl.DateTimeFormat(locale === "el" ? "el-GR" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function OrganizerInsights({ locale }: { locale: "en" | "el" }) {
  const [session, setSession] = useState<Session | null>(null);
  const [organizers, setOrganizers] = useState<Organizer[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [metrics, setMetrics] = useState<MetricRow[]>([]);
  const [selectedOrganizerId, setSelectedOrganizerId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        let current = readSession();
        if (!current) throw new Error("sign_in");
        if (current.expiresAt <= Date.now() + 60_000) current = await refreshSession(current);
        if (!current) throw new Error("sign_in");
        if (cancelled) return;
        setSession(current);

        const membershipResponse = await fetch(`${SUPABASE_URL}/rest/v1/organizer_admins?select=organizer_id,role,status&user_id=eq.${encodeURIComponent(current.userId)}&status=eq.active`, { headers: headers(current.accessToken), cache: "no-store" });
        if (!membershipResponse.ok) throw new Error("load");
        const memberships = await membershipResponse.json() as Membership[];
        const ids = memberships.map((item) => item.organizer_id);
        if (!ids.length) {
          setLoading(false);
          return;
        }
        const inFilter = `(${ids.join(",")})`;
        const [organizerResponse, eventResponse] = await Promise.all([
          fetch(`${SUPABASE_URL}/rest/v1/organizer_profiles?select=id,name,verified,status&id=in.${inFilter}&order=name.asc`, { headers: headers(current.accessToken), cache: "no-store" }),
          fetch(`${SUPABASE_URL}/rest/v1/radar_events?select=id,public_slug,organizer_profile_id,title,status,starts_at&organizer_profile_id=in.${inFilter}&publication_source=eq.organizer&order=starts_at.desc&limit=300`, { headers: headers(current.accessToken), cache: "no-store" }),
        ]);
        if (!organizerResponse.ok || !eventResponse.ok) throw new Error("load");
        const nextOrganizers = await organizerResponse.json() as Organizer[];
        const nextEvents = await eventResponse.json() as EventRow[];
        setOrganizers(nextOrganizers);
        setEvents(nextEvents);
        setSelectedOrganizerId(nextOrganizers[0]?.id ?? "");

        if (nextEvents.length) {
          const eventIds = `(${nextEvents.map((event) => event.id).join(",")})`;
          const metricResponse = await fetch(`${SUPABASE_URL}/rest/v1/event_metrics_daily?select=event_id,views,shares,map_clicks,source_noxa,source_instagram,source_google,source_facebook,source_tiktok,source_direct,source_other&event_id=in.${eventIds}`, { headers: headers(current.accessToken), cache: "no-store" });
          if (!metricResponse.ok) throw new Error("metrics");
          setMetrics(await metricResponse.json() as MetricRow[]);
        }
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, []);

  const visibleEvents = useMemo(() => events.filter((event) => !selectedOrganizerId || event.organizer_profile_id === selectedOrganizerId), [events, selectedOrganizerId]);
  const metricsByEvent = useMemo(() => {
    const map = new Map<string, EventMetric>();
    for (const event of events) map.set(event.id, sumMetrics(metrics.filter((row) => row.event_id === event.id)));
    return map;
  }, [events, metrics]);

  const t = locale === "el" ? {
    title: "Event Insights",
    body: "Δες πώς αποδίδουν τα events σου.",
    back: "Dashboard",
    noEvents: "Δεν υπάρχουν events ακόμη.",
    views: "Views",
    shares: "Shares",
    map: "Map clicks",
    traffic: "Πηγές επισκεψιμότητας",
    viewEvent: "Δες Event",
    manage: "Διαχείριση",
    signIn: "Σύνδεση Organizer",
  } : {
    title: "Event Insights",
    body: "See how your events are performing.",
    back: "Dashboard",
    noEvents: "No events yet.",
    views: "Views",
    shares: "Shares",
    map: "Map clicks",
    traffic: "Traffic sources",
    viewEvent: "View Event",
    manage: "Manage",
    signIn: "Organizer Sign In",
  };

  if (loading) return <main className={styles.state}>Loading…</main>;
  if (!session || error === "sign_in") return <main className={styles.state}><h1>{t.signIn}</h1><Link href={locale === "el" ? "/el/organizer" : "/organizer"}>{t.back} →</Link></main>;
  if (error) return <main className={styles.state}><h1>Unable to load insights.</h1><Link href={locale === "el" ? "/el/organizer" : "/organizer"}>{t.back} →</Link></main>;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link className={styles.brand} href={locale === "el" ? "/el" : "/"}>NOXA</Link>
        <Link href={locale === "el" ? "/el/organizer" : "/organizer"}>← {t.back}</Link>
      </header>
      <main className={styles.main}>
        <section className={styles.heading}>
          <p>NOXA ORGANIZER</p>
          <h1>{t.title}</h1>
          <span>{t.body}</span>
        </section>

        {organizers.length > 1 ? (
          <div className={styles.organizerTabs}>
            {organizers.map((organizer) => <button className={selectedOrganizerId === organizer.id ? styles.tabActive : styles.tab} key={organizer.id} onClick={() => setSelectedOrganizerId(organizer.id)} type="button">{organizer.name}</button>)}
          </div>
        ) : null}

        {visibleEvents.length ? (
          <div className={styles.list}>
            {visibleEvents.map((event) => {
              const metric = metricsByEvent.get(event.id) ?? sumMetrics([]);
              const sources = [
                ["NOXA", metric.source_noxa],
                ["Instagram", metric.source_instagram],
                ["Google", metric.source_google],
                ["Facebook", metric.source_facebook],
                ["TikTok", metric.source_tiktok],
                ["Direct", metric.source_direct],
                ["Other", metric.source_other],
              ].filter(([, value]) => Number(value) > 0) as Array<[string, number]>;
              const totalSources = sources.reduce((sum, [, value]) => sum + value, 0);
              return (
                <article className={styles.card} key={event.id}>
                  <div className={styles.cardTop}>
                    <div><span>{formatDate(event.starts_at, locale)}</span><h2>{event.title}</h2></div>
                    <span className={styles.status}>{event.status}</span>
                  </div>
                  <div className={styles.metrics}>
                    <div><strong>{metric.views}</strong><span>{t.views}</span></div>
                    <div><strong>{metric.shares}</strong><span>{t.shares}</span></div>
                    <div><strong>{metric.map_clicks}</strong><span>{t.map}</span></div>
                  </div>
                  <div className={styles.traffic}>
                    <span>{t.traffic}</span>
                    {sources.length ? sources.map(([name, value]) => (
                      <div className={styles.sourceRow} key={name}><span>{name}</span><div><i style={{ width: `${Math.max(5, Math.round((value / Math.max(1, totalSources)) * 100))}%` }} /></div><strong>{Math.round((value / Math.max(1, totalSources)) * 100)}%</strong></div>
                    )) : <small>—</small>}
                  </div>
                  <div className={styles.actions}>
                    {event.status === "published" ? <Link href={`${locale === "el" ? "/el" : ""}/meets/${event.public_slug}`}>{t.viewEvent} ↗</Link> : null}
                    <Link href={locale === "el" ? "/el/organizer" : "/organizer"}>{t.manage} →</Link>
                  </div>
                </article>
              );
            })}
          </div>
        ) : <div className={styles.empty}>{t.noEvents}</div>}
      </main>
    </div>
  );
}
