"use client";

import Link from "next/link";
import { type FormEvent, useRef, useState } from "react";

import { NoxaLogo } from "@/components/brand/NoxaLogo";
import type { Locale } from "@/i18n/landing-copy";
import styles from "@/components/communities/CommunityApplicationForm.module.css";

const SUBMIT_ENDPOINT = "https://qrouwtqsqrfeeeppyeru.supabase.co/functions/v1/organizer-submit-application";

type SubmitResponse = { ok?: boolean; submitted?: boolean; duplicate?: boolean; message?: string; error?: string };

export type OrganizerClaimTarget = {
  id: string;
  name: string;
  organizerType: string;
  city: string | null;
  instagramUrl: string | null;
  websiteUrl: string | null;
};

const copy = {
  en: {
    back: "← Organizers",
    eyebrow: "NOXA ORGANIZERS",
    title: "Apply as an organizer.",
    claimTitle: (name: string) => `Claim ${name}.`,
    intro: "For teams, companies, event pages and groups that organize public car or motorcycle events in Greece. Every application is reviewed before organizer access is granted.",
    claimIntro: "Represent this organizer? Send your contact details and proof. NOXA reviews the claim before owner access is granted.",
    noticeTitle: "Organizer access is reviewed.",
    noticeBody: "New organizer identities and profile claims both require manual review by NOXA.",
    claimNoticeTitle: "Claiming does not give instant access.",
    claimNoticeBody: "NOXA verifies your connection to the organizer first. If approved, an owner invite is sent to your verified contact email.",
    name: "Organizer name",
    namePlaceholder: "Example Events",
    type: "Organizer type",
    team: "Team",
    company: "Company",
    page: "Event page",
    group: "Group",
    country: "Country",
    city: "City",
    region: "Region",
    optional: "optional",
    instagram: "Instagram",
    website: "Website",
    publicLinkHelp: "At least one public Instagram page or website is required so NOXA can verify the organizer.",
    claimLinkHelp: "Use an official public page when possible. This helps NOXA verify that you are connected to the organizer.",
    about: "About the organizer",
    claimAbout: "Why should this profile be yours?",
    aboutPlaceholder: "What events do you organize, where are you active and how can NOXA verify your activity?",
    claimAboutPlaceholder: "Explain your role and how NOXA can verify that you represent this organizer.",
    contactName: "Contact person",
    contactEmail: "Contact email",
    consent: "I confirm that I represent or am authorized to submit this organizer, and NOXA may contact me about organizer access.",
    claimConsent: "I confirm that I represent this organizer or am authorized to manage it, and NOXA may contact me to verify this claim.",
    review: "Submitting does not create organizer access automatically. NOXA reviews the identity and public activity first. If approved, access is granted to the verified contact email.",
    claimReview: "A claim never changes the public organizer profile automatically. NOXA must approve it before an owner invite is created.",
    submit: "Send organizer application",
    claimSubmit: "Send claim for review",
    submitting: "Submitting…",
    successEyebrow: "APPLICATION RECEIVED",
    claimSuccessEyebrow: "CLAIM RECEIVED",
    successTitle: "Organizer application received.",
    claimSuccessTitle: "Organizer claim received.",
    success: "NOXA will review the public identity and activity before granting organizer access.",
    claimSuccess: "NOXA will verify your connection to the organizer before granting owner access.",
    duplicate: "This organizer is already listed or waiting for review.",
    claimDuplicate: "This organizer claim is already waiting for review.",
    directory: "Back to Organizers",
    again: "Submit another",
    community: "List a Community instead",
    errors: {
      publicLink: "Add an Instagram page or website so NOXA can verify the organizer.",
      generic: "Could not submit this organizer application.",
    },
  },
  el: {
    back: "← Organizers",
    eyebrow: "NOXA ORGANIZERS",
    title: "Κάνε αίτηση ως organizer.",
    claimTitle: (name: string) => `Claim το ${name}.`,
    intro: "Για teams, εταιρείες, event pages και groups που διοργανώνουν δημόσια car ή moto events στην Ελλάδα. Κάθε αίτηση ελέγχεται πριν δοθεί organizer access.",
    claimIntro: "Εκπροσωπείς αυτόν τον organizer; Στείλε στοιχεία επικοινωνίας και αποδεικτικά. Το NOXA ελέγχει το claim πριν δώσει owner access.",
    noticeTitle: "Το organizer access περνάει από έλεγχο.",
    noticeBody: "Νέοι organizers και claims σε υπάρχον profile περνούν πάντα από manual review του NOXA.",
    claimNoticeTitle: "Το claim δεν δίνει άμεσο access.",
    claimNoticeBody: "Το NOXA επιβεβαιώνει πρώτα τη σχέση σου με τον organizer. Αν εγκριθεί, στέλνεται owner invite στο επιβεβαιωμένο email.",
    name: "Όνομα organizer",
    namePlaceholder: "Example Events",
    type: "Τύπος organizer",
    team: "Team",
    company: "Εταιρεία",
    page: "Event page",
    group: "Group",
    country: "Χώρα",
    city: "Πόλη",
    region: "Περιοχή",
    optional: "προαιρετικό",
    instagram: "Instagram",
    website: "Website",
    publicLinkHelp: "Χρειάζεται τουλάχιστον δημόσιο Instagram ή website ώστε το NOXA να επιβεβαιώσει τον organizer.",
    claimLinkHelp: "Χρησιμοποίησε επίσημη δημόσια σελίδα όπου γίνεται. Βοηθά το NOXA να επιβεβαιώσει τη σχέση σου με τον organizer.",
    about: "Σχετικά με τον organizer",
    claimAbout: "Γιατί πρέπει να διαχειρίζεσαι αυτό το profile;",
    aboutPlaceholder: "Τι events διοργανώνετε, πού δραστηριοποιείστε και πώς μπορεί το NOXA να επιβεβαιώσει τη δραστηριότητά σας;",
    claimAboutPlaceholder: "Εξήγησε τον ρόλο σου και πώς μπορεί το NOXA να επιβεβαιώσει ότι εκπροσωπείς αυτόν τον organizer.",
    contactName: "Υπεύθυνος επικοινωνίας",
    contactEmail: "Email επικοινωνίας",
    consent: "Επιβεβαιώνω ότι εκπροσωπώ ή έχω άδεια να υποβάλω αυτόν τον organizer και ότι το NOXA μπορεί να επικοινωνήσει μαζί μου για organizer access.",
    claimConsent: "Επιβεβαιώνω ότι εκπροσωπώ αυτόν τον organizer ή έχω άδεια να τον διαχειρίζομαι και ότι το NOXA μπορεί να επικοινωνήσει μαζί μου για verification.",
    review: "Η αίτηση δεν δημιουργεί organizer access αυτόματα. Το NOXA ελέγχει πρώτα την ταυτότητα και τη δημόσια δραστηριότητα. Αν εγκριθεί, το access δίνεται στο επιβεβαιωμένο email.",
    claimReview: "Το claim δεν αλλάζει αυτόματα το δημόσιο profile. Το NOXA πρέπει πρώτα να το εγκρίνει και μετά δημιουργείται owner invite.",
    submit: "Στείλε αίτηση organizer",
    claimSubmit: "Στείλε claim για review",
    submitting: "Αποστολή…",
    successEyebrow: "Η ΑΙΤΗΣΗ ΕΛΗΦΘΗ",
    claimSuccessEyebrow: "ΤΟ CLAIM ΕΛΗΦΘΗ",
    successTitle: "Η αίτηση organizer ελήφθη.",
    claimSuccessTitle: "Το organizer claim ελήφθη.",
    success: "Το NOXA θα ελέγξει τη δημόσια ταυτότητα και δραστηριότητα πριν δώσει organizer access.",
    claimSuccess: "Το NOXA θα επιβεβαιώσει τη σχέση σου με τον organizer πριν δώσει owner access.",
    duplicate: "Αυτός ο organizer υπάρχει ήδη ή βρίσκεται σε review.",
    claimDuplicate: "Αυτό το organizer claim βρίσκεται ήδη σε review.",
    directory: "Πίσω στους Organizers",
    again: "Νέα αίτηση",
    community: "Καταχώρισε Community αντί γι’ αυτό",
    errors: {
      publicLink: "Πρόσθεσε Instagram ή website ώστε το NOXA να επιβεβαιώσει τον organizer.",
      generic: "Δεν ήταν δυνατή η αποστολή της αίτησης organizer.",
    },
  },
} as const;

