"use client";

import { useRef, useState } from "react";
import {
  AnimatePresence,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
} from "motion/react";
import * as m from "motion/react-m";

import { FeatureChapter } from "@/components/FeatureChapter";
import { NoxaPhone } from "@/components/visuals/NoxaPhone";

const chapters = [
  ["01", "Discover", "See what moves around you.", "Drivers, meets, events and automotive places appear on one focused live map.", "discover"],
  ["02", "Meet", "Turn activity into a real connection.", "Open a meet, see who is joining and start the route without leaving NOXA.", "meet"],
  ["03", "Belong", "Find the crew that feels like yours.", "Build local communities around shared cars, roads and culture.", "crew"],
  ["04", "Drive", "From discovery to the road.", "Plan the route, enter follow mode and move together in real time.", "drive"],
] as const;

export function ProductStory() {
  const sectionRef = useRef<HTMLElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    if (reduceMotion) return;
    const next = Math.min(chapters.length - 1, Math.floor(latest * chapters.length));
    setActiveIndex((current) => (current === next ? current : next));
  });

  if (reduceMotion) {
    return (
      <section id="product" className="section page-shell space-y-20">
        {chapters.map(([number, eyebrow, title, body, mode], index) => (
          <FeatureChapter
            key={number}
            number={number}
            eyebrow={eyebrow}
            title={title}
            body={body}
            mode={mode}
            reversed={index % 2 === 1}
          />
        ))}
      </section>
    );
  }

  const [number, eyebrow, title, body, mode] = chapters[activeIndex];

  return (
    <section
      ref={sectionRef}
      id="product"
      className="relative min-h-[440svh] border-y border-white/[0.06] bg-[#070709]"
    >
      <div className="sticky top-16 flex h-[calc(100svh-4rem)] items-stretch overflow-hidden pb-4 pt-5 sm:pb-6 sm:pt-7 lg:top-0 lg:h-auto lg:min-h-[100svh] lg:items-center lg:pb-10 lg:pt-24">
        <div className="page-shell grid h-full w-full content-between gap-3 lg:h-auto lg:grid-cols-[minmax(0,1fr)_minmax(420px,500px)] lg:items-center lg:gap-20 xl:gap-28">
          <div className="relative z-10 min-h-[205px] sm:min-h-[250px] lg:flex lg:min-h-[600px] lg:flex-col lg:justify-center">
            <div className="mb-4 flex items-center gap-2 sm:mb-7 lg:hidden" aria-hidden="true">
              {chapters.map(([chapterNumber], index) => (
                <span
                  key={chapterNumber}
                  className={`h-1 flex-1 rounded-full transition-colors duration-500 ${index <= activeIndex ? "bg-[#c8102e]" : "bg-white/10"}`}
                />
              ))}
            </div>

            <p className="eyebrow">One automotive world</p>
            <AnimatePresence mode="wait" initial={false}>
              <m.div
                key={number}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -18 }}
                transition={{ duration: 0.44, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.18em] text-white/60 sm:text-xs">
                  <span className="text-[#e32c49]">{number}</span>
                  <span className="h-px w-8 bg-white/25" />
                  <span>{eyebrow}</span>
                </div>
                <h2 className="mt-3 max-w-2xl text-[clamp(2.25rem,10vw,6.25rem)] font-semibold leading-[0.91] tracking-[-0.07em] sm:mt-5 lg:text-[clamp(4.5rem,5.7vw,6.7rem)]">
                  {title}
                </h2>
                <p className="mt-4 max-w-xl text-[0.94rem] leading-6 text-white/64 sm:mt-6 sm:text-[1.1rem] sm:leading-8 lg:text-lg">
                  {body}
                </p>
              </m.div>
            </AnimatePresence>

            <div className="mt-12 hidden border-t border-white/[0.08] pt-4 lg:grid lg:grid-cols-4 lg:gap-2">
              {chapters.map(([chapterNumber, chapterLabel], index) => {
                const isActive = index === activeIndex;

                return (
                  <div
                    key={chapterNumber}
                    className={`rounded-2xl border px-3 py-4 transition-colors duration-500 ${
                      isActive
                        ? "border-[#c8102e]/55 bg-[#c8102e]/10"
                        : "border-white/[0.08] bg-white/[0.025]"
                    }`}
                    aria-current={isActive ? "step" : undefined}
                  >
                    <p className={`text-[10px] font-bold tracking-[0.15em] ${isActive ? "text-[#e32c49]" : "text-white/52"}`}>
                      {chapterNumber}
                    </p>
                    <p className={`mt-2 text-sm font-semibold ${isActive ? "text-white" : "text-white/68"}`}>
                      {chapterLabel}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="relative isolate mx-auto flex h-[300px] w-full max-w-[430px] items-end justify-center overflow-hidden rounded-[2rem] border border-white/[0.09] bg-[#0a0a0d] px-4 pt-5 shadow-[0_38px_110px_rgba(0,0,0,.46)] sm:h-[400px] sm:rounded-[2.5rem] sm:px-8 sm:pt-8 lg:h-auto lg:min-h-[720px] lg:max-w-[500px] lg:px-12 lg:pt-12">
            <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_12%,rgba(200,16,46,.29),transparent_37%)]" />
            <div className="pointer-events-none absolute inset-x-8 top-8 hidden items-center justify-between text-[10px] font-bold uppercase tracking-[0.16em] text-white/58 lg:flex">
              <span>NOXA live map</span>
              <span>Thessaloniki · online</span>
            </div>
            <div className="pointer-events-none absolute left-8 top-20 hidden h-px w-24 bg-gradient-to-r from-[#c8102e] to-transparent lg:block" />

            <AnimatePresence mode="wait" initial={false}>
              <m.div
                key={mode}
                className="w-[150px] origin-bottom sm:w-[210px] lg:w-[330px]"
                initial={{ opacity: 0, y: 38, scale: 0.94 }}
                animate={{ opacity: 1, y: 34, scale: 1 }}
                exit={{ opacity: 0, y: 18, scale: 0.97 }}
                transition={{ duration: 0.54, ease: [0.22, 1, 0.36, 1] }}
              >
                <NoxaPhone mode={mode} className="lg:max-w-[330px]" />
              </m.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
