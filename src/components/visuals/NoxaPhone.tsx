"use client";

import type {
  LandingCopy,
  NoxaPhoneMode,
} from "@/i18n/landing-copy";

type NoxaPhoneProps = {
  mode?: NoxaPhoneMode;
  className?: string;
  compact?: boolean;
  copy: LandingCopy["phone"];
};

function PreviewIcon({ mode }: { mode: NoxaPhoneMode }) {
  if (mode === "meet") {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M7 3v3M17 3v3M4.5 9h15M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (mode === "crew") {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M8.5 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM15.5 10a2.5 2.5 0 1 0 0-5M3.5 19a5 5 0 0 1 10 0M14 14.5a4.5 4.5 0 0 1 6.5 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (mode === "drive") {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="m5 19 3.2-8.2L19 5l-5.8 10.8L5 19Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="10" r="2.3" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

export function NoxaPhone({
  mode = "discover",
  className = "",
  compact = false,
  copy,
}: NoxaPhoneProps) {
  const content = copy.previews[mode];
  return (
    <div
      className={`relative mx-auto w-full max-w-[304px] ${className}`}
      role="img"
      aria-label={`${copy.previewAriaPrefix} ${content.title}`}
    >
      <div
        className={`relative rounded-[3rem] border border-white/15 bg-[#030304] p-[7px] shadow-[0_38px_90px_rgba(0,0,0,.62)] ${
          compact ? "aspect-[0.56]" : "aspect-[0.49]"
        }`}
      >
        <div className="pointer-events-none absolute left-1/2 top-[10px] z-20 h-[25px] w-[92px] -translate-x-1/2 rounded-full bg-black" />

        <div className="relative h-full overflow-hidden rounded-[2.55rem] bg-[#0b0c0f]">
          <div
            className={`absolute inset-x-0 top-0 z-10 flex items-center justify-between font-semibold text-white/70 ${
              compact ? "px-5 pb-2 pt-4 text-[8px]" : "px-6 pb-3 pt-4 text-[10px]"
            }`}
          >
            <span>9:41</span>
            <span className="tracking-[0.12em]">NOXA</span>
            <span className="h-1.5 w-4 rounded-sm border border-white/55" aria-hidden="true" />
          </div>

          <div className="absolute inset-0 bg-[linear-gradient(180deg,#111114_0%,#09090c_100%)]" />

          <div
            className={`absolute left-4 right-4 flex min-w-0 items-center gap-2 overflow-hidden rounded-full border border-white/10 bg-[#111114] text-white/70 ${
              compact
                ? "top-[60px] px-3 py-2 text-[10px]"
                : "top-[76px] gap-3 px-4 py-3 text-sm"
            }`}
          >
            <svg className="size-3.5 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="1.8" />
              <path d="m16 16 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <span className="min-w-0 truncate whitespace-nowrap">
              {compact ? copy.searchCompact : copy.search}
            </span>
          </div>

          <div className={`absolute inset-x-3 flex flex-col ${compact ? "bottom-3 top-[104px] gap-2" : "bottom-4 top-[138px] gap-3"}`}>
            <div className={`flex min-w-0 items-start gap-3 rounded-[1.4rem] border border-white/10 bg-[#111114] ${compact ? "p-3" : "p-4"}`}>
              <span className={`flex shrink-0 items-center justify-center rounded-full bg-[#c8102e] text-white ${compact ? "size-8 p-2" : "size-10 p-2.5"}`}>
                <PreviewIcon mode={mode} />
              </span>
              <div className="min-w-0">
                <p
                  className={`font-bold uppercase tracking-[0.18em] text-[#e32c49] ${
                    compact ? "text-[8px]" : "text-[10px]"
                  }`}
                >
                  {content.label}
                </p>
                <p
                  className={`mt-2 min-w-0 [overflow-wrap:anywhere] font-semibold tracking-[-0.025em] ${
                    compact
                      ? "line-clamp-2 text-[10px] leading-[13px]"
                      : "text-[13px] leading-4 md:text-[17px] md:leading-5"
                  }`}
                >
                  {content.title}
                </p>
              </div>
            </div>

            <div className={`rounded-[1.25rem] border border-white/10 bg-[#111114] ${compact ? "px-3 py-2.5" : "px-4 py-3"}`}>
              <p className={`${compact ? "text-[9px] leading-4" : "text-xs leading-5"} text-white/70`}>
                {content.meta}
              </p>
            </div>

            <div className={`mt-auto rounded-[1.25rem] border border-white/10 bg-[#111114] ${compact ? "px-3 py-2.5" : "px-4 py-3"}`}>
              <div className={`flex items-center justify-between gap-2 ${compact ? "text-[9px]" : "text-xs"}`}>
                <span className="text-white/70">{copy.liveOnMap}</span>
                <span className="flex items-center gap-1.5 font-semibold text-white/90">
                  {content.action}
                  <span aria-hidden="true">→</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
