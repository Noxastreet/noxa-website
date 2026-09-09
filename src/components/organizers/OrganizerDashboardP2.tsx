/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

import { NoxaLogo } from "@/components/brand/NoxaLogo";

const SUPABASE_URL = "https://qrouwtqsqrfeeeppyeru.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_vR9wivNa_fIb0QKmqua6Wg_H_7OPvUk";
const SESSION_KEY = "noxa-organizer-session-v1";

const EVENT_TYPES = [
  ["car_meet", "Car meet"],
  ["cars_and_coffee", "Cars & Coffee"],
  ["group_drive", "Group drive"],
  ["moto_meet", "Moto meet"],
  ["show", "Car / moto show"],
  ["festival", "Festival"],
  ["track_day", "Track day"],
  ["drag", "Drag racing"],
  ["drift", "Drift"],
  ["rally", "Rally"],
  ["karting", "Karting"],
  ["dexterity", "Dexterity"],
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
  latitude: number | null;
  longitude: number | null;
  location_precision: string | null;
  updated_at: string;
};
type AuthUser = { id: string; email?: string };
type DashboardData = { memberships: Membership[]; organizers: Organizer[]; events: ManagedEvent[] };
type EventDraft = {
  title: string;
  eventType: string;
  startsAt: string;
  endsAt: string;
  city: string;
  region: string;
  location: string;
  summary: string;
  sourceUrl: string;
  latitude: string;
  longitude: string;
};

const copy = {
  en: {
    heading: "Organizer Dashboard",
    intro: "Create, publish and manage verified car + moto events in Greece.",
    signInTitle: "Organizer access.",
    signInBody: "Use the email that NOXA approved for your organizer profile.",
    email: "Email",
    send: "Send sign-in link",
    sent: "Sign-in link sent. Open it on this device.",
    signOut: "Sign out",
    back: "Back to NOXA",
    noAccess: "No organizer access yet.",
    noAccessBody: "Claim an existing Organizer profile or apply for a new one. NOXA must approve access first.",
    apply: "Apply as Organizer",
    browse: "Browse Organizers",
    organizations: "My organizations",
    create: "Create event",
    edit: "Edit event",
    myEvents: "My events",
    noEvents: "No organizer events yet.",
    draft: "Draft",
    published: "Published",
    cancelled: "Cancelled",
    saveDraft: "Save draft",
    publish: "Publish event",
    saveChanges: "Save changes",
    editAction: "Edit",
    publishAction: "Publish",
    unpublish: "Unpublish",
    cancel: "Cancel event",
    cancelEdit: "Cancel edit",
    event: "Event",
    place: "Place",
    proof: "Publish",
    next: "Continue",
    previous: "Back",
    sourceHelp: "Use the official page or social post for this exact event.",
    coordinatesHelp: "Exact latitude + longitude are required for Publish so the event can appear correctly on the NOXA Map. Drafts can be saved without them.",
    qualityHelp: "Published events must have a useful description, official event source and exact map point. NOXA Quality Gate blocks incomplete public events.",
  },
  el: {
    heading: "Organizer Dashboard",
    intro: "Δημιούργησε, δημοσίευσε και διαχειρίσου verified car + moto events στην Ελλάδα.",
    signInTitle: "Organizer access.",
    signInBody: "Χρησιμοποίησε το email που ενέκρινε το NOXA για το organizer profile σου.",
    email: "Email",
    send: "Στείλε link σύνδεσης",
    sent: "Το link στάλθηκε. Άνοιξέ το από αυτή τη συσκευή.",
    signOut: "Αποσύνδεση",
    back: "Πίσω στο NOXA",
    noAccess: "Δεν έχεις organizer access ακόμη.",
    noAccessBody: "Κάνε Claim σε υπάρχον Organizer profile ή αίτηση για νέο. Το NOXA πρέπει πρώτα να εγκρίνει την πρόσβαση.",
    apply: "Αίτηση Organizer",
    browse: "Δες Organizers",
    organizations: "Οι οργανισμοί μου",
    create: "Δημιουργία event",
    edit: "Επεξεργασία event",
    myEvents: "Τα events μου",
    noEvents: "Δεν υπάρχουν organizer events ακόμη.",
    draft: "Draft",
    published: "Published",
    cancelled: "Cancelled",
    saveDraft: "Αποθήκευση draft",
    publish: "Δημοσίευση event",
    saveChanges: "Αποθήκευση",
    editAction: "Edit",
    publishAction: "Publish",
    unpublish: "Unpublish",
    cancel: "Cancel event",
    cancelEdit: "Ακύρωση edit",
    event: "Event",
    place: "Τοποθεσία",
    proof: "Publish",
    next: "Συνέχεια",
    previous: "Πίσω",
    sourceHelp: "Χρησιμοποίησε την επίσημη σελίδα ή social post για το συγκεκριμένο event.",
    coordinatesHelp: "Ακριβές latitude + longitude απαιτούνται για Publish ώστε το event να εμφανίζεται σωστά στο NOXA Map. Το Draft μπορεί να σωθεί χωρίς αυτά.",
    qualityHelp: "Τα published events χρειάζονται κανονική περιγραφή, επίσημη πηγή event και ακριβές map point. Το NOXA Quality Gate μπλοκάρει ελλιπή public events.",
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
  return { accessToken, refreshToken, expiresAt: Date.now() + Math.max(60, expiresIn) * 1000 };
}

async function getUser(accessToken: string): Promise<AuthUser | null> {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: apiHeaders(accessToken), cache: "no-store" });
  return response.ok ? await response.json() as AuthUser : null;
}

