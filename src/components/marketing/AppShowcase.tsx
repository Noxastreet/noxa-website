import Link from "next/link";

import type { Locale } from "@/i18n/landing-copy";

import styles from "./MarketingPages.module.css";

const copy = {
  en: {
    eyebrow: "THE NOXA APP",
    title: "The full experience lives in the app.",
    body: "The website helps you discover what is happening. The app is where NOXA becomes your automotive space.",
    status: "Mobile app · coming to iOS & Android",
    cta: "Discover the app",
    features: [
      ["01", "Map", "See the automotive world around you."],
      ["02", "Crew", "Your people, vehicles and community in one place."],
      ["03", "Live Drive", "Drive together and stay connected on the road."],
      ["04", "Garage", "Build your profile around the vehicles you own."],
      ["05", "Events", "Move from discovery to the event without losing context."],
    ],
  },
  el: {
    eyebrow: "ΤΟ NOXA APP",
    title: "Η πλήρης εμπειρία βρίσκεται στο app.",
    body: "Το website σε βοηθά να ανακαλύψεις τι γίνεται. Στο app το NOXA γίνεται ο δικός σου automotive χώρος.",
    status: "Mobile app · έρχεται σε iOS & Android",
    cta: "Δες το app",
    features: [
      ["01", "Map", "Δες την automotive σκηνή γύρω σου."],
      ["02", "Crew", "Άτομα, οχήματα και κοινότητα σε ένα μέρος."],
      ["03", "Live Drive", "Οδήγησε μαζί με άλλους και μείνε συνδεδεμένος."],
      ["04", "Garage", "Χτίσε το profile σου γύρω από τα οχήματά σου."],
      ["05", "Events", "Από την ανακάλυψη στο event χωρίς να χάνεις το context."],
    ],
  },
} as const;

export function AppShowcase({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const href = locale === "el" ? "/el/app" : "/app";

  return (
    <section className={styles.section} aria-labelledby="noxa-app-heading">
      <div className={styles.shell}>
        <div className={styles.heading}>
          <div>
            <p className={styles.eyebrow}>{t.eyebrow}</p>
            <h2 id="noxa-app-heading">{t.title}</h2>
          </div>
          <div>
            <p className={styles.body}>{t.body}</p>
            <p className={styles.status}>{t.status}</p>
            <div className={styles.ctaRow}>
              <Link className={styles.secondary} href={href}>{t.cta} <span aria-hidden="true">→</span></Link>
            </div>
          </div>
        </div>

        <div className={styles.featureGrid}>
          {t.features.map(([index, title, body]) => (
            <article className={styles.feature} key={index}>
              <span>{index}</span>
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
