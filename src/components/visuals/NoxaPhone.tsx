"use client";

import { motion, useReducedMotion } from "motion/react";

type NoxaPhoneMode = "discover" | "meet" | "crew" | "drive";

type NoxaPhoneProps = {
  mode?: NoxaPhoneMode;
  className?: string;
};

const previewContent: Record<
  NoxaPhoneMode,
  {
    label: string;
    title: string;
    meta: string;
    action: string;
  }
> = {
  discover: {
    label: "Nearby",
    title: "Night Run Thessaloniki",
    meta: "2.4 km · 18 drivers",
    action: "Open meet",
  },
  meet: {
    label: "Car meet",
    title: "Harbour Night Session",
    meta: "Tonight · 21:30 · 34 joined",
    action: "Join event",
  },
  crew: {
    label: "Crew",
    title: "Northern Drivers",
    meta: "128 members · Thessaloniki",
    action: "View crew",
  },
  drive: {
    label: "Live drive",
    title: "Following the coastal route",
    meta: "18 min · 12.6 km remaining",
    action: "Follow route",
  },
};

export function NoxaPhone({ mode = "discover", className = "" }: NoxaPhoneProps) {
  const content = previewContent[mode];
  const reduceMotion = useReducedMotion();
  const initialMarker = reduceMotion ? false : { opacity: 0, scale: 0.35 };

  return (
    <div
      className={`relative mx-auto w-full max-w-[304px] ${className}`}
      role="img"
      aria-label={`NOXA mobile app preview showing ${content.title}`}
    >
      <div className="relative aspect-[0.49] rounded-[3rem] border border-white/15 bg-[#030304] p-[7px] shadow-[0_38px_90px_rgba(0,0,0,.62)]">
        <div className="pointer-events-none absolute left-1/2 top-[10px] z-20 h-[25px] w-[92px] -translate-x-1/2 rounded-full bg-black" />

        <div className="relative h-full overflow-hidden rounded-[2.55rem] bg-[#0b0c0f]">
          <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-6 pb-3 pt-4 text-[10px] font-semibold text-white/70">
            <span>9:41</span>
            <span className="tracking-[0.12em]">NOXA</span>
            <span>●●●</span>
          </div>

          <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_16%,rgba(200,16,46,.16),transparent_34%),linear-gradient(145deg,#111218_0%,#090a0d_58%,#121319_100%)]" />
          <div className="absolute inset-0 opacity-55 [background-image:linear-gradient(rgba(255,255,255,.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.035)_1px,transparent_1px)] [background-size:34px_34px]" />

          <svg
            className="absolute inset-0 h-full w-full"
            viewBox="0 0 300 610"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M-24 116C36 131 56 196 111 205C166 214 191 159 235 177C280 196 245 274 283 309C318 341 333 342 333 342"
              stroke="rgba(255,255,255,.09)"
              strokeWidth="18"
              strokeLinecap="round"
            />
            <motion.path
              d="M-24 116C36 131 56 196 111 205C166 214 191 159 235 177C280 196 245 274 283 309C318 341 333 342 333 342"
              stroke="#C8102E"
              strokeWidth="3.5"
              strokeLinecap="round"
              initial={reduceMotion ? false : { pathLength: 0, opacity: 0 }}
              whileInView={{ pathLength: 1, opacity: 1 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{
                pathLength: { duration: reduceMotion ? 0 : 1.25, ease: [0.22, 1, 0.36, 1] },
                opacity: { duration: reduceMotion ? 0 : 0.2 },
              }}
            />
            <path
              d="M34 480C77 440 94 405 126 397C171 386 194 433 236 417C265 406 278 377 324 372"
              stroke="rgba(255,255,255,.07)"
              strokeWidth="13"
              strokeLinecap="round"
            />
          </svg>

          <motion.div
            className="absolute left-[17%] top-[23%] size-3.5 rounded-full border-2 border-black bg-[#c8102e] shadow-[0_0_0_9px_rgba(200,16,46,.15),0_0_28px_rgba(200,16,46,.45)]"
            initial={initialMarker}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ delay: reduceMotion ? 0 : 0.35, type: "spring", stiffness: 310, damping: 19 }}
          />
          <motion.div
            className="absolute right-[17%] top-[38%] size-3 rounded-full border-2 border-black bg-white/90 shadow-[0_0_0_8px_rgba(255,255,255,.08)]"
            initial={initialMarker}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ delay: reduceMotion ? 0 : 0.52, type: "spring", stiffness: 310, damping: 19 }}
          />
          <motion.div
            className="absolute bottom-[34%] left-[32%] size-3 rounded-full border-2 border-black bg-white/75 shadow-[0_0_0_8px_rgba(255,255,255,.06)]"
            initial={initialMarker}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ delay: reduceMotion ? 0 : 0.66, type: "spring", stiffness: 310, damping: 19 }}
          />
          <motion.div
            className="absolute right-[30%] top-[54%] flex size-9 items-center justify-center rounded-full border border-white/15 bg-black/75 text-xs font-bold shadow-xl backdrop-blur-lg"
            initial={initialMarker}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ delay: reduceMotion ? 0 : 0.78, type: "spring", stiffness: 310, damping: 19 }}
          >
            N
          </motion.div>

          <div className="absolute left-4 right-4 top-[76px] flex items-center gap-3 rounded-full border border-white/10 bg-black/65 px-4 py-3 text-sm text-white/55 backdrop-blur-xl">
            <span className="size-2 rounded-full bg-[#c8102e]" />
            Search drivers, meets or places
          </div>

          <motion.div
            className="absolute inset-x-3 bottom-3 rounded-[1.75rem] border border-white/10 bg-black/78 p-4 shadow-2xl backdrop-blur-2xl"
            initial={reduceMotion ? false : { opacity: 0, y: 22, scale: 0.98 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: reduceMotion ? 0 : 0.6, delay: reduceMotion ? 0 : 0.75, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#e32c49]">
                  {content.label}
                </p>
                <p className="mt-2 text-[17px] font-semibold leading-5 tracking-[-0.025em]">
                  {content.title}
                </p>
                <p className="mt-1.5 text-xs leading-5 text-white/[0.45]">{content.meta}</p>
              </div>
              <span className="mt-1 flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-sm font-bold text-black">
                →
              </span>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-white/[0.08] pt-3 text-xs">
              <span className="text-white/[0.45]">Live on the map</span>
              <span className="font-semibold text-white/85">{content.action}</span>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
