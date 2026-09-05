"use client";

import Link from "next/link";
import { FormEvent, useMemo, useRef, useState } from "react";

import type { Locale } from "@/i18n/landing-copy";

import styles from "./CommunityApplicationForm.module.css";

const SUBMIT_ENDPOINT = "https://qrouwtqsqrfeeeppyeru.supabase.co/functions/v1/community-submit-application";
const COUNTRY_CODES = "AL AT BA BE BG CH CY CZ DE DK EE ES FI FR GB GE GR HR HU IE IS IT LI LT LU LV MC MD ME MK MT NL NO PL PT RO RS SE SI SK TR UA".split(" ");

type SubmitResponse = {
  ok?: boolean;
  submitted?: boolean;
  duplicate?: boolean;
  message?: string;
  error?: string;
};

const copy = {
  en: {
    back: "← Communities",
    eyebrow: "NOXA COMMUNITIES",
    title: "List your community.",
    intro: "Apply for a public NOXA profile for your club, organiser page or established local scene. Every application is reviewed before anything becomes public.",
    noticeTitle: "Real communities only.",
    noticeBody: "Add a public Instagram page or website that lets NOXA verify the community and its activity.",
    communityName: "Community name",
    communityPlaceholder: "Example Automotive Club",
    focus: "Focus",
    country: "Country",
    city: "City",
    region: "Region",
    optional: "optional",
    sceneTags: "Scene / styles",
    sceneHelp: "Comma separated — for example: JDM, stance, classics, track days.",
    instagram: "Instagram",
    website: "Website",
    publicLinkHelp: "At least one public link is required for verification.",
    about: "About the community",
    aboutPlaceholder: "What does your community do, where are you active and what kind of meets or activities do you organise?",
    contactName: "Contact person",
    contactEmail: "Contact email",
    consent: "I confirm I represent or am authorized to submit this community, and NOXA may contact me about the listing.",
    reviewNote: "Submitting an application does not automatically create a public profile or imply verification. NOXA reviews each listing before publication.",
    submit: "Send application",
    submitting: "Submitting…",
    successEyebrow: "APPLICATION RECEIVED",
    successTitle: "Your community is in review.",
    successBody: "NOXA will review the public links and details before creating any profile. We may contact you if we need to verify information.",
    duplicateBody: "This community is already listed or waiting for review.",
    backDirectory: "Back to Communities",
    submitAnother: "Submit another",
    errors: {
      publicLink: "Add an Instagram page or website so NOXA can verify the community.",
      generic: "Could not submit this application.",
    },
  },
  el: {
    back: "← Κοινότητες",
    eyebrow: "NOXA COMMUNITIES",
    title: "Καταχώρισε την κοινότητά σου.",
    intro: "Κάνε αίτηση για δημόσιο NOXA profile για το club, organiser page ή οργανωμένη local scene σου. Κάθε αίτηση ελέγχεται πριν δημοσιευτεί οτιδήποτε.",
    noticeTitle: "Μόνο πραγματικές κοινότητες.",
    noticeBody: "Πρόσθεσε δημόσιο Instagram ή website ώστε το NOXA να μπορεί να επιβεβαιώσει την κοινότητα και τη δραστηριότητά της.",
    communityName: "Όνομα κοινότητας",
    communityPlaceholder: "Example Automotive Club",
    focus: "Κατηγορία",
    country: "Χώρα",
    city: "Πόλη",
    region: "Περιοχή",
    optional: "προαιρετικό",
    sceneTags: "Scene / styles",
    sceneHelp: "Χώρισέ τα με κόμμα — π.χ. JDM, stance, classics, track days.",
    instagram: "Instagram",
    website: "Website",
    publicLinkHelp: "Χρειάζεται τουλάχιστον ένα δημόσιο link για verification.",
    about: "Σχετικά με την κοινότητα",
    aboutPlaceholder: "Τι κάνει η κοινότητά σου, πού δραστηριοποιείται και τι meets ή activities οργανώνει;",
    contactName: "Υπεύθυνος επικοινωνίας",
    contactEmail: "Email επικοινωνίας",
    consent: "Επιβεβαιώνω ότι εκπροσωπώ ή έχω άδεια να υποβάλω αυτή την κοινότητα και ότι το NOXA μπορεί να επικοινωνήσει μαζί μου για την καταχώριση.",
    reviewNote: "Η υποβολή αίτησης δεν δημιουργεί αυτόματα δημόσιο profile και δεν σημαίνει verification. Το NOXA ελέγχει κάθε καταχώριση πριν τη δημοσίευση.",
    submit: "Στείλε αίτηση",
    submitting: "Αποστολή…",
    successEyebrow: "Η ΑΙΤΗΣΗ ΕΛΗΦΘΗ",
    successTitle: "Η κοινότητά σου είναι σε review.",
    successBody: "Το NOXA θα ελέγξει τα δημόσια links και τα στοιχεία πριν δημιουργήσει profile. Μπορεί να επικοινωνήσουμε μαζί σου αν χρειαστεί επιβεβαίωση.",
    duplicateBody: "Αυτή η κοινότητα υπάρχει ήδη ή βρίσκεται ήδη σε review.",
    backDirectory: "Πίσω στις Κοινότητες",
    submitAnother: "Νέα αίτηση",
    errors: {
      publicLink: "Πρόσθεσε Instagram ή website ώστε το NOXA να μπορεί να επιβεβαιώσει την κοινότητα.",
      generic: "Δεν ήταν δυνατή η αποστολή της αίτησης.",
    },
  },
} as const;

