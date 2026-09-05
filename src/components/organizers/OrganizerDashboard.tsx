/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

import { NoxaLogo } from "@/components/brand/NoxaLogo";

import styles from "./OrganizerDashboard.module.css";

const SUPABASE_URL = "https://qrouwtqsqrfeeeppyeru.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_vR9wivNa_fIb0QKmqua6Wg_H_7OPvUk";
const SESSION_KEY = "noxa-organizer-session-v1";

const EVENT_TYPES = [
  ["car_meet", "Car meet"],
  ["cars_and_coffee", "Cars & Coffee"],
  ["group_drive", "Group drive"],
  ["moto_meet", "Moto meet"],
  ["show", "Auto show"],
  ["festival", "Festival"],
  ["track_day", "Track day"],
  ["drag", "Drag racing"],
  ["drift", "Drift"],
  ["rally", "Rally"],
  ["other", "Other"],
] as const;

type Locale = "en" | "el";
type Phase = "checking" | "signed_out" | "ready";
type OrganizerSession = { accessToken: string; refreshToken: string; expiresAt: number; email: string; userId: string };
type Membership = { organizer_id: string; role: "owner" | "admin" | "editor"; status: string };
type Organizer = {
  id: string;
  slug: string;
  name: string;
  organizer_type: "community" | "team" | "company" | "page" | "group";
  community_id: string | null;
  city: string | null;
  country_code: string;
  instagram_url: string | null;
  website_url: string | null;
  verified: boolean;
  status: string;
};
type ManagedEvent = {
  id: string;
  organizer_profile_id: string;
  title: string;
  event_type: string;
  starts_at: string;
  ends_at: string | null;
  timezone: string;
  location_text: string | null;
  city: string | null;
  region: string | null;
  summary: string | null;
  status: "published" | "unpublished" | "cancelled";
  source_url: string;
  updated_at: string;
};
type AuthUser = { id: string; email?: string };

type DashboardData = { memberships: Membership[]; organizers: Organizer[]; events: ManagedEvent[] };

const copy = {
  en: {
    signInTitle: "Organizer access.",
    signInBody: "Use the same email NOXA approved for your community, team, company, page or group.",
    email: "Email",
    send: "Send sign-in link",
    sent: "Sign-in link sent. Open the email on this device.",
    back: "Back to NOXA",
    heading: "Organizer Dashboard",
    intro: "Publish and manage events for verified NOXA organizer profiles.",
    noAccessTitle: "No organizer access yet.",
    noAccessBody: "Your email is signed in, but it is not linked to an approved organizer. Ask NOXA to grant access or submit your community for review.",
    apply: "List your community",
    signOut: "Sign out",
    orgs: "My organizations",
    verified: "Verified",
    notVerified: "Pending verification",
    createTitle: "Create event",
    editTitle: "Edit event",
    publishNow: "Publish now",
    saveDraft: "Save unpublished",
    saveChanges: "Save changes",
    cancelEdit: "Cancel edit",
    myEvents: "My events",
    noEvents: "No events yet.",
    edit: "Edit",
    publish: "Publish",
    unpublish: "Unpublish",
    cancel: "Cancel event",
  },
  el: {
    signInTitle: "Πρόσβαση διοργανωτή.",
    signInBody: "Χρησιμοποίησε το ίδιο email που ενέκρινε το NOXA για την κοινότητα, ομάδα, εταιρεία, σελίδα ή group σου.",
    email: "Email",
    send: "Στείλε link σύνδεσης",
    sent: "Το link στάλθηκε. Άνοιξέ το από αυτή τη συσκευή.",
    back: "Πίσω στο NOXA",
    heading: "Organizer Dashboard",
    intro: "Δημοσίευσε και διαχειρίσου events για verified NOXA organizer profiles.",
    noAccessTitle: "Δεν έχεις organizer access ακόμη.",
    noAccessBody: "Έχεις συνδεθεί, αλλά το email σου δεν είναι συνδεδεμένο με εγκεκριμένο organizer. Ζήτησε πρόσβαση από το NOXA ή στείλε την κοινότητά σου για review.",
    apply: "Καταχώρισε την κοινότητά σου",
    signOut: "Αποσύνδεση",
    orgs: "Οι οργανισμοί μου",
    verified: "Verified",
    notVerified: "Αναμονή verification",
    createTitle: "Δημιουργία event",
    editTitle: "Επεξεργασία event",
    publishNow: "Δημοσίευση τώρα",
    saveDraft: "Αποθήκευση unpublished",
    saveChanges: "Αποθήκευση αλλαγών",
    cancelEdit: "Ακύρωση επεξεργασίας",
    myEvents: "Τα events μου",
    noEvents: "Δεν υπάρχουν events ακόμη.",
    edit: "Edit",
    publish: "Publish",
    unpublish: "Unpublish",
    cancel: "Cancel event",
  },
} as const;

