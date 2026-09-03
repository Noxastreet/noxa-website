/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

import styles from "./OrganizerDashboardFlow.module.css";

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
type EventStatus = "published" | "unpublished" | "cancelled";
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
  status: EventStatus;
  source_url: string;
  updated_at: string;
};
type DashboardData = { memberships: Membership[]; organizers: Organizer[]; events: ManagedEvent[] };
type AuthUser = { id: string; email?: string };
type EventDraft = {
  title: string;
  eventType: string;
  startsAt: string;
  endsAt: string;
  city: string;
  region: string;
  location: string;
  summary: string;
};

const copy = {
  en: {
    heading: "Organizer Dashboard",
    signOut: "Sign out",
    orgs: "My organizations",
    verified: "Verified",
    pending: "Pending verification",
    create: "Create event",
    edit: "Edit event",
    myEvents: "My events",
    noEvents: "No events yet.",
    noAccess: "No organizer access yet.",
    apply: "List your community",
    email: "Email",
    signIn: "Organizer access",
    send: "Send sign-in link",
    sent: "Link sent.",
    back: "Back to NOXA",
    event: "Event",
    place: "Place",
    review: "Review",
    eventName: "Event name",
    type: "Type",
    starts: "Starts",
    ends: "Ends",
    city: "City",
    region: "Region",
    location: "Location",
    description: "Description",
    optional: "optional",
    next: "Continue",
    previous: "Back",
    saveDraft: "Save draft",
    publish: "Publish event",
    saveChanges: "Save changes",
    editAction: "Edit",
    unpublish: "Unpublish",
    publishAction: "Publish",
    cancel: "Cancel event",
    locked: "Verification required.",
  },
  el: {
    heading: "Organizer Dashboard",
    signOut: "Αποσύνδεση",
    orgs: "Οι οργανισμοί μου",
    verified: "Verified",
    pending: "Αναμονή verification",
    create: "Δημιουργία event",
    edit: "Επεξεργασία event",
    myEvents: "Τα events μου",
    noEvents: "Δεν υπάρχουν events ακόμη.",
    noAccess: "Δεν έχεις organizer access ακόμη.",
    apply: "Καταχώρισε την κοινότητά σου",
    email: "Email",
    signIn: "Organizer access",
    send: "Στείλε link σύνδεσης",
    sent: "Το link στάλθηκε.",
    back: "Πίσω στο NOXA",
    event: "Event",
    place: "Τοποθεσία",
    review: "Έλεγχος",
    eventName: "Όνομα event",
    type: "Τύπος",
    starts: "Έναρξη",
    ends: "Λήξη",
    city: "Πόλη",
    region: "Περιοχή",
    location: "Τοποθεσία",
    description: "Περιγραφή",
    optional: "προαιρετικό",
    next: "Συνέχεια",
    previous: "Πίσω",
    saveDraft: "Αποθήκευση draft",
    publish: "Δημοσίευση event",
    saveChanges: "Αποθήκευση",
    editAction: "Edit",
    unpublish: "Unpublish",
    publishAction: "Publish",
    cancel: "Cancel event",
    locked: "Απαιτείται verification.",
  },
} as const;

function headers(accessToken?: string) {
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
  return { accessToken, refreshToken, expiresAt: Date.now() + Math.max(60, expiresIn) * 1000 };
}

async function getUser(accessToken: string): Promise<AuthUser | null> {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: headers(accessToken), cache: "no-store" });
  return response.ok ? await response.json() as AuthUser : null;
}

async function refreshSession(refreshToken: string): Promise<OrganizerSession | null> {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  if (!response.ok) return null;
  const payload = await response.json() as { access_token: string; refresh_token: string; expires_in: number; user: AuthUser };
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
    headers: headers(accessToken),
    body: "{}",
    cache: "no-store",
  });
}

async function loadDashboard(session: OrganizerSession): Promise<DashboardData> {
  await claimInvites(session.accessToken);
  const membershipResponse = await fetch(
    `${SUPABASE_URL}/rest/v1/organizer_admins?select=organizer_id,role,status&user_id=eq.${encodeURIComponent(session.userId)}&status=eq.active`,
    { headers: headers(session.accessToken), cache: "no-store" },
  );
  if (!membershipResponse.ok) throw new Error("Unable to load organizer access.");
  const memberships = await membershipResponse.json() as Membership[];
  if (!memberships.length) return { memberships, organizers: [], events: [] };

  const ids = memberships.map((item) => item.organizer_id);
  const inFilter = `(${ids.join(",")})`;
  const [organizerResponse, eventResponse] = await Promise.all([
    fetch(`${SUPABASE_URL}/rest/v1/organizer_profiles?select=id,slug,name,organizer_type,community_id,city,country_code,instagram_url,website_url,verified,status&id=in.${inFilter}&order=name.asc`, { headers: headers(session.accessToken), cache: "no-store" }),
    fetch(`${SUPABASE_URL}/rest/v1/radar_events?select=id,organizer_profile_id,title,event_type,starts_at,ends_at,timezone,location_text,city,region,summary,status,source_url,updated_at&organizer_profile_id=in.${inFilter}&publication_source=eq.organizer&order=starts_at.desc&limit=300`, { headers: headers(session.accessToken), cache: "no-store" }),
  ]);
  if (!organizerResponse.ok || !eventResponse.ok) throw new Error("Unable to load organizer dashboard.");
  return {
    memberships,
    organizers: await organizerResponse.json() as Organizer[],
    events: await eventResponse.json() as ManagedEvent[],
  };
}

