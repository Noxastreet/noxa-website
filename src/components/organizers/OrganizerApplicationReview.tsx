/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useMemo, useState } from "react";

import styles from "@/components/communities/CommunityAdminReview.module.css";

const SUPABASE_URL = "https://qrouwtqsqrfeeeppyeru.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_vR9wivNa_fIb0QKmqua6Wg_H_7OPvUk";
const SESSION_KEY = "noxa-radar-admin-session-v1";

type Session = { accessToken: string; refreshToken: string; expiresAt: number; email: string; userId: string };
type Application = {
  id: string;
  application_kind: "new" | "claim";
  claimed_organizer_id: string | null;
  organizer_name: string;
  organizer_type: "team" | "company" | "page" | "group";
  city: string;
  region: string | null;
  country_code: string;
  instagram_url: string | null;
  website_url: string | null;
  about: string;
  contact_name: string;
  contact_email: string;
  consent_at: string;
  status: string;
  created_at: string;
};
type Phase = "checking" | "signed_out" | "unauthorized" | "ready";

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
  const payload = await response.json() as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    user?: { id?: string; email?: string };
  };
  return {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token,
    expiresAt: Date.now() + (payload.expires_in || 3600) * 1000,
    email: payload.user?.email ?? session.email,
    userId: payload.user?.id ?? session.userId,
  };
}

