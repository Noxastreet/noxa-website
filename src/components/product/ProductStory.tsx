"use client";

import {
  KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  AnimatePresence,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
} from "motion/react";
import * as m from "motion/react-m";

import { NoxaPhone } from "@/components/visuals/NoxaPhone";
import type { LandingCopy } from "@/i18n/landing-copy";

function useDesktopStoryMode() {
  const [isDesktopStory, setIsDesktopStory] = useState(false);

  useEffect(() => {
    const viewportQuery = window.matchMedia(
      "(min-width: 768px) and (min-height: 700px)",
    );
    const slowUpdateQuery = window.matchMedia("(update: slow)");
    const sync = () =>
      setIsDesktopStory(viewportQuery.matches && !slowUpdateQuery.matches);

    sync();
    viewportQuery.addEventListener("change", sync);
    slowUpdateQuery.addEventListener("change", sync);

    return () => {
      viewportQuery.removeEventListener("change", sync);
      slowUpdateQuery.removeEventListener("change", sync);
    };
  }, []);

  return isDesktopStory;
}

type ProductStoryProps = {
  copy: LandingCopy["product"];
  phoneCopy: LandingCopy["phone"];
};

export function ProductStory({ copy, phoneCopy }: ProductStoryProps) {
  const isDesktopStory = useDesktopStoryMode();
  const reduceMotion = useReducedMotion();

  return isDesktopStory && !reduceMotion ? (
    <DesktopProductStory copy={copy} phoneCopy={phoneCopy} />
  ) : (
    <MobileProductStory copy={copy} phoneCopy={phoneCopy} />
  );
}

function MobileProductStory({ copy, phoneCopy }: ProductStoryProps) {
  const chapters = copy.chapters;
  const [activeIndex, setActiveIndex] = useState(0);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const reduceMotion = useReducedMotion();
  const activeMode = chapters[activeIndex][4];

  function selectTab(index: number, focus = false) {
    setActiveIndex(index);
    if (focus) {
      window.requestAnimationFrame(() => tabRefs.current[index]?.focus());
    }
  }

  function handleTabKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    currentIndex: number,
  ) {
    let nextIndex: number | null = null;

    switch (event.key) {
      case "ArrowRight":
        nextIndex = (currentIndex + 1) % chapters.length;
        break;
      case "ArrowLeft":
        nextIndex = (currentIndex - 1 + chapters.length) % chapters.length;
        break;
      case "Home":
        nextIndex = 0;
        break;
      case "End":
        nextIndex = chapters.length - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    selectTab(nextIndex, true);
  }

  return (
    <section
      id="product"
      className="section border-y border-white/[0.06] bg-[#070709]"
    >
      <div className="page-shell">
        <p className="eyebrow">{copy.eyebrow}</p>

        <div
          className="mobile-tablist"
          role="tablist"
          aria-label={copy.tablistLabel}
        >
          {chapters.map(([number, label], index) => {
            const isActive = index === activeIndex;
            const tabId = `product-tab-${number}`;
            const panelId = `product-panel-${number}`;

            return (
              <button
                key={number}
                ref={(element) => {
                  tabRefs.current[index] = element;
                }}
                id={tabId}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls={panelId}
                tabIndex={isActive ? 0 : -1}
                className="mobile-tab"
                onClick={() => selectTab(index)}
                onKeyDown={(event) => handleTabKeyDown(event, index)}
              >
                {label}
              </button>
            );
          })}
        </div>

        <div className="mt-8">
          {chapters.map(([number, eyebrow, title, body], index) => {
            const isActive = index === activeIndex;
            const tabId = `product-tab-${number}`;
            const panelId = `product-panel-${number}`;

            return (
              <div
                key={number}
                id={panelId}
                role="tabpanel"
                aria-labelledby={tabId}
                tabIndex={0}
                hidden={!isActive}
                className="mobile-tabpanel min-w-0"
                style={reduceMotion ? { animation: "none" } : undefined}
              >
                <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-text-secondary)]">
                  <span className="text-[#e32c49]">{number}</span>
                  <span className="h-px w-8 bg-white/25" aria-hidden="true" />
                  <span>{eyebrow}</span>
                </div>
                <h2 className="mt-4 max-w-[38rem] text-[clamp(36px,10vw,56px)] font-semibold leading-[0.94] tracking-[-0.055em] [text-wrap:balance]">
                  {title}
                </h2>
                <p className="mt-5 max-w-[38rem] text-base leading-6 text-[var(--color-text-secondary)]">
                  {body}
                </p>
              </div>
            );
          })}
        </div>

        <div className="product-preview-card relative isolate mx-auto mt-8 w-full max-w-[430px] overflow-hidden border bg-[#0a0a0d] px-5 pt-7">
          <div className="mx-auto w-[clamp(168px,52vw,220px)]">
            <NoxaPhone copy={phoneCopy} mode={activeMode} />
          </div>
        </div>
      </div>
    </section>
  );
}

