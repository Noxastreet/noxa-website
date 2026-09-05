"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { NoxaLogo } from "@/components/brand/NoxaLogo";
import {
  buildDiscoveryQuery,
  eventDiscoveryState,
  matchesDiscoveryEvent,
  type DiscoveryQuery,
  type MeetDateFilter,
} from "@/lib/meets/dateFilters";

import { FollowSubscriptionForm } from "./FollowSubscriptionForm";
import { MobileMeetFilters } from "./MobileMeetFilters";
import growth from "./MeetsDirectoryGrowth.module.css";
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
  featured: boolean;
  partnerBadge: string | null;
};

type Filter = "all" | "car" | "moto" | "motorsport";
type InitialFilters = {
  country?: string;
  city?: string;
  type?: string;
  date?: string;
  q?: string;
};

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
const DATE_VALUES = new Set<MeetDateFilter>(["today", "tomorrow", "weekend", "month", "all"]);
const TYPE_VALUES = new Set<Filter>(["all", "car", "moto", "motorsport"]);

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

function eventLocation(event: MeetsDirectoryEvent) {
  if (!event.city || event.location.toLocaleLowerCase().includes(event.city.toLocaleLowerCase())) return event.location;
  return `${event.location} · ${event.city}`;
}

export function MeetsDirectory({
  events,
  detectedCountryCode,
  locale,
  initialFilters = {},
}: {
  events: MeetsDirectoryEvent[];
  detectedCountryCode: string;
  locale: "en" | "el";
  initialFilters?: InitialFilters;
}) {
  const countries = useMemo(() => Array.from(new Set(events.map((event) => event.countryCode))).sort(), [events]);
  const fallbackCountry = countries.includes(detectedCountryCode)
    ? detectedCountryCode
    : countries.includes("GR")
      ? "GR"
      : countries[0] ?? detectedCountryCode;
  const requestedCountry = initialFilters.country?.trim().toUpperCase();
  const initialCountry = requestedCountry && countries.includes(requestedCountry) ? requestedCountry : fallbackCountry;
  const [country, setCountry] = useState(initialCountry);
  const [filter, setFilter] = useState<Filter>(TYPE_VALUES.has(initialFilters.type as Filter) ? initialFilters.type as Filter : "all");
  const [city, setCity] = useState(initialFilters.city || "all");
  const [dateFilter, setDateFilter] = useState<MeetDateFilter>(DATE_VALUES.has(initialFilters.date as MeetDateFilter) ? initialFilters.date as MeetDateFilter : "all");
  const [query, setQuery] = useState(initialFilters.q || "");

  const countryEvents = useMemo(() => events.filter((event) => event.countryCode === country), [events, country]);
  const cities = useMemo(
    () => Array.from(new Set(countryEvents.map((event) => event.city).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    [countryEvents],
  );
  const selectedCity = city !== "all" && cities.includes(city) ? city : "all";
  const discoveryState: DiscoveryQuery = { country, city: selectedCity, type: filter, date: dateFilter, q: query };
  const visible = countryEvents.filter((event) => matchesDiscoveryEvent(event, discoveryState, locale));
  const lead = visible.find((event) => event.featured) ?? visible[0] ?? null;
  const remaining = lead ? visible.filter((event) => event.id !== lead.id) : visible;

  useEffect(() => {
    const next = buildDiscoveryQuery({ country, city: selectedCity, type: filter, date: dateFilter, q: query });
    window.history.replaceState(null, "", `${window.location.pathname}${next ? `?${next}` : ""}`);
  }, [country, selectedCity, filter, dateFilter, query]);

  const t = locale === "el" ? {
    eyebrow: "NOXA MEETS",
    heroKicker: "AUTOMOTIVE CULTURE · GREECE",
    title: "Βρες το επόμενο meet σου.",
    body: "Car meets, moto events και motorsport σε ένα μέρος. Δες τι συμβαίνει, διάλεξε πόλη και βγες στον δρόμο.",
    explore: "Δες τα Events",
    upcoming: "ΕΠΟΜΕΝΑ EVENTS",
    sectionTitle: "Τι έρχεται μετά.",
    sectionBody: "Today, αυτό το weekend ή στην πόλη σου — χωρίς περιττό ψάξιμο.",
    add: "Πρόσθεσε Event",
    search: "Αναζήτηση",
    searchPlaceholder: "Event, organizer ή πόλη",
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
    noEventsBody: "Δοκίμασε άλλη ημερομηνία, πόλη ή κατηγορία.",
    view: "Δες Event",
    reset: "Καθαρισμός φίλτρων",
    found: "events",
    nextUp: "NEXT UP",
    featured: "FEATURED",
    hostedBy: "Διοργάνωση",
    discoverIn: "Discover in",
    today: "Σήμερα",
    tomorrow: "Αύριο",
    weekend: "Αυτό το weekend",
    month: "Αυτόν τον μήνα",
    allUpcoming: "Όλα τα upcoming",
    happening: "ΤΩΡΑ",
    todayState: "ΣΗΜΕΡΑ",
    weekendState: "WEEKEND",
    followCity: (name: string) => `Ενημέρωσέ με για νέα events στο ${name}`,
  } : {
    eyebrow: "NOXA MEETS",
    heroKicker: "AUTOMOTIVE CULTURE · GREECE",
    title: "Find your next meet.",
    body: "Car meets, moto events and motorsport in one place. See what is happening, choose your city and get out there.",
    explore: "Explore Events",
    upcoming: "UPCOMING EVENTS",
    sectionTitle: "What’s next on the road.",
    sectionBody: "Today, this weekend or in your city — without digging through noise.",
    add: "Add Event",
    search: "Search",
    searchPlaceholder: "Event, organizer or city",
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
    noEventsBody: "Try another date, city or category.",
    view: "View Event",
    reset: "Reset filters",
    found: "events",
    nextUp: "NEXT UP",
    featured: "FEATURED",
    hostedBy: "Hosted by",
    discoverIn: "Discover in",
    today: "Today",
    tomorrow: "Tomorrow",
    weekend: "This weekend",
    month: "This month",
    allUpcoming: "All upcoming",
    happening: "HAPPENING NOW",
    todayState: "TODAY",
    weekendState: "THIS WEEKEND",
    followCity: (name: string) => `Notify me about new events in ${name}`,
  };

  const hasActiveFilters = selectedCity !== "all" || filter !== "all" || dateFilter !== "all" || query.trim() !== "";
  const countryLabel = countryName(country, locale);
  const resetFilters = () => {
    setFilter("all");
    setCity("all");
    setDateFilter("all");
    setQuery("");
  };
  const stateLabel = (event: MeetsDirectoryEvent) => {
    const state = eventDiscoveryState(event.startsAt, event.endsAt, event.timezone || "Europe/Athens");
    if (state === "happening") return t.happening;
    if (state === "today") return t.todayState;
    if (state === "weekend") return t.weekendState;
    return null;
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link className={styles.brand} href={locale === "el" ? "/el" : "/"} aria-label="NOXA home"><NoxaLogo /></Link>
        <div className={styles.headerActions}>
          <a className={styles.headerExplore} href="#events">{t.explore}</a>
          <Link className={styles.addHeader} href={locale === "el" ? "/el/meets/submit" : "/meets/submit"}>＋ {t.add}</Link>
        </div>
      </header>

      <main>
        <section className={styles.hero}>
          <div className={styles.heroMedia} aria-hidden="true">
            <video className={styles.heroVideo} autoPlay loop muted playsInline preload="metadata" tabIndex={-1}>
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
              <span>{t.discoverIn}</span><strong>{countryLabel}</strong><small>{countryEvents.length} {t.found}</small>
            </div>
          </div>
        </section>

        <section className={styles.feed} id="events">
          <div className={styles.shell}>
            <div className={styles.sectionIntro}>
              <div><p className={styles.sectionEyebrow}>{t.upcoming}</p><h2>{t.sectionTitle}</h2></div>
              <p>{t.sectionBody}</p>
            </div>

            <div className={`${styles.discoveryPanel} ${growth.compactPanel}`} aria-label="Meet filters">
              <label className={growth.searchControl}>
                <span>{t.search}</span>
                <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t.searchPlaceholder} />
              </label>
              <div className={growth.dateRow} aria-label="Date filters">
                {([["today", t.today], ["tomorrow", t.tomorrow], ["weekend", t.weekend], ["month", t.month], ["all", t.allUpcoming]] as const).map(([value, label]) => (
                  <button key={value} className={dateFilter === value ? growth.dateChipActive : growth.dateChip} type="button" aria-pressed={dateFilter === value} onClick={() => setDateFilter(value)}>{label}</button>
                ))}
              </div>

              <div className={growth.desktopFilters}>
                <div className={styles.locationGrid}>
                  <label className={styles.locationControl}>
                    <span className={styles.controlLabel}>{t.country}</span>
                    <span className={styles.selectShell}>
                      <span className={styles.flag} aria-hidden="true">{countryFlag(country)}</span>
                      <select aria-label={t.country} value={country} onChange={(event) => { setCountry(event.target.value); setCity("all"); }}>
                        {(countries.length ? countries : [country]).map((code) => <option key={code} value={code}>{countryName(code, locale)}</option>)}
                      </select>
                      <span className={styles.chevron} aria-hidden="true">⌄</span>
                    </span>
                  </label>
                  <label className={styles.locationControl}>
                    <span className={styles.controlLabel}>{t.city}</span>
                    <span className={styles.selectShell}>
                      <span className={styles.pin} aria-hidden="true">●</span>
                      <select aria-label={t.city} value={selectedCity} disabled={!cities.length} onChange={(event) => setCity(event.target.value)}>
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
                      <button className={filter === value ? styles.chipActive : styles.chip} key={value} onClick={() => setFilter(value)} type="button" aria-pressed={filter === value}>{label}</button>
                    ))}
                  </div>
                </div>
                <div className={styles.filterFooter}>
                  <span>{visible.length} {t.found}</span>
                  {hasActiveFilters ? <button className={styles.resetButton} type="button" onClick={resetFilters}>{t.reset}</button> : null}
                </div>
              </div>

              <MobileMeetFilters
                locale={locale}
                country={country}
                countryLabel={countryLabel}
                countries={countries}
                city={selectedCity}
                cities={cities}
                filter={filter}
                eventCount={visible.length}
                onCountryChange={(nextCountry) => { setCountry(nextCountry); setCity("all"); }}
                onCityChange={setCity}
                onFilterChange={setFilter}
                onReset={resetFilters}
              />
            </div>

            {selectedCity !== "all" ? <div className={growth.followWrap}><FollowSubscriptionForm locale={locale} target={{ type: "city", city: selectedCity, countryCode: country }} title={t.followCity(selectedCity)} /></div> : null}

            {lead ? (() => {
              const date = formatEventDate(lead, locale);
              const discoveryLabel = stateLabel(lead);
              return (
                <Link className={styles.featuredCard} href={`${locale === "el" ? "/el" : ""}/meets/${lead.slug}`}>
                  <div className={styles.featuredMedia} aria-hidden="true">
                    <span className={styles.featuredCategory}>{CATEGORY[lead.eventType] ?? "EVENT"}</span><span className={styles.featuredIndex}>01</span>
                  </div>
                  <div className={styles.featuredContent}>
                    <div className={styles.featuredTopline}><span>{lead.featured ? t.featured : t.nextUp}</span><span>{date.weekday} · {date.day} {date.month} · {date.time}</span></div>
                    {(discoveryLabel || lead.featured || lead.partnerBadge) ? <div className={`${growth.discoveryBadges} ${growth.leadBadges}`}>
                      {discoveryLabel ? <span className={growth.stateBadge}>{discoveryLabel}</span> : null}
                      {lead.featured ? <span className={growth.featuredDataBadge}>{t.featured}</span> : null}
                      {lead.partnerBadge ? <span className={growth.partnerDataBadge}>{lead.partnerBadge}</span> : null}
                    </div> : null}
                    <h3>{lead.title}</h3><p className={styles.featuredLocation}>{eventLocation(lead)}</p>
                    <div className={styles.featuredFooter}><span>{t.hostedBy} <strong>{lead.organizer}</strong></span><strong>{t.view} <span aria-hidden="true">↗</span></strong></div>
                  </div>
                </Link>
              );
            })() : null}

            {remaining.length ? <div className={styles.grid}>{remaining.map((event, index) => {
              const date = formatEventDate(event, locale);
              const discoveryLabel = stateLabel(event);
              return <Link className={styles.card} href={`${locale === "el" ? "/el" : ""}/meets/${event.slug}`} key={event.id}>
                <div className={styles.cardNumber} aria-hidden="true">{String(index + 2).padStart(2, "0")}</div>
                <div className={styles.cardTop}>
                  <div className={styles.dateBadge} aria-label={`${date.weekday} ${date.day} ${date.month}`}><span>{date.weekday}</span><strong>{date.day}</strong><small>{date.month}</small></div>
                  <div className={styles.cardMeta}><span className={styles.category}>{CATEGORY[event.eventType] ?? "EVENT"}</span><span className={styles.time}>{date.time}</span></div>
                </div>
                {(discoveryLabel || event.featured || event.partnerBadge) ? <div className={growth.discoveryBadges}>
                  {discoveryLabel ? <span className={growth.stateBadge}>{discoveryLabel}</span> : null}
                  {event.featured ? <span className={growth.featuredDataBadge}>{t.featured}</span> : null}
                  {event.partnerBadge ? <span className={growth.partnerDataBadge}>{event.partnerBadge}</span> : null}
                </div> : null}
                <h3>{event.title}</h3><p>{eventLocation(event)}</p>
                <div className={styles.cardFooter}><small className={styles.organizer}>{event.organizer}</small><strong className={styles.cardLink}>{t.view} <span aria-hidden="true">↗</span></strong></div>
              </Link>;
            })}</div> : lead ? null : <div className={styles.empty}><strong>{t.noEvents}</strong><p>{t.noEventsBody}</p>{hasActiveFilters ? <button type="button" onClick={resetFilters}>{t.reset}</button> : null}</div>}
          </div>
        </section>
      </main>
    </div>
  );
}
