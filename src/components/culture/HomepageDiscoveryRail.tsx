import Link from "next/link";

import type { Locale } from "@/i18n/landing-copy";

import styles from "./HomepageDiscoveryRail.module.css";

type Props = { locale: Locale };

type Item = {
  index: string;
  eyebrow: string;
  title: string;
  body: string;
  href: string;
};

const copy = {
  en: {
    label: "Explore NOXA events and map",
    items: [
      {
        index: "01",
        eyebrow: "CAR & MOTO EVENTS",
        title: "See what’s happening.",
        body: "Verified automotive and motorcycle events happening across Greece.",
      },
      {
        index: "02",
        eyebrow: "NOXA MAP",
        title: "Explore the scene.",
        body: "Open the map and discover events, tracks, routes and automotive places across Greece.",
      },
    ],
  },
  el: {
    label: "Εξερεύνησε NOXA events και map",
    items: [
      {
        index: "01",
        eyebrow: "CAR & MOTO EVENTS",
        title: "Δες τι γίνεται.",
        body: "Verified automotive και motorcycle events σε όλη την Ελλάδα.",
      },
      {
        index: "02",
        eyebrow: "NOXA MAP",
        title: "Εξερεύνησε τη σκηνή.",
        body: "Άνοιξε τον χάρτη και ανακάλυψε events, πίστες, διαδρομές και automotive μέρη σε όλη την Ελλάδα.",
      },
    ],
  },
} as const;

export function HomepageDiscoveryRail({ locale }: Props) {
  const base = locale === "el" ? "/el" : "";
  const t = copy[locale];
  const hrefs = [
    `${base}/meets`,
    `${base}/map`,
  ];

  const items: Item[] = t.items.map((item, index) => ({ ...item, href: hrefs[index] }));

  return (
    <section className={styles.section} aria-label={t.label}>
      <div className={styles.shell}>
        <div className={styles.rail}>
          {items.map((item) => (
            <Link className={styles.card} href={item.href} key={item.index}>
              <div className={styles.topline}>
                <span className={styles.index}>{item.index}</span>
                <span className={styles.eyebrow}>{item.eyebrow}</span>
              </div>
              <h2>{item.title}</h2>
              <p>{item.body}</p>
              <span className={styles.arrow} aria-hidden="true">→</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
