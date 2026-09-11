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
        eyebrow: "COMMUNITY · CREWS",
        title: "Find the people behind the scene.",
        body: "Discover Crews and automotive communities active across Greece.",
      },
      {
        index: "04",
        eyebrow: "CREW OR PARTNER?",
        title: "Add your event to NOXA.",
        body: "Crew and Business/Partner events can be submitted to NOXA for verification and publication.",
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
        eyebrow: "COMMUNITY · CREWS",
        title: "Βρες τους ανθρώπους της σκηνής.",
        body: "Ανακάλυψε Crews και automotive communities σε όλη την Ελλάδα.",
      },
      {
        index: "04",
        eyebrow: "CREW Ή PARTNER?",
        title: "Πρόσθεσε το event σου στο NOXA.",
        body: "Events από Crews και Business/Partners μπορούν να σταλούν στο NOXA για verification και δημοσίευση.",
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
