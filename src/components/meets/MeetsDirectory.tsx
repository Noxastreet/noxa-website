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

function eventLocation(event: MeetsDirectoryEvent) {
  if (!event.city || event.location.toLocaleLowerCase().includes(event.city.toLocaleLowerCase())) {
    return event.location;
  }
  return `${event.location} · ${event.city}`;
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
  const featured = visible[0] ?? null;
  const remaining = featured ? visible.slice(1) : visible;

  const t = locale === "el" ? {
    eyebrow: "NOXA MEETS",
    heroKicker: "AUTOMOTIVE CULTURE · GREECE",
    title: "Βρες το επόμενο meet σου.",
    body: "Car meets, moto events και motorsport σε ένα μέρος. Δες τι συμβαίνει, διάλεξε πόλη και βγες στον δρόμο.",
    explore: "Δες τα Events",
    upcoming: "ΕΠΟΜΕΝΑ EVENTS",
    sectionTitle: "Τι έρχεται μετά.",
    sectionBody: "Τα επόμενα automotive events, οργανωμένα ώστε να βρίσκεις γρήγορα αυτό που σε ενδιαφέρει.",
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
    noEventsBody: "Δοκίμασε άλλη πόλη ή κατηγορία για να δεις περισσότερα.",
    view: "Δες Event",
    reset: "Καθαρισμός φίλτρων",
    found: "events",
    featured: "NEXT UP",
    hostedBy: "Διοργάνωση",
    discoverIn: "Discover in",
  } : {
    eyebrow: "NOXA MEETS",
    heroKicker: "AUTOMOTIVE CULTURE · GREECE",
    title: "Find your next meet.",
    body: "Car meets, moto events and motorsport in one place. See what is happening, choose your city and get out there.",
    explore: "Explore Events",
    upcoming: "UPCOMING EVENTS",
    sectionTitle: "What’s next on the road.",
    sectionBody: "The next automotive events, organized so you can find what matters without digging through noise.",
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
    noEventsBody: "Try another city or category to discover more events.",
    view: "View Event",
    reset: "Reset filters",
    found: "events",
    featured: "NEXT UP",
    hostedBy: "Hosted by",
    discoverIn: "Discover in",
  };

  const hasActiveFilters = city !== "all" || filter !== "all";
  const countryLabel = countryName(country, locale);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link className={styles.brand} href={locale === "el" ? "/el" : "/"} aria-label="NOXA home">
          <NoxaLogo />
        </Link>
        <div className={styles.headerActions}>
          <a className={styles.headerExplore} href="#events">{t.explore}</a>
          <Link className={styles.addHeader} href={locale === "el" ? "/el/meets/submit" : "/meets/submit"}>＋ {t.add}</Link>
        </div>
      </header>

      <main>
        <section className={styles.hero}>
          <div className={styles.heroMedia} aria-hidden="true">
            <video
              className={styles.heroVideo}
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
              tabIndex={-1}
            >
              <source src="/media/noxa-hero-720p.mp4" type="video/mp4" />
            </video>
          </div>
          <div className={styles.heroShade} aria-hidden="true" />
          <div className={styles.heroNoise} aria-hidden="true" />
          <div className={`${styles.shell} ${styles.heroContent}`}>
            <div className={styles.heroCopy}>
              <p className={styles.eyebrow}>{t.eyebrow}</p>
              <p className={styles.heroKicker}>{t.heroKicker}</p>
              <h1>{t.title}</h1>
              <p className={styles.heroBody}>{t.body}</p>
              <div className={styles.heroActions}>
                <a className={styles.primaryAction} href="#events">{t.explore}<span aria-hidden="true">↘</span></a>
                <Link className={styles.secondaryAction} href={locale === "el" ? "/el/meets/submit" : "/meets/submit"}>{t.add}<span aria-hidden="true">＋</span></Link>
              </div>
            </div>
            <div className={styles.heroStat} aria-label={`${countryEvents.length} ${t.found} ${countryLabel}`}>
              <span>{t.discoverIn}</span>
              <strong>{countryLabel}</strong>
              <small>{countryEvents.length} {t.found}</small>
            </div>
          </div>
        </section>

        <section className={styles.feed} id="events">
          <div className={styles.shell}>
            <div className={styles.sectionIntro}>
              <div>
                <p className={styles.sectionEyebrow}>{t.upcoming}</p>
                <h2>{t.sectionTitle}</h2>
              </div>
              <p>{t.sectionBody}</p>
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
                      aria-pressed={filter === value}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.filterFooter}>
                <span>{visible.length} {t.found}</span>
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
            </div>

            {featured ? (() => {
              const date = formatEventDate(featured, locale);
              return (
                <Link className={styles.featuredCard} href={`${locale === "el" ? "/el" : ""}/meets/${featured.slug}`}>
                  <div className={styles.featuredMedia} aria-hidden="true">
                    <span className={styles.featuredCategory}>{CATEGORY[featured.eventType] ?? "EVENT"}</span>
                    <span className={styles.featuredIndex}>01</span>
                  </div>
                  <div className={styles.featuredContent}>
                    <div className={styles.featuredTopline}>
                      <span>{t.featured}</span>
                      <span>{date.weekday} · {date.day} {date.month} · {date.time}</span>
                    </div>
                    <h3>{featured.title}</h3>
                    <p className={styles.featuredLocation}>{eventLocation(featured)}</p>
                    <div className={styles.featuredFooter}>
                      <span>{t.hostedBy} <strong>{featured.organizer}</strong></span>
                      <strong>{t.view} <span aria-hidden="true">↗</span></strong>
                    </div>
                  </div>
                </Link>
              );
            })() : null}

            {remaining.length ? (
              <div className={styles.grid}>
                {remaining.map((event, index) => {
                  const date = formatEventDate(event, locale);
                  return (
                    <Link className={styles.card} href={`${locale === "el" ? "/el" : ""}/meets/${event.slug}`} key={event.id}>
                      <div className={styles.cardNumber} aria-hidden="true">{String(index + 2).padStart(2, "0")}</div>
                      <div className={styles.cardTop}>
                        <div className={styles.dateBadge} aria-label={`${date.weekday} ${date.day} ${date.month}`}>
                          <span>{date.weekday}</span>
                          <strong>{date.day}</strong>
                          <small>{date.month}</small>
                        </div>
                        <div className={styles.cardMeta}>
                          <span className={styles.category}>{CATEGORY[event.eventType] ?? "EVENT"}</span>
                          <span className={styles.time}>{date.time}</span>
                        </div>
                      </div>
                      <h3>{event.title}</h3>
                      <p>{eventLocation(event)}</p>
                      <div className={styles.cardFooter}>
                        <small className={styles.organizer}>{event.organizer}</small>
                        <strong className={styles.cardLink}>{t.view} <span aria-hidden="true">↗</span></strong>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : featured ? null : (
              <div className={styles.empty}>
                <strong>{t.noEvents}</strong>
                <p>{t.noEventsBody}</p>
                {hasActiveFilters ? <button type="button" onClick={() => { setFilter("all"); setCity("all"); }}>{t.reset}</button> : null}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
