"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { LanguageSwitch } from "@/components/i18n/LanguageSwitch";
import type { LandingCopy, Locale } from "@/i18n/landing-copy";

const navigationHrefs = ["#product", "#community", "#business"] as const;

const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

type SiteHeaderProps = {
  languageCopy: LandingCopy["language"];
  locale: Locale;
  navigationCopy: LandingCopy["navigation"];
};

export function SiteHeader({
  languageCopy,
  locale,
  navigationCopy,
}: SiteHeaderProps) {
  const navigationItems = navigationCopy.items;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeHref, setActiveHref] = useState<string | null>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  const closeMenu = useCallback((restoreFocus = true) => {
    setIsMenuOpen(false);
    if (restoreFocus) {
      window.requestAnimationFrame(() => menuButtonRef.current?.focus());
    }
  }, []);

  useEffect(() => {
    const sections = navigationHrefs
      .map((href) => document.querySelector<HTMLElement>(href))
      .filter((section): section is HTMLElement => Boolean(section));

    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visible?.target.id) {
          setActiveHref(`#${visible.target.id}`);
        }
      },
      {
        rootMargin: "-24% 0px -58% 0px",
        threshold: [0.08, 0.2, 0.4],
      },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isMenuOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    window.requestAnimationFrame(() => {
      sheetRef.current
        ?.querySelector<HTMLElement>(focusableSelector)
        ?.focus();
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeMenu(true);
        return;
      }

      if (event.key !== "Tab" || !sheetRef.current) return;

      const focusable = Array.from(
        sheetRef.current.querySelectorAll<HTMLElement>(focusableSelector),
      ).filter((element) => !element.hasAttribute("disabled"));

      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeMenu, isMenuOpen]);

  function handleMenuAnchorClick() {
    closeMenu(true);
  }

  return (
    <>
      <header className="site-header fixed inset-x-0 top-0 z-50 border-b border-[var(--color-border-subtle)] bg-[#050505]/88 backdrop-blur-[12px] adaptive-backdrop">
        <div className="page-shell site-header-row flex items-center gap-2">
          <a
            className="inline-flex min-h-12 shrink-0 items-center rounded-md pr-2 text-sm font-bold tracking-[0.24em]"
            href="#top"
            aria-label={navigationCopy.homeLabel}
          >
            NOXA
          </a>

          <nav
            className="ml-auto hidden items-center gap-1 min-[1025px]:flex"
            aria-label={navigationCopy.primaryLabel}
          >
            {navigationItems.map(([label, href]) => {
              const isActive = activeHref === href;

              return (
                <a
                  key={href}
                  href={href}
                  aria-current={isActive ? "location" : undefined}
                  className={`inline-flex min-h-12 items-center rounded-full px-4 text-sm font-medium transition-colors duration-[180ms] ${
                    isActive
                      ? "bg-white/[0.07] text-white"
                      : "text-[var(--color-text-secondary)] hover:bg-white/[0.05] hover:text-white"
                  }`}
                >
                  {label}
                </a>
              );
            })}
          </nav>

          <div className="ml-2 hidden min-[1025px]:block">
            <LanguageSwitch
              activeHref={activeHref}
              copy={languageCopy}
              locale={locale}
            />
          </div>

          <a
            className="ml-auto inline-flex min-h-12 shrink-0 items-center whitespace-nowrap rounded-full border border-[var(--color-border-strong)] bg-white/[0.04] px-4 text-sm font-semibold text-white transition-colors hover:bg-white/[0.08] min-[1025px]:ml-2 min-[1025px]:px-5"
            href="#waitlist"
          >
            {navigationCopy.join}
            <span className="ml-2 hidden sm:inline" aria-hidden="true">
              ↗
            </span>
          </a>

          <button
            ref={menuButtonRef}
            type="button"
            className="inline-flex size-12 shrink-0 items-center justify-center rounded-full border border-[var(--color-border-strong)] bg-white/[0.04] min-[1025px]:hidden"
            aria-label={navigationCopy.openMenu}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-navigation-sheet"
            onClick={() => setIsMenuOpen(true)}
          >
            <span className="sr-only">{navigationCopy.openMenu}</span>
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              aria-hidden="true"
            >
              <path d="M3 6H17M3 14H17" stroke="currentColor" strokeWidth="1.8" />
            </svg>
          </button>
        </div>
      </header>

      <div
        className={`fixed inset-0 z-[60] bg-black/64 transition-opacity duration-[240ms] min-[1025px]:hidden ${
          isMenuOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden="true"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) closeMenu(true);
        }}
      >
        <div
          ref={sheetRef}
          id="mobile-navigation-sheet"
          role="dialog"
          aria-modal="true"
          aria-labelledby="mobile-navigation-title"
          aria-hidden={!isMenuOpen}
          inert={!isMenuOpen}
          className={`adaptive-backdrop absolute inset-x-0 bottom-0 mx-auto max-w-[430px] rounded-t-[24px] border border-b-0 border-[var(--color-border-subtle)] bg-[#111114]/96 px-5 pt-6 shadow-[0_-24px_60px_rgba(0,0,0,.48)] backdrop-blur-[8px] transition-[transform,opacity] duration-[240ms] ${
            isMenuOpen ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
          }`}
          style={{ paddingBottom: "max(24px, env(safe-area-inset-bottom))" }}
        >
          <div className="flex items-center justify-between gap-4">
            <h2 id="mobile-navigation-title" className="text-base font-semibold">
              {navigationCopy.menuTitle}
            </h2>
            <button
              type="button"
              className="inline-flex size-12 shrink-0 items-center justify-center rounded-full border border-[var(--color-border-strong)] bg-white/[0.04]"
              aria-label={navigationCopy.closeMenu}
              onClick={() => closeMenu(true)}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M4 4L14 14M14 4L4 14"
                  stroke="currentColor"
                  strokeWidth="1.8"
                />
              </svg>
            </button>
          </div>

          <nav className="mt-4 grid gap-2" aria-label={navigationCopy.mobileLabel}>
            {navigationItems.map(([label, href]) => {
              const isActive = activeHref === href;

              return (
                <a
                  key={href}
                  href={href}
                  aria-current={isActive ? "location" : undefined}
                  className={`inline-flex min-h-12 items-center rounded-xl border px-4 text-base font-semibold transition-colors duration-[180ms] ${
                    isActive
                      ? "border-[#e32c49] bg-[#c8102e]/12 text-white"
                      : "border-[var(--color-border-subtle)] bg-white/[0.025] text-[var(--color-text-secondary)]"
                  }`}
                  onClick={handleMenuAnchorClick}
                >
                  {label}
                </a>
              );
            })}
          </nav>

          <div className="mt-5 border-t border-white/[0.08] pt-5">
            <LanguageSwitch
              activeHref={activeHref}
              copy={languageCopy}
              locale={locale}
            />
          </div>
        </div>
      </div>
    </>
  );
}