function apiHeaders(accessToken?: string) {
  return {
    apikey: SUPABASE_PUBLISHABLE_KEY,
    "Content-Type": "application/json",
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  };
}

function readSession(): OrganizerSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) as OrganizerSession : null;
  } catch {
    return null;
  }
}

function storeSession(session: OrganizerSession | null) {
  if (typeof window === "undefined") return;
  if (session) window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  else window.localStorage.removeItem(SESSION_KEY);
}

function parseMagicLinkSession(): Omit<OrganizerSession, "email" | "userId"> | null {
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
    expiresAt: Date.now() + Math.max(60, expiresIn) * 1000,
  };
}

async function getUser(accessToken: string): Promise<AuthUser | null> {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: apiHeaders(accessToken),
    cache: "no-store",
  });
  return response.ok ? await response.json() as AuthUser : null;
}

async function refreshSession(refreshToken: string): Promise<OrganizerSession | null> {
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
    expiresAt: Date.now() + (payload.expires_in || 3600) * 1000,
    email: payload.user.email,
    userId: payload.user.id,
  };
}

async function claimInvites(accessToken: string) {
  await fetch(`${SUPABASE_URL}/rest/v1/rpc/claim_organizer_invites`, {
    method: "POST",
    headers: apiHeaders(accessToken),
    body: "{}",
    cache: "no-store",
  });
}

async function loadDashboard(session: OrganizerSession): Promise<DashboardData> {
  await claimInvites(session.accessToken);
  const membershipResponse = await fetch(
    `${SUPABASE_URL}/rest/v1/organizer_admins?select=organizer_id,role,status&user_id=eq.${encodeURIComponent(session.userId)}&status=eq.active`,
    { headers: apiHeaders(session.accessToken), cache: "no-store" },
  );
  if (!membershipResponse.ok) throw new Error("Unable to load organizer access.");
  const memberships = await membershipResponse.json() as Membership[];
  if (!memberships.length) return { memberships, organizers: [], events: [] };

  const ids = memberships.map((item) => item.organizer_id);
  const inFilter = `(${ids.join(",")})`;
  const [organizerResponse, eventResponse] = await Promise.all([
    fetch(`${SUPABASE_URL}/rest/v1/organizer_profiles?select=id,slug,name,organizer_type,community_id,city,country_code,instagram_url,website_url,verified,status&id=in.${inFilter}&order=name.asc`, { headers: apiHeaders(session.accessToken), cache: "no-store" }),
    fetch(`${SUPABASE_URL}/rest/v1/radar_events?select=id,organizer_profile_id,title,event_type,starts_at,ends_at,timezone,location_text,city,region,summary,status,source_url,updated_at&organizer_profile_id=in.${inFilter}&publication_source=eq.organizer&order=starts_at.desc&limit=300`, { headers: apiHeaders(session.accessToken), cache: "no-store" }),
  ]);
  if (!organizerResponse.ok || !eventResponse.ok) throw new Error("Unable to load organizer dashboard.");
  return {
    memberships,
    organizers: await organizerResponse.json() as Organizer[],
    events: await eventResponse.json() as ManagedEvent[],
  };
}

