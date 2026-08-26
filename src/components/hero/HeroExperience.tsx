"use client";

import { useEffect, useRef, useState } from "react";
import {
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";
import * as m from "motion/react-m";

import { NoxaPhone } from "@/components/visuals/NoxaPhone";
import type { LandingCopy } from "@/i18n/landing-copy";

type HeroExperienceProps = {
  copy: LandingCopy["hero"];
  phoneCopy: LandingCopy["phone"];
};

export function HeroExperience({ copy, phoneCopy }: HeroExperienceProps) {
  const desktopSignals = copy.signals;
  const sectionRef = useRef<HTMLElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const [allowScrollMotion, setAllowScrollMotion] = useState(false);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  useEffect(() => {
    const desktopQuery = window.matchMedia(
      "(min-width: 768px) and (min-height: 700px)",
    );
    const slowUpdateQuery = window.matchMedia("(update: slow)");

    const syncMotionMode = () => {
      setAllowScrollMotion(desktopQuery.matches && !slowUpdateQuery.matches);
    };

    syncMotionMode();
    desktopQuery.addEventListener("change", syncMotionMode);
    slowUpdateQuery.addEventListener("change", syncMotionMode);

    return () => {
      desktopQuery.removeEventListener("change", syncMotionMode);
      slowUpdateQuery.removeEventListener("change", syncMotionMode);
    };
  }, []);

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 160,
    damping: 30,
    mass: 0.2,
  });

  const copyOpacity = useTransform(smoothProgress, [0, 0.1, 0.52], [1, 1, 0]);
  const copyY = useTransform(smoothProgress, [0, 0.52], [0, -96]);
  const copyScale = useTransform(smoothProgress, [0, 0.52], [1, 0.95]);
  const phoneScale = useTransform(smoothProgress, [0, 0.45, 1], [0.94, 1.02, 1.08]);
  const phoneY = useTransform(smoothProgress, [0, 0.55, 1], [28, -8, -42]);
  const phoneRotateX = useTransform(smoothProgress, [0, 0.38], [4, 0]);
  const hintOpacity = useTransform(smoothProgress, [0, 0.08], [1, 0]);
  const useScrollMotion = allowScrollMotion && !shouldReduceMotion;

  return (
    <section ref={sectionRef} id="top" className="hero-section">
      <div className="hero-stage">
        <div className="page-shell relative flex min-h-0 flex-col justify-start lg:grid lg:h-full lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,.95fr)] lg:items-center lg:gap-16 xl:gap-24">
          <m.div
            className="relative z-10 max-w-2xl lg:max-w-[680px]"
            style={
              useScrollMotion
                ? { opacity: copyOpacity, y: copyY, scale: copyScale }
                : undefined
            }
          >
            <p className="eyebrow">{copy.eyebrow}</p>
            <h1 className="hero-title font-semibold lg:max-w-none lg:text-[clamp(5.4rem,7vw,7.8rem)] lg:leading-[0.94]">
              {copy.titleFirst}
              <span className="block text-white/42">{copy.titleSecond}</span>
            </h1>
            <p className="hero-copy mt-5 text-[var(--color-text-secondary)] sm:mt-6 lg:max-w-lg lg:text-lg lg:leading-8">
              {copy.body}
            </p>
            <div className="mt-6 flex gap-3 sm:mt-8">
              <a className="primary-button hero-primary-action" href="#waitlist">
                {copy.join}
                <span aria-hidden="true">↗</span>
              </a>
              <a className="secondary-button hidden sm:inline-flex" href="#product">
                {copy.explore}
                <span aria-hidden="true">↓</span>
              </a>
            </div>

            <div className="mt-10 hidden items-center gap-6 border-t border-white/[0.08] pt-5 lg:flex">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
                {copy.builtAround}
              </span>
              <span className="h-px w-10 bg-white/10" aria-hidden="true" />
              <span className="text-sm text-[var(--color-text-secondary)]">
                {copy.pillars}
              </span>
            </div>
          </m.div>

          <m.div
            className="hero-phone relative z-10 mx-auto mt-8 origin-bottom sm:mt-10 lg:mx-0 lg:mt-0 lg:w-[330px] lg:justify-self-end xl:w-[360px]"
            style={
              useScrollMotion
                ? {
                    scale: phoneScale,
                    y: phoneY,
                    rotateX: phoneRotateX,
                    transformPerspective: 1200,
                  }
                : undefined
            }
          >
            <NoxaPhone
              compact
              copy={phoneCopy}
              className="lg:max-w-[330px] xl:max-w-[350px]"
            />

            <div className="pointer-events-none absolute -left-44 top-[18%] hidden w-44 space-y-3 xl:block">
              {desktopSignals.slice(0, 2).map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-2xl border border-white/10 bg-black/70 p-4 shadow-2xl backdrop-blur-[12px]"
                >
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/60">
                    {label}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-white/90">{value}</p>
                </div>
              ))}
            </div>

            <div className="pointer-events-none absolute -right-28 bottom-[20%] hidden w-40 rounded-2xl border border-white/10 bg-black/70 p-4 shadow-2xl backdrop-blur-[12px] xl:block">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#e32c49]">
                {desktopSignals[2][0]}
              </p>
              <p className="mt-2 text-sm font-semibold text-white/90">{desktopSignals[2][1]}</p>
              <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/10" aria-hidden="true">
                <div className="h-full w-[68%] rounded-full bg-[#c8102e]" />
              </div>
            </div>
          </m.div>

          <m.a
            href="#product"
            className="desktop-scroll-hint absolute bottom-5 left-1/2 z-20 min-h-12 -translate-x-1/2 items-center gap-2 whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-secondary)]"
            style={useScrollMotion ? { opacity: hintOpacity } : undefined}
          >
            {copy.scroll}
            <span aria-hidden="true">↓</span>
          </m.a>
        </div>
      </div>
    </section>
  );
}