async function isAdmin(token: string) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/radar_admin_status`, {
    method: "POST",
    headers: headers(token),
    body: "{}",
    cache: "no-store",
  });
  return response.ok && await response.json() === true;
}

async function load(token: string): Promise<Application[]> {
  const query = new URLSearchParams({
    select: "id,application_kind,claimed_organizer_id,organizer_name,organizer_type,city,region,country_code,instagram_url,website_url,about,contact_name,contact_email,consent_at,status,created_at",
    status: "eq.pending",
    order: "created_at.asc",
    limit: "200",
  });
  const response = await fetch(`${SUPABASE_URL}/rest/v1/organizer_applications?${query}`, {
    headers: headers(token),
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Unable to load organizer applications.");
  return await response.json() as Application[];
}

function slugify(value: string) {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function OrganizerApplicationReview() {
  const [phase, setPhase] = useState<Phase>("checking");
  const [session, setSession] = useState<Session | null>(null);
  const [items, setItems] = useState<Application[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");

  async function hydrate(activeSession: Session) {
    if (!(await isAdmin(activeSession.accessToken))) {
      setPhase("unauthorized");
      return;
    }
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(activeSession));
    setSession(activeSession);
    setItems(await load(activeSession.accessToken));
    setPhase("ready");
  }

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        let activeSession = readSession();
        if (!activeSession) {
          if (!cancelled) setPhase("signed_out");
          return;
        }
        if (activeSession.expiresAt <= Date.now() + 60_000) {
          activeSession = await refreshSession(activeSession);
          if (!activeSession) {
            if (!cancelled) setPhase("signed_out");
            return;
          }
        }
        if (!cancelled) await hydrate(activeSession);
      } catch {
        if (!cancelled) setPhase("signed_out");
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const visible = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return items;
    return items.filter((item) => `${item.application_kind} ${item.organizer_name} ${item.organizer_type} ${item.city} ${item.contact_email}`.toLowerCase().includes(normalized));
  }, [items, query]);

  async function approve(event: FormEvent<HTMLFormElement>, item: Application) {
    event.preventDefault();
    if (!session || busy) return;
    setBusy(item.id);
    setError("");
    setMessage("");
    try {
      const form = new FormData(event.currentTarget);
      const isClaim = item.application_kind === "claim";
      const slug = isClaim ? "" : String(form.get("slug") ?? "").trim();
      if (!isClaim && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error("Use a valid lowercase URL slug.");

      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/approve_organizer_application`, {
        method: "POST",
        headers: headers(session.accessToken),
        body: JSON.stringify({
          p_application_id: item.id,
          p_slug: slug,
          p_mark_verified: !isClaim && form.get("verified") === "on",
        }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({})) as { message?: string };
        throw new Error(payload.message ?? "Could not approve organizer.");
      }

      const payload = await response.json() as { email?: string; claim?: boolean };
      const email = payload.email ?? item.contact_email;
      const redirectTo = `${window.location.origin}/organizer`;
      const mail = await fetch(`${SUPABASE_URL}/auth/v1/otp?redirect_to=${encodeURIComponent(redirectTo)}`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ email, create_user: true }),
      });

      setItems(await load(session.accessToken));
      const action = isClaim ? `${item.organizer_name} claim approved.` : `${item.organizer_name} approved.`;
      setMessage(mail.ok
        ? `${action} Owner access link sent to ${email}.`
        : `${action} Owner invite created. Email delivery failed; the owner can request a sign-in link at /organizer.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not approve organizer.");
    } finally {
      setBusy(null);
    }
  }

  async function reject(item: Application) {
    if (!session || busy || !window.confirm(`Reject ${item.application_kind === "claim" ? "claim for " : ""}${item.organizer_name}?`)) return;
    setBusy(item.id);
    setError("");
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/reject_organizer_application`, {
        method: "POST",
        headers: headers(session.accessToken),
        body: JSON.stringify({ p_application_id: item.id, p_notes: null }),
      });
      if (!response.ok) throw new Error("Could not reject organizer application.");
      setItems(await load(session.accessToken));
      setMessage(`${item.application_kind === "claim" ? "Claim for " : ""}${item.organizer_name} rejected.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not reject organizer application.");
    } finally {
      setBusy(null);
    }
  }

  if (phase === "checking") return <main className={styles.centerState}>Checking admin session…</main>;
  if (phase === "signed_out") return <main className={styles.centerState}><h1>Admin sign-in required.</h1><Link className={styles.primaryLink} href="/radar/admin">Open NOXA Meets Admin</Link></main>;
  if (phase === "unauthorized") return <main className={styles.centerState}><h1>Not authorized.</h1><Link className={styles.primaryLink} href="/">Back to NOXA</Link></main>;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href="/radar/admin/organizers">← Organizer Admin</Link>
        <nav>
          <Link href="/radar/admin/communities">Community applications</Link>
          <Link aria-current="page" href="/radar/admin/organizers/applications">Organizer applications</Link>
        </nav>
      </header>
      <main className={styles.main}>
        <section className={styles.heading}>
          <div>
            <p className={styles.eyebrow}>NOXA ADMIN</p>
            <h1>Organizer applications & claims</h1>
            <p>Review new organizer identities and claims separately from Communities. New approvals create a profile; claim approvals create owner access to the existing verified profile.</p>
          </div>
          <div className={styles.adminMeta}><span>{items.length} pending</span><span>{session?.email}</span></div>
        </section>

        <div className={styles.toolbar}>
          <label><span>Search applications</span><input onChange={(event) => setQuery(event.target.value)} placeholder="Organizer, claim, city or email" type="search" value={query} /></label>
        </div>
        {message ? <p className={styles.success} role="status">{message}</p> : null}
        {error ? <p className={styles.error} role="alert">{error}</p> : null}

        {visible.length ? (
          <div className={styles.list}>
            {visible.map((item) => {
              const isClaim = item.application_kind === "claim";
              return (
                <article className={styles.card} key={item.id}>
                  <div className={styles.cardHeading}>
                    <div>
                      <div className={styles.badges}>
                        <span>{isClaim ? "CLAIM" : "NEW"}</span>
                        <span>{item.organizer_type.toUpperCase()}</span>
                        <span>{item.country_code}</span>
                      </div>
                      <h2>{item.organizer_name}</h2>
                      <p>{[item.city, item.region].filter(Boolean).join(" · ")}</p>
                    </div>
                    <time>{formatDate(item.created_at)}</time>
                  </div>

                  <p className={styles.about}>{item.about}</p>
                  <div className={styles.detailsGrid}>
                    <div>
                      <span>PUBLIC LINKS</span>
                      {item.instagram_url ? <a href={item.instagram_url} target="_blank" rel="noreferrer">Instagram ↗</a> : null}
                      {item.website_url ? <a href={item.website_url} target="_blank" rel="noreferrer">Website ↗</a> : null}
                    </div>
                    <div>
                      <span>CONTACT / OWNER</span>
                      <strong>{item.contact_name}</strong>
                      <a href={`mailto:${item.contact_email}`}>{item.contact_email}</a>
                    </div>
                    <div>
                      <span>{isClaim ? "CLAIM TARGET" : "CONSENT"}</span>
                      <strong>{isClaim ? item.claimed_organizer_id : formatDate(item.consent_at)}</strong>
                      <small>{isClaim ? "existing verified organizer" : "organizer-listing-v1"}</small>
                    </div>
                  </div>

                  <form className={styles.actions} onSubmit={(event) => void approve(event, item)}>
                    {!isClaim ? (
                      <>
                        <label className={styles.slugField}><span>Public URL slug</span><input defaultValue={slugify(item.organizer_name)} name="slug" required /></label>
                        <label className={styles.verifyToggle}><input name="verified" type="checkbox" /><span>Verified organizer</span></label>
                      </>
                    ) : null}
                    <button className={styles.approveButton} disabled={busy === item.id} type="submit">
                      {busy === item.id ? "Working…" : isClaim ? "Approve claim & create access" : "Approve & create access"}
                    </button>
                    <button className={styles.rejectButton} disabled={Boolean(busy)} onClick={() => void reject(item)} type="button">Reject</button>
                  </form>
                </article>
              );
            })}
          </div>
        ) : (
          <section className={styles.empty}><h2>No pending organizer applications.</h2><p>New organizer applications and profile claims will appear here for manual review.</p></section>
        )}
      </main>
    </div>
  );
}
