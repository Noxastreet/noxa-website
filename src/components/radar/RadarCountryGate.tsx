"use client";

import { useEffect, useMemo, useState } from "react";

import styles from "./RadarCountryGate.module.css";

const STORAGE_KEY = "noxa-radar-country";
const COUNTRY_CODES = "AD AE AF AG AI AL AM AO AR AT AU AZ BA BB BD BE BF BG BH BI BJ BN BO BR BS BT BW BY BZ CA CD CF CG CH CI CL CM CN CO CR CU CV CY CZ DE DJ DK DM DO DZ EC EE EG ER ES ET FI FJ FM FR GA GB GD GE GH GM GN GQ GR GT GW GY HK HN HR HT HU ID IE IL IN IQ IR IS IT JM JO JP KE KG KH KI KM KN KP KR KW KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MG MH MK ML MM MN MR MT MU MV MW MX MY MZ NA NE NG NI NL NO NP NR NZ OM PA PE PG PH PK PL PS PT PW PY QA RO RS RU RW SA SB SC SD SE SG SI SK SL SM SN SO SR SS ST SV SY SZ TD TG TH TJ TL TM TN TO TR TT TV TW TZ UA UG US UY UZ VA VC VE VN VU WS XK YE ZA ZM ZW".split(" ");

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

function normalizeCountryCode(value: string | null | undefined) {
  const candidate = value?.trim().toUpperCase();
  return candidate && /^[A-Z]{2}$/.test(candidate) ? candidate : "GR";
}

function NoxaMark() {
  return (
    <svg
      aria-label="NOXA"
      className={styles.logoMark}
      role="img"
      viewBox="180 220 650 590"
    >
      <path
        d="M408 265 265 654h90l79-182 130 286h103l129-363H694l-79 182-130-312Z"
        fill="currentColor"
      />
      <path d="M263 655h-37v100Z" fill="currentColor" />
    </svg>
  );
}

type RadarCountryGateProps = {
  detectedCountryCode: string;
};

export function RadarCountryGate({ detectedCountryCode }: RadarCountryGateProps) {
  const detectedCode = normalizeCountryCode(detectedCountryCode);
  const [selectedCode, setSelectedCode] = useState(detectedCode);
  const [gateOpen, setGateOpen] = useState(true);
  const [countriesOpen, setCountriesOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setSelectedCode(normalizeCountryCode(saved));
      setGateOpen(false);
    }
    setHydrated(true);
  }, []);

  const selectedName = useMemo(() => countryName(selectedCode), [selectedCode]);
  const filteredCountries = useMemo(() => {
    const query = search.trim().toLowerCase();
    return COUNTRY_CODES.map((code) => ({ code, name: countryName(code) }))
      .filter(({ code, name }) => !query || code.toLowerCase().includes(query) || name.toLowerCase().includes(query))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [search]);

  function confirmCountry() {
    window.localStorage.setItem(STORAGE_KEY, selectedCode);
    setGateOpen(false);
  }

  function chooseCountry(code: string) {
    setSelectedCode(code);
    setCountriesOpen(false);
    setSearch("");
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <a className={styles.brand} href="/" aria-label="NOXA home">
          NOXA
        </a>
        <button
          aria-label={`Change country. Current country: ${selectedName}`}
          className={styles.countryChip}
          onClick={() => setGateOpen(true)}
          type="button"
        >
          <span aria-hidden="true">{countryFlag(selectedCode)}</span>
          <span>{selectedName}</span>
          <span aria-hidden="true">⌄</span>
        </button>
      </header>

      <main className={styles.main}>
        <section className={styles.hero}>
          <div className={styles.heroShade} />
          <div className={styles.heroContent}>
            <p className={styles.eyebrow}>NOXA AUTOMOTIVE CULTURE</p>
            <h1>Know what&apos;s happening around you.</h1>
            <p>
              One place to discover public automotive and motorcycle gatherings without searching every community separately.
            </p>
          </div>
        </section>

        <section className={styles.feed} aria-labelledby="country-events-heading">
          <div className={styles.feedHeading}>
            <div>
              <p className={styles.eyebrow}>YOUR COUNTRY</p>
              <h2 id="country-events-heading">{selectedName}</h2>
            </div>
            <button className={styles.inlineChange} onClick={() => setGateOpen(true)} type="button">
              Change
            </button>
          </div>

          <div className={styles.emptyState}>
            <span className={styles.emptyFlag} aria-hidden="true">{countryFlag(selectedCode)}</span>
            <h3>No events found at the moment.</h3>
            <p>New public meets and events will appear here when they are discovered.</p>
          </div>
        </section>
      </main>

      {hydrated && gateOpen ? (
        <div className={styles.modalLayer}>
          <div className={styles.backdrop} aria-hidden="true" />
          <section
            aria-labelledby="country-gate-title"
            aria-modal="true"
            className={styles.countryModal}
            role="dialog"
          >
            <NoxaMark />
            <div className={styles.modalCopy}>
              <h2 id="country-gate-title">Your country</h2>
              <p>Automatically detected. You can change it anytime.</p>
            </div>

            <div className={styles.detectedCountry}>
              <span className={styles.detectedLabel}>DETECTED</span>
              <span className={styles.largeFlag} aria-hidden="true">{countryFlag(selectedCode)}</span>
              <strong>{selectedName}</strong>
            </div>

            <button className={styles.moreCountries} onClick={() => setCountriesOpen(true)} type="button">
              <span className={styles.globeIcon} aria-hidden="true">◎</span>
              <span>More countries</span>
              <span aria-hidden="true">→</span>
            </button>

            <button className={styles.continueButton} onClick={confirmCountry} type="button">
              Explore {selectedName}
              <span aria-hidden="true">→</span>
            </button>
          </section>
        </div>
      ) : null}

      {countriesOpen ? (
        <div className={styles.countryPickerLayer}>
          <button
            aria-label="Close country list"
            className={styles.pickerBackdrop}
            onClick={() => setCountriesOpen(false)}
            type="button"
          />
          <section aria-labelledby="country-picker-title" aria-modal="true" className={styles.countryPicker} role="dialog">
            <div className={styles.pickerHandle} aria-hidden="true" />
            <div className={styles.pickerHeader}>
              <div>
                <p className={styles.eyebrow}>NOXA</p>
                <h2 id="country-picker-title">Choose country</h2>
              </div>
              <button aria-label="Close" className={styles.closeButton} onClick={() => setCountriesOpen(false)} type="button">
                ×
              </button>
            </div>

            <label className={styles.searchField}>
              <span className="sr-only">Search countries</span>
              <input
                autoFocus
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search country"
                type="search"
                value={search}
              />
            </label>

            <div className={styles.countryList}>
              {filteredCountries.map(({ code, name }) => (
                <button
                  className={`${styles.countryRow} ${code === selectedCode ? styles.countryRowSelected : ""}`}
                  key={code}
                  onClick={() => chooseCountry(code)}
                  type="button"
                >
                  <span className={styles.rowFlag} aria-hidden="true">{countryFlag(code)}</span>
                  <span>{name}</span>
                  {code === selectedCode ? <span className={styles.rowCheck} aria-hidden="true">✓</span> : null}
                </button>
              ))}
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
