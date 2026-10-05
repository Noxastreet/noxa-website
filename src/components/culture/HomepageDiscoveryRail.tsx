"use client";

import Link from "next/link";
import { useReducedMotion } from "motion/react";
import * as m from "motion/react-m";

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
    label: "Explore NOXA events and app",
    items: [
      {
        index: "01",
        eyebrow: "CAR & MOTO EVENTS",
        title: "See what’s happening.",
        body: "Verified automotive and motorcycle events happening across Greece.",
      },
      {
        index: "02",
        eyebrow: "NOXA APP",
        title: "The full NOXA experience.",
        body: "Map, crews, live drives, profiles, events and garage — built for the car & moto community.",
      },
    ],
  },
  el: {
    label: "Εξερεύνησε NOXA events και app",
    items: [
      {
        index: "01",
        eyebrow: "CAR & MOTO EVENTS",
        title: "Δες τι γίνεται.",
        body: "Verified automotive και motorcycle events σε όλη την Ελλάδα.",
      },
      {
        index: "02",
        eyebrow: "NOXA APP",
        title: "Η πλήρης εμπειρία NOXA.",
        body: "Map, crews, live drives, profiles, events και garage — για την car & moto κοινότητα.",
      },
    ],
  },
} as const;

export function HomepageDiscoveryRail({ locale }: Props) {
  const reduceMotion = useReducedMotion();
  const base = locale === "el" ? "/el" : "";
  const t = copy[locale];
  const hrefs = [`${base}/meets`, `${base}/app`];
  const items: Item[] = t.items.map((item, index) => ({ ...item, href: hrefs[index] }));

  return (
    <section className={styles.section} aria-label={t.label}>
      <div className={styles.shell}>
        <div className={styles.rail}>
          {items.map((item, index) => (
            <m.div
              className={styles.cardMotion}
              key={item.index}
              initial={reduceMotion ? false : { opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={reduceMotion ? undefined : { y: -6, scale: 1.006 }}
              viewport={{ once: true, amount: 0.26 }}
              transition={{
                duration: reduceMotion ? 0 : 0.62,
                delay: reduceMotion ? 0 : index * 0.07,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <Link className={styles.card} href={item.href}>
                <div className={styles.topline}>
                  <span className={styles.index}>{item.index}</span>
                  <span className={styles.eyebrow}>{item.eyebrow}</span>
                </div>
                <h2>{item.title}</h2>
                <p>{item.body}</p>
                <span className={styles.arrow} aria-hidden="true">→</span>
              </Link>
            </m.div>
          ))}
        </div>
      </div>
    </section>
  );
}
