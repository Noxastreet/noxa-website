import Link from "next/link";

import type { Locale } from "@/i18n/landing-copy";

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
    label: "Interactive NOXA automotive map preview",
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
    label: "Προεπισκόπηση automotive χάρτη NOXA",
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

        <Link href={mapHref} className={styles.mapFrame} aria-label={t.label}>
          <div className={styles.mapTopbar} aria-hidden="true">
            <span className={styles.mapBrand}>NOXA MAP</span>
            <span className={styles.searchMock}>Search Greece</span>
            <span className={styles.locationMock}><i className={styles.locationCrosshair} /></span>
          </div>

          <svg className={styles.mapArtwork} viewBox="0 0 1200 680" role="presentation" aria-hidden="true">
            <rect width="1200" height="680" fill="#080a0d" />
            <path d="M0 84C130 62 206 88 304 132C401 176 455 184 536 161C630 134 700 82 803 91C919 101 997 162 1200 129V680H0Z" fill="#181b20" />
            <path d="M0 168C120 144 196 161 280 212C359 261 441 272 537 236C626 202 706 144 797 160C915 181 1012 248 1200 210" fill="none" stroke="#30353c" strokeWidth="2" />
            <path d="M72 521C185 474 234 389 330 339C428 288 477 288 555 333C640 382 684 423 787 391C904 354 972 271 1124 260" fill="none" stroke="#8d929a" strokeWidth="5" strokeLinecap="round" />
            <path d="M151 124C262 182 318 219 355 299C391 379 441 422 541 456C647 492 750 487 846 530C939 571 1034 597 1164 582" fill="none" stroke="#5f656d" strokeWidth="3" strokeLinecap="round" />
            <path d="M322 655C376 561 410 504 474 451C545 391 611 370 698 318C785 265 852 207 916 108" fill="none" stroke="#6f747c" strokeWidth="3" strokeLinecap="round" />
            <path d="M470 220C558 242 604 272 638 344C666 404 720 447 819 457" fill="none" stroke="#e32c49" strokeWidth="5" strokeLinecap="round" strokeDasharray="10 14" opacity=".9" />
            <path d="M540 590C618 545 679 518 752 514C824 510 889 532 968 568" fill="none" stroke="#ff8a3d" strokeWidth="4" strokeLinecap="round" opacity=".95" />
            <g opacity=".72" fill="#8f949d" fontFamily="system-ui, sans-serif" fontWeight="700">
              <text x="477" y="280" fontSize="30">GREECE</text>
              <text x="855" y="383" fontSize="22">ATHENS</text>
              <text x="559" y="126" fontSize="21">THESSALONIKI</text>
              <text x="635" y="565" fontSize="19">PELOPONNESE</text>
            </g>
          </svg>

          <div className={`${styles.poi} ${styles.poiEvent} ${styles.poiOne}`} aria-hidden="true"><span className={styles.poiEventIcon} /></div>
          <div className={`${styles.poi} ${styles.poiTrack} ${styles.poiTwo}`} aria-hidden="true"><span className={styles.poiTrackIcon} /></div>
          <div className={`${styles.poi} ${styles.poiRoute} ${styles.poiThree}`} aria-hidden="true"><span className={styles.poiRouteIcon} /></div>
          <div className={`${styles.poi} ${styles.poiPlace} ${styles.poiFour}`} aria-hidden="true"><span className={styles.poiPlaceIcon} /></div>

          <div className={styles.mapLegend} aria-hidden="true">
            <span><i className={styles.eventDot} />{t.events}</span>
            <span><i className={styles.trackDot} />{t.tracks}</span>
            <span><i className={styles.routeDot} />{t.routes}</span>
            <span><i className={styles.placeDot} />{t.places}</span>
          </div>

          <div className={styles.mapCta} aria-hidden="true">
            <strong>{t.cta}</strong><span>→</span>
          </div>
        </Link>
      </div>
    </section>
  );
}
