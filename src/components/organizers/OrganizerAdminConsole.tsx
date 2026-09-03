/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

import styles from "./OrganizerAdminConsole.module.css";

const SUPABASE_URL = "https://qrouwtqsqrfeeeppyeru.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_vR9wivNa_fIb0QKmqua6Wg_H_7OPvUk";
const SESSION_KEY = "noxa-radar-admin-session-v1";

type AdminSession = { accessToken: string; refreshToken: string; expiresAt: number; email: string; userId: string };
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
  status: "draft" | "active" | "suspended";
};
type Invite = {
  id: string;
  organizer_id: string;
  email: string;
  role: "owner" | "admin" | "editor";
  status: "pending" | "revoked";
  expires_at: string;
  created_at: string;
};

type Phase = "checking" | "signed_out" | "unauthorized" | "ready";

function headers(accessToken?: string) {
  return {
    apikey: SUPABASE_PUBLISHABLE_KEY,
    "Content-Type": "application/json",
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  };
}

function readSession(): AdminSession | null {
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) as AdminSession : null;
  } catch {
    return null;
  }
}

async function refreshSession(session: AdminSession): Promise<AdminSession | null> {
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

async function isAdmin(accessToken: string) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/radar_admin_status`, {
    method: "POST",
    headers: headers(accessToken),
    body: "{}",
    cache: "no-store",
  });
  return response.ok && await response.json() === true;
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

export function OrganizerAdminConsole() {
  const [phase, setPhase] = useState<Phase>("checking");
  const [session, setSession] = useState<AdminSession | null>(null);
  const [organizers, setOrganizers] = useState<Organizer[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");

  async function load(accessToken: string) {
    const [organizerResponse, inviteResponse] = await Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/organizer_profiles?select=id,slug,name,organizer_type,community_id,city,country_code,instagram_url,website_url,verified,status&order=name.asc`, { headers: headers(accessToken), cache: "no-store" }),
      fetch(`${SUPABASE_URL}/rest/v1/organizer_invites?select=id,organizer_id,email,role,status,expires_at,created_at&order=created_at.desc`, { headers: headers(accessToken), cache: "no-store" }),
    ]);
    if (!organizerResponse.ok || !inviteResponse.ok) throw new Error("Unable to load organizer access.");
    setOrganizers(await organizerResponse.json() as Organizer[]);
    setInvites(await inviteResponse.json() as Invite[]);
  }

  useEffect(() => {
    let cancelled = false;
    async function restore() {
      try {
        let stored = readSession();
        if (!stored) {
          if (!cancelled) setPhase("signed_out");
          return;
        }
        if (stored.expiresAt <= Date.now() + 60_000) {
          stored = await refreshSession(stored);
          if (!stored) {
            if (!cancelled) setPhase("signed_out");
            return;
          }
          window.localStorage.setItem(SESSION_KEY, JSON.stringify(stored));
        }
        if (!(await isAdmin(stored.accessToken))) {
          if (!cancelled) setPhase("unauthorized");
          return;
        }
        if (!cancelled) {
          setSession(stored);
          await load(stored.accessToken);
          setPhase("ready");
        }
      } catch (restoreError) {
        if (!cancelled) {
          setError(restoreError instanceof Error ? restoreError.message : "Unable to restore admin access.");
          setPhase("signed_out");
        }
      }
    }
    void restore();
    return () => { cancelled = true; };
  }, []);

  const pendingByOrganizer = useMemo(() => {
    const map = new Map<string, Invite[]>();
    for (const invite of invites.filter((item) => item.status === "pending")) {
      map.set(invite.organizer_id, [...(map.get(invite.organizer_id) ?? []), invite]);
    }
    return map;
  }, [invites]);

  async function createOrganizer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session || busy) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const form = new FormData(event.currentTarget);
      const normalizedSlug = String(form.get("slug") ?? "").trim();
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalizedSlug)) throw new Error("Use a valid URL slug.");
      const instagram = String(form.get("instagram") ?? "").trim() || null;
      const website = String(form.get("website") ?? "").trim() || null;
      if (!instagram && !website) throw new Error("Add Instagram or website for organizer verification.");
      const response = await fetch(`${SUPABASE_URL}/rest/v1/organizer_profiles`, {
        method: "POST",
        headers: { ...headers(session.accessToken), Prefer: "return=minimal" },
        body: JSON.stringify({
          name: String(form.get("name") ?? "").trim(),
          slug: normalizedSlug,
          organizer_type: form.get("type"),
          city: String(form.get("city") ?? "").trim() || null,
          country_code: String(form.get("country") ?? "GR").toUpperCase(),
          instagram_url: instagram,
          website_url: website,
          verified: form.get("verified") === "on",
          status: "active",
        }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({})) as { message?: string };
        throw new Error(payload.message ?? "Could not create organizer.");
      }
      setName("");
      setSlug("");
      event.currentTarget.reset();
      await load(session.accessToken);
      setMessage("Organizer profile created.");
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Could not create organizer.");
    } finally {
      setBusy(false);
    }
  }

  async function invite(event: FormEvent<HTMLFormElement>, organizer: Organizer) {
    event.preventDefault();
    if (!session || busy) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const form = new FormData(event.currentTarget);
      const email = String(form.get("email") ?? "").trim().toLowerCase();
      const role = String(form.get("role") ?? "admin");
      const response = await fetch(`${SUPABASE_URL}/rest/v1/organizer_invites`, {
        method: "POST",
        headers: { ...headers(session.accessToken), Prefer: "return=minimal" },
        body: JSON.stringify({
          organizer_id: organizer.id,
          email,
          role,
          status: "pending",
          invited_by: session.userId,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({})) as { message?: string };
        throw new Error(payload.message ?? "Could not create invitation.");
      }

      const redirectTo = `${window.location.origin}/organizer`;
      const mailResponse = await fetch(`${SUPABASE_URL}/auth/v1/otp?redirect_to=${encodeURIComponent(redirectTo)}`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ email, create_user: true }),
      });

      event.currentTarget.reset();
      await load(session.accessToken);
      if (mailResponse.ok) {
        setMessage(`Invitation sent to ${email}. The sign-in link opens the NOXA Organizer Dashboard.`);
      } else {
        setMessage(`Access is prepared for ${email}, but the sign-in email could not be sent. They can open /organizer and request a link with the same email.`);
      }
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Could not create invitation.");
    } finally {
      setBusy(false);
    }
  }

  async function revoke(inviteId: string) {
    if (!session || busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/organizer_invites?id=eq.${encodeURIComponent(inviteId)}`, {
        method: "PATCH",
        headers: { ...headers(session.accessToken), Prefer: "return=minimal" },
        body: JSON.stringify({ status: "revoked", updated_at: new Date().toISOString() }),
      });
      if (!response.ok) throw new Error("Could not revoke invitation.");
      await load(session.accessToken);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Could not revoke invitation.");
    } finally {
      setBusy(false);
    }
  }

  if (phase === "checking") return <main className={styles.state}>Checking admin access…</main>;
  if (phase === "signed_out") return <main className={styles.state}><h1>Admin sign-in required.</h1><Link href="/radar/admin">Open NOXA Meets Admin</Link></main>;
  if (phase === "unauthorized") return <main className={styles.state}><h1>Not authorized.</h1><Link href="/">Back to NOXA</Link></main>;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link className={styles.brand} href="/">NOXA</Link>
        <nav>
          <Link href="/radar/admin">Meets</Link>
          <Link href="/radar/admin/communities">Communities</Link>
          <Link aria-current="page" href="/radar/admin/organizers">Organizers</Link>
        </nav>
      </header>

      <main className={styles.main}>
        <section className={styles.heading}>
          <p className={styles.eyebrow}>NOXA ADMIN</p>
          <h1>Organizer access</h1>
          <p>Create approved organizer identities and grant dashboard access to the people who actually manage them.</p>
        </section>

        {message ? <p className={styles.success}>{message}</p> : null}
        {error ? <p className={styles.error} role="alert">{error}</p> : null}

        <section className={styles.createPanel}>
          <div>
            <p className={styles.eyebrow}>MANUAL ORGANIZER</p>
            <h2>Add team, company, page or group</h2>
            <p>Communities should normally come through the Community review flow. Use this for other verified organizer types.</p>
          </div>
          <form className={styles.createForm} onSubmit={createOrganizer}>
            <label><span>Name</span><input name="name" onChange={(event) => { setName(event.target.value); if (!slug) setSlug(slugify(event.target.value)); }} required value={name} /></label>
            <label><span>URL slug</span><input name="slug" onChange={(event) => setSlug(event.target.value)} required value={slug} /></label>
            <label><span>Type</span><select defaultValue="team" name="type"><option value="team">Team</option><option value="company">Company</option><option value="page">Page</option><option value="group">Group</option></select></label>
            <label><span>City</span><input name="city" placeholder="Thessaloniki" /></label>
            <label><span>Country</span><input defaultValue="GR" maxLength={2} name="country" /></label>
            <label><span>Instagram</span><input name="instagram" placeholder="https://instagram.com/..." type="url" /></label>
            <label><span>Website</span><input name="website" placeholder="https://..." type="url" /></label>
            <label className={styles.check}><input name="verified" type="checkbox" /><span>Verified organizer</span></label>
            <button disabled={busy} type="submit">Create organizer</button>
          </form>
        </section>

        <section className={styles.organizerSection}>
          <div className={styles.sectionTitle}><h2>Organizer profiles</h2><span>{organizers.length}</span></div>
          <div className={styles.list}>
            {organizers.map((organizer) => (
              <article className={styles.card} key={organizer.id}>
                <div className={styles.cardTop}>
                  <div>
                    <div className={styles.badges}><span>{organizer.organizer_type}</span>{organizer.verified ? <span className={styles.verified}>VERIFIED</span> : <span>NOT VERIFIED</span>}</div>
                    <h3>{organizer.name}</h3>
                    <p>{[organizer.city, organizer.country_code].filter(Boolean).join(" · ")} · /{organizer.slug}</p>
                  </div>
                  <span>{organizer.status}</span>
                </div>
                <form className={styles.inviteForm} onSubmit={(event) => void invite(event, organizer)}>
                  <label><span>Admin email</span><input name="email" placeholder="owner@example.com" required type="email" /></label>
                  <label><span>Role</span><select defaultValue="owner" name="role"><option value="owner">Owner</option><option value="admin">Admin</option><option value="editor">Editor</option></select></label>
                  <button disabled={busy} type="submit">Send invite</button>
                </form>
                {(pendingByOrganizer.get(organizer.id) ?? []).length ? (
                  <div className={styles.invites}>
                    {(pendingByOrganizer.get(organizer.id) ?? []).map((item) => (
                      <div key={item.id}><span>{item.email} · {item.role}</span><button disabled={busy} onClick={() => void revoke(item.id)} type="button">Revoke</button></div>
                    ))}
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