async function refreshSession(refreshToken: string): Promise<OrganizerSession | null> {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
    method: "POST",
    headers: apiHeaders(),
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
    fetch(`${SUPABASE_URL}/rest/v1/radar_events?select=id,organizer_profile_id,title,event_type,starts_at,ends_at,timezone,location_text,city,region,summary,status,source_url,latitude,longitude,location_precision,updated_at&organizer_profile_id=in.${inFilter}&publication_source=eq.organizer&order=starts_at.desc&limit=300`, { headers: apiHeaders(session.accessToken), cache: "no-store" }),
  ]);
  if (!organizerResponse.ok || !eventResponse.ok) throw new Error("Unable to load organizer dashboard.");
  return {
    memberships,
    organizers: await organizerResponse.json() as Organizer[],
    events: await eventResponse.json() as ManagedEvent[],
  };
}

function organizerUrl(organizer: Organizer) {
  return organizer.website_url || organizer.instagram_url || (organizer.community_id ? `https://noxastreetapp.com/communities/${organizer.slug}` : "");
}

function localInputValue(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

function formatDate(value: string, locale: Locale) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale === "el" ? "el-GR" : "en-GB", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  }).format(date);
}

function parseCoordinate(value: string, min: number, max: number) {
  if (!value.trim()) return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= min && number <= max ? number : Number.NaN;
}

function normalizeUrl(value: string) {
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : "";
  } catch {
    return "";
  }
}

function qualityError(message: string, locale: Locale) {
  if (!message.includes("RADAR_QUALITY_GATE:")) return message;
  const raw = message.split("RADAR_QUALITY_GATE:")[1] ?? "";
  const labels: Record<string, string> = {
    missing_summary: locale === "el" ? "λείπει περιγραφή" : "description is missing",
    short_summary: locale === "el" ? "η περιγραφή είναι πολύ μικρή" : "description is too short",
    invalid_source_url: locale === "el" ? "η επίσημη πηγή δεν είναι έγκυρο URL" : "official source is not a valid URL",
    map_location_not_exact: locale === "el" ? "λείπει exact map point" : "exact map point is missing",
    map_coordinates_missing: locale === "el" ? "λείπουν latitude / longitude" : "latitude / longitude are missing",
    outside_greece: locale === "el" ? "το event πρέπει να είναι στην Ελλάδα" : "event must be in Greece",
  };
  const issues = raw.split(",").map((item) => labels[item.trim()] ?? item.trim()).filter(Boolean);
  return `${locale === "el" ? "Δεν μπορεί να δημοσιευτεί ακόμη" : "Not ready to publish"}: ${issues.join(", ")}.`;
}

