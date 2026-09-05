/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

import { NoxaLogo } from "@/components/brand/NoxaLogo";

import styles from "./RadarAdminConsole.module.css";

const SUPABASE_URL = "https://qrouwtqsqrfeeeppyeru.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_vR9wivNa_fIb0QKmqua6Wg_H_7OPvUk";
const SESSION_KEY = "noxa-radar-admin-session-v1";

type AdminSession = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  email: string;
  userId: string;
};

type AuthUser = {
  id: string;
  email?: string;
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
  last_success_at: string | null;
  last_error: string | null;
  created_at: string;
};

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

type CollectorRun = {
  id: string;
  started_at: string;
  finished_at: string | null;
  status: string;
  sources_checked: number;
  candidates_created: number;
  duplicates_skipped: number;
  error_count: number;
  notes: string | null;
};

type Tab = "overview" | "inbox" | "published" | "sources" | "activity";
type AuthPhase = "checking" | "signed_out" | "unauthorized" | "signed_in";

type DashboardData = {
  candidates: RadarCandidate[];
  events: RadarEvent[];
  sources: RadarSource[];
  runs: CollectorRun[];
};

const emptyDashboard: DashboardData = {
  candidates: [],
  events: [],
  sources: [],
  runs: [],
};

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
    if (!value) return null;
    return JSON.parse(value) as AdminSession;
  } catch {
    return null;
  }
}

function storeSession(session: AdminSession | null) {
  if (typeof window === "undefined") return;
  if (!session) {
    window.localStorage.removeItem(SESSION_KEY);
    return;
  }
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
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

function formatDate(value: string | null, withTime = true) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(date);
}

function countryFlag(code: string) {
  if (!/^[A-Z]{2}$/.test(code)) return "🌐";
  return String.fromCodePoint(...code.split("").map((char) => 127397 + char.charCodeAt(0)));
}

function confidenceLabel(value: number | string | null) {
  if (value === null) return "—";
  const normalized = Number(value);
  if (!Number.isFinite(normalized)) return "—";
  return `${Math.round(normalized <= 1 ? normalized * 100 : normalized)}%`;
}

async function getUser(accessToken: string): Promise<AuthUser | null> {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: apiHeaders(accessToken),
    cache: "no-store",
  });

  if (!response.ok) return null;
  return (await response.json()) as AuthUser;
}

async function refreshSession(refreshToken: string): Promise<AdminSession | null> {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
    method: "POST",
    headers: apiHeaders(),
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!response.ok) return null;

  const payload = (await response.json()) as {
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

  if (!response.ok) return false;
  return (await response.json()) === true;
}

async function loadDashboard(accessToken: string): Promise<DashboardData> {
  const headers = apiHeaders(accessToken);
  const [candidateResponse, eventResponse, sourceResponse, runResponse] = await Promise.all([
    fetch(`${SUPABASE_URL}/rest/v1/radar_candidates?select=id,title,country_code,event_type,starts_at,timezone,location_text,city,organizer_name,original_url,ai_confidence,status,created_at&order=created_at.desc&limit=100`, { headers, cache: "no-store" }),
    fetch(`${SUPABASE_URL}/rest/v1/radar_events?select=id,title,country_code,event_type,starts_at,timezone,city,location_text,source_name,source_url,status,published_at&order=starts_at.asc&limit=200`, { headers, cache: "no-store" }),
    fetch(`${SUPABASE_URL}/rest/v1/radar_sources?select=id,name,platform,url,country_code,active,trust_level,last_checked_at,last_success_at,last_error,created_at&order=created_at.desc&limit=200`, { headers, cache: "no-store" }),
    fetch(`${SUPABASE_URL}/rest/v1/radar_collector_runs?select=id,started_at,finished_at,status,sources_checked,candidates_created,duplicates_skipped,error_count,notes&order=started_at.desc&limit=100`, { headers, cache: "no-store" }),
  ]);

  if (![candidateResponse, eventResponse, sourceResponse, runResponse].every((response) => response.ok)) {
    throw new Error("Unable to load Radar administration data.");
  }

  const [candidates, events, sources, runs] = await Promise.all([
    candidateResponse.json() as Promise<RadarCandidate[]>,
    eventResponse.json() as Promise<RadarEvent[]>,
    sourceResponse.json() as Promise<RadarSource[]>,
    runResponse.json() as Promise<CollectorRun[]>,
  ]);

  return { candidates, events, sources, runs };
}

