/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

import styles from "./CommunityAdminReview.module.css";

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

type CommunityApplication = {
  id: string;
  community_name: string;
  city: string;
  region: string | null;
  country_code: string;
  focus: "car" | "moto" | "mixed";
  scene_tags: string[];
  instagram_url: string | null;
  website_url: string | null;
  about: string;
  contact_name: string;
  contact_email: string;
  consent_at: string;
  status: string;
  created_at: string;
};

type AuthPhase = "checking" | "signed_out" | "unauthorized" | "signed_in";

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
    const raw = window.localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) as AdminSession : null;
  } catch {
    return null;
  }
}

function storeSession(session: AdminSession | null) {
  if (typeof window === "undefined") return;
  if (session) window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  else window.localStorage.removeItem(SESSION_KEY);
}

async function refreshSession(session: AdminSession): Promise<AdminSession | null> {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
    method: "POST",
    headers: apiHeaders(),
    body: JSON.stringify({ refresh_token: session.refreshToken }),
  });
  if (!response.ok) return null;
  const payload = await response.json() as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    user?: { id?: string; email?: string };
  };
  if (!payload.access_token || !payload.refresh_token) return null;
  return {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token,
    expiresAt: Date.now() + Math.max(60, payload.expires_in || 3600) * 1000,
    email: payload.user?.email ?? session.email,
    userId: payload.user?.id ?? session.userId,
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

async function loadApplications(accessToken: string): Promise<CommunityApplication[]> {
  const query = new URLSearchParams({
    select: "id,community_name,city,region,country_code,focus,scene_tags,instagram_url,website_url,about,contact_name,contact_email,consent_at,status,created_at",
    status: "eq.pending",
    order: "created_at.asc",
    limit: "200",
  });
  const response = await fetch(`${SUPABASE_URL}/rest/v1/community_applications?${query.toString()}`, {
    headers: apiHeaders(accessToken),
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Unable to load community applications.");
  return await response.json() as CommunityApplication[];
}

function slugSuggestion(value: string) {
  const slug = value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return slug.length >= 2 ? slug : "";
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function CommunityAdminReview() {
  const [phase, setPhase] = useState<AuthPhase>("checking");
  const [session, setSession] = useState<AdminSession | null>(null);
  const [applications, setApplications] = useState<CommunityApplication[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");

  async function hydrate(nextSession: AdminSession) {
    if (!(await isRadarAdmin(nextSession.accessToken))) {
      setPhase("unauthorized");
      return;
    }
    setApplications(await loadApplications(nextSession.accessToken));
    setSession(nextSession);
    storeSession(nextSession);
    setPhase("signed_in");
  }

  useEffect(() => {
    let cancelled = false;
    async function restore() {
      const stored = readStoredSession();
      if (!stored) {
        if (!cancelled) setPhase("signed_out");
        return;
      }
      try {
        let usable = stored;
        if (stored.expiresAt <= Date.now() + 60_000) {
          const refreshed = await refreshSession(stored);
          if (!refreshed) {
            storeSession(null);
            if (!cancelled) setPhase("signed_out");
            return;
          }
          usable = refreshed;
        }
        if (!cancelled) await hydrate(usable);
      } catch {
        if (!cancelled) setPhase("signed_out");
      }
    }
    void restore();
    return () => { cancelled = true; };
  }, []);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return applications;
    return applications.filter((item) =>
      `${item.community_name} ${item.city} ${item.country_code} ${item.focus} ${item.contact_email}`
        .toLowerCase()
        .includes(needle),
    );
  }, [applications, query]);

  async function refreshList(accessToken: string) {
    setApplications(await loadApplications(accessToken));
  }

  async function approve(event: FormEvent<HTMLFormElement>, application: CommunityApplication) {
    event.preventDefault();
    if (!session || busyId) return;
    setBusyId(application.id);
    setError("");
    setMessage("");
    try {
      const form = new FormData(event.currentTarget);
      const slug = String(form.get("slug") ?? "").trim();
      const verified = form.get("verified") === "on";
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
        throw new Error("Use a lowercase URL slug with letters, numbers and hyphens only.");
      }
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/approve_community_application`, {
        method: "POST",
        headers: apiHeaders(session.accessToken),
        body: JSON.stringify({
          p_application_id: application.id,
          p_slug: slug,
          p_mark_verified: verified,
        }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({})) as { message?: string };
        throw new Error(payload.message ?? "Could not approve this application.");
      }
      await refreshList(session.accessToken);
      setMessage(`${application.community_name} was approved and published.`);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Could not approve this application.");
    } finally {
      setBusyId(null);
    }
  }

  async function reject(application: CommunityApplication) {
    if (!session || busyId) return;
    if (!window.confirm(`Reject ${application.community_name}?`)) return;
    setBusyId(application.id);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/reject_community_application`, {
        method: "POST",
        headers: apiHeaders(session.accessToken),
        body: JSON.stringify({ p_application_id: application.id, p_notes: null }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({})) as { message?: string };
        throw new Error(payload.message ?? "Could not reject this application.");
      }
      await refreshList(session.accessToken);
      setMessage(`${application.community_name} was rejected.`);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Could not reject this application.");
    } finally {
      setBusyId(null);
    }
  }

  if (phase === "checking") {
    return <main className={styles.centerState}>Checking admin session…</main>;
  }

  if (phase === "signed_out") {
    return (
      <main className={styles.centerState}>
        <h1>Admin sign-in required.</h1>
        <p>Sign in through the existing NOXA Meets admin console first.</p>
        <Link className={styles.primaryLink} href="/radar/admin">Open NOXA Meets Admin</Link>
      </main>
    );
  }

  if (phase === "unauthorized") {
    return (
      <main className={styles.centerState}>
        <h1>Not authorized.</h1>
        <p>This page is restricted to NOXA website administrators.</p>
        <Link className={styles.primaryLink} href="/">Back to NOXA</Link>
      </main>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link className={styles.brand} href="/">NOXA</Link>
        <nav>
          <Link href="/radar/admin">Meets Admin</Link>
          <Link aria-current="page" href="/radar/admin/communities">Communities</Link>
        </nav>
      </header>

      <main className={styles.main}>
        <section className={styles.heading}>
          <div>
            <p className={styles.eyebrow}>NOXA ADMIN</p>
            <h1>Community applications</h1>
            <p>Review real communities before publishing a NOXA profile. Approval also creates the organizer identity used for future event permissions.</p>
          </div>
          <div className={styles.adminMeta}>
            <span>{applications.length} pending</span>
            <span>{session?.email}</span>
          </div>
        </section>

        <div className={styles.toolbar}>
          <label>
            <span>Search applications</span>
            <input onChange={(event) => setQuery(event.target.value)} placeholder="Community, city or email" type="search" value={query} />
          </label>
        </div>

        {message ? <p className={styles.success} role="status">{message}</p> : null}
        {error ? <p className={styles.error} role="alert">{error}</p> : null}

        {visible.length ? (
          <div className={styles.list}>
            {visible.map((application) => (
              <article className={styles.card} key={application.id}>
                <div className={styles.cardHeading}>
                  <div>
                    <div className={styles.badges}>
                      <span>{application.focus.toUpperCase()}</span>
                      <span>{application.country_code}</span>
                    </div>
                    <h2>{application.community_name}</h2>
                    <p>{[application.city, application.region].filter(Boolean).join(" · ")}</p>
                  </div>
                  <time>{formatDate(application.created_at)}</time>
                </div>

                <p className={styles.about}>{application.about}</p>

                {application.scene_tags.length ? (
                  <div className={styles.tags}>
                    {application.scene_tags.map((tag) => <span key={tag}>{tag}</span>)}
                  </div>
                ) : null}

                <div className={styles.detailsGrid}>
                  <div>
                    <span>PUBLIC LINKS</span>
                    {application.instagram_url ? <a href={application.instagram_url} rel="noreferrer" target="_blank">Instagram ↗</a> : null}
                    {application.website_url ? <a href={application.website_url} rel="noreferrer" target="_blank">Website ↗</a> : null}
                  </div>
                  <div>
                    <span>CONTACT</span>
                    <strong>{application.contact_name}</strong>
                    <a href={`mailto:${application.contact_email}`}>{application.contact_email}</a>
                  </div>
                  <div>
                    <span>CONSENT</span>
                    <strong>{formatDate(application.consent_at)}</strong>
                    <small>community-listing-v1</small>
                  </div>
                </div>

                <form className={styles.actions} onSubmit={(event) => void approve(event, application)}>
                  <label className={styles.slugField}>
                    <span>Public URL slug</span>
                    <input defaultValue={slugSuggestion(application.community_name)} name="slug" placeholder="community-name" required />
                  </label>
                  <label className={styles.verifyToggle}>
                    <input name="verified" type="checkbox" />
                    <span>Verified organizer</span>
                  </label>
                  <button className={styles.approveButton} disabled={busyId === application.id} type="submit">
                    {busyId === application.id ? "Working…" : "Approve & publish"}
                  </button>
                  <button className={styles.rejectButton} disabled={Boolean(busyId)} onClick={() => void reject(application)} type="button">
                    Reject
                  </button>
                </form>
              </article>
            ))}
          </div>
        ) : (
          <section className={styles.empty}>
            <h2>No pending applications.</h2>
            <p>New community submissions will appear here for manual review.</p>
          </section>
        )}
      </main>
    </div>
  );
}
