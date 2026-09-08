import Link from "next/link";

import type { Locale } from "@/i18n/landing-copy";

import { HomepageMapCanvas } from "./HomepageMapCanvas";
import styles from "./HomepageMapPreview.module.css";

type Props = { locale: Locale };

const copy = {
  en: {
    eyebrow: "EXPLORE GREECE",
    title: "The automotive map of Greece.",
    body: "Events, tracks, roads and verified automotive places — built around the NOXA event ecosystem.",
    cta: "Open NOXA Map",
    events: "Events",
    tracks: "Tracks",
    routes: "Routes",
    places: "Places",
    city: "THESSALONIKI",
    label: "Real NOXA map preview centered on Thessaloniki",
    credits: "Map credits",
  },
  el: {
    eyebrow: "ΕΞΕΡΕΥΝΗΣΕ ΤΗΝ ΕΛΛΑΔΑ",
    title: "Ο automotive χάρτης της Ελλάδας.",
    body: "Events, πίστες, δρόμοι και επαληθευμένα automotive μέρη — γύρω από το οικοσύστημα events της NOXA.",
    cta: "Άνοιξε το NOXA Map",
    events: "Events",
    tracks: "Πίστες",
    routes: "Διαδρομές",
    places: "Μέρη",
    city: "ΘΕΣΣΑΛΟΝΙΚΗ",
    label: "Πραγματική προεπισκόπηση του NOXA Map με κέντρο τη Θεσσαλονίκη",
    credits: "Στοιχεία χάρτη",
  },
} as const;

export function HomepageMapPreview({ locale }: Props) {
  const t = copy[locale];
  const mapHref = locale === "el" ? "/el/map" : "/map";

  return (
    <section className={styles.section} aria-labelledby="home-map-title">
      <div className={styles.shell}>
        <div className={styles.heading}>
          <div>
            <p className={styles.eyebrow}>{t.eyebrow}</p>
            <h2 id="home-map-title">{t.title}</h2>
          </div>
          <div className={styles.headingAside}>
            <p>{t.body}</p>
            <Link href={mapHref}>{t.cta}<span aria-hidden="true">↗</span></Link>
          </div>
        </div>

        <div className={styles.mapFrame} role="group" aria-label={t.label}>
          <HomepageMapCanvas />

          <div className={styles.cityBadge} aria-hidden="true">
            <i />
            <span>{t.city}</span>
          </div>

          <details className={styles.mapCredits}>
            <summary aria-label={t.credits} title={t.credits}>©</summary>
            <div className={styles.mapCreditsPanel}>
              <a href="https://openfreemap.org/" target="_blank" rel="noreferrer">OpenFreeMap</a>
              <span>·</span>
              <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>
            </div>
          </details>

          <div className={styles.mapLegend} aria-hidden="true">
            <span><i className={styles.eventDot} />{t.events}</span>
            <span><i className={styles.trackDot} />{t.tracks}</span>
            <span><i className={styles.routeDot} />{t.routes}</span>
            <span><i className={styles.placeDot} />{t.places}</span>
          </div>

          <Link href={mapHref} className={styles.mapCta} aria-label={t.cta}>
            <strong>{t.cta}</strong><span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
