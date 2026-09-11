"use client";

import Link from "next/link";
import { type FormEvent, useRef, useState } from "react";

import { NoxaLogo } from "@/components/brand/NoxaLogo";
import type { Locale } from "@/i18n/landing-copy";

import styles from "./RadarSubmitForm.module.css";

const SUBMIT_ENDPOINT = "https://qrouwtqsqrfeeeppyeru.supabase.co/functions/v1/radar-submit-event";
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

const PUBLISHER_TYPES = [
  ["crew", "Crew / Community"],
  ["business", "Business / Partner"],
] as const;

type SubmitResponse = { ok?: boolean; submitted?: boolean; duplicate?: boolean; message?: string; error?: string };

const copy = {
  en: {
    back: "← NOXA Meets",
    eyebrow: "ADD EVENT · GREECE",
    title: "Add your event.",
    intro: "NOXA event submissions are for Crews and Business/Partners active in Greece. Send the official source and event details. NOXA verifies every submission before it appears in Meets.",
    noticeTitle: "Crew or Business/Partner submission only.",
    noticeBody: "This form does not publish instantly. NOXA verifies the publisher and source before publication.",
    crewCta: "Register or view your Crew",
    businessCta: "Business & Partners",
    publisherType: "Publisher type",
    eventName: "Event name",
    type: "Type",
    date: "Date & time",
    country: "Country",
    city: "City",
    location: "Location",
    publisher: "Crew / Business name",
    source: "Official event source",
    sourceHelp: "Use the official Crew, Business/Partner, venue or event page for this exact event.",
    details: "Event details",
    optional: "optional",
    detailsPlaceholder: "Program, entry rules, meetup time, parking, vehicle theme, spectator information…",
    review: "NOXA checks the publisher and source before publication. Do not invent missing details.",
    submit: "Send event for review",
    submitting: "Submitting…",
    successEyebrow: "EVENT RECEIVED",
    successTitle: "Your event is in the NOXA review queue.",
    success: "NOXA will verify the publisher, source and details before it becomes public.",
    duplicate: "This event is already published or waiting in the NOXA review queue.",
    backMeets: "Back to NOXA Meets",
    another: "Add another event",
    invalidDate: "Choose a valid date and time.",
    generic: "Could not submit this event for review.",
  },
  el: {
    back: "← NOXA Meets",
    eyebrow: "ΠΡΟΣΘΗΚΗ EVENT · ΕΛΛΑΔΑ",
    title: "Πρόσθεσε το event σου.",
    intro: "Οι υποβολές event στο NOXA είναι για Crews και Business/Partners που δραστηριοποιούνται στην Ελλάδα. Στείλε την επίσημη πηγή και τα στοιχεία. Το NOXA ελέγχει κάθε υποβολή πριν εμφανιστεί στα Meets.",
    noticeTitle: "Μόνο Crew ή Business/Partner.",
    noticeBody: "Η φόρμα δεν δημοσιεύει άμεσα. Το NOXA επιβεβαιώνει τον publisher και την πηγή πριν τη δημοσίευση.",
    crewCta: "Καταχώρισε ή δες το Crew σου",
    businessCta: "Business & Partners",
    publisherType: "Τύπος publisher",
    eventName: "Όνομα event",
    type: "Τύπος",
    date: "Ημερομηνία & ώρα",
    country: "Χώρα",
    city: "Πόλη",
    location: "Τοποθεσία",
    publisher: "Όνομα Crew / Business",
    source: "Επίσημη πηγή event",
    sourceHelp: "Χρησιμοποίησε την επίσημη σελίδα Crew, Business/Partner, venue ή event για το συγκεκριμένο event.",
    details: "Στοιχεία event",
    optional: "προαιρετικό",
    detailsPlaceholder: "Πρόγραμμα, κανόνες εισόδου, ώρα συνάντησης, parking, vehicle theme, spectator info…",
    review: "Το NOXA ελέγχει τον publisher και την πηγή πριν τη δημοσίευση. Μην προσθέτεις στοιχεία που δεν είναι επιβεβαιωμένα.",
    submit: "Στείλε το event για review",
    submitting: "Αποστολή…",
    successEyebrow: "ΤΟ EVENT ΕΛΗΦΘΗ",
    successTitle: "Το event μπήκε στο NOXA review queue.",
    success: "Το NOXA θα επιβεβαιώσει publisher, πηγή και στοιχεία πριν γίνει public.",
    duplicate: "Αυτό το event είναι ήδη published ή βρίσκεται στο NOXA review queue.",
    backMeets: "Πίσω στα NOXA Meets",
    another: "Πρόσθεσε άλλο event",
    invalidDate: "Διάλεξε έγκυρη ημερομηνία και ώρα.",
    generic: "Δεν ήταν δυνατή η αποστολή του event για review.",
  },
} as const;

