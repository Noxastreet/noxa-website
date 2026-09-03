import Link from "next/link";

import { DocumentLanguage } from "@/components/i18n/DocumentLanguage";
import { SiteHeader } from "@/components/navigation/SiteHeader";
import { WaitlistForm } from "@/components/waitlist/WaitlistForm";
import { landingCopy, type Locale } from "@/i18n/landing-copy";

import { RadarHomeSpotlight } from "./RadarHomeSpotlight";
import styles from "./CultureLandingV2.module.css";

type Props = { locale: Locale };

const copy = {
  en: {
    nav: {
      meets: "Meets",
      communities: "Communities",
      add: "Add Event",
      organizer: "Organizer",
      app: "NOXA App",
    },
    hero: {
      eyebrow: "NOXA · GREECE",
      title: "Find car & moto meets across Greece.",
      body: "Events, communities and automotive culture — all in one place.",
      primary: "Explore Meets",
      secondary: "Add an Event",
      app: "NOXA App · Coming soon",
    },
    paths: {
      title: "Choose your way in.",
      communities: {
        eyebrow: "COMMUNITIES",
        title: "Find your community.",
        body: "Discover car and moto communities near you.",
        cta: "Explore Communities",
      },
      organizer: {
        eyebrow: "ORGANIZERS",
        title: "Run your events on NOXA.",
        body: "Create, publish and manage your meets from one place.",
        cta: "Organizer Login",
      },
    },
    culture: {
      line1: "Different cars.",
      line2: "Same passion.",
    },
    app: {
      eyebrow: "NOXA APP · COMING SOON",
      title: "The road becomes social.",
      body: "Meets. Crews. Routes. Live Map.",
      cta: "Join Early Access",
    },
    footer: {
      meets: "Meets",
      communities: "Communities",
      organizers: "Organizer",
      add: "Add Event",
      app: "Early Access",
      instagram: "Instagram",
    },
  },
  el: {
    nav: {
      meets: "Meets",
      communities: "Κοινότητες",
      add: "Πρόσθεσε Event",
      organizer: "Organizer",
      app: "NOXA App",
    },
    hero: {
      eyebrow: "NOXA · ΕΛΛΑΔΑ",
      title: "Βρες car & moto meets σε όλη την Ελλάδα.",
      body: "Events, κοινότητες και automotive culture — όλα σε ένα μέρος.",
      primary: "Βρες Meets",
      secondary: "Πρόσθεσε Event",
      app: "NOXA App · Σύντομα",
    },
    paths: {
      title: "Διάλεξε τι θέλεις να κάνεις.",
      communities: {
        eyebrow: "ΚΟΙΝΟΤΗΤΕΣ",
        title: "Βρες την κοινότητά σου.",
        body: "Ανακάλυψε car και moto κοινότητες κοντά σου.",
        cta: "Δες Κοινότητες",
      },
      organizer: {
        eyebrow: "ORGANIZERS",
        title: "Διαχειρίσου τα events σου στο NOXA.",
        body: "Δημιούργησε, δημοσίευσε και διαχειρίσου τα meets σου.",
        cta: "Organizer Login",
      },
    },
    culture: {
      line1: "Different cars.",
      line2: "Same passion.",
    },
    app: {
      eyebrow: "NOXA APP · ΣΥΝΤΟΜΑ",
      title: "The road becomes social.",
      body: "Meets. Crews. Routes. Live Map.",
      cta: "Μπες στο Early Access",
    },
    footer: {
      meets: "Meets",
      communities: "Κοινότητες",
      organizers: "Organizer",
      add: "Πρόσθεσε Event",
      app: "Early Access",
      instagram: "Instagram",
    },
  },
} as const;

