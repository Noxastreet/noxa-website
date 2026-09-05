/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

import { NoxaLogo } from "@/components/brand/NoxaLogo";

import { RadarAiAnalyzeButton } from "./RadarAiAnalyzeButton";
import styles from "./RadarAdminSimple.module.css";

const SUPABASE_URL = "https://qrouwtqsqrfeeeppyeru.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_vR9wivNa_fIb0QKmqua6Wg_H_7OPvUk";
const SESSION_KEY = "noxa-radar-admin-session-v1";

const MEET_TYPES = new Set(["car_meet", "cars_and_coffee", "group_drive", "show", "festival"]);
const MOTORSPORT_TYPES = new Set(["track_day", "drag", "drift", "rally"]);

type EventFilter = "all" | "meets" | "motorsport" | "moto";
type Tab = "review" | "live" | "sources";
type AuthPhase = "checking" | "signed_out" | "unauthorized" | "signed_in";

type AdminSession = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  email: string;
  userId: string;
};

type AuthUser = { id: string; email?: string };

type RadarCandidate = {
  id: string;
  title: string;
  country_code: string;
  event_type: string;
  starts_at: string | null;
  timezone: string | null;
  location_text: string | null;
  city: string | null;
  organizer_name: string | null;
  original_url: string;
  ai_confidence: number | string | null;
  ai_reason: string | null;
  status: string;
  created_at: string;
};

type RadarEvent = {
  id: string;
  title: string;
  country_code: string;
  event_type: string;
  starts_at: string;
  timezone: string;
  city: string | null;
  location_text: string | null;
  source_name: string;
  source_url: string;
  status: string;
  published_at: string;
};

type RadarSource = {
  id: string;
  name: string;
  platform: string;
  url: string;
  country_code: string;
  active: boolean;
  trust_level: string;
  last_checked_at: string | null;
  last_error: string | null;
  created_at: string;
};

type DashboardData = {
  candidates: RadarCandidate[];
  events: RadarEvent[];
  sources: RadarSource[];
};

type ReviewGroup = {
  key: string;
  title: string;
  countryCode: string;
  eventType: string;
  city: string | null;
  location: string | null;
  candidates: RadarCandidate[];
};

const emptyDashboard: DashboardData = { candidates: [], events: [], sources: [] };

function apiHeaders(accessToken?: string) {
  return {
    apikey: SUPABASE_PUBLISHABLE_KEY,
    "Content-Type": "application/json",
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  };
}

function readStoredSession(): AdminSession | null {
  if (typeof window === "undefined") return null;
  try {
    const value = window.localStorage.getItem(SESSION_KEY);
    return value ? JSON.parse(value) as AdminSession : null;
  } catch {
    return null;
  }
}

function storeSession(session: AdminSession | null) {
  if (typeof window === "undefined") return;
  if (!session) window.localStorage.removeItem(SESSION_KEY);
  else window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function parseMagicLinkSession(): Omit<AdminSession, "email" | "userId"> | null {
  if (typeof window === "undefined" || !window.location.hash) return null;
  const params = new URLSearchParams(window.location.hash.slice(1));
  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");
  const expiresIn = Number(params.get("expires_in") ?? "3600");
  if (!accessToken || !refreshToken) return null;
  window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
  return {
    accessToken,
    refreshToken,
    expiresAt: Date.now() + Math.max(60, expiresIn) * 1_000,
  };
}

function countryFlag(code: string) {
  if (!/^[A-Z]{2}$/.test(code)) return "🌐";
  return String.fromCodePoint(...code.split("").map((char) => 127397 + char.charCodeAt(0)));
}

function formatDate(value: string | null) {
  if (!value) return "No date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatShortDate(value: string | null) {
  if (!value) return "No date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en", { day: "2-digit", month: "short" }).format(date);
}

function confidenceNumber(value: number | string | null) {
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  return Math.round(number <= 1 ? number * 100 : number);
}

function confidenceLabel(value: number | string | null) {
  const number = confidenceNumber(value);
  return number === null ? "AI —" : `AI ${number}%`;
}

function matchesType(eventType: string, filter: EventFilter) {
  if (filter === "all") return true;
  if (filter === "meets") return MEET_TYPES.has(eventType);
  if (filter === "motorsport") return MOTORSPORT_TYPES.has(eventType);
  return eventType === "moto_meet";
}