function DesktopProductStory({ copy, phoneCopy }: ProductStoryProps) {
  const chapters = copy.chapters;
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

  const [number, eyebrow, title, body, mode] = chapters[activeIndex];

  return (
    <section
      ref={sectionRef}
      id="product"
      className="relative min-h-[440svh] border-y border-white/[0.06] bg-[#070709]"
    >
      <div className="sticky top-[calc(var(--header-row-height)+env(safe-area-inset-top))] flex h-[calc(100svh-var(--header-row-height)-env(safe-area-inset-top))] items-center overflow-hidden py-8">
        <div className="page-shell grid w-full grid-cols-[minmax(0,1fr)_minmax(360px,500px)] items-center gap-16 xl:gap-24">
          <div className="relative z-10 flex min-h-[560px] flex-col justify-center">
            <p className="eyebrow">{copy.eyebrow}</p>
            <AnimatePresence mode="wait" initial={false}>
              <m.div
                key={number}
                initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
                transition={{
                  duration: reduceMotion ? 0 : 0.24,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-text-secondary)]">
                  <span className="text-[#e32c49]">{number}</span>
                  <span className="h-px w-8 bg-white/25" aria-hidden="true" />
                  <span>{eyebrow}</span>
                </div>
                <h2 className="mt-5 max-w-2xl text-[clamp(4.5rem,5.7vw,6.7rem)] font-semibold leading-[0.94] tracking-[-0.06em] [text-wrap:balance]">
                  {title}
                </h2>
                <p className="mt-6 max-w-[38rem] text-lg leading-7 text-[var(--color-text-secondary)]">
                  {body}
                </p>
              </m.div>
            </AnimatePresence>

            <div className="mt-12 grid grid-cols-4 gap-2 border-t border-white/[0.08] pt-4">
              {chapters.map(([chapterNumber, chapterLabel], index) => {
                const isActive = index === activeIndex;

                return (
                  <div
                    key={chapterNumber}
                    className={`rounded-2xl border px-3 py-4 transition-colors duration-[180ms] ${
                      isActive
                        ? "border-[#c8102e]/55 bg-[#c8102e]/10"
                        : "border-white/[0.08] bg-white/[0.025]"
                    }`}
                    aria-current={isActive ? "step" : undefined}
                  >
                    <p className={`text-xs font-bold tracking-[0.15em] ${isActive ? "text-[#e32c49]" : "text-[var(--color-text-secondary)]"}`}>
                      {chapterNumber}
                    </p>
                    <p className={`mt-2 text-sm font-semibold ${isActive ? "text-white" : "text-[var(--color-text-secondary)]"}`}>
                      {chapterLabel}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="product-preview-card relative isolate mx-auto flex min-h-[680px] w-full max-w-[500px] items-end justify-center overflow-hidden border bg-[#0a0a0d] px-10 pt-10">
            <div className="pointer-events-none absolute inset-x-8 top-8 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--color-text-secondary)]" aria-hidden="true">
              <span>{copy.liveMap}</span>
              <span>{copy.online}</span>
            </div>
            <AnimatePresence mode="wait" initial={false}>
              <m.div
                key={mode}
                className="w-[320px] origin-bottom"
                initial={reduceMotion ? false : { opacity: 0, y: 24, scale: 0.97 }}
                animate={{ opacity: 1, y: 32, scale: 1 }}
                exit={reduceMotion ? undefined : { opacity: 0, y: 16, scale: 0.98 }}
                transition={{
                  duration: reduceMotion ? 0 : 0.24,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <NoxaPhone
                  copy={phoneCopy}
                  mode={mode}
                  className="max-w-[320px]"
                />
              </m.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