export function RadarSubmitForm({ locale = "en" }: { locale?: Locale }) {
  const t = copy[locale];
  const base = locale === "el" ? "/el" : "";
  const formStartedAt = useRef(0);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function markStarted() {
    if (!formStartedAt.current) formStartedAt.current = Date.now();
  }

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
      if (!localDate || Number.isNaN(parsedDate.getTime())) throw new Error(t.invalidDate);

      const response = await fetch(SUBMIT_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          publisherType: form.get("publisherType"),
          title: form.get("title"),
          eventType: form.get("eventType"),
          startsAt: parsedDate.toISOString(),
          countryCode: "GR",
          city: form.get("city"),
          location: form.get("location"),
          organizerName: form.get("publisherName"),
          sourceUrl: form.get("sourceUrl"),
          summary: form.get("summary"),
          website: form.get("website"),
          formStartedAt: formStartedAt.current,
        }),
      });
      const payload = await response.json().catch(() => ({})) as SubmitResponse;
      if (!response.ok) throw new Error(payload.error ?? t.generic);
      setDone(true);
      setMessage(payload.duplicate ? t.duplicate : t.success);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t.generic);
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <main className={styles.page}>
        <section className={styles.successCard}>
          <span className={styles.successMark} aria-hidden="true">✓</span>
          <p className={styles.eyebrow}>{t.successEyebrow}</p>
          <h1>{t.successTitle}</h1>
          <p>{message}</p>
          <div className={styles.successActions}>
            <Link className={styles.primaryLink} href={`${base}/meets`}>{t.backMeets}</Link>
            <button onClick={() => { setDone(false); setMessage(""); formStartedAt.current = 0; }} type="button">{t.another}</button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link className={styles.brand} href={base || "/"} aria-label="NOXA home"><NoxaLogo /></Link>
        <Link className={styles.backLink} href={`${base}/meets`}>{t.back}</Link>
      </header>
      <main className={styles.main}>
        <section className={styles.intro}>
          <p className={styles.eyebrow}>{t.eyebrow}</p>
          <h1>{t.title}</h1>
          <p>{t.intro}</p>
        </section>
        <form className={styles.form} onFocusCapture={markStarted} onSubmit={submit}>
          <div className={styles.notice}>
            <strong>{t.noticeTitle}</strong>
            <span>{t.noticeBody}</span>
            <div className="mt-2 flex flex-wrap gap-4">
              <Link className="text-sm font-semibold text-white underline underline-offset-4" href={`${base}/communities`}>{t.crewCta} →</Link>
              <Link className="text-sm font-semibold text-white underline underline-offset-4" href="/business">{t.businessCta} →</Link>
            </div>
          </div>

          <label className={styles.field}>
            <span>{t.publisherType}</span>
            <select defaultValue="crew" name="publisherType">{PUBLISHER_TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
          </label>
          <label className={styles.field}><span>{t.eventName}</span><input maxLength={160} name="title" placeholder="Thessaloniki Night Meet" required /></label>
          <div className={styles.twoColumns}>
            <label className={styles.field}>
              <span>{t.type}</span>
              <select defaultValue="car_meet" name="eventType">{EVENT_TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
            </label>
            <label className={styles.field}><span>{t.date}</span><input name="startsAt" required type="datetime-local" /></label>
          </div>

          <div className={styles.twoColumns}>
            <label className={styles.field}><span>{t.country}</span><input readOnly value={locale === "el" ? "Ελλάδα" : "Greece"} /></label>
            <label className={styles.field}><span>{t.city}</span><input maxLength={100} name="city" placeholder="Thessaloniki" required /></label>
          </div>

          <label className={styles.field}><span>{t.location}</span><input maxLength={180} name="location" placeholder="Venue, track, parking area or meeting point" required /></label>
          <label className={styles.field}><span>{t.publisher}</span><input maxLength={120} name="publisherName" placeholder="Crew or Business name" required /></label>
          <label className={styles.field}>
            <span>{t.source}</span>
            <input inputMode="url" maxLength={500} name="sourceUrl" placeholder="https://instagram.com/..." required type="url" />
            <small>{t.sourceHelp}</small>
          </label>
          <label className={styles.field}>
            <span>{t.details} <em>{t.optional}</em></span>
            <textarea maxLength={700} name="summary" placeholder={t.detailsPlaceholder} rows={5} />
          </label>

          <div className={styles.honeypot} aria-hidden="true"><label>Website<input autoComplete="off" name="website" tabIndex={-1} /></label></div>
          <div className={styles.reviewNote}><span aria-hidden="true">●</span><p>{t.review}</p></div>
          {error ? <p className={styles.error} role="alert">{error}</p> : null}
          <button className={styles.submitButton} disabled={busy} type="submit">
            {busy ? t.submitting : t.submit}{!busy ? <span aria-hidden="true">→</span> : null}
          </button>
        </form>
      </main>
    </div>
  );
}
