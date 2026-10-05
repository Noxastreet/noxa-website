"use client";

import { useReducedMotion, useScroll, useSpring } from "motion/react";
import * as m from "motion/react-m";

import styles from "./ScrollProgress.module.css";

export function ScrollProgress() {
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 150,
    damping: 28,
    mass: 0.24,
  });

  if (reduceMotion) return null;

  return (
    <div className={styles.track} aria-hidden="true">
      <m.div className={styles.bar} style={{ scaleX }} />
    </div>
  );
}
