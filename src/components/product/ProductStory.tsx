"use client";

import { useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
} from "motion/react";

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
    <section ref={sectionRef} id="product" className="relative min-h-[440svh] border-y border-white/[0.06] bg-[#070709]">
      <div className="sticky top-0 flex min-h-[100svh] items-center overflow-hidden pb-7 pt-24">
        <div className="page-shell grid w-full gap-7 lg:grid-cols-[1fr_.9fr] lg:items-center lg:gap-20">
          <div className="relative z-10 min-h-[270px] sm:min-h-[300px] lg:min-h-[440px]">
            <div className="mb-7 flex items-center gap-2" aria-hidden="true">
              {chapters.map(([chapterNumber], index) => (
                <span
                  key={chapterNumber}
                  className={`h-1 flex-1 rounded-full transition-colors duration-500 ${index <= activeIndex ? "bg-[#c8102e]" : "bg-white/10"}`}
                />
              ))}
            </div>

            <p className="eyebrow">One automotive world</p>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={number}
                initial={{ opacity: 0, y: 28, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -22, filter: "blur(6px)" }}
                transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.18em] text-white/36">
                  <span className="text-[#e32c49]">{number}</span>
                  <span className="h-px w-8 bg-white/15" />
                  <span>{eyebrow}</span>
                </div>
                <h2 className="mt-5 max-w-2xl text-[clamp(2.75rem,12vw,6.25rem)] font-semibold leading-[0.91] tracking-[-0.07em]">{title}</h2>
                <p className="mt-6 max-w-xl text-[1.04rem] leading-7 text-white/52 sm:text-[1.1rem] sm:leading-8">{body}</p>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="relative isolate mx-auto flex w-full max-w-[430px] items-end justify-center overflow-hidden rounded-[2.5rem] border border-white/[0.09] bg-[#0a0a0d] px-5 pt-8 shadow-[0_38px_110px_rgba(0,0,0,.46)] sm:px-10 lg:min-h-[690px]">
            <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_12%,rgba(200,16,46,.27),transparent_37%)]" />
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={mode}
                className="w-[226px] origin-bottom sm:w-[276px] lg:w-[304px]"
                initial={{ opacity: 0, y: 46, scale: 0.94 }}
                animate={{ opacity: 1, y: 38, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.97 }}
                transition={{ duration: 0.58, ease: [0.22, 1, 0.36, 1] }}
              >
                <NoxaPhone mode={mode} />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