export function RadarAdminConsole() {
  const [phase, setPhase] = useState<AuthPhase>("checking");
  const [session, setSession] = useState<AdminSession | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [dashboard, setDashboard] = useState<DashboardData>(emptyDashboard);
  const [email, setEmail] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sourceName, setSourceName] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [sourcePlatform, setSourcePlatform] = useState("website");
  const [sourceCountry, setSourceCountry] = useState("GR");

  const newCandidates = useMemo(
    () => dashboard.candidates.filter((candidate) => candidate.status === "new"),
    [dashboard.candidates],
  );
  const publishedEvents = useMemo(
    () => dashboard.events.filter((event) => event.status === "published"),
    [dashboard.events],
  );
  const activeSources = useMemo(
    () => dashboard.sources.filter((source) => source.active),
    [dashboard.sources],
  );

  async function hydrateAdmin(nextSession: AdminSession) {
    const admin = await isRadarAdmin(nextSession.accessToken);
    if (!admin) {
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

          await hydrateAdmin({
            ...magic,
            email: user.email,
            userId: user.id,
          });
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
          setError("Unable to restore the admin session.");
          setPhase("signed_out");
        }
      }
    }

    void restore();
    return () => {
      cancelled = true;
    };
  }, []);

  async function requestMagicLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setAuthMessage("");

    try {
      const redirectTo = `${window.location.origin}/radar/admin`;
      const response = await fetch(`${SUPABASE_URL}/auth/v1/otp?redirect_to=${encodeURIComponent(redirectTo)}`, {
        method: "POST",
        headers: apiHeaders(),
        body: JSON.stringify({ email: email.trim(), create_user: true }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { msg?: string; message?: string } | null;
        throw new Error(payload?.msg ?? payload?.message ?? "Unable to send the sign-in link.");
      }

      setAuthMessage("Secure sign-in link sent. Open the email on this device and return here.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to send the sign-in link.");
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
      setError(refreshError instanceof Error ? refreshError.message : "Unable to refresh Radar data.");
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

  async function addSource(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session) return;

    setBusy(true);
    setError("");
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/radar_sources`, {
        method: "POST",
        headers: {
          ...apiHeaders(session.accessToken),
          Prefer: "return=representation",
        },
        body: JSON.stringify({
          name: sourceName.trim(),
          url: sourceUrl.trim(),
          platform: sourcePlatform,
          country_code: sourceCountry.trim().toUpperCase(),
          active: true,
          trust_level: "standard",
        }),
      });

      if (!response.ok) throw new Error("Source could not be added.");

      setSourceName("");
      setSourceUrl("");
      await refreshDashboard();
    } catch (sourceError) {
      setError(sourceError instanceof Error ? sourceError.message : "Source could not be added.");
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

      if (!response.ok) throw new Error("Source status could not be changed.");
      await refreshDashboard();
    } catch (sourceError) {
      setError(sourceError instanceof Error ? sourceError.message : "Source status could not be changed.");
    } finally {
      setBusy(false);
    }
  }

  async function reviewCandidate(candidate: RadarCandidate, status: "approved" | "rejected") {
    if (!session) return;
    if (status === "approved" && !candidate.starts_at) {
      setError("This candidate needs a date before it can be approved.");
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

      if (!response.ok) throw new Error(`Candidate could not be ${status}.`);
      await refreshDashboard();
    } catch (candidateError) {
      setError(candidateError instanceof Error ? candidateError.message : "Candidate could not be reviewed.");
    } finally {
      setBusy(false);
    }
  }

  if (phase === "checking") {
    return (
      <main className={styles.authPage}>
        <div className={styles.authCard}>
          <span className={styles.kicker}>NOXA RADAR</span>
          <h1>Checking admin access…</h1>
          <div className={styles.loadingBar} aria-hidden="true" />
        </div>
      </main>
    );
  }

  if (phase === "signed_out" || phase === "unauthorized") {
    return (
      <main className={styles.authPage}>
        <section className={styles.authCard} aria-labelledby="radar-admin-login-title">
          <Link aria-label="NOXA Meets home" className={styles.authBrand} href="/radar"><NoxaLogo className="block h-auto w-[116px]" /></Link>
          <span className={styles.kicker}>RADAR ADMIN</span>
          <h1 id="radar-admin-login-title">Private console.</h1>
          <p>
            {phase === "unauthorized"
              ? "This Supabase account is authenticated but is not authorized for NOXA Radar administration."
              : "Enter the authorized admin email. A secure sign-in link will be sent to your inbox."}
          </p>

          <form className={styles.authForm} onSubmit={requestMagicLink}>
            <label>
              Admin email
              <input
                autoComplete="email"
                inputMode="email"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@example.com"
                required
                type="email"
                value={email}
              />
            </label>
            <button disabled={busy} type="submit">
              {busy ? "Sending…" : "Send secure sign-in link"}
            </button>
          </form>

          {authMessage ? <p className={styles.successMessage}>{authMessage}</p> : null}
          {error ? <p className={styles.errorMessage}>{error}</p> : null}

          <Link className={styles.backLink} href="/radar">← Back to public Radar</Link>
        </section>
      </main>
    );
  }

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: "overview", label: "Overview" },
    { key: "inbox", label: "Inbox", count: newCandidates.length },
    { key: "published", label: "Published", count: publishedEvents.length },
    { key: "sources", label: "Sources", count: activeSources.length },
    { key: "activity", label: "Activity" },
  ];

  return (
    <div className={styles.consolePage}>
      <header className={styles.consoleHeader}>
        <div>
          <Link aria-label="NOXA Meets home" className={styles.consoleBrand} href="/radar"><NoxaLogo className="block h-auto w-[116px]" /></Link>
          <span>RADAR ADMIN</span>
        </div>
        <div className={styles.headerActions}>
          <button disabled={busy} onClick={() => void refreshDashboard()} type="button">Refresh</button>
          <button onClick={signOut} type="button">Sign out</button>
        </div>
      </header>

      <div className={styles.consoleShell}>
        <aside className={styles.sidebar}>
          <div className={styles.ownerBlock}>
            <span>OWNER</span>
            <strong>{session?.email}</strong>
          </div>
          <nav aria-label="Radar admin sections">
            {tabs.map((tab) => (
              <button
                aria-current={activeTab === tab.key ? "page" : undefined}
                className={activeTab === tab.key ? styles.activeNav : ""}
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                type="button"
              >
                <span>{tab.label}</span>
                {typeof tab.count === "number" ? <b>{tab.count}</b> : null}
              </button>
            ))}
          </nav>
        </aside>

        <main className={styles.content}>
          {error ? <div className={styles.consoleError}>{error}</div> : null}

          {activeTab === "overview" ? (
            <section>
              <div className={styles.sectionHeading}>
                <div>
                  <span className={styles.kicker}>OPERATIONS</span>
                  <h1>Radar overview</h1>
                </div>
                <span className={styles.liveBadge}>● LIVE DATABASE</span>
              </div>

              <div className={styles.metricGrid}>
                <article><span>New discoveries</span><strong>{newCandidates.length}</strong><small>Waiting for review</small></article>
                <article><span>Published</span><strong>{publishedEvents.length}</strong><small>Visible in Radar database</small></article>
                <article><span>Active sources</span><strong>{activeSources.length}</strong><small>{dashboard.sources.length} total configured</small></article>
                <article><span>Collector errors</span><strong>{dashboard.runs[0]?.error_count ?? 0}</strong><small>Latest collector run</small></article>
              </div>

              <div className={styles.splitGrid}>
                <article className={styles.panel}>
                  <div className={styles.panelTitle}><h2>Review queue</h2><button onClick={() => setActiveTab("inbox")} type="button">Open inbox →</button></div>
                  {newCandidates.length ? newCandidates.slice(0, 4).map((candidate) => (
                    <div className={styles.compactRow} key={candidate.id}>
                      <div><strong>{candidate.title}</strong><span>{countryFlag(candidate.country_code)} {candidate.city ?? candidate.country_code}</span></div>
                      <b>{confidenceLabel(candidate.ai_confidence)}</b>
                    </div>
                  )) : <p className={styles.muted}>No candidates waiting for review.</p>}
                </article>

                <article className={styles.panel}>
                  <div className={styles.panelTitle}><h2>Source health</h2><button onClick={() => setActiveTab("sources")} type="button">Manage →</button></div>
                  {dashboard.sources.slice(0, 4).map((source) => (
                    <div className={styles.compactRow} key={source.id}>
                      <div><strong>{source.name}</strong><span>{source.platform} · {source.country_code}</span></div>
                      <b className={source.last_error ? styles.dangerText : styles.okText}>{source.last_error ? "ERROR" : source.active ? "ACTIVE" : "PAUSED"}</b>
                    </div>
                  ))}
                </article>
              </div>
            </section>
          ) : null}

          {activeTab === "inbox" ? (
            <section>
              <div className={styles.sectionHeading}>
                <div><span className={styles.kicker}>AI + COLLECTOR</span><h1>Discovery inbox</h1></div>
                <span className={styles.counter}>{newCandidates.length} new</span>
              </div>

              <div className={styles.cardList}>
                {newCandidates.length ? newCandidates.map((candidate) => (
                  <article className={styles.candidateCard} key={candidate.id}>
                    <div className={styles.candidateTopline}>
                      <span>{countryFlag(candidate.country_code)} {candidate.country_code} · {candidate.event_type}</span>
                      <strong>{confidenceLabel(candidate.ai_confidence)}</strong>
                    </div>
                    <h2>{candidate.title}</h2>
                    <div className={styles.candidateMeta}>
                      <span>{formatDate(candidate.starts_at)}</span>
                      <span>{candidate.location_text ?? candidate.city ?? "Location not extracted"}</span>
                      <span>{candidate.organizer_name ?? "Organizer not extracted"}</span>
                    </div>
                    <div className={styles.candidateActions}>
                      <a href={candidate.original_url} rel="noreferrer" target="_blank">Original source ↗</a>
                      <button disabled={busy} onClick={() => void reviewCandidate(candidate, "rejected")} type="button">Reject</button>
                      <button disabled={busy || !candidate.starts_at} onClick={() => void reviewCandidate(candidate, "approved")} type="button">
                        {candidate.starts_at ? "Approve" : "Needs date"}
                      </button>
                    </div>
                  </article>
                )) : <div className={styles.emptyPanel}><strong>Inbox is clear.</strong><span>The collector has not created any candidates yet.</span></div>}
              </div>
            </section>
          ) : null}

          {activeTab === "published" ? (
            <section>
              <div className={styles.sectionHeading}>
                <div><span className={styles.kicker}>PUBLIC DATA</span><h1>Published events</h1></div>
                <span className={styles.counter}>{publishedEvents.length} live</span>
              </div>
              <div className={styles.tableList}>
                {publishedEvents.map((event) => (
                  <article key={event.id}>
                    <div className={styles.tablePrimary}>
                      <span>{countryFlag(event.country_code)}</span>
                      <div><strong>{event.title}</strong><small>{event.event_type} · {event.city ?? event.location_text ?? event.country_code}</small></div>
                    </div>
                    <time>{formatDate(event.starts_at)}</time>
                    <a href={event.source_url} rel="noreferrer" target="_blank">{event.source_name} ↗</a>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {activeTab === "sources" ? (
            <section>
              <div className={styles.sectionHeading}>
                <div><span className={styles.kicker}>COLLECTOR INPUTS</span><h1>Sources</h1></div>
                <span className={styles.counter}>{activeSources.length} active</span>
              </div>

              <form className={styles.sourceForm} onSubmit={addSource}>
                <div><label>Source name<input onChange={(event) => setSourceName(event.target.value)} placeholder="Serres Circuit" required value={sourceName} /></label></div>
                <div><label>URL<input onChange={(event) => setSourceUrl(event.target.value)} placeholder="https://…" required type="url" value={sourceUrl} /></label></div>
                <div><label>Platform<select onChange={(event) => setSourcePlatform(event.target.value)} value={sourcePlatform}><option value="website">Website</option><option value="instagram">Instagram</option><option value="facebook">Facebook</option><option value="rss">RSS</option><option value="organizer">Organizer</option><option value="manual">Manual</option></select></label></div>
                <div><label>Country<input maxLength={2} onChange={(event) => setSourceCountry(event.target.value.toUpperCase())} required value={sourceCountry} /></label></div>
                <button disabled={busy} type="submit">+ Add source</button>
              </form>

              <div className={styles.tableList}>
                {dashboard.sources.map((source) => (
                  <article key={source.id}>
                    <div className={styles.tablePrimary}>
                      <span>{countryFlag(source.country_code)}</span>
                      <div><strong>{source.name}</strong><small>{source.platform} · {source.trust_level}</small></div>
                    </div>
                    <div className={styles.sourceStatus}>
                      <b className={source.last_error ? styles.dangerText : source.active ? styles.okText : ""}>{source.last_error ? "ERROR" : source.active ? "ACTIVE" : "PAUSED"}</b>
                      <small>Checked {formatDate(source.last_checked_at)}</small>
                    </div>
                    <button disabled={busy} onClick={() => void toggleSource(source)} type="button">{source.active ? "Pause" : "Activate"}</button>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {activeTab === "activity" ? (
            <section>
              <div className={styles.sectionHeading}>
                <div><span className={styles.kicker}>AUTOMATION</span><h1>Bot activity</h1></div>
              </div>
              <div className={styles.activityList}>
                {dashboard.runs.length ? dashboard.runs.map((run) => (
                  <article key={run.id}>
                    <span className={run.error_count > 0 ? styles.activityError : styles.activityDot} />
                    <div>
                      <strong>{run.status.toUpperCase()} · {formatDate(run.started_at)}</strong>
                      <p>{run.sources_checked} sources checked · {run.candidates_created} candidates · {run.duplicates_skipped} duplicates · {run.error_count} errors</p>
                      {run.notes ? <small>{run.notes}</small> : null}
                    </div>
                  </article>
                )) : <div className={styles.emptyPanel}><strong>No collector runs yet.</strong><span>This section will become the live audit trail when the bot starts monitoring sources.</span></div>}
              </div>
            </section>
          ) : null}
        </main>
      </div>
    </div>
  );
}
