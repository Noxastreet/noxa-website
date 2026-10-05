import Link from "next/link";

import { DocumentLanguage } from "@/components/i18n/DocumentLanguage";
import { Reveal } from "@/components/motion/Reveal";
import { WebsiteHeader } from "@/components/navigation/WebsiteHeader";
import type { Locale } from "@/i18n/landing-copy";

import { AppShowcase } from "./AppShowcase";
import styles from "./MarketingPages.module.css";

const copy = {
  en: {
    eyebrow: "NOXA MOBILE",
    title: "Built for the road, not the browser.",
    body: "NOXA is an automotive social and spatial app. Discover events on the web, then use the app for the map, crews, live drives, profiles and your garage.",
    events: "Explore Events",
    add: "Add an Event",
  },
  el: {
    eyebrow: "NOXA MOBILE",
    title: "Φτιαγμένο για τον δρόμο, όχι για τον browser.",
    body: "Το NOXA είναι automotive social και spatial app. Ανακάλυψε events στο web και χρησιμοποίησε το app για map, crews, live drives, profiles και garage.",
    events: "Δες Events",
    add: "Πρόσθεσε Event",
  },
} as const;

export function AppMarketingPage({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const base = locale === "el" ? "/el" : "";

  return (
    <div className={styles.page}>
      <DocumentLanguage locale={locale} />
      <WebsiteHeader locale={locale} path="/app" />
      <main>
        <section className={styles.pageHero}>
          <Reveal className={styles.inner}>
            <p className={styles.eyebrow}>{t.eyebrow}</p>
            <h1>{t.title}</h1>
            <p>{t.body}</p>
            <div className={styles.ctaRow}>
              <Link className={styles.primary} href={`${base}/meets`}>{t.events}</Link>
              <Link className={styles.secondary} href={`${base}/meets/submit`}>{t.add}</Link>
            </div>
          </Reveal>
        </section>
        <AppShowcase locale={locale} />
      </main>
    </div>
  );
}
