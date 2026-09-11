import Link from "next/link";

import { NoxaLogo } from "@/components/brand/NoxaLogo";
import { DocumentLanguage } from "@/components/i18n/DocumentLanguage";
import { HomepageMapPreview } from "@/components/map/HomepageMapPreview";
import { WebsiteHeader } from "@/components/navigation/WebsiteHeader";
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
    hero: {
      eyebrow: "NOXA · GREECE",
      title: "Car & moto events across Greece.",
      body: "Find what is happening, open the event details and explore the automotive scene directly on the NOXA Map.",
      primary: "Explore Events",
      map: "Open NOXA Map",
    },
    footer: { meets: "Events", map: "Map" },
  },
  el: {
    hero: {
      eyebrow: "NOXA · ΕΛΛΑΔΑ",
      title: "Car & moto events σε όλη την Ελλάδα.",
      body: "Βρες τι γίνεται, δες τις λεπτομέρειες κάθε event και εξερεύνησε την automotive σκηνή απευθείας στο NOXA Map.",
      primary: "Δες Events",
      map: "Άνοιξε το NOXA Map",
    },
    footer: { meets: "Events", map: "Map" },
  },
} as const;

export function CultureLandingV2({ locale }: Props) {
  const base = landingCopy[locale];
  const t = copy[locale];
  const home = locale === "el" ? "/el" : "/";
  const meets = locale === "el" ? "/el/meets" : "/meets";
  const map = locale === "el" ? "/el/map" : "/map";

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
            </div>
          </div>
        </section>

        <HomepageDiscoveryRail locale={locale} />

        <div className={styles.cinematicBand}>
          <RadarHomeSpotlight locale={locale} />
        </div>

        <HomepageMapPreview locale={locale} />
      </main>

      <footer className={styles.footer}>
        <div className={styles.shell}>
          <div className={styles.footerTop}>
            <Link aria-label="NOXA home" className={styles.footerBrand} href={home}><NoxaLogo /></Link>
            <nav aria-label="Footer">
              <Link href={meets}>{t.footer.meets}</Link>
              <Link href={map}>{t.footer.map}</Link>
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
