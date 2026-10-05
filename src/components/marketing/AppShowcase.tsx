"use client";

import Link from "next/link";
import { useRef } from "react";
import { useReducedMotion, useScroll, useSpring } from "motion/react";
import * as m from "motion/react-m";

import type { Locale } from "@/i18n/landing-copy";

import styles from "./MarketingPages.module.css";

const copy = {
  en: {
    eyebrow: "THE NOXA APP",
    title: "The full experience lives in the app.",
    body: "The website helps you discover what is happening. The app is where NOXA becomes your automotive space.",
    status: "Mobile app · coming to iOS & Android",
    cta: "Discover the app",
    features: [
      ["01", "Map", "See the automotive world around you."],
      ["02", "Crew", "Your people, vehicles and community in one place."],
      ["03", "Live Drive", "Drive together and stay connected on the road."],
      ["04", "Garage", "Build your profile around the vehicles you own."],
      ["05", "Events", "Move from discovery to the event without losing context."],
    ],
  },
  el: {
    eyebrow: "ΤΟ NOXA APP",
    title: "Η πλήρης εμπειρία βρίσκεται στο app.",
    body: "Το website σε βοηθά να ανακαλύψεις τι γίνεται. Στο app το NOXA γίνεται ο δικός σου automotive χώρος.",
    status: "Mobile app · έρχεται σε iOS & Android",
    cta: "Δες το app",
    features: [
      ["01", "Map", "Δες την automotive σκηνή γύρω σου."],
      ["02", "Crew", "Άτομα, οχήματα και κοινότητα σε ένα μέρος."],
      ["03", "Live Drive", "Οδήγησε μαζί με άλλους και μείνε συνδεδεμένος."],
      ["04", "Garage", "Χτίσε το profile σου γύρω από τα οχήματά σου."],
      ["05", "Events", "Από την ανακάλυψη στο event χωρίς να χάνεις το context."],
    ],
  },
} as const;

export function AppShowcase({ locale }: { locale: Locale }) {
  const sectionRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const t = copy[locale];
  const href = locale === "el" ? "/el/app" : "/app";
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start 72%", "end 35%"],
  });
  const progress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 26,
    mass: 0.28,
  });

  return (
    <section ref={sectionRef} className={styles.section} aria-labelledby="noxa-app-heading">
      <div className={styles.shell}>
        <div className={styles.story}>
          <div className={styles.sticky}>
            <m.p
              className={styles.eyebrow}
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
            >
              {t.eyebrow}
            </m.p>
            <m.h2
              id="noxa-app-heading"
              initial={reduceMotion ? false : { opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.28 }}
              transition={{ duration: reduceMotion ? 0 : .7, ease: [0.22, 1, 0.36, 1] }}
            >
              {t.title}
            </m.h2>
            <m.p
              className={styles.body}
              initial={reduceMotion ? false : { opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.28 }}
              transition={{ duration: reduceMotion ? 0 : .62, delay: reduceMotion ? 0 : .08, ease: [0.22, 1, 0.36, 1] }}
            >
              {t.body}
            </m.p>

            <p className={styles.status}>{t.status}</p>

            <div className={styles.ctaRow}>
              <Link className={styles.secondary} href={href}>
                {t.cta} <span aria-hidden="true">→</span>
              </Link>
            </div>

            {!reduceMotion ? (
              <div className={styles.progressTrack} aria-hidden="true">
                <m.span className={styles.progressBar} style={{ scaleY: progress }} />
              </div>
            ) : null}
          </div>

          <div className={styles.featureStack}>
            {t.features.map(([index, title, body], itemIndex) => (
              <m.article
                className={styles.feature}
                key={index}
                initial={reduceMotion ? false : { opacity: 0, y: 42, scale: .985 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                whileHover={reduceMotion ? undefined : { y: -7 }}
                viewport={{ once: true, amount: .22 }}
                transition={{
                  duration: reduceMotion ? 0 : .68,
                  delay: reduceMotion ? 0 : Math.min(itemIndex * .035, .14),
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <div className={styles.featureTop}>
                  <span>{index}</span>
                  <small>{title}</small>
                </div>

                <div className={styles.featureVisual} aria-hidden="true">
                  <i className={styles.orbit} />
                  <i className={styles.orbitSecondary} />
                  <strong>{index}</strong>
                </div>

                <h3>{title}</h3>
                <p>{body}</p>
              </m.article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
