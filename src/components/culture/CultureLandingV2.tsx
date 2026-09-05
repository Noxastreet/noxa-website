import Link from "next/link";

import { NoxaLogo } from "@/components/brand/NoxaLogo";
import { DocumentLanguage } from "@/components/i18n/DocumentLanguage";
import { SiteHeader } from "@/components/navigation/SiteHeader";
import { WaitlistForm } from "@/components/waitlist/WaitlistForm";
import { landingCopy, type Locale } from "@/i18n/landing-copy";

import videoStyles from "./CultureHeroVideo.module.css";
import { HeroVideo } from "./HeroVideo";
import { RadarHomeSpotlight } from "./RadarHomeSpotlight";
import styles from "./CultureLandingV2.module.css";
import refine from "./CultureLandingV2Refine.module.css";

type Props = { locale: Locale };

const HERO_VIDEO_URL = "/media/noxa-hero-720p.mp4?v=20260905-1";
const DESKTOP_HERO_POSTER_URL =
  "/_next/image?url=https%3A%2F%2Fimages.pexels.com%2Fphotos%2F17716197%2Fpexels-photo-17716197.jpeg%3Fauto%3Dcompress%26cs%3Dtinysrgb%26w%3D1600&w=1200&q=75";

const copy = {
  en: {
    nav: {
      meets: "Meets",
      communities: "Communities",
      organizer: "Organizer",
      app: "NOXA App",
    },
    hero: {
      eyebrow: "NOXA · GREECE",
      title: "Find car & moto meets across Greece.",
      body: "Events, communities and automotive culture — all in one place.",
      primary: "Explore Meets",
      app: "NOXA App · Coming soon",
    },
    paths: {
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
      app: "Early Access",
      instagram: "Instagram",
    },
  },
  el: {
    nav: {
      meets: "Meets",
      communities: "Κοινότητες",
      organizer: "Organizer",
      app: "NOXA App",
    },
    hero: {
      eyebrow: "NOXA · ΕΛΛΑΔΑ",
      title: "Βρες car & moto meets σε όλη την Ελλάδα.",
      body: "Events, κοινότητες και automotive culture — όλα σε ένα μέρος.",
      primary: "Βρες Meets",
      app: "NOXA App · Σύντομα",
    },
    paths: {
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

  const navigationCopy = {
    ...base.navigation,
    join: t.nav.app,
    items: [
      [t.nav.meets, meets],
      [t.nav.communities, communities],
      [t.nav.organizer, organizer],
    ] as const,
  };

  return (
    <div className={styles.site}>
      <link rel="preload" href={DESKTOP_HERO_POSTER_URL} as="image" media="(min-width: 821px)" fetchPriority="high" />
      <DocumentLanguage locale={locale} />
      <a className="skip-link" href="#main-content">{base.skipToContent}</a>
      <div className={refine.headerCompact}>
        <SiteHeader
          homeHref={home}
          joinHref="#app"
          languageCopy={base.language}
          languagePaths={{ en: "/", el: "/el" }}
          locale={locale}
          navigationCopy={navigationCopy}
        />
      </div>

      <main id="main-content">
        <section className={`${styles.hero} ${refine.heroRefined}`} id="top">
          <div className={`${styles.heroMedia} ${videoStyles.media}`} aria-hidden="true">
            <HeroVideo className={videoStyles.video} src={HERO_VIDEO_URL} />
          </div>
          <div className={styles.heroShade} aria-hidden="true" />
          <div className={styles.heroNoise} aria-hidden="true" />
          <div className={styles.heroAccent} aria-hidden="true" />
          <div className={styles.shell}>
            <div className={styles.heroCopy}>
              <p className={styles.eyebrow}>{t.hero.eyebrow}</p>
              <h1>{t.hero.title}</h1>
              <p className={styles.heroBody}>{t.hero.body}</p>
              <div className={styles.heroActions}>
                <Link className={styles.primaryButton} href={meets}>{t.hero.primary} <span aria-hidden="true">→</span></Link>
              </div>
              <a className={styles.appHint} href="#app">{t.hero.app} <span aria-hidden="true">↓</span></a>
            </div>
          </div>
        </section>

        <div className={styles.cinematicBand}>
          <RadarHomeSpotlight locale={locale} />
        </div>

        <section className={`${styles.pathsSection} ${styles.revealSection} ${refine.pathsRefined}`}>
          <div className={styles.shell}>
            <div className={`${styles.pathsGrid} ${refine.pathsGridRefined}`}>
              <Link className={`${styles.pathCard} ${styles.communityCard} ${refine.pathCardRefined}`} href={communities}>
                <div className={`${styles.pathShade} ${refine.pathShadeRefined}`} />
                <div className={`${styles.pathCopy} ${refine.pathCopyRefined}`}>
                  <p className={styles.eyebrow}>{t.paths.communities.eyebrow}</p>
                  <h3>{t.paths.communities.title}</h3>
                  <p>{t.paths.communities.body}</p>
                  <strong>{t.paths.communities.cta} <span aria-hidden="true">→</span></strong>
                </div>
              </Link>

              <Link className={`${styles.pathCard} ${styles.organizerCard} ${refine.pathCardRefined}`} href={organizer}>
                <div className={`${styles.pathShade} ${refine.pathShadeRefined}`} />
                <div className={`${styles.pathCopy} ${refine.pathCopyRefined}`}>
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
          <div className={`${styles.cultureMedia} ${refine.cultureMediaRefined}`} aria-hidden="true" />
          <div className={`${styles.cultureShade} ${refine.cultureShadeRefined}`} aria-hidden="true" />
          <div className={styles.cultureNoise} aria-hidden="true" />
          <div className={styles.shell}>
            <p>{t.culture.line1}</p>
            <strong>{t.culture.line2}</strong>
            <span>NOXA</span>
          </div>
        </section>

        <section className={`${styles.appSection} ${styles.revealSection} ${refine.appRefined}`} id="app">
          <div className={styles.shell}>
            <div className={styles.appGrid}>
              <div>
                <p className={styles.eyebrow}>{t.app.eyebrow}</p>
                <h2>{t.app.title}</h2>
                <p className={styles.appBody}>{t.app.body}</p>
              </div>
              <div className={`${styles.waitlistWrap} ${refine.waitlistCompact}`}>
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
            <Link aria-label="NOXA home" className={styles.footerBrand} href={home}><NoxaLogo /></Link>
            <nav aria-label="Footer">
              <Link href={meets}>{t.footer.meets}</Link>
              <Link href={communities}>{t.footer.communities}</Link>
              <Link href={organizer}>{t.footer.organizers}</Link>
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