export function CultureLandingV2({ locale }: Props) {
  const base = landingCopy[locale];
  const t = copy[locale];
  const home = locale === "el" ? "/el" : "/";
  const meets = locale === "el" ? "/el/meets" : "/meets";
  const communities = locale === "el" ? "/el/communities" : "/communities";
  const organizer = locale === "el" ? "/el/organizer" : "/organizer";
  const addEvent = locale === "el" ? "/el/meets/submit" : "/meets/submit";

  const navigationCopy = {
    ...base.navigation,
    join: t.nav.app,
    items: [
      [t.nav.meets, meets],
      [t.nav.communities, communities],
      [t.nav.add, addEvent],
      [t.nav.organizer, organizer],
    ] as const,
  };

  return (
    <div className={styles.site}>
      <DocumentLanguage locale={locale} />
      <a className="skip-link" href="#main-content">{base.skipToContent}</a>
      <SiteHeader
        homeHref={home}
        joinHref="#app"
        languageCopy={base.language}
        languagePaths={{ en: "/", el: "/el" }}
        locale={locale}
        navigationCopy={navigationCopy}
      />

      <main id="main-content">
        <section className={styles.hero} id="top">
          <div className={styles.heroMedia} aria-hidden="true" />
          <div className={styles.heroShade} aria-hidden="true" />
          <div className={styles.heroNoise} aria-hidden="true" />
          <div className={styles.shell}>
            <div className={styles.heroCopy}>
              <p className={styles.eyebrow}>{t.hero.eyebrow}</p>
              <h1>{t.hero.title}</h1>
              <p className={styles.heroBody}>{t.hero.body}</p>
              <div className={styles.heroActions}>
                <Link className={styles.primaryButton} href={meets}>{t.hero.primary} <span aria-hidden="true">→</span></Link>
                <Link className={styles.secondaryButton} href={addEvent}>{t.hero.secondary}</Link>
              </div>
              <a className={styles.appHint} href="#app">{t.hero.app} <span aria-hidden="true">↓</span></a>
            </div>
          </div>
        </section>

        <RadarHomeSpotlight locale={locale} />

        <section className={styles.pathsSection}>
          <div className={styles.shell}>
            <h2>{t.paths.title}</h2>
            <div className={styles.pathsGrid}>
              <Link className={`${styles.pathCard} ${styles.communityCard}`} href={communities}>
                <div className={styles.pathShade} />
                <div className={styles.pathCopy}>
                  <p className={styles.eyebrow}>{t.paths.communities.eyebrow}</p>
                  <h3>{t.paths.communities.title}</h3>
                  <p>{t.paths.communities.body}</p>
                  <strong>{t.paths.communities.cta} <span aria-hidden="true">→</span></strong>
                </div>
              </Link>

              <Link className={`${styles.pathCard} ${styles.organizerCard}`} href={organizer}>
                <div className={styles.pathShade} />
                <div className={styles.pathCopy}>
                  <p className={styles.eyebrow}>{t.paths.organizer.eyebrow}</p>
                  <h3>{t.paths.organizer.title}</h3>
                  <p>{t.paths.organizer.body}</p>
                  <strong>{t.paths.organizer.cta} <span aria-hidden="true">→</span></strong>
                </div>
              </Link>
            </div>
          </div>
        </section>

        <section className={styles.cultureSection} aria-label="NOXA automotive culture">
          <div className={styles.cultureMedia} aria-hidden="true" />
          <div className={styles.cultureShade} aria-hidden="true" />
          <div className={styles.shell}>
            <p>{t.culture.line1}</p>
            <strong>{t.culture.line2}</strong>
            <span>NOXA</span>
          </div>
        </section>

        <section className={styles.appSection} id="app">
          <div className={styles.shell}>
            <div className={styles.appGrid}>
              <div>
                <p className={styles.eyebrow}>{t.app.eyebrow}</p>
                <h2>{t.app.title}</h2>
                <p className={styles.appBody}>{t.app.body}</p>
              </div>
              <div className={styles.waitlistWrap}>
                <p className={styles.waitlistTitle}>{t.app.cta}</p>
                <WaitlistForm copy={base.waitlist} locale={locale} />
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.shell}>
          <div className={styles.footerTop}>
            <Link className={styles.footerBrand} href={home}>NOXA</Link>
            <nav aria-label="Footer">
              <Link href={meets}>{t.footer.meets}</Link>
              <Link href={communities}>{t.footer.communities}</Link>
              <Link href={organizer}>{t.footer.organizers}</Link>
              <Link href={addEvent}>{t.footer.add}</Link>
              <a href="#app">{t.footer.app}</a>
              <a href="https://www.instagram.com/noxa_app/" rel="noreferrer" target="_blank">{t.footer.instagram}</a>
            </nav>
          </div>
          <div className={styles.footerBottom}>
            <span>© 2026 NOXA</span>
            <span>S. KARAKETIDIS</span>
            <div>
              <Link href="/privacy">Privacy</Link>
              <Link href="/terms">Terms</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