function localInputValue(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function sourceForOrganizer(organizer: Organizer) {
  if (organizer.instagram_url) return organizer.instagram_url;
  if (organizer.website_url) return organizer.website_url;
  if (organizer.community_id) return `https://noxastreetapp.com/communities/${organizer.slug}`;
  return "";
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

export function OrganizerDashboard({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const [phase, setPhase] = useState<Phase>("checking");
  const [session, setSession] = useState<OrganizerSession | null>(null);
  const [data, setData] = useState<DashboardData>({ memberships: [], organizers: [], events: [] });
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [editing, setEditing] = useState<ManagedEvent | null>(null);
  const [selectedOrganizerId, setSelectedOrganizerId] = useState("");
  const editorRef = useRef<HTMLDivElement>(null);

  const verifiedOrganizers = useMemo(
    () => data.organizers.filter((organizer) => organizer.verified && organizer.status === "active"),
    [data.organizers],
  );

  async function hydrate(nextSession: OrganizerSession) {
    const nextData = await loadDashboard(nextSession);
    storeSession(nextSession);
    setSession(nextSession);
    setData(nextData);
    setSelectedOrganizerId((current) => current || nextData.organizers[0]?.id || "");
    setPhase("ready");
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
          if (!cancelled) await hydrate({ ...magic, email: user.email, userId: user.id });
          return;
        }

        let stored = readSession();
        if (!stored) {
          if (!cancelled) setPhase("signed_out");
          return;
        }
        if (stored.expiresAt <= Date.now() + 60_000) {
          stored = await refreshSession(stored.refreshToken);
          if (!stored) {
            storeSession(null);
            if (!cancelled) setPhase("signed_out");
            return;
          }
        }
        if (!cancelled) await hydrate(stored);
      } catch (restoreError) {
        storeSession(null);
        if (!cancelled) {
          setError(restoreError instanceof Error ? restoreError.message : "Unable to restore organizer access.");
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
      const route = locale === "el" ? "/el/organizer" : "/organizer";
      const redirectTo = `${window.location.origin}${route}`;
      const response = await fetch(`${SUPABASE_URL}/auth/v1/otp?redirect_to=${encodeURIComponent(redirectTo)}`, {
        method: "POST",
        headers: apiHeaders(),
        body: JSON.stringify({ email: email.trim(), create_user: true }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null) as { msg?: string; message?: string } | null;
        throw new Error(payload?.msg ?? payload?.message ?? "Unable to send sign-in link.");
      }
      setMessage(t.sent);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to send sign-in link.");
    } finally {
      setBusy(false);
    }
  }

  async function refreshData() {
    if (!session) return;
    setData(await loadDashboard(session));
  }

  function beginEdit(event: ManagedEvent) {
    setEditing(event);
    setSelectedOrganizerId(event.organizer_profile_id);
    window.setTimeout(() => editorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  }

  async function saveEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session || busy) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const form = new FormData(event.currentTarget);
      const organizer = data.organizers.find((item) => item.id === selectedOrganizerId);
      if (!organizer) throw new Error("Choose an organizer.");
      if (!organizer.verified || organizer.status !== "active") throw new Error("This organizer is not verified for direct publishing.");
      const sourceUrl = sourceForOrganizer(organizer);
      if (!sourceUrl) throw new Error("This organizer needs an Instagram or website before publishing events.");
      const startsAt = new Date(String(form.get("startsAt") ?? ""));
      const endsRaw = String(form.get("endsAt") ?? "");
      const endsAt = endsRaw ? new Date(endsRaw) : null;
      if (Number.isNaN(startsAt.getTime())) throw new Error("Choose a valid start date and time.");
      if (endsAt && Number.isNaN(endsAt.getTime())) throw new Error("Choose a valid end date and time.");
      if (endsAt && endsAt <= startsAt) throw new Error("End time must be after the start time.");

      const payload = {
        title: String(form.get("title") ?? "").trim(),
        event_type: String(form.get("eventType") ?? "other"),
        starts_at: startsAt.toISOString(),
        ends_at: endsAt?.toISOString() ?? null,
        timezone: String(form.get("timezone") ?? "Europe/Athens").trim() || "Europe/Athens",
        location_text: String(form.get("location") ?? "").trim(),
        city: String(form.get("city") ?? "").trim(),
        region: String(form.get("region") ?? "").trim() || null,
        summary: String(form.get("summary") ?? "").trim() || null,
        status: String(form.get("status") ?? "published"),
        updated_at: new Date().toISOString(),
      };

      if (editing) {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/radar_events?id=eq.${encodeURIComponent(editing.id)}`, {
          method: "PATCH",
          headers: { ...apiHeaders(session.accessToken), Prefer: "return=minimal" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          const result = await response.json().catch(() => ({})) as { message?: string };
          throw new Error(result.message ?? "Could not update event.");
        }
        setMessage("Event updated.");
      } else {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/radar_events`, {
          method: "POST",
          headers: { ...apiHeaders(session.accessToken), Prefer: "return=minimal" },
          body: JSON.stringify({
            ...payload,
            organizer_profile_id: organizer.id,
            publication_source: "organizer",
            country_code: organizer.country_code,
            organizer_name: organizer.name,
            organizer_url: sourceUrl,
            source_name: organizer.name,
            source_url: sourceUrl,
            candidate_id: null,
            source_id: null,
          }),
        });
        if (!response.ok) {
          const result = await response.json().catch(() => ({})) as { message?: string };
          throw new Error(result.message ?? "Could not create event.");
        }
        setMessage(payload.status === "published" ? "Event published." : "Event saved unpublished.");
      }

      setEditing(null);
      await refreshData();
      event.currentTarget.reset();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Could not save event.");
    } finally {
      setBusy(false);
    }
  }

  async function setStatus(eventId: string, status: ManagedEvent["status"]) {
    if (!session || busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/radar_events?id=eq.${encodeURIComponent(eventId)}`, {
        method: "PATCH",
        headers: { ...apiHeaders(session.accessToken), Prefer: "return=minimal" },
        body: JSON.stringify({ status, updated_at: new Date().toISOString() }),
      });
      if (!response.ok) throw new Error("Could not update event status.");
      await refreshData();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Could not update event status.");
    } finally {
      setBusy(false);
    }
  }

  function signOut() {
    storeSession(null);
    setSession(null);
    setData({ memberships: [], organizers: [], events: [] });
    setPhase("signed_out");
  }

  if (phase === "checking") return <main className={styles.state}>Checking organizer access…</main>;

  if (phase === "signed_out") {
    return (
      <main className={styles.signInPage}>
        <Link aria-label="NOXA home" className={styles.brand} href={locale === "el" ? "/el" : "/"}><NoxaLogo className="block h-auto w-[116px]" /></Link>
        <section className={styles.signInCard}>
          <p className={styles.eyebrow}>NOXA ORGANIZER</p>
          <h1>{t.signInTitle}</h1>
          <p>{t.signInBody}</p>
          <form onSubmit={requestMagicLink}>
            <label><span>{t.email}</span><input autoComplete="email" onChange={(event) => setEmail(event.target.value)} required type="email" value={email} /></label>
            <button disabled={busy} type="submit">{busy ? "…" : t.send}</button>
          </form>
          {message ? <p className={styles.success}>{message}</p> : null}
          {error ? <p className={styles.error} role="alert">{error}</p> : null}
          <Link className={styles.backLink} href={locale === "el" ? "/el" : "/"}>← {t.back}</Link>
        </section>
      </main>
    );
  }

  if (!data.organizers.length) {
    return (
      <main className={styles.state}>
        <p className={styles.eyebrow}>NOXA ORGANIZER</p>
        <h1>{t.noAccessTitle}</h1>
        <p>{t.noAccessBody}</p>
        <div className={styles.stateActions}>
          <Link href={locale === "el" ? "/el/communities/apply" : "/communities/apply"}>{t.apply}</Link>
          <button onClick={signOut} type="button">{t.signOut}</button>
        </div>
      </main>
    );
  }

  const activeOrganizer = data.organizers.find((item) => item.id === selectedOrganizerId) ?? data.organizers[0];
  const formEvent = editing;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link aria-label="NOXA home" className={styles.brand} href={locale === "el" ? "/el" : "/"}><NoxaLogo className="block h-auto w-[116px]" /></Link>
        <div className={styles.headerRight}>
          <span>{session?.email}</span>
          <button onClick={signOut} type="button">{t.signOut}</button>
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.heading}>
          <p className={styles.eyebrow}>NOXA ORGANIZER</p>
          <h1>{t.heading}</h1>
          <p>{t.intro}</p>
        </section>

        {message ? <p className={styles.success}>{message}</p> : null}
        {error ? <p className={styles.error} role="alert">{error}</p> : null}

        <section className={styles.organizations}>
          <div className={styles.sectionTitle}><h2>{t.orgs}</h2><span>{data.organizers.length}</span></div>
          <div className={styles.orgGrid}>
            {data.organizers.map((organizer) => {
              const membership = data.memberships.find((item) => item.organizer_id === organizer.id);
              return (
                <button
                  aria-pressed={selectedOrganizerId === organizer.id}
                  className={selectedOrganizerId === organizer.id ? styles.orgCardActive : styles.orgCard}
                  key={organizer.id}
                  onClick={() => { setSelectedOrganizerId(organizer.id); if (editing?.organizer_profile_id !== organizer.id) setEditing(null); }}
                  type="button"
                >
                  <span>{organizer.organizer_type} · {membership?.role}</span>
                  <strong>{organizer.name}</strong>
                  <small>{organizer.verified ? t.verified : t.notVerified}</small>
                </button>
              );
            })}
          </div>
        </section>

        <div className={styles.workspace}>
          <section className={styles.editor} ref={editorRef}>
            <div className={styles.sectionTitle}>
              <h2>{editing ? t.editTitle : t.createTitle}</h2>
              {editing ? <button className={styles.textButton} onClick={() => setEditing(null)} type="button">{t.cancelEdit}</button> : null}
            </div>

            {!activeOrganizer?.verified ? (
              <div className={styles.locked}>
                <strong>{activeOrganizer?.name}</strong>
                <p>Direct publishing is locked until NOXA verifies this organizer profile.</p>
              </div>
            ) : (
              <form className={styles.eventForm} key={editing?.id ?? `new-${activeOrganizer.id}`} onSubmit={saveEvent}>
                <label><span>Organizer</span><input disabled value={activeOrganizer.name} /></label>
                <label><span>Event name</span><input defaultValue={formEvent?.title ?? ""} maxLength={160} name="title" required /></label>
                <div className={styles.twoColumns}>
                  <label><span>Type</span><select defaultValue={formEvent?.event_type ?? "car_meet"} name="eventType">{EVENT_TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                  <label><span>Status</span><select defaultValue={formEvent?.status ?? "published"} name="status"><option value="published">{t.publishNow}</option><option value="unpublished">{t.saveDraft}</option><option value="cancelled">Cancelled</option></select></label>
                </div>
                <div className={styles.twoColumns}>
                  <label><span>Starts</span><input defaultValue={localInputValue(formEvent?.starts_at ?? null)} name="startsAt" required type="datetime-local" /></label>
                  <label><span>Ends <em>optional</em></span><input defaultValue={localInputValue(formEvent?.ends_at ?? null)} name="endsAt" type="datetime-local" /></label>
                </div>
                <div className={styles.twoColumns}>
                  <label><span>City</span><input defaultValue={formEvent?.city ?? activeOrganizer.city ?? ""} maxLength={100} name="city" required /></label>
                  <label><span>Region <em>optional</em></span><input defaultValue={formEvent?.region ?? ""} maxLength={100} name="region" /></label>
                </div>
                <label><span>Location</span><input defaultValue={formEvent?.location_text ?? ""} maxLength={180} name="location" required /></label>
                <label><span>Timezone</span><input defaultValue={formEvent?.timezone ?? (activeOrganizer.country_code === "GR" ? "Europe/Athens" : "UTC")} maxLength={80} name="timezone" required /></label>
                <label><span>Description <em>optional</em></span><textarea defaultValue={formEvent?.summary ?? ""} maxLength={1200} name="summary" rows={5} /></label>
                <button disabled={busy} type="submit">{busy ? "…" : editing ? t.saveChanges : ("Create event")}</button>
              </form>
            )}
          </section>

          <section className={styles.eventsSection}>
            <div className={styles.sectionTitle}><h2>{t.myEvents}</h2><span>{data.events.length}</span></div>
            {data.events.length ? (
              <div className={styles.eventList}>
                {data.events.map((item) => {
                  const organizer = data.organizers.find((org) => org.id === item.organizer_profile_id);
                  return (
                    <article className={styles.eventCard} key={item.id}>
                      <div className={styles.eventTop}>
                        <div><span>{organizer?.name ?? "Organizer"}</span><h3>{item.title}</h3></div>
                        <span className={styles.status}>{item.status}</span>
                      </div>
                      <p>{formatDate(item.starts_at)} · {item.city ?? item.location_text ?? "Location"}</p>
                      <div className={styles.eventActions}>
                        <button onClick={() => beginEdit(item)} type="button">{t.edit}</button>
                        {item.status === "published" ? <button onClick={() => void setStatus(item.id, "unpublished")} type="button">{t.unpublish}</button> : <button onClick={() => void setStatus(item.id, "published")} type="button">{t.publish}</button>}
                        {item.status !== "cancelled" ? <button className={styles.danger} onClick={() => void setStatus(item.id, "cancelled")} type="button">{t.cancel}</button> : null}
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : <div className={styles.empty}>{t.noEvents}</div>}
          </section>
        </div>
      </main>
    </div>
  );
}
