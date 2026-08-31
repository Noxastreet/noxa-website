"use client";

import type { MouseEvent } from "react";

import type { LandingCopy, Locale } from "@/i18n/landing-copy";

type LanguageSwitchProps = {
  activeHref: string | null;
  copy: LandingCopy["language"];
  locale: Locale;
  destinations?: Partial<Record<Locale, string>>;
  compact?: boolean;
};

export function LanguageSwitch({
  activeHref,
  copy,
  locale,
  destinations,
  compact = false,
}: LanguageSwitchProps) {
  function preserveAttribution(
    event: MouseEvent<HTMLAnchorElement>,
    destination: string,
  ) {
    const suffix = `${window.location.search}${activeHref ?? ""}`;
    event.currentTarget.href = `${destination}${suffix}`;
  }

  return (
    <div
      className={`inline-flex rounded-full border border-[var(--color-border-strong)] bg-white/[0.035] p-1 ${
        compact ? "gap-0" : ""
      }`}
      role="group"
      aria-label={copy.label}
    >
      {(["en", "el"] as const).map((option: Locale) => {
        const isActive = locale === option;
        const languageName = option === "en" ? copy.english : copy.greek;
        const destination =
          destinations?.[option] ?? (option === "en" ? "/" : "/el");

        return (
          <a
            key={option}
            href={destination}
            hrefLang={option}
            lang={option}
            aria-label={languageName}
            title={languageName}
            aria-current={isActive ? "page" : undefined}
            className={`inline-flex min-h-10 items-center justify-center rounded-full text-xs font-bold tracking-[0.12em] transition-[background-color,color,transform] duration-[180ms] ${
              compact ? "min-w-10 px-2" : "min-h-12 min-w-12 px-3"
            } ${
              isActive
                ? "bg-[#f5f5f7] text-[#050505] shadow-[0_5px_20px_rgba(255,255,255,.08)]"
                : "text-[var(--color-text-secondary)] hover:bg-white/[0.06] hover:text-white"
            }`}
            style={
              isActive
                ? {
                    color: "#050505",
                    WebkitTextFillColor: "#050505",
                  }
                : undefined
            }
            onClick={(event) => preserveAttribution(event, destination)}
          >
            {option.toUpperCase()}
          </a>
        );
      })}
    </div>
  );
}
