import Link from "next/link";

import { NoxaLogo } from "@/components/brand/NoxaLogo";
import { DocumentLanguage } from "@/components/i18n/DocumentLanguage";
import { HomepageMapPreview } from "@/components/map/HomepageMapPreview";
import { WebsiteHeader } from "@/components/navigation/WebsiteHeader";
import { WaitlistForm } from "@/components/waitlist/WaitlistForm";
import { landingCopy, type Locale } from "@/i18n/landing-copy";

import videoStyles from "./CultureHeroVideo.module.css";
import { HeroVideo } from "./HeroVideo";
import { HomepageDiscoveryRail } from "./HomepageDiscoveryRail";
import { RadarHomeSpotlight } from "./RadarHomeSpotlight";
import styles from "./CultureLandingV2.module.css";
import refine from "./CultureLandingV2Refine.module.css";

type Props = { locale: Locale };

const HERO_VIDEO_URL = "/media/noxa-hero-720p.mp4?v=20260905-1";

const copy = {
  en: {
    nav: { meets: "Meets", communities: "Communities", business: "Business", app: "NOXA App" },
    hero: {
      eyebrow: "NOXA · GREECE",
      title: "Discover car & moto events across Greece.",
      body: "See what’s happening this weekend, explore the map and find the crews and businesses shaping the scene.",
      primary: "Explore Events",
      map: "Open NOXA Map",
      app: "NOXA App · Coming soon",
    },
    paths: {
      communities: {
        eyebrow: "COMMUNITY",
        title: "Find your crew.",
        body: "Discover car and moto crews and communities near you.",
        cta: "Explore Community",
      },
      business: {
        eyebrow: "BUSINESS & PARTNERS",
        title: "Meet the businesses behind the culture.",
        body: "Discover automotive businesses and partners connected to the NOXA community.",
        cta: "Explore Business",
      },
    },
    culture: { line1: "Different cars.", line2: "Same passion." },
    app: {
      eyebrow: "NOXA APP · COMING SOON",
      title: "The road becomes social.",
      body: "Meets. Crews. Routes. Live Map.",
      cta: "Join Early Access",
    },
    footer: { meets: "Meets", communities: "Community", business: "Business", app: "Early Access", instagram: "Instagram" },
  },
  el: {
    nav: { meets: "Meets", communities: "Κοινότητες", business: "Business", app: "NOXA App" },
    hero: {
      eyebrow: "NOXA · ΕΛΛΑΔΑ",
      title: "Ανακάλυψε car & moto events σε όλη την Ελλάδα.",
      body: "Δες τι γίνεται αυτό το weekend, εξερεύνησε τον χάρτη και βρες τα crews και τις επιχειρήσεις που διαμορφώνουν τη σκηνή.",
      primary: "Δες Events",
      map: "Άνοιξε το NOXA Map",
      app: "NOXA App · Σύντομα",
    },
    paths: {
      communities: {
        eyebrow: "COMMUNITY",
        title: "Βρες το crew σου.",
        body: "Ανακάλυψε car και moto crews και κοινότητες κοντά σου.",
        cta: "Δες Community",
      },
      business: {
        eyebrow: "BUSINESS & PARTNERS",
        title: "Βρες τις επιχειρήσεις πίσω από την κουλτούρα.",
        body: "Ανακάλυψε automotive επιχειρήσεις και partners που συνδέονται με την κοινότητα του NOXA.",
        cta: "Δες Business",
      },
    },
    culture: { line1: "Different cars.", line2: "Same passion." },
    app: {
      eyebrow: "NOXA APP · ΣΥΝΤΟΜΑ",
      title: "The road becomes social.",
      body: "Meets. Crews. Routes. Live Map.",
      cta: "Μπες στο Early Access",
    },
    footer: { meets: "Meets", communities: "Community", business: "Business", app: "Early Access", instagram: "Instagram" },
  },
} as const;

export function CultureLandingV2({ locale }: Props) {
  const base = landingCopy[locale];
  const t = copy[locale];
  const home = locale === "el" ? "/el" : "/";
  const meets = locale === "el" ? "/el/meets" : "/meets";
  const map = locale === "el" ? "/el/map" : "/map";
  const communities = locale === "el" ? "/el/communities" : "/communities";
  const business = "/business";

  return (
    <div className={styles.site}>
      <DocumentLanguage locale={locale} />
      <a className="skip-link" href="#main-content">{base.skipToContent}</a>
      <div className={refine.headerCompact}>
        <WebsiteHeader locale={locale} />
      </div>

      <main id="main-content">
        <section className={`${styles.hero} ${refine.heroRefined}`} id="top">
          <div className={`${styles.heroMedia} ${videoStyles.media}`} aria-hidden="true">
            <HeroVideo className={videoStyles.video} src={HERO_VIDEO_URL} />
          </div>
          <div className={styles.heroShade} aria-hidden="true" />
          <div className={styles.shell}>
            <div className={styles.heroCopy}>
              <p className={styles.eyebrow}>{t.hero.eyebrow}</p>
              <h1>{t.hero.title}</h1>
              <p className={styles.heroBody}>{t.hero.body}</p>
              <div className={styles.heroActions}>
                <Link className={styles.primaryButton} href={meets}>{t.hero.primary} <span aria-hidden="true">→</span></Link>
                <Link className={styles.secondaryButton} href={map}>{t.hero.map} <span aria-hidden="true">↗</span></Link>
              </div>
              <a className={styles.appHint} href="#app">{t.hero.app} <span aria-hidden="true">↓</span></a>
            </div>
          </div>
        </section>

        <HomepageDiscoveryRail locale={locale} />

        <div className={styles.cinematicBand}>
          <RadarHomeSpotlight locale={locale} />
        </div>

        <HomepageMapPreview locale={locale} />

        <section className={`${styles.pathsSection} ${styles.revealSection} ${refine.pathsRefined}`}>
          <div className={styles.shell}>
            <div className={`${styles.pathsGrid} ${refine.pathsGridRefined}`}>
              <Link className={`${styles.pathCard} ${styles.communityCard} ${refine.pathCardRefined}`} href={communities}>
                <div className={`${styles.pathShade} ${refine.pathShadeRefined}`} />
                <div className={`${styles.pathCopy} ${refine.pathCopyRefined}`}>
                  <p className={styles.eyebrow}>{t.paths.communities.eyebrow}</p>
                  <h2>{t.paths.communities.title}</h2>
                  <p>{t.paths.communities.body}</p>
                  <strong>{t.paths.communities.cta} <span aria-hidden="true">→</span></strong>
                </div>
              </Link>

              <Link className={`${styles.pathCard} ${styles.organizerCard} ${refine.pathCardRefined}`} href={business}>
                <div className={`${styles.pathShade} ${refine.pathShadeRefined}`} />
                <div className={`${styles.pathCopy} ${refine.pathCopyRefined}`}>
                  <p className={styles.eyebrow}>{t.paths.business.eyebrow}</p>
                  <h2>{t.paths.business.title}</h2>
                  <p>{t.paths.business.body}</p>
                  <strong>{t.paths.business.cta} <span aria-hidden="true">→</span></strong>
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
              <Link href={business}>{t.footer.business}</Link>
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