function emptyDraft(organizer: Organizer): EventDraft {
  return {
    title: "",
    eventType: "car_meet",
    startsAt: "",
    endsAt: "",
    city: organizer.city ?? "",
    region: "",
    location: "",
    summary: "",
    sourceUrl: "",
    latitude: "",
    longitude: "",
  };
}

function draftFromEvent(event: ManagedEvent): EventDraft {
  return {
    title: event.title,
    eventType: event.event_type,
    startsAt: localInputValue(event.starts_at),
    endsAt: localInputValue(event.ends_at),
    city: event.city ?? "",
    region: event.region ?? "",
    location: event.location_text ?? "",
    summary: event.summary ?? "",
    sourceUrl: event.source_url ?? "",
    latitude: event.latitude == null ? "" : String(event.latitude),
    longitude: event.longitude == null ? "" : String(event.longitude),
  };
}

function eventStatusLabel(status: EventStatus, locale: Locale) {
  const t = copy[locale];
  if (status === "published") return t.published;
  if (status === "cancelled") return t.cancelled;
  return t.draft;
}

export function OrganizerDashboardP2({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const [phase, setPhase] = useState<Phase>("checking");
  const [session, setSession] = useState<OrganizerSession | null>(null);
  const [data, setData] = useState<DashboardData>({ memberships: [], organizers: [], events: [] });
  const [selectedOrganizerId, setSelectedOrganizerId] = useState("");
  const [editing, setEditing] = useState<ManagedEvent | null>(null);
  const [draft, setDraft] = useState<EventDraft | null>(null);
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const activeOrganizer = useMemo(
    () => data.organizers.find((item) => item.id === selectedOrganizerId) ?? data.organizers[0],
    [data.organizers, selectedOrganizerId],
  );

  async function hydrate(nextSession: OrganizerSession) {
    const nextData = await loadDashboard(nextSession);
    storeSession(nextSession);
    setSession(nextSession);
    setData(nextData);
    const organizer = nextData.organizers[0];
    setSelectedOrganizerId((current) => current || organizer?.id || "");
    setDraft(organizer ? emptyDraft(organizer) : null);
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
    setBusy(true); setError(""); setMessage("");
    try {
      const route = locale === "el" ? "/el/organizer" : "/organizer";
      const response = await fetch(`${SUPABASE_URL}/auth/v1/otp?redirect_to=${encodeURIComponent(`${window.location.origin}${route}`)}`, {
        method: "POST",
        headers: apiHeaders(),
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
    const next = await loadDashboard(session);
    setData(next);
  }

  function chooseOrganizer(id: string) {
    const organizer = data.organizers.find((item) => item.id === id);
    setSelectedOrganizerId(id);
    setEditing(null);
    setStep(1);
    if (organizer) setDraft(emptyDraft(organizer));
  }

  function beginEdit(event: ManagedEvent) {
    setSelectedOrganizerId(event.organizer_profile_id);
    setEditing(event);
    setDraft(draftFromEvent(event));
    setStep(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditing(null);
    setStep(1);
    if (activeOrganizer) setDraft(emptyDraft(activeOrganizer));
  }

  function updateDraft<K extends keyof EventDraft>(key: K, value: EventDraft[K]) {
    setDraft((current) => current ? { ...current, [key]: value } : current);
    setError("");
  }

  function validateStep(nextStep: number) {
    if (!draft) return false;
    if (nextStep > 1 && draft.title.trim().length < 3) {
      setError(locale === "el" ? "Βάλε όνομα event." : "Add an event name."); return false;
    }
    if (nextStep > 2) {
      const starts = new Date(draft.startsAt);
      const ends = draft.endsAt ? new Date(draft.endsAt) : null;
      if (!draft.startsAt || Number.isNaN(starts.getTime()) || !draft.city.trim() || !draft.location.trim()) {
        setError(locale === "el" ? "Συμπλήρωσε ημερομηνία, πόλη και τοποθεσία." : "Add date, city and location."); return false;
      }
      if (ends && (Number.isNaN(ends.getTime()) || ends <= starts)) {
        setError(locale === "el" ? "Η λήξη πρέπει να είναι μετά την έναρξη." : "End time must be after start time."); return false;
      }
    }
    return true;
  }

  function validateForSave(status: EventStatus) {
    if (!draft) return locale === "el" ? "Δεν υπάρχει event draft." : "Event draft is missing.";
    if (!validateStep(3)) return error || (locale === "el" ? "Έλεγξε τα στοιχεία του event." : "Check the event details.");
    const sourceUrl = normalizeUrl(draft.sourceUrl);
    const latitude = parseCoordinate(draft.latitude, -90, 90);
    const longitude = parseCoordinate(draft.longitude, -180, 180);
    const hasAnyCoordinate = draft.latitude.trim() || draft.longitude.trim();
    if (hasAnyCoordinate && (!Number.isFinite(latitude) || !Number.isFinite(longitude))) {
      return locale === "el" ? "Βάλε έγκυρα latitude και longitude." : "Add valid latitude and longitude.";
    }
    if (status === "published") {
      if (draft.summary.trim().length < 32) return locale === "el" ? "Η περιγραφή πρέπει να έχει τουλάχιστον 32 χαρακτήρες." : "Published events need a description of at least 32 characters.";
      if (!sourceUrl) return locale === "el" ? "Βάλε επίσημη πηγή για το συγκεκριμένο event." : "Add the official source for this exact event.";
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return locale === "el" ? "Το Publish χρειάζεται exact latitude + longitude." : "Publish requires exact latitude + longitude.";
      if ((latitude as number) < 34 || (latitude as number) > 42.5 || (longitude as number) < 18 || (longitude as number) > 31) {
        return locale === "el" ? "Το map point φαίνεται εκτός Ελλάδας." : "The map point appears to be outside Greece.";
      }
    }
    return "";
  }

  async function saveEvent(status: EventStatus) {
    if (!session || !activeOrganizer || !draft || busy) return;
    const validation = validateForSave(status);
    if (validation) { setError(validation); return; }
    if (!activeOrganizer.verified || activeOrganizer.status !== "active") {
      setError(locale === "el" ? "Ο organizer πρέπει να είναι verified πριν το Publish." : "Organizer must be verified before publishing."); return;
    }
    const profileUrl = organizerUrl(activeOrganizer);
    if (!profileUrl) { setError("Organizer profile needs an official website or Instagram URL."); return; }

    setBusy(true); setError(""); setMessage("");
    try {
      const startsAt = new Date(draft.startsAt);
      const endsAt = draft.endsAt ? new Date(draft.endsAt) : null;
      const latitude = parseCoordinate(draft.latitude, -90, 90);
      const longitude = parseCoordinate(draft.longitude, -180, 180);
      const hasExactPoint = Number.isFinite(latitude) && Number.isFinite(longitude);
      const payload = {
        title: draft.title.trim(),
        event_type: draft.eventType,
        starts_at: startsAt.toISOString(),
        ends_at: endsAt?.toISOString() ?? null,
        timezone: "Europe/Athens",
        location_text: draft.location.trim(),
        city: draft.city.trim(),
        region: draft.region.trim() || null,
        summary: draft.summary.trim() || null,
        source_url: normalizeUrl(draft.sourceUrl) || profileUrl,
        latitude: hasExactPoint ? latitude : null,
        longitude: hasExactPoint ? longitude : null,
        location_precision: hasExactPoint ? "exact" : "unknown",
        status,
        updated_at: new Date().toISOString(),
      };

      const response = editing
        ? await fetch(`${SUPABASE_URL}/rest/v1/radar_events?id=eq.${encodeURIComponent(editing.id)}&organizer_profile_id=eq.${encodeURIComponent(activeOrganizer.id)}`, {
            method: "PATCH", headers: { ...apiHeaders(session.accessToken), Prefer: "return=minimal" }, body: JSON.stringify(payload),
          })
        : await fetch(`${SUPABASE_URL}/rest/v1/radar_events`, {
            method: "POST", headers: { ...apiHeaders(session.accessToken), Prefer: "return=minimal" },
            body: JSON.stringify({
              ...payload,
              organizer_profile_id: activeOrganizer.id,
              publication_source: "organizer",
              country_code: "GR",
              organizer_name: activeOrganizer.name,
              organizer_url: profileUrl,
              source_name: activeOrganizer.name,
              candidate_id: null,
              source_id: null,
            }),
          });

      if (!response.ok) {
        const result = await response.json().catch(() => ({})) as { message?: string };
        throw new Error(qualityError(result.message ?? "Could not save event.", locale));
      }
      setMessage(status === "published"
        ? (locale === "el" ? "Το event δημοσιεύτηκε και είναι έτοιμο για Meets + Map." : "Event published and ready for Meets + Map.")
        : (locale === "el" ? "Το draft αποθηκεύτηκε." : "Draft saved."));
      setEditing(null); setStep(1);
      await refreshData();
      setDraft(emptyDraft(activeOrganizer));
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Could not save event.");
    } finally {
      setBusy(false);
    }
  }

  async function setStatus(event: ManagedEvent, status: EventStatus) {
    if (!session || busy) return;
    setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/radar_events?id=eq.${encodeURIComponent(event.id)}&organizer_profile_id=eq.${encodeURIComponent(event.organizer_profile_id)}`, {
        method: "PATCH",
        headers: { ...apiHeaders(session.accessToken), Prefer: "return=minimal" },
        body: JSON.stringify({ status, updated_at: new Date().toISOString() }),
      });
      if (!response.ok) {
        const result = await response.json().catch(() => ({})) as { message?: string };
        throw new Error(qualityError(result.message ?? "Could not update event status.", locale));
      }
      setMessage(locale === "el" ? "Το status ενημερώθηκε." : "Event status updated.");
      await refreshData();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Could not update event status.");
    } finally {
      setBusy(false);
    }
  }

  function signOut() {
    storeSession(null); setSession(null); setData({ memberships: [], organizers: [], events: [] }); setPhase("signed_out");
  }

  if (phase === "checking") return <main className="min-h-screen bg-[#050505] p-8 text-white">Checking organizer access…</main>;

  if (phase === "signed_out") {
    return <main className="min-h-screen bg-[#050505] px-5 py-8 text-white">
      <Link aria-label="NOXA home" href={locale === "el" ? "/el" : "/"}><NoxaLogo className="h-auto w-[116px]" /></Link>
      <section className="mx-auto mt-20 max-w-lg rounded-3xl border border-white/10 bg-white/[0.035] p-6 sm:p-8">
        <p className="text-xs font-semibold tracking-[0.2em] text-white/45">NOXA ORGANIZER</p>
        <h1 className="mt-3 text-3xl font-semibold">{t.signInTitle}</h1>
        <p className="mt-3 text-sm leading-6 text-white/60">{t.signInBody}</p>
        <form className="mt-7 space-y-4" onSubmit={requestMagicLink}>
          <label className="block text-sm text-white/70"><span>{t.email}</span><input className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-black/40 px-4 text-white outline-none" autoComplete="email" onChange={(event) => setEmail(event.target.value)} required type="email" value={email} /></label>
          <button className="h-12 w-full rounded-xl bg-white px-4 font-semibold text-black disabled:opacity-50" disabled={busy} type="submit">{busy ? "…" : t.send}</button>
        </form>
        {message ? <p className="mt-4 text-sm text-emerald-300">{message}</p> : null}
        {error ? <p className="mt-4 text-sm text-red-300" role="alert">{error}</p> : null}
        <Link className="mt-6 inline-block text-sm text-white/60" href={locale === "el" ? "/el" : "/"}>← {t.back}</Link>
      </section>
    </main>;
  }

  if (!data.organizers.length) {
    return <main className="min-h-screen bg-[#050505] px-5 py-20 text-white">
      <div className="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-white/[0.035] p-8 text-center">
        <p className="text-xs tracking-[0.2em] text-white/45">NOXA ORGANIZER</p><h1 className="mt-3 text-3xl font-semibold">{t.noAccess}</h1><p className="mt-3 text-white/60">{t.noAccessBody}</p>
        <div className="mt-7 flex flex-wrap justify-center gap-3"><Link className="rounded-xl bg-white px-5 py-3 font-semibold text-black" href={locale === "el" ? "/el/organizers/apply" : "/organizers/apply"}>{t.apply}</Link><Link className="rounded-xl border border-white/15 px-5 py-3" href={locale === "el" ? "/el/organizers" : "/organizers"}>{t.browse}</Link><button className="rounded-xl border border-white/15 px-5 py-3" onClick={signOut} type="button">{t.signOut}</button></div>
      </div>
    </main>;
  }

  if (!activeOrganizer || !draft) return null;
  const membership = data.memberships.find((item) => item.organizer_id === activeOrganizer.id);

  return <div className="min-h-screen bg-[#050505] text-white">
    <header className="sticky top-0 z-20 border-b border-white/10 bg-[#050505]/95 px-4 py-4 backdrop-blur sm:px-8">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4"><Link aria-label="NOXA home" href={locale === "el" ? "/el" : "/"}><NoxaLogo className="h-auto w-[108px]" /></Link><div className="flex items-center gap-3 text-xs text-white/55"><span className="hidden sm:inline">{session?.email}</span><button className="rounded-lg border border-white/10 px-3 py-2" onClick={signOut} type="button">{t.signOut}</button></div></div>
    </header>

    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-8">
      <section><p className="text-xs font-semibold tracking-[0.2em] text-white/40">NOXA ORGANIZER</p><h1 className="mt-2 text-3xl font-semibold sm:text-4xl">{t.heading}</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-white/55">{t.intro}</p></section>
      {message ? <p className="mt-6 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">{message}</p> : null}
      {error ? <p className="mt-6 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200" role="alert">{error}</p> : null}

      <section className="mt-8"><div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-semibold">{t.organizations}</h2><span className="text-xs text-white/40">{data.organizers.length}</span></div><div className="flex gap-3 overflow-x-auto pb-2">{data.organizers.map((organizer) => { const m = data.memberships.find((item) => item.organizer_id === organizer.id); const active = organizer.id === activeOrganizer.id; return <button className={`min-w-[210px] rounded-2xl border p-4 text-left ${active ? "border-white/35 bg-white/10" : "border-white/10 bg-white/[0.03]"}`} key={organizer.id} onClick={() => chooseOrganizer(organizer.id)} type="button"><span className="text-[11px] uppercase tracking-[0.15em] text-white/40">{organizer.organizer_type} · {m?.role}</span><strong className="mt-2 block">{organizer.name}</strong><small className={organizer.verified ? "text-emerald-300" : "text-amber-300"}>{organizer.verified ? "✓ Verified" : "Pending verification"}</small></button>; })}</div></section>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,.95fr)]">
        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-7">
          <div className="flex items-center justify-between gap-4"><div><p className="text-xs tracking-[0.16em] text-white/40">{activeOrganizer.name} · {membership?.role}</p><h2 className="mt-1 text-2xl font-semibold">{editing ? t.edit : t.create}</h2></div>{editing ? <button className="text-sm text-white/55" onClick={cancelEdit} type="button">{t.cancelEdit}</button> : null}</div>
          {!activeOrganizer.verified ? <div className="mt-6 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-100">Verification required before public publishing.</div> : null}

          <div className="mt-6 grid grid-cols-3 gap-2 text-center text-xs">{[t.event, t.place, t.proof].map((label, index) => { const number = index + 1; return <button className={`rounded-xl border px-2 py-3 ${step === number ? "border-white/35 bg-white/10" : "border-white/10 text-white/45"}`} key={label} onClick={() => { if (number <= step || validateStep(number)) setStep(number); }} type="button"><strong className="block">{number}</strong><span>{label}</span></button>; })}</div>

          {step === 1 ? <div className="mt-6 space-y-4"><label className="block text-sm text-white/70"><span>Event name</span><input className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-black/35 px-4 outline-none" maxLength={160} onChange={(event) => updateDraft("title", event.target.value)} value={draft.title} /></label><label className="block text-sm text-white/70"><span>Type</span><select className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-[#111] px-4 outline-none" onChange={(event) => updateDraft("eventType", event.target.value)} value={draft.eventType}>{EVENT_TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></div> : null}

          {step === 2 ? <div className="mt-6 space-y-4"><div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm text-white/70"><span>Starts</span><input className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-black/35 px-4 outline-none" onChange={(event) => updateDraft("startsAt", event.target.value)} type="datetime-local" value={draft.startsAt} /></label><label className="block text-sm text-white/70"><span>Ends <em className="text-white/35">optional</em></span><input className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-black/35 px-4 outline-none" onChange={(event) => updateDraft("endsAt", event.target.value)} type="datetime-local" value={draft.endsAt} /></label></div><div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm text-white/70"><span>City</span><input className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-black/35 px-4 outline-none" maxLength={100} onChange={(event) => updateDraft("city", event.target.value)} value={draft.city} /></label><label className="block text-sm text-white/70"><span>Region <em className="text-white/35">optional</em></span><input className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-black/35 px-4 outline-none" maxLength={100} onChange={(event) => updateDraft("region", event.target.value)} value={draft.region} /></label></div><label className="block text-sm text-white/70"><span>Exact location / venue</span><input className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-black/35 px-4 outline-none" maxLength={180} onChange={(event) => updateDraft("location", event.target.value)} value={draft.location} /></label></div> : null}

          {step === 3 ? <div className="mt-6 space-y-4"><div className="rounded-2xl border border-white/10 bg-black/25 p-4"><p className="text-xs tracking-[0.16em] text-white/40">PREVIEW</p><h3 className="mt-2 text-xl font-semibold">{draft.title || "Event"}</h3><p className="mt-2 text-sm text-white/55">{draft.startsAt ? formatDate(new Date(draft.startsAt).toISOString(), locale) : "—"}</p><p className="text-sm text-white/55">{[draft.city, draft.location].filter(Boolean).join(" · ") || "—"}</p><small className="mt-2 block text-emerald-300">{activeOrganizer.name} ✓</small></div><label className="block text-sm text-white/70"><span>Description</span><textarea className="mt-2 min-h-32 w-full rounded-xl border border-white/10 bg-black/35 p-4 outline-none" maxLength={1200} onChange={(event) => updateDraft("summary", event.target.value)} placeholder="What is the event, where is it, what should visitors know?" value={draft.summary} /></label><label className="block text-sm text-white/70"><span>Official event source</span><input className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-black/35 px-4 outline-none" inputMode="url" onChange={(event) => updateDraft("sourceUrl", event.target.value)} placeholder="https://instagram.com/..." type="url" value={draft.sourceUrl} /><small className="mt-2 block text-white/40">{t.sourceHelp}</small></label><div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm text-white/70"><span>Latitude</span><input className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-black/35 px-4 outline-none" inputMode="decimal" onChange={(event) => updateDraft("latitude", event.target.value)} placeholder="40.6401" value={draft.latitude} /></label><label className="block text-sm text-white/70"><span>Longitude</span><input className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-black/35 px-4 outline-none" inputMode="decimal" onChange={(event) => updateDraft("longitude", event.target.value)} placeholder="22.9444" value={draft.longitude} /></label></div><p className="rounded-xl border border-white/10 bg-white/[0.035] p-3 text-xs leading-5 text-white/50">{t.coordinatesHelp}</p><p className="text-xs leading-5 text-white/40">{t.qualityHelp}</p></div> : null}

          <div className="mt-7 flex flex-wrap items-center justify-between gap-3">{step > 1 ? <button className="rounded-xl border border-white/15 px-4 py-3 text-sm" disabled={busy} onClick={() => { setStep((current) => current - 1); setError(""); }} type="button">← {t.previous}</button> : <span/>}{step < 3 ? <button className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black" onClick={() => { if (validateStep(step + 1)) { setStep((current) => current + 1); setError(""); } }} type="button">{t.next} →</button> : editing ? <button className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black disabled:opacity-50" disabled={busy} onClick={() => void saveEvent(editing.status)} type="button">{busy ? "…" : t.saveChanges}</button> : <div className="flex flex-wrap gap-2"><button className="rounded-xl border border-white/15 px-5 py-3 text-sm" disabled={busy} onClick={() => void saveEvent("unpublished")} type="button">{t.saveDraft}</button><button className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black disabled:opacity-50" disabled={busy || !activeOrganizer.verified} onClick={() => void saveEvent("published")} type="button">{busy ? "…" : t.publish}</button></div>}</div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-7"><div className="flex items-center justify-between"><h2 className="text-2xl font-semibold">{t.myEvents}</h2><span className="text-xs text-white/40">{data.events.length}</span></div>{data.events.length ? <div className="mt-5 space-y-3">{data.events.map((event) => <article className="rounded-2xl border border-white/10 bg-black/25 p-4" key={event.id}><div className="flex items-start justify-between gap-4"><div><span className={`text-[11px] font-semibold uppercase tracking-[0.15em] ${event.status === "published" ? "text-emerald-300" : event.status === "cancelled" ? "text-red-300" : "text-amber-300"}`}>{eventStatusLabel(event.status, locale)}</span><h3 className="mt-1 font-semibold">{event.title}</h3><p className="mt-1 text-xs text-white/45">{formatDate(event.starts_at, locale)} · {event.city ?? "—"}</p><p className="mt-1 text-xs text-white/35">{event.location_precision === "exact" && event.latitude != null && event.longitude != null ? `Map ✓ ${event.latitude}, ${event.longitude}` : "Map point missing"}</p></div><button className="rounded-lg border border-white/10 px-3 py-2 text-xs" onClick={() => beginEdit(event)} type="button">{t.editAction}</button></div><div className="mt-4 flex flex-wrap gap-2">{event.status !== "published" && event.status !== "cancelled" ? <button className="rounded-lg bg-white px-3 py-2 text-xs font-semibold text-black disabled:opacity-50" disabled={busy} onClick={() => void setStatus(event, "published")} type="button">{t.publishAction}</button> : null}{event.status === "published" ? <button className="rounded-lg border border-white/15 px-3 py-2 text-xs" disabled={busy} onClick={() => void setStatus(event, "unpublished")} type="button">{t.unpublish}</button> : null}{event.status !== "cancelled" ? <button className="rounded-lg border border-red-400/20 px-3 py-2 text-xs text-red-200" disabled={busy} onClick={() => void setStatus(event, "cancelled")} type="button">{t.cancel}</button> : null}</div></article>)}</div> : <p className="mt-5 text-sm text-white/45">{t.noEvents}</p>}</section>
      </div>
    </main>
  </div>;
}
