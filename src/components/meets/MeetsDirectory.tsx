"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { NoxaLogo } from "@/components/brand/NoxaLogo";

import styles from "./MeetsDirectory.module.css";

export type MeetsDirectoryEvent = {
  id: string;
  slug: string;
  countryCode: string;
  title: string;
  eventType: string;
  startsAt: string;
  endsAt: string | null;
  timezone: string | null;
  location: string;
  city: string;
  region: string;
  organizer: string;
};

type Filter = "all" | "car" | "moto" | "motorsport";

const MOTORSPORT = new Set(["track_day", "drag", "drift", "rally"]);
const MOTO = new Set(["moto_meet"]);
const CATEGORY: Record<string, string> = {
  car_meet: "CAR MEET",
  moto_meet: "MOTO MEET",
  track_day: "TRACK DAY",
  drag: "DRAG",
  drift: "DRIFT",
  rally: "RALLY",
  show: "AUTO SHOW",
  cars_and_coffee: "CARS & COFFEE",
  group_drive: "GROUP DRIVE",
  festival: "FESTIVAL",
  other: "EVENT",
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

function formatEventDate(event: MeetsDirectoryEvent, locale: "en" | "el") {
  const start = new Date(event.startsAt);
  const formatterLocale = locale === "el" ? "el-GR" : "en-GB";
  const timeZone = event.timezone || "Europe/Athens";
  const clean = (value: string) => value.replace(/\.$/, "").toLocaleUpperCase(formatterLocale);

  return {
    weekday: clean(new Intl.DateTimeFormat(formatterLocale, { weekday: "short", timeZone }).format(start)),
    day: new Intl.DateTimeFormat(formatterLocale, { day: "2-digit", timeZone }).format(start),
    month: clean(new Intl.DateTimeFormat(formatterLocale, { month: "short", timeZone }).format(start)),
    time: new Intl.DateTimeFormat(formatterLocale, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone,
    }).format(start),
  };
}

function matches(event: MeetsDirectoryEvent, filter: Filter) {
  if (filter === "all") return true;
  if (filter === "moto") return MOTO.has(event.eventType);
  if (filter === "motorsport") return MOTORSPORT.has(event.eventType);
  return !MOTO.has(event.eventType) && !MOTORSPORT.has(event.eventType);
}