function normalizedGroupPart(value: string | null | undefined) {
  return (value ?? "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function groupCandidates(candidates: RadarCandidate[]): ReviewGroup[] {
  const map = new Map<string, ReviewGroup>();

  for (const candidate of candidates) {
    const place = candidate.city ?? candidate.location_text ?? candidate.country_code;
    const key = [
      normalizedGroupPart(candidate.title),
      normalizedGroupPart(place),
      candidate.event_type,
      candidate.country_code,
    ].join("|");

    const existing = map.get(key);
    if (existing) {
      existing.candidates.push(candidate);
      continue;
    }

    map.set(key, {
      key,
      title: candidate.title,
      countryCode: candidate.country_code,
      eventType: candidate.event_type,
      city: candidate.city,
      location: candidate.location_text,
      candidates: [candidate],
    });
  }

  return Array.from(map.values())
    .map((group) => ({
      ...group,
      candidates: group.candidates.slice().sort((a, b) => {
        const aTime = a.starts_at ? new Date(a.starts_at).getTime() : Number.MAX_SAFE_INTEGER;
        const bTime = b.starts_at ? new Date(b.starts_at).getTime() : Number.MAX_SAFE_INTEGER;
        return aTime - bTime;
      }),
    }))
    .sort((a, b) => {
      const aTime = a.candidates[0]?.starts_at ? new Date(a.candidates[0].starts_at!).getTime() : Number.MAX_SAFE_INTEGER;
      const bTime = b.candidates[0]?.starts_at ? new Date(b.candidates[0].starts_at!).getTime() : Number.MAX_SAFE_INTEGER;
      return aTime - bTime;
    });
}

function groupConfidence(group: ReviewGroup) {
  const values = group.candidates
    .map((candidate) => confidenceNumber(candidate.ai_confidence))
    .filter((value): value is number => value !== null);
  if (!values.length) return "AI —";
  return `AI ${Math.min(...values)}%`;
}

function groupDateSummary(group: ReviewGroup) {
  if (group.candidates.length === 1) return formatDate(group.candidates[0].starts_at);
  const dated = group.candidates.filter((candidate) => candidate.starts_at);
  if (!dated.length) return `${group.candidates.length} dates`;
  const first = formatShortDate(dated[0].starts_at);
  const last = formatShortDate(dated[dated.length - 1].starts_at);
  return `${group.candidates.length} dates · ${first}${first === last ? "" : `–${last}`}`;
}

async function getUser(accessToken: string): Promise<AuthUser | null> {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: apiHeaders(accessToken),
    cache: "no-store",
  });
  return response.ok ? await response.json() as AuthUser : null;
}

async function refreshSession(refreshToken: string): Promise<AdminSession | null> {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
    method: "POST",
    headers: apiHeaders(),
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  if (!response.ok) return null;
  const payload = await response.json() as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    user: AuthUser;
  };
  if (!payload.user.email) return null;
  return {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token,
    expiresAt: Date.now() + payload.expires_in * 1_000,
    email: payload.user.email,
    userId: payload.user.id,
  };
}

