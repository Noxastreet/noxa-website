import Link from "next/link";

import { NoxaLogo } from "@/components/brand/NoxaLogo";
import { DocumentLanguage } from "@/components/i18n/DocumentLanguage";
import { AppShowcase } from "@/components/marketing/AppShowcase";
import { WebsiteHeader } from "@/components/navigation/WebsiteHeader";
import { landingCopy, type Locale } from "@/i18n/landing-copy";

import { MotionHero } from "./MotionHero";
import { HomepageDiscoveryRail } from "./HomepageDiscoveryRail";
import { RadarHomeSpotlight } from "./RadarHomeSpotlight";
import styles from "./CultureLandingV2.module.css";
import refine from "./CultureLandingV2Refine.module.css";

type Props = { locale: Locale };

const HERO_VIDEO_URL = "/media/noxa-hero-720p.mp4?v=20260905-1";

const copy = {
  en: {
    hero: {
      eyebrow: "NOXA · AUTOMOTIVE GREECE",
      title: "The automotive platform for Greece.",
      accent: "platform",
      body: "Discover car & moto events today. The full NOXA app brings together the map, crews, live drives, profiles and your garage.",
      primary: "Explore Events",
      app: "Discover the app",
    },
    footer: { meets: "Events", app: "App" },
  },
  el: {
    hero: {
      eyebrow: "NOXA · AUTOMOTIVE ΕΛΛΑΔΑ",
      title: "Η automotive πλατφόρμα για την Ελλάδα.",
      accent: "πλατφόρμα",
      body: "Ανακάλυψε car & moto events σήμερα. Η πλήρης εμπειρία NOXA στο app ενώνει map, crews, live drives, profiles και το garage σου.",
      primary: "Δες Events",
      app: "Δες το app",
    },
    footer: { meets: "Events", app: "App" },
  },
} as const;

export function CultureLandingV2({ locale }: Props) {
  const base = landingCopy[locale];
  const t = copy[locale];
  const home = locale === "el" ? "/el" : "/";
  const meets = locale === "el" ? "/el/meets" : "/meets";
  const app = locale === "el" ? "/el/app" : "/app";

  return (
    <div className={styles.site}>
      <DocumentLanguage locale={locale} />
      <a className="skip-link" href="#main-content">{base.skipToContent}</a>
      <div className={refine.headerCompact}>
        <WebsiteHeader locale={locale} />
      </div>

      <main id="main-content">
        <MotionHero
          eyebrow={t.hero.eyebrow}
          title={t.hero.title}
          accent={t.hero.accent}
          body={t.hero.body}
          primary={t.hero.primary}
          secondary={t.hero.app}
          primaryHref={meets}
          secondaryHref={app}
          videoSrc={HERO_VIDEO_URL}
        />

        <HomepageDiscoveryRail locale={locale} />

        <div className={styles.cinematicBand}>
          <RadarHomeSpotlight locale={locale} />
        </div>

        <AppShowcase locale={locale} />
      </main>

      <footer className={styles.footer}>
        <div className={styles.shell}>
          <div className={styles.footerTop}>
            <Link aria-label="NOXA home" className={styles.footerBrand} href={home}><NoxaLogo /></Link>
            <nav aria-label="Footer">
              <Link href={meets}>{t.footer.meets}</Link>
              <Link href={app}>{t.footer.app}</Link>
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
