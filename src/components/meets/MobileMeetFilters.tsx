"use client";

import { useEffect, useState } from "react";

import styles from "./MeetsDirectoryGrowth.module.css";

type Filter = "all" | "car" | "moto" | "motorsport";

type MobileMeetFiltersProps = {
  locale: "en" | "el";
  country: string;
  countryLabel: string;
  countries: string[];
  city: string;
  cities: string[];
  filter: Filter;
  eventCount: number;
  onCountryChange: (country: string) => void;
  onCityChange: (city: string) => void;
  onFilterChange: (filter: Filter) => void;
  onReset: () => void;
};

function countryName(code: string, locale: "en" | "el") {
  try {
    return new Intl.DisplayNames([locale === "el" ? "el" : "en"], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
}

function countryFlag(code: string) {
  if (!/^[A-Z]{2}$/.test(code)) return "";
  return String.fromCodePoint(...code.split("").map((char) => 127397 + char.charCodeAt(0)));
}

export function MobileMeetFilters({
  locale,
  country,
  countryLabel,
  countries,
  city,
  cities,
  filter,
  eventCount,
  onCountryChange,
  onCityChange,
  onFilterChange,
  onReset,
}: MobileMeetFiltersProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const t = locale === "el" ? {
    filters: "Φίλτρα",
    title: "Φίλτρα events",
    close: "Κλείσιμο",
    done: "Έτοιμο",
    country: "Χώρα",
    city: "Πόλη",
    type: "Τύπος",
    allCities: "Όλες οι πόλεις",
    noCities: "Δεν υπάρχουν πόλεις",
    all: "Όλα",
    car: "Cars",
    moto: "Moto",
    motorsport: "Motorsport",
    reset: "Καθαρισμός",
    events: "events",
  } : {
    filters: "Filters",
    title: "Event filters",
    close: "Close",
    done: "Done",
    country: "Country",
    city: "City",
    type: "Type",
    allCities: "All cities",
    noCities: "No cities yet",
    all: "All",
    car: "Cars",
    moto: "Moto",
    motorsport: "Motorsport",
    reset: "Reset",
    events: "events",
  };

  const typeLabel = filter === "car" ? t.car : filter === "moto" ? t.moto : filter === "motorsport" ? t.motorsport : t.all;
  const cityLabel = city === "all" ? t.allCities : city;

  return (
    <div className={styles.mobileFilters}>
      <div className={styles.mobileFilterBar}>
        <div className={styles.mobileFilterSummary} aria-label={`${countryLabel}, ${cityLabel}, ${typeLabel}`}>
          <span className={styles.mobileFlag} aria-hidden="true">{countryFlag(country)}</span>
          <span className={styles.mobileSummaryText}>{countryLabel}</span>
          <span className={styles.mobileDot} aria-hidden="true">·</span>
          <span className={styles.mobileSummaryText}>{cityLabel}</span>
          <span className={styles.mobileDot} aria-hidden="true">·</span>
          <span className={styles.mobileSummaryText}>{typeLabel}</span>
        </div>
        <button className={styles.mobileFilterButton} type="button" onClick={() => setOpen(true)} aria-haspopup="dialog" aria-expanded={open}>
          {t.filters}<span aria-hidden="true">↗</span>
        </button>
      </div>
      <div className={styles.mobileFilterFooter}>
        <span>{eventCount} {t.events}</span>
        <button type="button" onClick={onReset}>{t.reset}</button>
      </div>

      {open ? (
        <div className={styles.filterSheetLayer} role="presentation">
          <button className={styles.filterSheetBackdrop} type="button" aria-label={t.close} onClick={() => setOpen(false)} />
          <section className={styles.filterSheet} role="dialog" aria-modal="true" aria-labelledby="mobile-meet-filters-title">
            <div className={styles.filterSheetHeader}>
              <div>
                <span>NOXA MEETS</span>
                <h2 id="mobile-meet-filters-title">{t.title}</h2>
              </div>
              <button className={styles.filterSheetClose} type="button" aria-label={t.close} onClick={() => setOpen(false)}>×</button>
            </div>

            <div className={styles.filterSheetFields}>
              <label className={styles.sheetField}>
                <span>{t.country}</span>
                <div className={styles.sheetSelectShell}>
                  <span className={styles.sheetIcon} aria-hidden="true">{countryFlag(country)}</span>
                  <select value={country} aria-label={t.country} onChange={(event) => onCountryChange(event.target.value)}>
                    {(countries.length ? countries : [country]).map((code) => (
                      <option key={code} value={code}>{countryName(code, locale)}</option>
                    ))}
                  </select>
                  <span className={styles.sheetChevron} aria-hidden="true">⌄</span>
                </div>
              </label>

              <label className={styles.sheetField}>
                <span>{t.city}</span>
                <div className={styles.sheetSelectShell}>
                  <span className={`${styles.sheetIcon} ${styles.sheetPin}`} aria-hidden="true">●</span>
                  <select value={city} aria-label={t.city} disabled={!cities.length} onChange={(event) => onCityChange(event.target.value)}>
                    <option value="all">{cities.length ? t.allCities : t.noCities}</option>
                    {cities.map((name) => <option key={name} value={name}>{name}</option>)}
                  </select>
                  <span className={styles.sheetChevron} aria-hidden="true">⌄</span>
                </div>
              </label>

              <div className={styles.sheetTypeGroup}>
                <span>{t.type}</span>
                <div className={styles.sheetTypeGrid}>
                  {([["all", t.all], ["car", t.car], ["moto", t.moto], ["motorsport", t.motorsport]] as const).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={filter === value}
                      className={filter === value ? styles.sheetTypeActive : styles.sheetTypeButton}
                      onClick={() => onFilterChange(value)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className={styles.filterSheetActions}>
              <button className={styles.sheetReset} type="button" onClick={onReset}>{t.reset}</button>
              <button className={styles.sheetDone} type="button" onClick={() => setOpen(false)}>{t.done} · {eventCount}</button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
