"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

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

function formatDate(event: MeetsDirectoryEvent, locale: "en" | "el") {
  const start = new Date(event.startsAt);
  return new Intl.DateTimeFormat(locale === "el" ? "el-GR" : "en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: event.timezone || "Europe/Athens",
  }).format(start);
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
  const cities = useMemo(() => Array.from(new Set(countryEvents.map((event) => event.city).filter(Boolean))).sort(), [countryEvents]);
  const visible = useMemo(() => countryEvents.filter((event) => matches(event, filter) && (city === "all" || event.city === city)), [countryEvents, filter, city]);

  const t = locale === "el" ? {
    eyebrow: "NOXA MEETS",
    title: "Βρες το επόμενο meet σου.",
    body: "Car meets, moto events και motorsport σε ένα μέρος.",
    upcoming: "Επόμενα",
    add: "Πρόσθεσε Event",
    all: "Όλα",
    car: "Cars",
    moto: "Moto",
    motorsport: "Motorsport",
    city: "Πόλη",
    allCities: "Όλες",
    noEvents: "Δεν υπάρχουν events με αυτά τα φίλτρα.",
    view: "Δες Event",
  } : {
    eyebrow: "NOXA MEETS",
    title: "Find your next meet.",
    body: "Car meets, moto events and motorsport in one place.",
    upcoming: "Upcoming",
    add: "Add Event",
    all: "All",
    car: "Cars",
    moto: "Moto",
    motorsport: "Motorsport",
    city: "City",
    allCities: "All cities",
    noEvents: "No events match these filters.",
    view: "View Event",
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link className={styles.brand} href={locale === "el" ? "/el" : "/"}>NOXA</Link>
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
              <div>
                <span>{t.upcoming}</span>
                <h2>{countryFlag(country)} {countryName(country, locale)}</h2>
              </div>
              <label className={styles.countrySelect}>
                <span className="sr-only">Country</span>
                <select value={country} onChange={(event) => { setCountry(event.target.value); setCity("all"); }}>
                  {(countries.length ? countries : [country]).map((code) => <option key={code} value={code}>{countryName(code, locale)}</option>)}
                </select>
              </label>
            </div>

            <div className={styles.filters}>
              <div className={styles.chips}>
                {([[
                  "all", t.all,
                ], ["car", t.car], ["moto", t.moto], ["motorsport", t.motorsport]] as const).map(([value, label]) => (
                  <button className={filter === value ? styles.chipActive : styles.chip} key={value} onClick={() => setFilter(value)} type="button">{label}</button>
                ))}
              </div>
              {cities.length ? (
                <label className={styles.citySelect}><span>{t.city}</span><select value={city} onChange={(event) => setCity(event.target.value)}><option value="all">{t.allCities}</option>{cities.map((name) => <option key={name} value={name}>{name}</option>)}</select></label>
              ) : null}
            </div>

            {visible.length ? (
              <div className={styles.grid}>
                {visible.map((event) => (
                  <Link className={styles.card} href={`${locale === "el" ? "/el" : ""}/meets/${event.slug}`} key={event.id}>
                    <div className={styles.cardTop}><span>{formatDate(event, locale)}</span><span>{CATEGORY[event.eventType] ?? "EVENT"}</span></div>
                    <h3>{event.title}</h3>
                    <p>{[event.location, event.city].filter(Boolean).join(" · ")}</p>
                    <small>{event.organizer}</small>
                    <strong>{t.view} →</strong>
                  </Link>
                ))}
              </div>
            ) : <div className={styles.empty}>{t.noEvents}</div>}
          </div>
        </section>
      </main>
    </div>
  );
}