function typeLabel(type: string, t: typeof copy.en | typeof copy.el) {
  if (type === "company") return t.company;
  if (type === "page") return t.page;
  if (type === "group") return t.group;
  return t.team;
}

export function OrganizerApplicationForm({ locale, claimTarget }: { locale: Locale; claimTarget?: OrganizerClaimTarget }) {
  const t = copy[locale];
  const base = locale === "el" ? "/el" : "";
  const isClaim = Boolean(claimTarget);
  const formStartedAt = useRef(0);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [duplicate, setDuplicate] = useState(false);
  const [error, setError] = useState("");

  function markStarted() {
    if (!formStartedAt.current) formStartedAt.current = Date.now();
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
      const response = await fetch(SUBMIT_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationKind: isClaim ? "claim" : "new",
          claimedOrganizerId: claimTarget?.id ?? null,
          organizerName: form.get("organizerName"),
          organizerType: form.get("organizerType"),
          countryCode: "GR",
          city: form.get("city"),
          region: form.get("region"),
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
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t.errors.generic);
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <main className={styles.page}>
        <section className={styles.successCard}>
          <span className={styles.successMark} aria-hidden="true">✓</span>
          <p className={styles.eyebrow}>{isClaim ? t.claimSuccessEyebrow : t.successEyebrow}</p>
          <h1>{isClaim ? t.claimSuccessTitle : t.successTitle}</h1>
          <p>{duplicate ? (isClaim ? t.claimDuplicate : t.duplicate) : (isClaim ? t.claimSuccess : t.success)}</p>
          <div className={styles.successActions}>
            <Link className={styles.primaryLink} href={`${base}/organizers`}>{t.directory}</Link>
            {!isClaim ? <button onClick={() => { setDone(false); setDuplicate(false); formStartedAt.current = 0; }} type="button">{t.again}</button> : null}
          </div>
        </section>
      </main>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link className={styles.brand} href={base || "/"} aria-label="NOXA home"><NoxaLogo /></Link>
        <Link className={styles.backLink} href={claimTarget ? `${base}/organizers/${claimTarget.id}` : `${base}/organizers`}>{t.back}</Link>
      </header>
      <main className={styles.main}>
        <section className={styles.intro}>
          <p className={styles.eyebrow}>{t.eyebrow}</p>
          <h1>{isClaim ? t.claimTitle(claimTarget!.name) : t.title}</h1>
          <p>{isClaim ? t.claimIntro : t.intro}</p>
        </section>
        <form className={styles.form} onFocusCapture={markStarted} onSubmit={submit}>
          <div className={styles.notice}>
            <strong>{isClaim ? t.claimNoticeTitle : t.noticeTitle}</strong>
            <span>{isClaim ? t.claimNoticeBody : t.noticeBody}</span>
            {!isClaim ? <Link className="mt-1 text-sm font-semibold text-white underline underline-offset-4" href={`${base}/communities/apply`}>{t.community} →</Link> : null}
          </div>

          <div className={styles.twoColumns}>
            <label className={styles.field}>
              <span>{t.name}</span>
              <input maxLength={120} name="organizerName" placeholder={t.namePlaceholder} readOnly={isClaim} defaultValue={claimTarget?.name ?? ""} required />
            </label>
            <label className={styles.field}>
              <span>{t.type}</span>
              {isClaim ? (
                <>
                  <input readOnly value={typeLabel(claimTarget!.organizerType, t)} />
                  <input name="organizerType" type="hidden" value={claimTarget!.organizerType} />
                </>
              ) : (
                <select defaultValue="team" name="organizerType">
                  <option value="team">{t.team}</option>
                  <option value="company">{t.company}</option>
                  <option value="page">{t.page}</option>
                  <option value="group">{t.group}</option>
                </select>
              )}
            </label>
          </div>

          <div className={styles.twoColumns}>
            <label className={styles.field}>
              <span>{t.country}</span>
              <input readOnly value={locale === "el" ? "Ελλάδα" : "Greece"} />
            </label>
            <label className={styles.field}>
              <span>{t.city}</span>
              <input maxLength={100} name="city" defaultValue={claimTarget?.city ?? ""} placeholder="Thessaloniki" required />
            </label>
          </div>

          <label className={styles.field}>
            <span>{t.region} <em>{t.optional}</em></span>
            <input maxLength={100} name="region" placeholder="Central Macedonia" />
          </label>

          <div className={styles.twoColumns}>
            <label className={styles.field}>
              <span>{t.instagram} <em>{t.optional}</em></span>
              <input inputMode="url" maxLength={700} name="instagramUrl" defaultValue={claimTarget?.instagramUrl ?? ""} placeholder="https://instagram.com/..." type="url" />
            </label>
            <label className={styles.field}>
              <span>{t.website} <em>{t.optional}</em></span>
              <input inputMode="url" maxLength={700} name="websiteUrl" defaultValue={claimTarget?.websiteUrl ?? ""} placeholder="https://..." type="url" />
            </label>
          </div>

          <div className={styles.reviewNote}><span aria-hidden="true">●</span><p>{isClaim ? t.claimLinkHelp : t.publicLinkHelp}</p></div>

          <label className={styles.field}>
            <span>{isClaim ? t.claimAbout : t.about}</span>
            <textarea maxLength={2000} minLength={20} name="about" placeholder={isClaim ? t.claimAboutPlaceholder : t.aboutPlaceholder} required rows={7} />
          </label>

          <div className={styles.twoColumns}>
            <label className={styles.field}><span>{t.contactName}</span><input autoComplete="name" maxLength={120} name="contactName" required /></label>
            <label className={styles.field}><span>{t.contactEmail}</span><input autoComplete="email" inputMode="email" maxLength={254} name="contactEmail" required type="email" /></label>
          </div>

          <label className="flex min-h-12 items-start gap-3 text-sm leading-6 text-[#b7b8bd]">
            <input className="mt-1 size-5 shrink-0 accent-[#c8102e]" name="consent" required type="checkbox" />
            <span>{isClaim ? t.claimConsent : t.consent}</span>
          </label>

          <div className={styles.honeypot} aria-hidden="true"><label>Website<input autoComplete="off" name="website" tabIndex={-1} /></label></div>
          <div className={styles.reviewNote}><span aria-hidden="true">●</span><p>{isClaim ? t.claimReview : t.review}</p></div>
          {error ? <p className={styles.error} role="alert">{error}</p> : null}
          <button className={styles.submitButton} disabled={busy} type="submit">
            {busy ? t.submitting : isClaim ? t.claimSubmit : t.submit}
            {!busy ? <span aria-hidden="true">→</span> : null}
          </button>
        </form>
      </main>
    </div>
  );
}