function countryName(code: string, locale: Locale) {
  try {
    return new Intl.DisplayNames([locale === "el" ? "el-GR" : "en-GB"], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
}

export function CommunityApplicationForm({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const formStartedAt = useRef(0);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [duplicate, setDuplicate] = useState(false);
  const [error, setError] = useState("");
  const [countryCode, setCountryCode] = useState("GR");
  const countries = useMemo(
    () => COUNTRY_CODES.map((code) => ({ code, name: countryName(code, locale) })).sort((a, b) => a.name.localeCompare(b.name)),
    [locale],
  );
  const directoryHref = locale === "el" ? "/el/communities" : "/communities";

  function markFormStarted() {
    if (formStartedAt.current === 0) formStartedAt.current = Date.now();
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    setBusy(true);
    setError("");

    try {
      const form = new FormData(event.currentTarget);
      const instagramUrl = String(form.get("instagramUrl") ?? "").trim();
      const websiteUrl = String(form.get("websiteUrl") ?? "").trim();
      if (!instagramUrl && !websiteUrl) throw new Error(t.errors.publicLink);

      const sceneTags = String(form.get("sceneTags") ?? "")
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
        .slice(0, 16);

      const response = await fetch(SUBMIT_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          communityName: form.get("communityName"),
          focus: form.get("focus"),
          countryCode: form.get("countryCode"),
          city: form.get("city"),
          region: form.get("region"),
          sceneTags,
          instagramUrl,
          websiteUrl,
          about: form.get("about"),
          contactName: form.get("contactName"),
          contactEmail: form.get("contactEmail"),
          consent: form.get("consent") === "on",
          website: form.get("website"),
          formStartedAt: formStartedAt.current,
        }),
      });

      const payload = await response.json().catch(() => ({})) as SubmitResponse;
      if (!response.ok) throw new Error(payload.error ?? t.errors.generic);

      setDuplicate(Boolean(payload.duplicate));
      setDone(true);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : t.errors.generic);
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
          <p>{duplicate ? t.duplicateBody : t.successBody}</p>
          <div className={styles.successActions}>
            <Link className={styles.primaryLink} href={directoryHref}>{t.backDirectory}</Link>
            <button onClick={() => { setDone(false); setDuplicate(false); formStartedAt.current = 0; }} type="button">{t.submitAnother}</button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link className={styles.brand} href={locale === "el" ? "/el" : "/"} aria-label="NOXA home">
          <img src="/brand/noxa-header-sticker.svg" alt="" aria-hidden="true" />
        </Link>
        <Link className={styles.backLink} href={directoryHref}>{t.back}</Link>
      </header>

      <main className={styles.main}>
        <section className={styles.intro}>
          <p className={styles.eyebrow}>{t.eyebrow}</p>
          <h1>{t.title}</h1>
          <p>{t.intro}</p>
        </section>

        <form className={styles.form} onFocusCapture={markFormStarted} onSubmit={submit}>
          <div className={styles.notice}>
            <strong>{t.noticeTitle}</strong>
            <span>{t.noticeBody}</span>
          </div>

          <label className={styles.field}>
            <span>{t.communityName}</span>
            <input maxLength={120} name="communityName" placeholder={t.communityPlaceholder} required />
          </label>

          <div className={styles.twoColumns}>
            <label className={styles.field}>
              <span>{t.focus}</span>
              <select defaultValue="car" name="focus">
                <option value="car">Car</option>
                <option value="moto">Moto</option>
                <option value="mixed">Mixed</option>
              </select>
            </label>
            <label className={styles.field}>
              <span>{t.country}</span>
              <select name="countryCode" onChange={(event) => setCountryCode(event.target.value)} value={countryCode}>
                {countries.map(({ code, name }) => <option key={code} value={code}>{name}</option>)}
              </select>
            </label>
          </div>

          <div className={styles.twoColumns}>
            <label className={styles.field}>
              <span>{t.city}</span>
              <input maxLength={100} name="city" placeholder="Thessaloniki" required />
            </label>
            <label className={styles.field}>
              <span>{t.region} <em>{t.optional}</em></span>
              <input maxLength={100} name="region" placeholder="Central Macedonia" />
            </label>
          </div>

          <label className={styles.field}>
            <span>{t.sceneTags} <em>{t.optional}</em></span>
            <input maxLength={300} name="sceneTags" placeholder="JDM, stance, classics" />
            <small>{t.sceneHelp}</small>
          </label>

          <div className={styles.twoColumns}>
            <label className={styles.field}>
              <span>{t.instagram} <em>{t.optional}</em></span>
              <input inputMode="url" maxLength={700} name="instagramUrl" placeholder="https://instagram.com/..." type="url" />
            </label>
            <label className={styles.field}>
              <span>{t.website} <em>{t.optional}</em></span>
              <input inputMode="url" maxLength={700} name="websiteUrl" placeholder="https://..." type="url" />
            </label>
          </div>
          <div className={styles.reviewNote}>
            <span aria-hidden="true">●</span>
            <p>{t.publicLinkHelp}</p>
          </div>

          <label className={styles.field}>
            <span>{t.about}</span>
            <textarea maxLength={2000} minLength={20} name="about" placeholder={t.aboutPlaceholder} required rows={7} />
          </label>

          <div className={styles.twoColumns}>
            <label className={styles.field}>
              <span>{t.contactName}</span>
              <input autoComplete="name" maxLength={120} name="contactName" required />
            </label>
            <label className={styles.field}>
              <span>{t.contactEmail}</span>
              <input autoComplete="email" inputMode="email" maxLength={254} name="contactEmail" required type="email" />
            </label>
          </div>

          <label className={styles.reviewNote}>
            <input name="consent" required type="checkbox" />
            <p>{t.consent}</p>
          </label>

          <div className={styles.honeypot} aria-hidden="true">
            <label>Website<input autoComplete="off" name="website" tabIndex={-1} /></label>
          </div>

          <div className={styles.reviewNote}>
            <span aria-hidden="true">●</span>
            <p>{t.reviewNote}</p>
          </div>

          {error ? <p className={styles.error} role="alert">{error}</p> : null}

          <button className={styles.submitButton} disabled={busy} type="submit">
            {busy ? t.submitting : t.submit}
            {!busy ? <span aria-hidden="true">→</span> : null}
          </button>
        </form>
      </main>
    </div>
  );
}
