"use client";

import { useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";

import { NoxaPhone } from "@/components/visuals/NoxaPhone";

const desktopSignals = [
  ["Nearby now", "18 drivers"],
  ["Tonight", "6 active meets"],
  ["Live route", "12.6 km"],
] as const;

export function HeroExperience() {
  const sectionRef = useRef<HTMLElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 110,
    damping: 28,
    mass: 0.25,
  });

  const copyOpacity = useTransform(smoothProgress, [0, 0.46, 0.76], [1, 1, 0]);
  const copyY = useTransform(smoothProgress, [0, 0.76], [0, -72]);
  const copyScale = useTransform(smoothProgress, [0, 0.76], [1, 0.96]);
  const phoneScale = useTransform(smoothProgress, [0, 0.72, 1], [0.9, 1, 1.08]);
  const phoneY = useTransform(smoothProgress, [0, 1], [44, -18]);
  const phoneRotateX = useTransform(smoothProgress, [0, 0.72], [7, 0]);
  const routeOpacity = useTransform(smoothProgress, [0, 0.62, 1], [0.78, 0.5, 0]);
  const hintOpacity = useTransform(smoothProgress, [0, 0.2], [1, 0]);

  return (
    <section ref={sectionRef} id="top" className="relative min-h-[172svh]">
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <div className="page-shell relative flex h-full flex-col justify-start pb-6 pt-24 sm:justify-center sm:pb-8 lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,.95fr)] lg:items-center lg:gap-16 lg:pb-12 lg:pt-24 xl:gap-24">
          <motion.div
            className="pointer-events-none absolute inset-x-0 top-16 -z-10 h-[72svh] overflow-hidden lg:top-10 lg:h-[86svh]"
            style={shouldReduceMotion ? undefined : { opacity: routeOpacity }}
            aria-hidden="true"
          >
            <div className="absolute left-1/2 top-12 h-72 w-72 -translate-x-1/2 rounded-full bg-[#c8102e]/14 blur-[105px] lg:left-[72%] lg:top-[22%] lg:h-[430px] lg:w-[430px]" />
            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1180 720" fill="none">
              <path
                d="M-80 155C138 173 174 339 349 329C518 320 548 99 744 151C918 197 839 421 1064 458C1151 472 1219 442 1280 396"
                stroke="rgba(255,255,255,.055)"
                strokeWidth="28"
                strokeLinecap="round"
              />
              <motion.path
                d="M-80 155C138 173 174 339 349 329C518 320 548 99 744 151C918 197 839 421 1064 458C1151 472 1219 442 1280 396"
                stroke="#C8102E"
                strokeWidth="3"
                strokeLinecap="round"
                initial={shouldReduceMotion ? false : { pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1.25, ease: [0.22, 1, 0.36, 1] }}
              />
            </svg>
          </motion.div>

          <motion.div
            className="relative z-10 max-w-2xl lg:max-w-[680px]"
            style={
              shouldReduceMotion
                ? undefined
                : { opacity: copyOpacity, y: copyY, scale: copyScale }
            }
          >
            <p className="eyebrow">A social platform for drivers</p>
            <h1 className="text-[clamp(2.9rem,13vw,6.8rem)] font-semibold leading-[0.89] tracking-[-0.075em] lg:text-[clamp(5.4rem,7vw,7.8rem)]">
              The road
              <span className="block text-white/42">becomes social.</span>
            </h1>
            <p className="mt-5 max-w-md text-base leading-7 text-white/58 sm:mt-6 sm:text-[1.0625rem] lg:max-w-lg lg:text-lg lg:leading-8">
              Discover drivers, meets, crews and automotive events around you — on one live map.
            </p>
            <div className="mt-6 flex gap-3 sm:mt-8">
              <a className="primary-button" href="#waitlist">
                Join the waitlist
                <span aria-hidden="true">↗</span>
              </a>
              <a className="secondary-button hidden sm:inline-flex" href="#product">
                Explore NOXA
                <span aria-hidden="true">↓</span>
              </a>
            </div>

            <div className="mt-10 hidden items-center gap-6 border-t border-white/[0.08] pt-5 lg:flex">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-white/28">
                Built around real roads
              </span>
              <span className="h-px w-10 bg-white/10" />
              <span className="text-sm text-white/42">Drivers · Meets · Crews · Routes</span>
            </div>
          </motion.div>

          <motion.div
            className="relative z-10 mx-auto mt-3 w-[160px] origin-bottom min-[390px]:w-[176px] sm:mt-10 sm:w-[270px] lg:mx-0 lg:mt-0 lg:w-[330px] lg:justify-self-end xl:w-[360px]"
            style={
              shouldReduceMotion
                ? undefined
                : {
                    scale: phoneScale,
                    y: phoneY,
                    rotateX: phoneRotateX,
                    transformPerspective: 1200,
                  }
            }
          >
            <div className="pointer-events-none absolute inset-x-[-38%] bottom-[-12%] h-52 rounded-[50%] bg-[#c8102e]/16 blur-[70px] lg:h-72" />
            <NoxaPhone className="lg:max-w-[330px] xl:max-w-[350px]" />

            <div className="pointer-events-none absolute -left-44 top-[18%] hidden w-44 space-y-3 xl:block">
              {desktopSignals.slice(0, 2).map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-2xl border border-white/10 bg-black/55 p-4 shadow-2xl backdrop-blur-2xl"
                >
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/30">
                    {label}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-white/82">{value}</p>
                </div>
              ))}
            </div>

            <div className="pointer-events-none absolute -right-28 bottom-[20%] hidden w-40 rounded-2xl border border-white/10 bg-black/55 p-4 shadow-2xl backdrop-blur-2xl xl:block">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#e32c49]">
                {desktopSignals[2][0]}
              </p>
              <p className="mt-2 text-sm font-semibold text-white/82">{desktopSignals[2][1]}</p>
              <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-[68%] rounded-full bg-[#c8102e]" />
              </div>
            </div>
          </motion.div>

          <motion.a
            href="#product"
            className="absolute bottom-3 left-1/2 z-20 inline-flex min-h-10 -translate-x-1/2 items-center gap-2 whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.18em] text-white/38 sm:bottom-5"
            style={shouldReduceMotion ? undefined : { opacity: hintOpacity }}
          >
            Scroll to explore
            <span aria-hidden="true">↓</span>
          </motion.a>
        </div>
      </div>
    </section>
  );
}