async function isRadarAdmin(accessToken: string) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/radar_admin_status`, {
    method: "POST",
    headers: apiHeaders(accessToken),
    body: "{}",
    cache: "no-store",
  });
  return response.ok && await response.json() === true;
}

async function loadDashboard(accessToken: string): Promise<DashboardData> {
  const headers = apiHeaders(accessToken);
  const [candidateResponse, eventResponse, sourceResponse] = await Promise.all([
    fetch(`${SUPABASE_URL}/rest/v1/radar_candidates?select=id,title,country_code,event_type,starts_at,timezone,location_text,city,organizer_name,original_url,ai_confidence,ai_reason,status,created_at&status=in.(new,needs_review)&order=starts_at.asc.nullslast&limit=250`, { headers, cache: "no-store" }),
    fetch(`${SUPABASE_URL}/rest/v1/radar_events?select=id,title,country_code,event_type,starts_at,timezone,city,location_text,source_name,source_url,status,published_at&status=eq.published&order=starts_at.asc&limit=500`, { headers, cache: "no-store" }),
    fetch(`${SUPABASE_URL}/rest/v1/radar_sources?select=id,name,platform,url,country_code,active,trust_level,last_checked_at,last_error,created_at&order=active.desc,created_at.desc&limit=250`, { headers, cache: "no-store" }),
  ]);

  if (![candidateResponse, eventResponse, sourceResponse].every((response) => response.ok)) {
    throw new Error("Unable to load Radar data.");
  }

  const [candidates, events, sources] = await Promise.all([
    candidateResponse.json() as Promise<RadarCandidate[]>,
    eventResponse.json() as Promise<RadarEvent[]>,
    sourceResponse.json() as Promise<RadarSource[]>,
  ]);
  return { candidates, events, sources };
}

export function RadarAdminSimpleConsole() {
  const [phase, setPhase] = useState<AuthPhase>("checking");
  const [session, setSession] = useState<AdminSession | null>(null);
  const [dashboard, setDashboard] = useState<DashboardData>(emptyDashboard);
  const [activeTab, setActiveTab] = useState<Tab>("review");
  const [eventFilter, setEventFilter] = useState<EventFilter>("all");
  const [countryFilter, setCountryFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [sourceName, setSourceName] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [sourcePlatform, setSourcePlatform] = useState("website");
  const [sourceCountry, setSourceCountry] = useState("GR");

  const reviewItems = useMemo(
    () => dashboard.candidates.filter((candidate) => candidate.status === "new" || candidate.status === "needs_review"),
    [dashboard.candidates],
  );
  const liveItems = useMemo(
    () => dashboard.events.filter((event) => event.status === "published"),
    [dashboard.events],
  );
  const activeSources = useMemo(
    () => dashboard.sources.filter((source) => source.active),
    [dashboard.sources],
  );

  const countries = useMemo(() => {
    const codes = new Set<string>();
    reviewItems.forEach((item) => codes.add(item.country_code));
    liveItems.forEach((item) => codes.add(item.country_code));
    return Array.from(codes).sort();
  }, [reviewItems, liveItems]);

  const baseItems = activeTab === "live" ? liveItems : reviewItems;
  const cities = useMemo(() => Array.from(new Set(
    baseItems
      .filter((item) => countryFilter === "all" || item.country_code === countryFilter)
      .map((item) => item.city?.trim() ?? "")
      .filter(Boolean),
  )).sort((a, b) => a.localeCompare(b)), [baseItems, countryFilter]);

  const filteredReview = useMemo(() => {
    const query = search.trim().toLowerCase();
    return reviewItems.filter((item) => {
      const searchable = `${item.title} ${item.city ?? ""} ${item.location_text ?? ""} ${item.organizer_name ?? ""}`.toLowerCase();
      return matchesType(item.event_type, eventFilter) &&
        (countryFilter === "all" || item.country_code === countryFilter) &&
        (cityFilter === "all" || item.city === cityFilter) &&
        (!query || searchable.includes(query));
    });
  }, [reviewItems, eventFilter, countryFilter, cityFilter, search]);

  const reviewGroups = useMemo(() => groupCandidates(filteredReview), [filteredReview]);

  const filteredLive = useMemo(() => liveItems.filter((item) =>
    matchesType(item.event_type, eventFilter) &&
    (countryFilter === "all" || item.country_code === countryFilter) &&
    (cityFilter === "all" || item.city === cityFilter)),
  [liveItems, eventFilter, countryFilter, cityFilter]);

  async function hydrateAdmin(nextSession: AdminSession) {
    if (!(await isRadarAdmin(nextSession.accessToken))) {
      storeSession(null);
      setSession(null);
      setPhase("unauthorized");
      return;
    }
    const data = await loadDashboard(nextSession.accessToken);
    storeSession(nextSession);
    setSession(nextSession);
    setDashboard(data);
    setPhase("signed_in");
  }

  useEffect(() => {
    let cancelled = false;
    async function restore() {
      try {
        const magic = parseMagicLinkSession();
        if (magic) {
          const user = await getUser(magic.accessToken);
          if (!user?.email || cancelled) {
            if (!cancelled) setPhase("signed_out");
            return;
          }
          if (!cancelled) await hydrateAdmin({ ...magic, email: user.email, userId: user.id });
          return;
        }

        let stored = readStoredSession();
        if (!stored) {
          if (!cancelled) setPhase("signed_out");
          return;
        }
        if (stored.expiresAt < Date.now() + 30_000) {
          stored = await refreshSession(stored.refreshToken);
          if (!stored) {
            storeSession(null);
            if (!cancelled) setPhase("signed_out");
            return;
          }
        }
        if (!cancelled) await hydrateAdmin(stored);
      } catch {
        storeSession(null);
        if (!cancelled) {
          setError("Unable to restore admin access.");
          setPhase("signed_out");
        }
      }
    }
    void restore();
    return () => { cancelled = true; };
  }, []);

  async function requestMagicLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const redirectTo = `${window.location.origin}/radar/admin`;
      const response = await fetch(`${SUPABASE_URL}/auth/v1/otp?redirect_to=${encodeURIComponent(redirectTo)}`, {
        method: "POST",
        headers: apiHeaders(),
        body: JSON.stringify({ email: email.trim(), create_user: true }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null) as { msg?: string; message?: string } | null;
        throw new Error(payload?.msg ?? payload?.message ?? "Unable to send sign-in link.");
      }
      setMessage("Sign-in link sent. Open the email on this device.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to send sign-in link.");
    } finally {
      setBusy(false);
    }
  }

  async function refreshDashboard() {
    if (!session) return;
    setBusy(true);
    setError("");
    try {
      setDashboard(await loadDashboard(session.accessToken));
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : "Unable to refresh Radar.");
    } finally {
      setBusy(false);
    }
  }

  async function reviewCandidate(candidate: RadarCandidate, status: "approved" | "rejected") {
    if (!session) return;
    if (status === "approved" && !candidate.starts_at) {
      setError("This event needs a date before approval.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/radar_candidates?id=eq.${encodeURIComponent(candidate.id)}`, {
        method: "PATCH",
        headers: apiHeaders(session.accessToken),
        body: JSON.stringify({
          status,
          reviewed_by: session.userId,
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }),
      });
      if (!response.ok) throw new Error("Could not update this event.");
      await refreshDashboard();
    } catch (candidateError) {
      setError(candidateError instanceof Error ? candidateError.message : "Could not update this event.");
    } finally {
      setBusy(false);
    }
  }

  async function addSource(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/radar_sources`, {
        method: "POST",
        headers: { ...apiHeaders(session.accessToken), Prefer: "return=minimal" },
        body: JSON.stringify({
          name: sourceName.trim(),
          url: sourceUrl.trim(),
          platform: sourcePlatform,
          country_code: sourceCountry.trim().toUpperCase(),
          active: true,
          trust_level: "standard",
        }),
      });
      if (!response.ok) throw new Error("Could not add source.");
      setSourceName("");
      setSourceUrl("");
      await refreshDashboard();
    } catch (sourceError) {
      setError(sourceError instanceof Error ? sourceError.message : "Could not add source.");
    } finally {
      setBusy(false);
    }
  }

  async function toggleSource(source: RadarSource) {
    if (!session) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/radar_sources?id=eq.${encodeURIComponent(source.id)}`, {
        method: "PATCH",
        headers: apiHeaders(session.accessToken),
        body: JSON.stringify({ active: !source.active, updated_at: new Date().toISOString() }),
      });
      if (!response.ok) throw new Error("Could not change source status.");
      await refreshDashboard();
    } catch (sourceError) {
      setError(sourceError instanceof Error ? sourceError.message : "Could not change source status.");
    } finally {
      setBusy(false);
    }
  }

  function signOut() {
    storeSession(null);
    setSession(null);
    setDashboard(emptyDashboard);
    setPhase("signed_out");
  }

  function changeTab(tab: Tab) {
    setActiveTab(tab);
    setCityFilter("all");
    setExpandedGroup(null);
  }

  if (phase === "checking") {
    return <main className={styles.authPage}><div className={styles.authCard}><NoxaLogo className={styles.authLogo} /><h1>Opening Admin…</h1></div></main>;
  }

  if (phase === "signed_out" || phase === "unauthorized") {
    return (
      <main className={styles.authPage}>
        <section className={styles.authCard}>
          <Link aria-label="NOXA Meets home" className={styles.brand} href="/radar"><NoxaLogo /></Link>
          <h1>Radar Admin</h1>
          <p>{phase === "unauthorized" ? "This account is not authorized." : "Sign in with the owner email."}</p>
          <form className={styles.authForm} onSubmit={requestMagicLink}>
            <input aria-label="Admin email" autoComplete="email" inputMode="email" onChange={(event) => setEmail(event.target.value)} placeholder="Admin email" required type="email" value={email} />
            <button disabled={busy} type="submit">{busy ? "Sending…" : "Send sign-in link"}</button>
          </form>
          {message ? <p className={styles.authMessage}>{message}</p> : null}
          {error ? <p className={styles.authError}>{error}</p> : null}
          <Link className={styles.back} href="/radar">← Public Radar</Link>
        </section>
      </main>
    );
  }

  const filterControls = activeTab === "sources" ? null : (
    <div className={styles.filters}>
      <div className={styles.chips}>
        {([["all", "All"], ["meets", "Meets"], ["motorsport", "Motorsport"], ["moto", "Moto"]] as const).map(([value, label]) => (
          <button
            aria-pressed={eventFilter === value}
            className={eventFilter === value ? styles.chipActive : styles.chip}
            key={value}
            onClick={() => setEventFilter(value)}
            type="button"
          >{label}</button>
        ))}
      </div>
      {activeTab === "review" ? (
        <label className={styles.searchField}>
          <span>Search</span>
          <input onChange={(event) => setSearch(event.target.value)} placeholder="Event, city, organizer" type="search" value={search} />
        </label>
      ) : null}
      <div className={styles.selects}>
        <label>Country
          <select onChange={(event) => { setCountryFilter(event.target.value); setCityFilter("all"); }} value={countryFilter}>
            <option value="all">All</option>
            {countries.map((code) => <option key={code} value={code}>{countryFlag(code)} {code}</option>)}
          </select>
        </label>
        <label>City
          <select onChange={(event) => setCityFilter(event.target.value)} value={cityFilter}>
            <option value="all">All cities</option>
            {cities.map((city) => <option key={city} value={city}>{city}</option>)}
          </select>
        </label>
      </div>
    </div>
  );

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.brandBlock}><Link aria-label="NOXA Meets home" className={styles.brand} href="/radar"><NoxaLogo /></Link><span>ADMIN</span></div>
        <div className={styles.headerActions}>
          <button disabled={busy} onClick={() => void refreshDashboard()} type="button">Refresh</button>
          <button onClick={signOut} type="button">Exit</button>
        </div>
      </header>

      <nav className={styles.nav} aria-label="Radar admin">
        <button className={activeTab === "review" ? styles.active : ""} onClick={() => changeTab("review")} type="button">Review <b>{reviewItems.length}</b></button>
        <button className={activeTab === "live" ? styles.active : ""} onClick={() => changeTab("live")} type="button">Live <b>{liveItems.length}</b></button>
        <button className={activeTab === "sources" ? styles.active : ""} onClick={() => changeTab("sources")} type="button">Sources <b>{activeSources.length}</b></button>
      </nav>

      <main className={styles.main}>
        {error ? <div className={styles.error}>{error}</div> : null}

        <div className={styles.pageHeading}>
          <h1>{activeTab === "review" ? "Review" : activeTab === "live" ? "Live events" : "Sources"}</h1>
          <span>{activeTab === "review" ? `${reviewGroups.length} groups` : activeTab === "live" ? `${filteredLive.length} shown` : `${activeSources.length} active`}</span>
        </div>
        <div className={styles.quickStats}>
          <span><strong>{reviewItems.length}</strong> review</span>
          <span><strong>{liveItems.length}</strong> live</span>
          <span><strong>{activeSources.length}</strong> sources</span>
        </div>

        {filterControls}

        {activeTab === "review" ? (
          <div className={styles.list}>
            {reviewGroups.length ? reviewGroups.map((group) => {
              const expanded = expandedGroup === group.key;
              const first = group.candidates[0];
              const single = group.candidates.length === 1;
              return (
                <article className={styles.groupCard} key={group.key}>
                  <div className={styles.groupTop}>
                    <span>{countryFlag(group.countryCode)} {group.city ?? group.countryCode} · {group.eventType.replaceAll("_", " ")}</span>
                    <strong>{groupConfidence(group)}</strong>
                  </div>
                  <h2>{group.title}</h2>
                  <div className={styles.groupSummary}>
                    <span>{groupDateSummary(group)}</span>
                    {group.location && group.location !== group.city ? <span>{group.location}</span> : null}
                  </div>

                  {single ? (
                    <div className={styles.compactActions}>
                      <a href={first.original_url} rel="noreferrer" target="_blank">Source ↗</a>
                      <button disabled={busy} onClick={() => void reviewCandidate(first, "rejected")} type="button">Reject</button>
                      <button className={styles.approve} disabled={busy || !first.starts_at} onClick={() => void reviewCandidate(first, "approved")} type="button">{first.starts_at ? "Approve" : "Needs date"}</button>
                    </div>
                  ) : (
                    <button
                      aria-expanded={expanded}
                      className={styles.expandButton}
                      onClick={() => setExpandedGroup(expanded ? null : group.key)}
                      type="button"
                    >
                      {expanded ? "Hide dates" : `View ${group.candidates.length} dates`}
                      <span aria-hidden="true">{expanded ? "↑" : "↓"}</span>
                    </button>
                  )}

                  {!single && expanded ? (
                    <div className={styles.dateList}>
                      {group.candidates.map((candidate) => (
                        <div className={styles.dateRow} key={candidate.id}>
                          <div className={styles.dateInfo}>
                            <strong>{formatDate(candidate.starts_at)}</strong>
                            <span>{confidenceLabel(candidate.ai_confidence)}</span>
                          </div>
                          <div className={styles.dateActions}>
                            <a href={candidate.original_url} rel="noreferrer" target="_blank" aria-label={`Open source for ${formatDate(candidate.starts_at)}`}>↗</a>
                            <button disabled={busy} onClick={() => void reviewCandidate(candidate, "rejected")} type="button">Reject</button>
                            <button className={styles.approve} disabled={busy || !candidate.starts_at} onClick={() => void reviewCandidate(candidate, "approved")} type="button">Approve</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </article>
              );
            }) : <div className={styles.empty}><strong>Nothing here.</strong><span>Try another filter or wait for the collector.</span></div>}
          </div>
        ) : null}

        {activeTab === "live" ? (
          <div className={styles.list}>
            {filteredLive.length ? filteredLive.map((event) => (
              <article className={styles.liveCard} key={event.id}>
                <div><strong>{event.title}</strong><small>{countryFlag(event.country_code)} {event.city ?? event.location_text ?? event.country_code} · {event.event_type.replaceAll("_", " ")}</small></div>
                <div><small>{formatDate(event.starts_at)} · <a href={event.source_url} rel="noreferrer" target="_blank">Source ↗</a></small></div>
              </article>
            )) : <div className={styles.empty}><strong>No live events.</strong><span>Try another filter.</span></div>}
          </div>
        ) : null}

        {activeTab === "sources" ? (
          <>
            <section className={styles.tools}>
              <h2>Bot tools</h2>
              <p>Scan sources for new events or run AI on the next review batch.</p>
              <RadarAiAnalyzeButton />
            </section>

            <details className={styles.addSource}>
              <summary>+ Add source</summary>
              <form className={styles.sourceForm} onSubmit={addSource}>
                <label>Name<input onChange={(event) => setSourceName(event.target.value)} placeholder="Serres Circuit" required value={sourceName} /></label>
                <label>URL<input onChange={(event) => setSourceUrl(event.target.value)} placeholder="https://…" required type="url" value={sourceUrl} /></label>
                <label>Platform<select onChange={(event) => setSourcePlatform(event.target.value)} value={sourcePlatform}><option value="website">Website</option><option value="instagram">Instagram</option><option value="facebook">Facebook</option><option value="rss">RSS</option><option value="organizer">Organizer</option><option value="manual">Manual</option></select></label>
                <label>Country<input maxLength={2} onChange={(event) => setSourceCountry(event.target.value.toUpperCase())} required value={sourceCountry} /></label>
                <button disabled={busy} type="submit">Add source</button>
              </form>
            </details>

            <div className={styles.list}>
              {dashboard.sources.map((source) => (
                <article className={styles.sourceCard} key={source.id}>
                  <div className={styles.sourceRow}>
                    <div><strong>{source.name}</strong><small>{countryFlag(source.country_code)} {source.platform} · checked {formatDate(source.last_checked_at)}</small></div>
                    <span className={source.last_error ? styles.statusError : source.active ? styles.statusActive : styles.statusPaused}>{source.last_error ? "ERROR" : source.active ? "ACTIVE" : "PAUSED"}</span>
                  </div>
                  <button disabled={busy} onClick={() => void toggleSource(source)} type="button">{source.active ? "Pause" : "Activate"}</button>
                </article>
              ))}
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
}
