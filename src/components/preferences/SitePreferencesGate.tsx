"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { NoxaLogo } from "@/components/brand/NoxaLogo";

import styles from "./SitePreferencesGate.module.css";

const CONSENT_COOKIE = "noxa_cookie_consent";
const COUNTRY_COOKIE = "noxa_country";
const COUNTRY_STORAGE = "noxa_country";
const ONE_YEAR = 60 * 60 * 24 * 365;
const PSEUDO_REGIONS = new Set(["AC", "CP", "DG", "EA", "EU", "EZ", "IC", "TA", "UN", "ZZ"]);

function normalizeCountryCode(value: string | null | undefined) {
  const candidate = value?.trim().toUpperCase();
  return candidate && /^[A-Z]{2}$/.test(candidate) ? candidate : "GR";
}

function countryName(code: string) {
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
}

function countryFlag(code: string) {
  if (!/^[A-Z]{2}$/.test(code)) return "🌐";
  return String.fromCodePoint(...code.split("").map((char) => 127397 + char.charCodeAt(0)));
}

function regionFromLocale() {
  for (const locale of navigator.languages ?? [navigator.language]) {
    try {
      const region = new Intl.Locale(locale).region;
      if (region) return normalizeCountryCode(region);
    } catch {
      // Try the next locale.
    }
  }
  return "GR";
}

function detectSuggestedCountry() {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const launchRegionByTimezone: Record<string, string> = {
    "Europe/Athens": "GR",
    "Europe/Sofia": "BG",
    "Asia/Nicosia": "CY",
    "Europe/Nicosia": "CY",
  };
  return launchRegionByTimezone[timeZone] ?? regionFromLocale();
}

function availableCountries() {
  const displayNames = new Intl.DisplayNames(["en"], { type: "region" });
  const codes: string[] = [];
  for (let first = 65; first <= 90; first += 1) {
    for (let second = 65; second <= 90; second += 1) {
      const code = String.fromCharCode(first, second);
      if (PSEUDO_REGIONS.has(code)) continue;
      const name = displayNames.of(code);
      if (name && name !== code) codes.push(code);
    }
  }
  return codes.sort((a, b) => countryName(a).localeCompare(countryName(b)));
}

function readCookie(name: string) {
  const prefix = `${name}=`;
  return document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix))
    ?.slice(prefix.length) ?? null;
}

function writeCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${ONE_YEAR}; Path=/; SameSite=Lax; Secure`;
}

export function SitePreferencesGate() {
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedCode, setSelectedCode] = useState("GR");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState("");

  const legalRoute = pathname === "/privacy" || pathname === "/terms";
  const countries = useMemo(() => availableCountries(), []);
  const filteredCountries = useMemo(() => {
    const query = search.trim().toLowerCase();
    return countries.filter((code) => {
      const name = countryName(code).toLowerCase();
      return !query || code.toLowerCase().includes(query) || name.includes(query);
    });
  }, [countries, search]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      if (legalRoute) {
        setReady(true);
        setOpen(false);
        return;
      }

      const consent = readCookie(CONSENT_COOKIE);
      const storedCountry = readCookie(COUNTRY_COOKIE) ?? window.localStorage.getItem(COUNTRY_STORAGE);
      if (storedCountry) setSelectedCode(normalizeCountryCode(decodeURIComponent(storedCountry)));

      if (consent === "essential-v1" && storedCountry) {
        setOpen(false);
      } else {
        setSelectedCode(storedCountry ? normalizeCountryCode(decodeURIComponent(storedCountry)) : detectSuggestedCountry());
        setOpen(true);
      }
      setReady(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [legalRoute]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  function acceptAndContinue() {
    writeCookie(COUNTRY_COOKIE, selectedCode);
    writeCookie(CONSENT_COOKIE, "essential-v1");
    window.localStorage.setItem(COUNTRY_STORAGE, selectedCode);
    window.dispatchEvent(new CustomEvent("noxa:country-change", { detail: selectedCode }));

    if (pathname.startsWith("/radar")) {
      window.location.reload();
      return;
    }
    setOpen(false);
  }

  if (!ready || !open || legalRoute) return null;

  const selectedName = countryName(selectedCode);

  return (
    <div className={styles.layer}>
      <div className={styles.backdrop} aria-hidden="true" />
      <section aria-labelledby="site-preferences-title" aria-modal="true" className={styles.modal} role="dialog">
        <NoxaLogo className={styles.brand} />
        <p className={styles.eyebrow}>WELCOME</p>
        <h2 id="site-preferences-title">Choose your country</h2>
        <p className={styles.intro}>NOXA uses your country to show relevant meets, events and local content across the site.</p>

        <button className={styles.countryButton} onClick={() => setPickerOpen(true)} type="button">
          <span className={styles.flag} aria-hidden="true">{countryFlag(selectedCode)}</span>
          <span className={styles.countryCopy}>
            <small>YOUR COUNTRY</small>
            <strong>{selectedName}</strong>
          </span>
          <span className={styles.change}>Change</span>
        </button>

        <div className={styles.cookieNotice}>
          <span className={styles.cookieDot} aria-hidden="true" />
          <p>
            We use essential cookies to remember your country and site preferences. No advertising cookies are enabled by this choice.
            {" "}<Link href="/privacy" target="_blank">Privacy</Link>
          </p>
        </div>

        <button className={styles.continueButton} onClick={acceptAndContinue} type="button">
          Accept & continue <span aria-hidden="true">→</span>
        </button>

        <p className={styles.legal}>By continuing, your country preference is saved on this device. <Link href="/terms" target="_blank">Terms</Link></p>
      </section>

      {pickerOpen ? (
        <div className={styles.pickerLayer}>
          <button aria-label="Close country picker" className={styles.pickerBackdrop} onClick={() => setPickerOpen(false)} type="button" />
          <section aria-labelledby="global-country-picker-title" aria-modal="true" className={styles.picker} role="dialog">
            <div className={styles.handle} aria-hidden="true" />
            <div className={styles.pickerHeader}>
              <div><p className={styles.eyebrow}>NOXA</p><h3 id="global-country-picker-title">Choose country</h3></div>
              <button aria-label="Close" className={styles.close} onClick={() => setPickerOpen(false)} type="button">×</button>
            </div>
            <label className={styles.searchField}>
              <span className="sr-only">Search countries</span>
              <input autoFocus onChange={(event) => setSearch(event.target.value)} placeholder="Search country" type="search" value={search} />
            </label>
            <div className={styles.countryList}>
              {filteredCountries.map((code) => (
                <button
                  className={`${styles.countryRow} ${selectedCode === code ? styles.countryRowSelected : ""}`}
                  key={code}
                  onClick={() => {
                    setSelectedCode(code);
                    setPickerOpen(false);
                    setSearch("");
                  }}
                  type="button"
                >
                  <span aria-hidden="true">{countryFlag(code)}</span>
                  <span>{countryName(code)}</span>
                  {selectedCode === code ? <span className={styles.check} aria-hidden="true">✓</span> : null}
                </button>
              ))}
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
