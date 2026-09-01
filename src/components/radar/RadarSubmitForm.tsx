"use client";

import Link from "next/link";
import { FormEvent, useMemo, useRef, useState } from "react";

import styles from "./RadarSubmitForm.module.css";

const SUBMIT_ENDPOINT = "https://qrouwtqsqrfeeeppyeru.supabase.co/functions/v1/radar-submit-event";

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

const COUNTRY_CODES = "AL AT BA BE BG CH CY CZ DE DK EE ES FI FR GB GE GR HR HU IE IS IT LI LT LU LV MC MD ME MK MT NL NO PL PT RO RS SE SI SK TR UA".split(" ");

type SubmitResponse = {
  ok?: boolean;
  submitted?: boolean;
  duplicate?: boolean;
  message?: string;
  error?: string;
};

function countryName(code: string) {
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
}

export function RadarSubmitForm() {
  const formStartedAt = useRef(Date.now());
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [countryCode, setCountryCode] = useState("GR");
  const countries = useMemo(
    () => COUNTRY_CODES.map((code) => ({ code, name: countryName(code) })).sort((a, b) => a.name.localeCompare(b.name)),
    [],
  );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    setBusy(true);
    setError("");
    setMessage("");

    try {
      const form = new FormData(event.currentTarget);
      const localDate = String(form.get("startsAt") ?? "");
      const parsedDate = new Date(localDate);
      if (!localDate || Number.isNaN(parsedDate.getTime())) {
        throw new Error("Choose a valid date and time.");
      }

      const response = await fetch(SUBMIT_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.get("title"),
          eventType: form.get("eventType"),
          startsAt: parsedDate.toISOString(),
          countryCode: form.get("countryCode"),
          city: form.get("city"),
          location: form.get("location"),
          organizerName: form.get("organizerName"),
          sourceUrl: form.get("sourceUrl"),
          summary: form.get("summary"),
          website: form.get("website"),
          formStartedAt: formStartedAt.current,
        }),
      });

      const payload = await response.json().catch(() => ({})) as SubmitResponse;
      if (!response.ok) throw new Error(payload.error ?? "Could not submit this event.");

      setDone(true);
      setMessage(payload.duplicate
        ? "This event is already in the NOXA review queue."
        : "Submitted. NOXA will review the details before anything appears publicly.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not submit this event.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <main className={styles.page}>
        <section className={styles.successCard}>
          <span className={styles.successMark} aria-hidden="true">✓</span>
          <p className={styles.eyebrow}>SUBMITTED FOR REVIEW</p>
          <h1>Thanks for the tip.</h1>
          <p>{message}</p>
          <div className={styles.successActions}>
            <Link className={styles.primaryLink} href="/radar">Back to Radar</Link>
            <button onClick={() => { setDone(false); setMessage(""); formStartedAt.current = Date.now(); }} type="button">Submit another</button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link className={styles.brand} href="/">NOXA</Link>
        <Link className={styles.backLink} href="/radar">← Radar</Link>
      </header>

      <main className={styles.main}>
        <section className={styles.intro}>
          <p className={styles.eyebrow}>COMMUNITY SUBMISSION</p>
          <h1>Submit an event.</h1>
          <p>Know about a public car meet, moto gathering or motorsport event? Send the source and details. Nothing is published until NOXA reviews it.</p>
        </section>

        <form className={styles.form} onSubmit={submit}>
          <div className={styles.notice}>
            <strong>Public events only.</strong>
            <span>Add the original organizer post, event page or public announcement so we can verify the details.</span>
          </div>

          <label className={styles.field}>
            <span>Event name</span>
            <input maxLength={160} name="title" placeholder="Thessaloniki Night Meet" required />
          </label>

          <div className={styles.twoColumns}>
            <label className={styles.field}>
              <span>Type</span>
              <select defaultValue="car_meet" name="eventType">
                {EVENT_TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <label className={styles.field}>
              <span>Date & time</span>
              <input name="startsAt" required type="datetime-local" />
            </label>
          </div>

          <div className={styles.twoColumns}>
            <label className={styles.field}>
              <span>Country</span>
              <select name="countryCode" onChange={(event) => setCountryCode(event.target.value)} value={countryCode}>
                {countries.map(({ code, name }) => <option key={code} value={code}>{name}</option>)}
              </select>
            </label>
            <label className={styles.field}>
              <span>City</span>
              <input maxLength={100} name="city" placeholder="Thessaloniki" required />
            </label>
          </div>

          <label className={styles.field}>
            <span>Location</span>
            <input maxLength={180} name="location" placeholder="Venue, parking area or meeting point" required />
          </label>

          <label className={styles.field}>
            <span>Organizer / community</span>
            <input maxLength={120} name="organizerName" placeholder="Organizer name or club" required />
          </label>

          <label className={styles.field}>
            <span>Original public source</span>
            <input inputMode="url" maxLength={500} name="sourceUrl" placeholder="https://instagram.com/... or https://facebook.com/events/..." required type="url" />
            <small>Instagram, Facebook, organizer website or another public event page.</small>
          </label>

          <label className={styles.field}>
            <span>Extra details <em>optional</em></span>
            <textarea maxLength={700} name="summary" placeholder="Entry rules, meetup time, parking details, vehicle theme…" rows={5} />
          </label>

          <div className={styles.honeypot} aria-hidden="true">
            <label>Website<input autoComplete="off" name="website" tabIndex={-1} /></label>
          </div>

          <div className={styles.reviewNote}>
            <span aria-hidden="true">●</span>
            <p>Submitting does not mean NOXA organizes or endorses the event. Final details remain the organizer&apos;s responsibility.</p>
          </div>

          {error ? <p className={styles.error} role="alert">{error}</p> : null}

          <button className={styles.submitButton} disabled={busy} type="submit">
            {busy ? "Submitting…" : "Send for review"}
            {!busy ? <span aria-hidden="true">→</span> : null}
          </button>
        </form>
      </main>
    </div>
  );
}
