import Link from "next/link";

import { DocumentLanguage } from "@/components/i18n/DocumentLanguage";
import { Reveal } from "@/components/motion/Reveal";
import { WebsiteHeader } from "@/components/navigation/WebsiteHeader";
import type { Locale } from "@/i18n/landing-copy";

import styles from "./MarketingPages.module.css";

const copy = {
  en: {
    eyebrow: "FOR ORGANIZERS",
    title: "Put your event in front of the right automotive audience.",
    body: "NOXA gives car clubs, moto communities and event organizers a simple public entry point. Submit the event, we review the information, and approved events can appear in NOXA discovery.",
    primary: "Add an Event",
    secondary: "Explore Events",
    steps: [
      ["01", "Submit", "Send the essential event information and official source."],
      ["02", "Verify", "NOXA reviews the details before public discovery."],
      ["03", "Discover", "People can find, save, share and add the event to their calendar."],
    ],
  },
  el: {
    eyebrow: "ΓΙΑ ΔΙΟΡΓΑΝΩΤΕΣ",
    title: "Βάλε το event σου μπροστά στο σωστό automotive κοινό.",
    body: "Το NOXA δίνει σε car clubs, moto communities και διοργανωτές ένα απλό δημόσιο σημείο εισόδου. Στέλνεις το event, ελέγχουμε τις πληροφορίες και τα εγκεκριμένα events μπορούν να εμφανιστούν στο NOXA discovery.",
    primary: "Πρόσθεσε Event",
    secondary: "Δες Events",
    steps: [
      ["01", "Υποβολή", "Στείλε τις βασικές πληροφορίες και την επίσημη πηγή του event."],
      ["02", "Έλεγχος", "Το NOXA ελέγχει τα στοιχεία πριν τη δημόσια εμφάνιση."],
      ["03", "Ανακάλυψη", "Ο κόσμος μπορεί να βρει, να αποθηκεύσει, να μοιραστεί και να βάλει το event στο ημερολόγιο."],
    ],
  },
} as const;

export function OrganizersMarketingPage({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const base = locale === "el" ? "/el" : "";

  return (
    <div className={styles.page}>
      <DocumentLanguage locale={locale} />
      <WebsiteHeader locale={locale} path="/organizers" />
      <main>
        <section className={styles.organizerHero}>
          <Reveal className={styles.inner}>
            <p className={styles.eyebrow}>{t.eyebrow}</p>
            <h1>{t.title}</h1>
            <p>{t.body}</p>
            <div className={styles.ctaRow}>
              <Link className={styles.primary} href={`${base}/meets/submit`}>{t.primary}</Link>
              <Link className={styles.secondary} href={`${base}/meets`}>{t.secondary}</Link>
            </div>
          </Reveal>
        </section>

        <section aria-label={t.eyebrow}>
          <Reveal className={styles.organizerSteps} delay={0.08}>
            {t.steps.map(([index, title, body]) => (
              <article className={styles.organizerStep} key={index}>
                <span>{index}</span>
                <h2>{title}</h2>
                <p>{body}</p>
              </article>
            ))}
          </Reveal>
        </section>
      </main>
    </div>
  );
}
