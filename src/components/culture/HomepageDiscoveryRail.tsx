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
    label: "Start exploring NOXA",
    items: [
      {
        index: "01",
        eyebrow: "THIS WEEKEND",
        title: "See what’s happening.",
        body: "Car and moto events happening across Greece this weekend.",
      },
      {
        index: "02",
        eyebrow: "NOXA MAP",
        title: "Explore the road.",
        body: "Events, tracks, routes and verified automotive places on one map.",
      },
      {
        index: "03",
        eyebrow: "CREWS & COMMUNITY",
        title: "Find your people.",
        body: "Discover the crews and communities shaping automotive culture around you.",
      },
      {
        index: "04",
        eyebrow: "HOSTING AN EVENT?",
        title: "Add it to NOXA.",
        body: "Send your event to NOXA and put it in front of the Greek car + moto community.",
      },
    ],
  },
  el: {
    label: "Ξεκίνα να εξερευνάς το NOXA",
    items: [
      {
        index: "01",
        eyebrow: "ΑΥΤΟ ΤΟ WEEKEND",
        title: "Δες τι γίνεται.",
        body: "Car και moto events που γίνονται αυτό το weekend σε όλη την Ελλάδα.",
      },
      {
        index: "02",
        eyebrow: "NOXA MAP",
        title: "Εξερεύνησε τον δρόμο.",
        body: "Events, πίστες, διαδρομές και verified automotive μέρη σε έναν χάρτη.",
      },
      {
        index: "03",
        eyebrow: "CREWS & COMMUNITY",
        title: "Βρες την κοινότητά σου.",
        body: "Ανακάλυψε crews και κοινότητες που διαμορφώνουν την automotive σκηνή γύρω σου.",
      },
      {
        index: "04",
        eyebrow: "ΔΙΟΡΓΑΝΩΝΕΙΣ EVENT?",
        title: "Πρόσθεσέ το στο NOXA.",
        body: "Στείλε το event σου στο NOXA και δείξ’ το στην car + moto κοινότητα της Ελλάδας.",
      },
    ],
  },
} as const;

export function HomepageDiscoveryRail({ locale }: Props) {
  const base = locale === "el" ? "/el" : "";
  const t = copy[locale];
  const hrefs = [
    `${base}/meets?country=GR&date=weekend`,
    `${base}/map`,
    `${base}/communities`,
    `${base}/meets/submit`,
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
