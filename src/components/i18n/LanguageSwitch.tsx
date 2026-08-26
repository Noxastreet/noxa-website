"use client";

import type { MouseEvent } from "react";

import type { LandingCopy, Locale } from "@/i18n/landing-copy";

type LanguageSwitchProps = {
  activeHref: string | null;
  copy: LandingCopy["language"];
  locale: Locale;
};

export function LanguageSwitch({
  activeHref,
  copy,
  locale,
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
      className="inline-flex rounded-full border border-[var(--color-border-strong)] bg-white/[0.035] p-1"
      role="group"
      aria-label={copy.label}
    >
      {(["en", "el"] as const).map((option: Locale) => {
        const isActive = locale === option;
        const languageName = option === "en" ? copy.english : copy.greek;
        const destination = option === "en" ? "/" : "/el";

        return (
          <a
            key={option}
            href={destination}
            hrefLang={option}
            lang={option}
            aria-label={languageName}
            aria-current={isActive ? "page" : undefined}
            className={`inline-flex min-h-12 min-w-12 items-center justify-center rounded-full px-3 text-xs font-bold tracking-[0.12em] transition-colors duration-[180ms] ${
              isActive
                ? "bg-white text-black"
                : "text-[var(--color-text-secondary)] hover:bg-white/[0.06] hover:text-white"
            }`}
            onClick={(event) => preserveAttribution(event, destination)}
          >
            {option.toUpperCase()}
          </a>
        );
      })}
    </div>
  );
}