export function MeetsDirectory({ events, detectedCountryCode, locale }: { events: MeetsDirectoryEvent[]; detectedCountryCode: string; locale: "en" | "el" }) {
  const countries = useMemo(() => Array.from(new Set(events.map((event) => event.countryCode))).sort(), [events]);
  const initialCountry = countries.includes(detectedCountryCode) ? detectedCountryCode : (countries.includes("GR") ? "GR" : countries[0] ?? detectedCountryCode);
  const [country, setCountry] = useState(initialCountry);
  const [filter, setFilter] = useState<Filter>("all");
  const [city, setCity] = useState("all");

  const countryEvents = useMemo(() => events.filter((event) => event.countryCode === country), [events, country]);
  const cities = useMemo(() => Array.from(new Set(countryEvents.map((event) => event.city).filter(Boolean))).sort((a, b) => a.localeCompare(b)), [countryEvents]);
  const visible = useMemo(() => countryEvents.filter((event) => matches(event, filter) && (city === "all" || event.city === city)), [countryEvents, filter, city]);

  const t = locale === "el" ? {
    eyebrow: "NOXA MEETS",
    title: "Βρες το επόμενο meet σου.",
    body: "Car meets, moto events και motorsport σε ένα μέρος.",
    upcoming: "Επόμενα",
    add: "Πρόσθεσε Event",
    country: "Χώρα",
    city: "Πόλη",
    type: "Τύπος",
    all: "Όλα",
    car: "Cars",
    moto: "Moto",
    motorsport: "Motorsport",
    allCities: "Όλες οι πόλεις",
    noCities: "Δεν υπάρχουν πόλεις",
    noEvents: "Δεν υπάρχουν events με αυτά τα φίλτρα.",
    view: "Δες Event",
    reset: "Καθαρισμός",
    found: "events",
  } : {
    eyebrow: "NOXA MEETS",
    title: "Find your next meet.",
    body: "Car meets, moto events and motorsport in one place.",
    upcoming: "Upcoming",
    add: "Add Event",
    country: "Country",
    city: "City",
    type: "Type",
    all: "All",
    car: "Cars",
    moto: "Moto",
    motorsport: "Motorsport",
    allCities: "All cities",
    noCities: "No cities yet",
    noEvents: "No events match these filters.",
    view: "View Event",
    reset: "Reset",
    found: "events",
  };

  const hasActiveFilters = city !== "all" || filter !== "all";

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link className={styles.brand} href={locale === "el" ? "/el" : "/"} aria-label="NOXA home">
          <NoxaLogo />
        </Link>
        <Link className={styles.addHeader} href={locale === "el" ? "/el/meets/submit" : "/meets/submit"}>＋ {t.add}</Link>
      </header>

      <main>
        <section className={styles.hero}>
          <div className={styles.heroMedia} aria-hidden="true" />
          <div className={styles.heroShade} aria-hidden="true" />
          <div className={styles.shell}>
            <p className={styles.eyebrow}>{t.eyebrow}</p>
            <h1>{t.title}</h1>
            <p>{t.body}</p>
          </div>
        </section>

        <section className={styles.feed}>
          <div className={styles.shell}>
            <div className={styles.feedTop}>
              <span>{t.upcoming}</span>
              <strong>{visible.length} {t.found}</strong>
            </div>

            <div className={styles.discoveryPanel} aria-label="Meet filters">
              <div className={styles.locationGrid}>
                <label className={styles.locationControl}>
                  <span className={styles.controlLabel}>{t.country}</span>
                  <span className={styles.selectShell}>
                    <span className={styles.flag} aria-hidden="true">{countryFlag(country)}</span>
                    <select
                      aria-label={t.country}
                      value={country}
                      onChange={(event) => {
                        setCountry(event.target.value);
                        setCity("all");
                      }}
                    >
                      {(countries.length ? countries : [country]).map((code) => (
                        <option key={code} value={code}>{countryName(code, locale)}</option>
                      ))}
                    </select>
                    <span className={styles.chevron} aria-hidden="true">⌄</span>
                  </span>
                </label>

                <label className={styles.locationControl}>
                  <span className={styles.controlLabel}>{t.city}</span>
                  <span className={styles.selectShell}>
                    <span className={styles.pin} aria-hidden="true">●</span>
                    <select
                      aria-label={t.city}
                      value={city}
                      disabled={!cities.length}
                      onChange={(event) => setCity(event.target.value)}
                    >
                      <option value="all">{cities.length ? t.allCities : t.noCities}</option>
                      {cities.map((name) => <option key={name} value={name}>{name}</option>)}
                    </select>
                    <span className={styles.chevron} aria-hidden="true">⌄</span>
                  </span>
                </label>
              </div>

              <div className={styles.typeRow}>
                <span className={styles.controlLabel}>{t.type}</span>
                <div className={styles.chips}>
                  {([["all", t.all], ["car", t.car], ["moto", t.moto], ["motorsport", t.motorsport]] as const).map(([value, label]) => (
                    <button
                      className={filter === value ? styles.chipActive : styles.chip}
                      key={value}
                      onClick={() => setFilter(value)}
                      type="button"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {hasActiveFilters ? (
                <button
                  className={styles.resetButton}
                  type="button"
                  onClick={() => {
                    setFilter("all");
                    setCity("all");
                  }}
                >
                  {t.reset}
                </button>
              ) : null}
            </div>

            {visible.length ? (
              <div className={styles.grid}>
                {visible.map((event) => {
                  const date = formatEventDate(event, locale);
                  return (
                    <Link className={styles.card} href={`${locale === "el" ? "/el" : ""}/meets/${event.slug}`} key={event.id}>
                      <div className={styles.cardTop}>
                        <div className={styles.dateBadge} aria-label={`${date.weekday} ${date.day} ${date.month}`}>
                          <span>{date.weekday}</span>
                          <strong>{date.day}</strong>
                          <small>{date.month}</small>
                        </div>
                        <div className={styles.cardMeta}>
                          <span className={styles.time}>{date.time}</span>
                          <span className={styles.category}>{CATEGORY[event.eventType] ?? "EVENT"}</span>
                        </div>
                      </div>
                      <h3>{event.title}</h3>
                      <p>{[event.location, event.city].filter(Boolean).join(" · ")}</p>
                      <small className={styles.organizer}>{event.organizer}</small>
                      <strong className={styles.cardLink}>{t.view} →</strong>
                    </Link>
                  );
                })}
              </div>
            ) : <div className={styles.empty}>{t.noEvents}</div>}
          </div>
        </section>
      </main>
    </div>
  );
}