function sourceForOrganizer(organizer: Organizer) {
  return organizer.instagram_url || organizer.website_url || (organizer.community_id ? `https://noxastreetapp.com/communities/${organizer.slug}` : "");
}

function localInputValue(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function formatDate(value: string, locale: Locale) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale === "el" ? "el-GR" : "en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function eventTypeLabel(value: string) {
  return EVENT_TYPES.find(([type]) => type === value)?.[1] ?? "Event";
}

function EventWizard({
  locale,
  organizer,
  editing,
  busy,
  onSave,
  onCancelEdit,
}: {
  locale: Locale;
  organizer: Organizer;
  editing: ManagedEvent | null;
  busy: boolean;
  onSave: (draft: EventDraft, status: EventStatus) => Promise<boolean>;
  onCancelEdit: () => void;
}) {
  const t = copy[locale];
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState<EventDraft>({
    title: editing?.title ?? "",
    eventType: editing?.event_type ?? "car_meet",
    startsAt: localInputValue(editing?.starts_at ?? null),
    endsAt: localInputValue(editing?.ends_at ?? null),
    city: editing?.city ?? organizer.city ?? "",
    region: editing?.region ?? "",
    location: editing?.location_text ?? "",
    summary: editing?.summary ?? "",
  });

  function update<K extends keyof EventDraft>(key: K, value: EventDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
    setError("");
  }

  function goNext() {
    if (step === 1 && !draft.title.trim()) {
      setError(locale === "el" ? "Βάλε όνομα event." : "Add an event name.");
      return;
    }
    if (step === 2) {
      if (!draft.startsAt || !draft.city.trim() || !draft.location.trim()) {
        setError(locale === "el" ? "Συμπλήρωσε ημερομηνία, πόλη και τοποθεσία." : "Add date, city and location.");
        return;
      }
      const starts = new Date(draft.startsAt);
      const ends = draft.endsAt ? new Date(draft.endsAt) : null;
      if (Number.isNaN(starts.getTime()) || (ends && Number.isNaN(ends.getTime()))) {
        setError(locale === "el" ? "Έλεγξε την ημερομηνία." : "Check the date and time.");
        return;
      }
      if (ends && ends <= starts) {
        setError(locale === "el" ? "Η λήξη πρέπει να είναι μετά την έναρξη." : "End time must be after start time.");
        return;
      }
    }
    setStep((current) => Math.min(3, current + 1));
    setError("");
  }

  async function submit(status: EventStatus) {
    setError("");
    const ok = await onSave(draft, status);
    if (ok && !editing) {
      setStep(1);
      setDraft({
        title: "",
        eventType: "car_meet",
        startsAt: "",
        endsAt: "",
        city: organizer.city ?? "",
        region: "",
        location: "",
        summary: "",
      });
    }
  }

  return (
    <div className={styles.wizard}>
      <div className={styles.progress} aria-label="Event creation progress">
        {[t.event, t.place, t.review].map((label, index) => {
          const number = index + 1;
          return <span className={step === number ? styles.progressActive : step > number ? styles.progressDone : styles.progressIdle} key={label}>{number}<small>{label}</small></span>;
        })}
      </div>

      {step === 1 ? (
        <div className={styles.stepPanel}>
          <div className={styles.organizerLine}><span>Organizer</span><strong>{organizer.name}</strong><small>✓ {t.verified}</small></div>
          <label><span>{t.eventName}</span><input autoFocus maxLength={160} onChange={(event) => update("title", event.target.value)} value={draft.title} /></label>
          <label><span>{t.type}</span><select onChange={(event) => update("eventType", event.target.value)} value={draft.eventType}>{EVENT_TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        </div>
      ) : null}

      {step === 2 ? (
        <div className={styles.stepPanel}>
          <div className={styles.twoColumns}>
            <label><span>{t.starts}</span><input onChange={(event) => update("startsAt", event.target.value)} type="datetime-local" value={draft.startsAt} /></label>
            <label><span>{t.ends} <em>{t.optional}</em></span><input onChange={(event) => update("endsAt", event.target.value)} type="datetime-local" value={draft.endsAt} /></label>
          </div>
          <div className={styles.twoColumns}>
            <label><span>{t.city}</span><input maxLength={100} onChange={(event) => update("city", event.target.value)} value={draft.city} /></label>
            <label><span>{t.region} <em>{t.optional}</em></span><input maxLength={100} onChange={(event) => update("region", event.target.value)} value={draft.region} /></label>
          </div>
          <label><span>{t.location}</span><input maxLength={180} onChange={(event) => update("location", event.target.value)} value={draft.location} /></label>
        </div>
      ) : null}

      {step === 3 ? (
        <div className={styles.stepPanel}>
          <article className={styles.previewCard}>
            <span>{eventTypeLabel(draft.eventType).toUpperCase()}</span>
            <h3>{draft.title || "Event"}</h3>
            <p>{draft.startsAt ? formatDate(new Date(draft.startsAt).toISOString(), locale) : "—"}</p>
            <p>{[draft.city, draft.location].filter(Boolean).join(" · ") || "—"}</p>
            <small>{organizer.name} ✓</small>
          </article>
          <label><span>{t.description} <em>{t.optional}</em></span><textarea maxLength={1200} onChange={(event) => update("summary", event.target.value)} rows={4} value={draft.summary} /></label>
        </div>
      ) : null}

      {error ? <p className={styles.inlineError} role="alert">{error}</p> : null}

      <div className={styles.wizardActions}>
        {step > 1 ? <button className={styles.secondaryButton} disabled={busy} onClick={() => { setStep((current) => current - 1); setError(""); }} type="button">← {t.previous}</button> : editing ? <button className={styles.secondaryButton} onClick={onCancelEdit} type="button">{t.previous}</button> : <span />}
        {step < 3 ? <button className={styles.primaryButton} onClick={goNext} type="button">{t.next} →</button> : editing ? <button className={styles.primaryButton} disabled={busy} onClick={() => void submit(editing.status)} type="button">{busy ? "…" : t.saveChanges}</button> : (
          <div className={styles.finalActions}>
            <button className={styles.secondaryButton} disabled={busy} onClick={() => void submit("unpublished")} type="button">{t.saveDraft}</button>
            <button className={styles.primaryButton} disabled={busy} onClick={() => void submit("published")} type="button">{busy ? "…" : t.publish}</button>
          </div>
        )}
      </div>
    </div>
  );
}

export function OrganizerDashboardFlow({ locale }: { locale: Locale }) {
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

  const activeOrganizer = useMemo(
    () => data.organizers.find((item) => item.id === selectedOrganizerId) ?? data.organizers[0],
    [data.organizers, selectedOrganizerId],
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
          if (!user?.email || cancelled) return setPhase("signed_out");
          if (!cancelled) await hydrate({ ...magic, email: user.email, userId: user.id });
          return;
        }
        let stored = readSession();
        if (!stored) return setPhase("signed_out");
        if (stored.expiresAt <= Date.now() + 60_000) stored = await refreshSession(stored.refreshToken);
        if (!stored) {
          storeSession(null);
          return setPhase("signed_out");
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
        headers: headers(),
        body: JSON.stringify({ email: email.trim(), create_user: true }),
      });
      if (!response.ok) throw new Error("Unable to send sign-in link.");
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

  async function saveEvent(draft: EventDraft, requestedStatus: EventStatus): Promise<boolean> {
    if (!session || !activeOrganizer || busy) return false;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      if (!activeOrganizer.verified || activeOrganizer.status !== "active") throw new Error(t.locked);
      const sourceUrl = sourceForOrganizer(activeOrganizer);
      if (!sourceUrl) throw new Error("Organizer needs Instagram or website.");

      const starts = new Date(draft.startsAt);
      const ends = draft.endsAt ? new Date(draft.endsAt) : null;
      if (Number.isNaN(starts.getTime())) throw new Error("Invalid start time.");
      if (ends && (Number.isNaN(ends.getTime()) || ends <= starts)) throw new Error("Invalid end time.");

      const payload = {
        title: draft.title.trim(),
        event_type: draft.eventType,
        starts_at: starts.toISOString(),
        ends_at: ends?.toISOString() ?? null,
        timezone: activeOrganizer.country_code === "GR" ? "Europe/Athens" : "UTC",
        location_text: draft.location.trim(),
        city: draft.city.trim(),
        region: draft.region.trim() || null,
        summary: draft.summary.trim() || null,
        status: requestedStatus,
        updated_at: new Date().toISOString(),
      };

      if (editing) {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/radar_events?id=eq.${encodeURIComponent(editing.id)}`, {
          method: "PATCH",
          headers: { ...headers(session.accessToken), Prefer: "return=minimal" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error("Could not update event.");
        setMessage("Event updated.");
        setEditing(null);
      } else {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/radar_events`, {
          method: "POST",
          headers: { ...headers(session.accessToken), Prefer: "return=minimal" },
          body: JSON.stringify({
            ...payload,
            organizer_profile_id: activeOrganizer.id,
            publication_source: "organizer",
            country_code: activeOrganizer.country_code,
            organizer_name: activeOrganizer.name,
            organizer_url: sourceUrl,
            source_name: activeOrganizer.name,
            source_url: sourceUrl,
            candidate_id: null,
            source_id: null,
          }),
        });
        if (!response.ok) throw new Error("Could not create event.");
        setMessage(requestedStatus === "published" ? "Event published." : "Draft saved.");
      }

      await refreshData();
      return true;
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Could not save event.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function setStatus(eventId: string, status: EventStatus) {
    if (!session || busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/radar_events?id=eq.${encodeURIComponent(eventId)}`, {
        method: "PATCH",
        headers: { ...headers(session.accessToken), Prefer: "return=minimal" },
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

  if (phase === "checking") return <main className={styles.state}>Checking access…</main>;

  if (phase === "signed_out") {
    return (
      <main className={styles.signInPage}>
        <Link className={styles.brand} href={locale === "el" ? "/el" : "/"}>NOXA</Link>
        <section className={styles.signInCard}>
          <p className={styles.eyebrow}>NOXA ORGANIZER</p>
          <h1>{t.signIn}</h1>
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
        <h1>{t.noAccess}</h1>
        <Link className={styles.primaryLink} href={locale === "el" ? "/el/communities/apply" : "/communities/apply"}>{t.apply}</Link>
      </main>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link className={styles.brand} href={locale === "el" ? "/el" : "/"}>NOXA</Link>
        <button className={styles.signOut} onClick={signOut} type="button">{t.signOut}</button>
      </header>

      <main className={styles.main}>
        <section className={styles.heading}>
          <p className={styles.eyebrow}>NOXA ORGANIZER</p>
          <h1>{t.heading}</h1>
        </section>

        {message ? <p className={styles.success}>{message}</p> : null}
        {error ? <p className={styles.error} role="alert">{error}</p> : null}

        <section className={styles.organizations}>
          <div className={styles.sectionTitle}><h2>{t.orgs}</h2><span>{data.organizers.length}</span></div>
          <div className={styles.orgGrid}>
            {data.organizers.map((organizer) => {
              const membership = data.memberships.find((item) => item.organizer_id === organizer.id);
              const active = activeOrganizer?.id === organizer.id;
              return (
                <button className={active ? styles.orgCardActive : styles.orgCard} key={organizer.id} onClick={() => { setSelectedOrganizerId(organizer.id); setEditing(null); }} type="button">
                  <span>{organizer.organizer_type} · {membership?.role}</span>
                  <strong>{organizer.name}</strong>
                  <small>{organizer.verified ? t.verified : t.pending}</small>
                </button>
              );
            })}
          </div>
        </section>

        <div className={styles.workspace}>
          <section className={styles.editor}>
            <div className={styles.sectionTitle}><h2>{editing ? t.edit : t.create}</h2>{editing ? <button className={styles.textButton} onClick={() => setEditing(null)} type="button">×</button> : null}</div>
            {!activeOrganizer?.verified ? <div className={styles.locked}>{t.locked}</div> : <EventWizard busy={busy} editing={editing} key={`${activeOrganizer.id}-${editing?.id ?? "new"}`} locale={locale} onCancelEdit={() => setEditing(null)} onSave={saveEvent} organizer={activeOrganizer} />}
          </section>

          <section className={styles.eventsSection}>
            <div className={styles.sectionTitle}><h2>{t.myEvents}</h2><span>{data.events.length}</span></div>
            {data.events.length ? (
              <div className={styles.eventList}>
                {data.events.map((item) => {
                  const organizer = data.organizers.find((org) => org.id === item.organizer_profile_id);
                  return (
                    <article className={styles.eventCard} key={item.id}>
                      <div className={styles.eventTop}><div><span>{organizer?.name ?? "Organizer"}</span><h3>{item.title}</h3></div><span className={styles.status}>{item.status}</span></div>
                      <p>{formatDate(item.starts_at, locale)} · {item.city ?? item.location_text ?? "—"}</p>
                      <div className={styles.eventActions}>
                        <button onClick={() => { setSelectedOrganizerId(item.organizer_profile_id); setEditing(item); }} type="button">{t.editAction}</button>
                        {item.status === "published" ? <button onClick={() => void setStatus(item.id, "unpublished")} type="button">{t.unpublish}</button> : null}
                        {item.status === "unpublished" ? <button onClick={() => void setStatus(item.id, "published")} type="button">{t.publishAction}</button> : null}
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
