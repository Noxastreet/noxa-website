"use client";

import Link from "next/link";
import { useRef } from "react";
import { useReducedMotion, useScroll, useSpring, useTransform } from "motion/react";
import * as m from "motion/react-m";

import { HeroVideo } from "./HeroVideo";
import videoStyles from "./CultureHeroVideo.module.css";
import styles from "./CultureLandingV2.module.css";
import refine from "./CultureLandingV2Refine.module.css";

type Props = {
  eyebrow: string;
  title: string;
  accent: string;
  body: string;
  primary: string;
  secondary: string;
  primaryHref: string;
  secondaryHref: string;
  videoSrc: string;
};

export function MotionHero({
  eyebrow,
  title,
  accent,
  body,
  primary,
  secondary,
  primaryHref,
  secondaryHref,
  videoSrc,
}: Props) {
  const sectionRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  const mediaY = useTransform(scrollYProgress, [0, 1], [0, 72]);
  const mediaScale = useTransform(scrollYProgress, [0, 1], [1.015, 1.075]);
  const copyY = useTransform(scrollYProgress, [0, 1], [0, -24]);
  const copyOpacity = useTransform(scrollYProgress, [0, 0.78], [1, 0.58]);
  const cueProgress = useSpring(
    useTransform(scrollYProgress, [0, 0.72], [0.18, 1]),
    { stiffness: 120, damping: 24, mass: 0.25 },
  );

  const accentIndex = title.indexOf(accent);
  const before = accentIndex >= 0 ? title.slice(0, accentIndex) : title;
  const after = accentIndex >= 0 ? title.slice(accentIndex + accent.length) : "";

  return (
    <section
      ref={sectionRef}
      className={`${styles.hero} ${refine.heroRefined}`}
      id="top"
    >
      <m.div
        className={`${styles.heroMedia} ${videoStyles.media}`}
        aria-hidden="true"
        style={reduceMotion ? undefined : { y: mediaY, scale: mediaScale }}
      >
        <HeroVideo
          className={videoStyles.video}
          src={videoSrc}
          poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16'%3E%3Crect width='16' height='16' fill='%23050505'/%3E%3C/svg%3E"
        />
      </m.div>

      <div className={styles.heroShade} aria-hidden="true" />
      <div className={styles.heroSignal} aria-hidden="true" />

      <div className={styles.shell}>
        <m.div
          className={styles.heroCopy}
          style={reduceMotion ? undefined : { y: copyY, opacity: copyOpacity }}
        >
          <m.p
            className={styles.eyebrow}
            initial={reduceMotion ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.55, delay: reduceMotion ? 0 : 0.08, ease: [0.22, 1, 0.36, 1] }}
          >
            {eyebrow}
          </m.p>

          <h1>
            {before}
            {accentIndex >= 0 ? <span className={styles.heroAccent}>{accent}</span> : null}
            {after}
          </h1>

          <m.p
            className={styles.heroBody}
            initial={reduceMotion ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.68, delay: reduceMotion ? 0 : 0.24, ease: [0.22, 1, 0.36, 1] }}
          >
            {body}
          </m.p>

          <m.div
            className={styles.heroActions}
            initial={reduceMotion ? false : { opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.62, delay: reduceMotion ? 0 : 0.32, ease: [0.22, 1, 0.36, 1] }}
          >
            <Link className={styles.primaryButton} href={primaryHref}>
              {primary} <span aria-hidden="true">→</span>
            </Link>
            <Link className={styles.secondaryButton} href={secondaryHref}>
              {secondary} <span aria-hidden="true">↗</span>
            </Link>
          </m.div>
        </m.div>

        <div className={styles.heroCoordinates} aria-hidden="true">
          <span>NOXA / GR</span>
          <span>37.9838° N · 23.7275° E</span>
        </div>

        {!reduceMotion ? (
          <div className={styles.heroScrollCue} aria-hidden="true">
            <span>SCROLL TO DISCOVER</span>
            <i className={styles.heroScrollTrack}>
              <m.b className={styles.heroScrollBar} style={{ scaleX: cueProgress }} />
            </i>
          </div>
        ) : null}
      </div>
    </section>
  );
}
