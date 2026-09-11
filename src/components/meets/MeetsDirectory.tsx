"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { DocumentLanguage } from "@/components/i18n/DocumentLanguage";
import { WebsiteHeader } from "@/components/navigation/WebsiteHeader";
import {
  buildNoxaMapHref,
  eventDistanceKm,
  rankRecommendations,
  type GeoPoint,
} from "@/lib/meets/discoveryPersonalization";
import {
  buildDiscoveryQuery,
  eventDiscoveryState,
  matchesDiscoveryEvent,
  type DiscoveryQuery,
  type MeetDateFilter,
} from "@/lib/meets/dateFilters";
import { readSavedEvents } from "@/lib/meets/savedEvents";

import discovery from "./MeetsDiscovery.module.css";
import { FollowSubscriptionForm } from "./FollowSubscriptionForm";
import mediaStyles from "./EventMedia.module.css";
import { MobileDiscoveryDock } from "./MobileDiscoveryDock";
import { MobileMeetFilters } from "./MobileMeetFilters";
import growth from "./MeetsDirectoryGrowth.module.css";
import styles from "./MeetsDirectory.module.css";
import { SAVED_EVENT_CHANGE, SavedEventButton } from "./SavedEventButton";

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
  coverImageUrl: string | null;
  coverImageAlt: string | null;
  latitude: number | null;
  longitude: number | null;
  locationPrecision: string | null;
};

type Filter = "all" | "car" | "moto" | "motorsport";
type PersonalMode = "all" | "saved" | "nearby";
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
  karting: "KARTING",
  dexterity: "DEXTERITY",
  other: "EVENT",
};
const DATE_VALUES = new Set<MeetDateFilter>(["today", "tomorrow", "weekend", "month", "all"]);
const TYPE_VALUES = new Set<Filter>(["all", "car", "moto", "motorsport"]);
const NOXA_EVENT_FALLBACK = "radial-gradient(circle at 78% 24%, rgba(200,16,46,.28), transparent 32%), linear-gradient(135deg,#111114 0%,#08080a 46%,#050505 100%)";
const NEARBY_RADIUS_KM = 100;

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

function coverStyle(url: string | null) {
  return { backgroundImage: url ? `url(${JSON.stringify(url)})` : NOXA_EVENT_FALLBACK };
}

function distanceLabel(event: MeetsDirectoryEvent, userLocation: GeoPoint | null, locale: "en" | "el") {
  if (!userLocation) return null;
  const distance = eventDistanceKm(event, userLocation);
  if (distance === null) return null;
  const rounded = distance < 10 ? Math.round(distance * 10) / 10 : Math.round(distance);
  return locale === "el" ? `${rounded} km μακριά` : `${rounded} km away`;
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
  const [personalMode, setPersonalMode] = useState<PersonalMode>("all");
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [userLocation, setUserLocation] = useState<GeoPoint | null>(null);
  const [locationState, setLocationState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [mobileFilterSignal, setMobileFilterSignal] = useState(0);

  const countryEvents = useMemo(() => events.filter((event) => event.countryCode === country), [events, country]);
  const cities = useMemo(
    () => Array.from(new Set(countryEvents.map((event) => event.city).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    [countryEvents],
  );
  const selectedCity = city !== "all" && cities.includes(city) ? city : "all";
  const discoveryState: DiscoveryQuery = { country, city: selectedCity, type: filter, date: dateFilter, q: query };
  const baseVisible = countryEvents.filter((event) => matchesDiscoveryEvent(event, discoveryState, locale));
  const savedSet = new Set(savedIds);
  const visible = personalMode === "saved"
    ? baseVisible.filter((event) => savedSet.has(event.id))
    : personalMode === "nearby" && userLocation
      ? baseVisible
        .map((event) => ({ event, distance: eventDistanceKm(event, userLocation) }))
        .filter((item): item is { event: MeetsDirectoryEvent; distance: number } => item.distance !== null && item.distance <= NEARBY_RADIUS_KM)
        .sort((a, b) => a.distance - b.distance)
        .map((item) => item.event)
      : baseVisible;
  const lead = visible.find((event) => event.featured) ?? visible[0] ?? null;
  const remaining = lead ? visible.filter((event) => event.id !== lead.id) : visible;

  const weekendEvents = countryEvents.filter((event) => matchesDiscoveryEvent(event, {
    country,
    city: selectedCity,
    type: filter,
    date: "weekend",
    q: "",
  }, locale));
  const exactMapCount = countryEvents.filter((event) => event.locationPrecision === "exact" && event.latitude !== null && event.longitude !== null).length;
  const recommendations = rankRecommendations({
    events: countryEvents,
    savedIds,
    selectedCity,
    selectedFamily: filter,
    userLocation,
    excludeIds: lead ? [lead.id] : [],
    limit: 4,
  });

  useEffect(() => {
    const sync = () => setSavedIds(readSavedEvents(window.localStorage));
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener(SAVED_EVENT_CHANGE, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(SAVED_EVENT_CHANGE, sync);
    };
  }, []);

  useEffect(() => {
    const next = buildDiscoveryQuery({ country, city: selectedCity, type: filter, date: dateFilter, q: query });
    window.history.replaceState(null, "", `${window.location.pathname}${next ? `?${next}` : ""}`);
  }, [country, selectedCity, filter, dateFilter, query]);

  const t = locale === "el" ? {
    eyebrow: "NOXA MEETS",
    title: "Βρες το επόμενο meet σου.",
    body: "Car meets, moto events και motorsport σε ένα μέρος. Δες τι συμβαίνει, τι είναι κοντά σου και ποιος το διοργανώνει.",
    explore: "Δες τα Events",
    upcoming: "UPCOMING EVENTS",
    sectionTitle: "Τι γίνεται στον δρόμο.",
    sectionBody: "Today, αυτό το weekend, κοντά σου ή από τα saved σου — χωρίς περιττό ψάξιμο.",
    add: "Πρόσθεσε Event",
    search: "Αναζήτηση",
    searchPlaceholder: "Event, crew, business ή πόλη",
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
    savedEmpty: "Δεν έχεις saved upcoming events ακόμα.",
    nearbyEmpty: `Δεν βρέθηκαν events σε ${NEARBY_RADIUS_KM} km με αυτά τα φίλτρα.`,
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
    quick: "ΓΡΗΓΟΡΗ ΑΝΑΚΑΛΥΨΗ",
    quickHint: "Διάλεξε πώς θέλεις να ψάξεις.",
    near: "Κοντά μου",
    nearBody: `Events έως ${NEARBY_RADIUS_KM} km. Η τοποθεσία μένει στη συσκευή σου.`,
    locating: "Εύρεση τοποθεσίας…",
    locationError: "Δεν ήταν δυνατή η πρόσβαση στην τοποθεσία.",
    nearbyReady: `Δείχνουμε events έως ${NEARBY_RADIUS_KM} km από εσένα.`,
    clearNear: "Όλα τα events",
    saved: "Saved",
    savedBody: "Τα upcoming events που κράτησες.",
    map: "NOXA Map",
    mapBody: "Events, tracks, routes και places σε έναν χάρτη.",
    forYou: "ΓΙΑ ΕΣΕΝΑ",
    recTitle: "Προτάσεις με βάση τα ενδιαφέροντά σου.",
    recBody: "Χρησιμοποιούμε μόνο τα saved σου, τα φίλτρα και — αν το επέλεξες — την τοποθεσία της συσκευής σου.",
  } : {
    eyebrow: "NOXA MEETS",
    title: "Find your next meet.",
    body: "Car meets, moto events and motorsport in one place. See what is happening, what is near you and who is behind it.",
    explore: "Explore Events",
    upcoming: "UPCOMING EVENTS",
    sectionTitle: "What’s happening on the road.",
    sectionBody: "Today, this weekend, near you or from your saved list — without digging through noise.",
    add: "Add Event",
    search: "Search",
    searchPlaceholder: "Event, crew, business or city",
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
    savedEmpty: "You do not have any saved upcoming events yet.",
    nearbyEmpty: `No events were found within ${NEARBY_RADIUS_KM} km with these filters.`,
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
    quick: "QUICK DISCOVERY",
    quickHint: "Choose how you want to explore.",
    near: "Near me",
    nearBody: `Events within ${NEARBY_RADIUS_KM} km. Your location stays on your device.`,
    locating: "Finding your location…",
    locationError: "Location access was not available.",
    nearbyReady: `Showing events within ${NEARBY_RADIUS_KM} km of you.`,
    clearNear: "All events",
    saved: "Saved",
    savedBody: "The upcoming events you kept for later.",
    map: "NOXA Map",
    mapBody: "Events, tracks, routes and places on one map.",
    forYou: "FOR YOU",
    recTitle: "Recommendations shaped around you.",
    recBody: "Based only on your saved events, current filters and — if you chose it — your on-device location.",
  };

  const hasActiveFilters = selectedCity !== "all" || filter !== "all" || dateFilter !== "all" || query.trim() !== "" || personalMode !== "all";
  const countryLabel = countryName(country, locale);
  const resetFilters = () => {
    setFilter("all");
    setCity("all");
    setDateFilter("all");
    setQuery("");
    setPersonalMode("all");
  };
  const stateLabel = (event: MeetsDirectoryEvent) => {
    const state = eventDiscoveryState(event.startsAt, event.endsAt, event.timezone || "Europe/Athens");
    if (state === "happening") return t.happening;
    if (state === "today") return t.todayState;
    if (state === "weekend") return t.weekendState;
    return null;
  };

  function requestNearby() {
    if (personalMode === "nearby") {
      setPersonalMode("all");
      return;
    }
    if (userLocation) {
      setPersonalMode("nearby");
      setDateFilter("all");
      return;
    }
    if (!navigator.geolocation) {
      setLocationState("error");
      return;
    }
    setLocationState("loading");
    navigator.geolocation.getCurrentPosition((position) => {
      setUserLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude });
      setLocationState("ready");
      setPersonalMode("nearby");
      setDateFilter("all");
    }, () => {
      setLocationState("error");
    }, { enableHighAccuracy: false, timeout: 8000, maximumAge: 120_000 });
  }

  function activateWeekend() {
    setPersonalMode("all");
    setDateFilter("weekend");
    document.getElementById("events")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function activateSaved() {
    setFilter("all");
    setCity("all");
    setDateFilter("all");
    setQuery("");
    setPersonalMode(personalMode === "saved" ? "all" : "saved");
    document.getElementById("events")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const mapBase = locale === "el" ? "/el/map" : "/map";

  return (
    <div className={`${styles.page} ${discovery.discoveryPage}`}>
      <DocumentLanguage locale={locale} />
      <a className="skip-link" href="#main-content">{locale === "el" ? "Μετάβαση στο περιεχόμενο" : "Skip to content"}</a>
      <WebsiteHeader locale={locale} path="/meets" action="submit" />

      <main id="main-content">
        <section className={styles.hero}>
          <div className={styles.heroMedia} aria-hidden="true">
            <video className={styles.heroVideo} autoPlay loop muted playsInline preload="metadata" tabIndex={-1}>
              <source src="/media/noxa-hero-720p.mp4" type="video/mp4" />
            </video>
          </div>
          <div className={styles.heroShade} aria-hidden="true" />
          <div className={`${styles.shell} ${styles.heroContent}`}>
            <div className={styles.heroCopy}>
              <p className={styles.eyebrow}>{t.eyebrow}</p>
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

            <section className={discovery.quickSection} aria-label={t.quick}>
              <div className={discovery.quickHeader}><span>{t.quick}</span><strong>{t.quickHint}</strong></div>
              <div className={discovery.quickRail}>
                <button type="button" className={`${discovery.quickCard} ${personalMode === "nearby" ? discovery.quickCardActive : ""}`} aria-pressed={personalMode === "nearby"} onClick={requestNearby}>
                  <span className={discovery.quickCardTop}><span className={discovery.quickCardIcon} aria-hidden="true">⌖</span><small>{locationState === "loading" ? "…" : `${NEARBY_RADIUS_KM} KM`}</small></span>
                  <span><strong>{t.near}</strong><p>{locationState === "loading" ? t.locating : t.nearBody}</p></span>
                </button>
                <button type="button" className={`${discovery.quickCard} ${dateFilter === "weekend" && personalMode === "all" ? discovery.quickCardActive : ""}`} aria-pressed={dateFilter === "weekend" && personalMode === "all"} onClick={activateWeekend}>
                  <span className={discovery.quickCardTop}><span className={discovery.quickCardIcon} aria-hidden="true">◫</span><small>{weekendEvents.length} EVENTS</small></span>
                  <span><strong>{t.weekend}</strong><p>{locale === "el" ? "Ό,τι συμβαίνει αυτό το weekend στην επιλεγμένη περιοχή." : "Everything happening this weekend in your selected area."}</p></span>
                </button>
                <button type="button" className={`${discovery.quickCard} ${personalMode === "saved" ? discovery.quickCardActive : ""}`} aria-pressed={personalMode === "saved"} onClick={activateSaved}>
                  <span className={discovery.quickCardTop}><span className={discovery.quickCardIcon} aria-hidden="true">♥</span><small>{savedIds.length} SAVED</small></span>
                  <span><strong>{t.saved}</strong><p>{t.savedBody}</p></span>
                </button>
                <Link className={discovery.quickCard} href={mapBase}>
                  <span className={discovery.quickCardTop}><span className={discovery.quickCardIcon} aria-hidden="true">⌁</span><small>{exactMapCount} POINTS</small></span>
                  <span><strong>{t.map}</strong><p>{t.mapBody}</p></span>
                </Link>
              </div>
              {locationState === "error" ? <div className={discovery.nearStatus}><span>{t.locationError}</span><button type="button" onClick={requestNearby}>{locale === "el" ? "Ξανά" : "Try again"}</button></div> : null}
              {personalMode === "nearby" && userLocation ? <div className={discovery.nearStatus}><strong>{t.nearbyReady}</strong><button type="button" onClick={() => setPersonalMode("all")}>{t.clearNear}</button></div> : null}
            </section>

            <div className={`${styles.discoveryPanel} ${growth.compactPanel}`} aria-label="Meet filters">
              <label className={growth.searchControl}>
                <span>{t.search}</span>
                <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t.searchPlaceholder} />
              </label>
              <div className={growth.dateRow} aria-label="Date filters">
                {([["today", t.today], ["tomorrow", t.tomorrow], ["weekend", t.weekend], ["month", t.month], ["all", t.allUpcoming]] as const).map(([value, label]) => (
                  <button key={value} className={dateFilter === value && personalMode === "all" ? growth.dateChipActive : growth.dateChip} type="button" aria-pressed={dateFilter === value && personalMode === "all"} onClick={() => { setPersonalMode("all"); setDateFilter(value); }}>{label}</button>
                ))}
              </div>

              <div className={growth.desktopFilters}>
                <div className={styles.locationGrid}>
                  <label className={styles.locationControl}>
                    <span className={styles.controlLabel}>{t.country}</span>
                    <span className={styles.selectShell}>
                      <span className={styles.flag} aria-hidden="true">{countryFlag(country)}</span>
                      <select aria-label={t.country} value={country} onChange={(event) => { setCountry(event.target.value); setCity("all"); setPersonalMode("all"); }}>
                        {(countries.length ? countries : [country]).map((code) => <option key={code} value={code}>{countryName(code, locale)}</option>)}
                      </select>
                      <span className={styles.chevron} aria-hidden="true">⌄</span>
                    </span>
                  </label>
                  <label className={styles.locationControl}>
                    <span className={styles.controlLabel}>{t.city}</span>
                    <span className={styles.selectShell}>
                      <span className={styles.pin} aria-hidden="true">●</span>
                      <select aria-label={t.city} value={selectedCity} disabled={!cities.length} onChange={(event) => { setCity(event.target.value); setPersonalMode("all"); }}>
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
                      <button className={filter === value ? styles.chipActive : styles.chip} key={value} onClick={() => { setFilter(value); setPersonalMode("all"); }} type="button" aria-pressed={filter === value}>{label}</button>
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
                openSignal={mobileFilterSignal}
                onCountryChange={(nextCountry) => { setCountry(nextCountry); setCity("all"); setPersonalMode("all"); }}
                onCityChange={(nextCity) => { setCity(nextCity); setPersonalMode("all"); }}
                onFilterChange={(nextFilter) => { setFilter(nextFilter); setPersonalMode("all"); }}
                onReset={resetFilters}
              />
            </div>

            {selectedCity !== "all" ? <div className={growth.followWrap}><FollowSubscriptionForm locale={locale} target={{ type: "city", city: selectedCity, countryCode: country }} title={t.followCity(selectedCity)} /></div> : null}

            {recommendations.length ? (
              <section className={discovery.recommendations} aria-labelledby="noxa-recommendations-title">
                <div className={discovery.recommendationHeader}>
                  <div><span>{t.forYou}</span><h3 id="noxa-recommendations-title">{t.recTitle}</h3></div>
                  <p>{t.recBody}</p>
                </div>
                <div className={discovery.recommendationRail}>
                  {recommendations.map((event) => {
                    const distance = distanceLabel(event, userLocation, locale);
                    return <Link className={discovery.recommendationCard} key={event.id} href={`${locale === "el" ? "/el" : ""}/meets/${event.slug}`}>
                      <span>{CATEGORY[event.eventType] ?? "EVENT"}</span>
                      <strong>{event.title}</strong>
                      <small>{distance || event.city || event.location}</small>
                    </Link>;
                  })}
                </div>
              </section>
            ) : null}

            {lead ? (() => {
              const date = formatEventDate(lead, locale);
              const discoveryLabel = stateLabel(lead);
              const mapHref = buildNoxaMapHref(lead, locale);
              const distance = distanceLabel(lead, userLocation, locale);
              return (
                <div className={discovery.featuredShell}>
                  <Link className={styles.featuredCard} href={`${locale === "el" ? "/el" : ""}/meets/${lead.slug}`}>
                    <div className={styles.featuredMedia} style={coverStyle(lead.coverImageUrl)} aria-hidden="true">
                      <span className={styles.featuredCategory}>{CATEGORY[lead.eventType] ?? "EVENT"}</span>
                    </div>
                    <div className={styles.featuredContent}>
                      <div className={styles.featuredTopline}><span>{lead.featured ? t.featured : t.nextUp}</span><span>{date.weekday} · {date.day} {date.month} · {date.time}</span></div>
                      {(discoveryLabel || lead.featured || lead.partnerBadge || distance) ? <div className={`${growth.discoveryBadges} ${growth.leadBadges}`}>
                        {discoveryLabel ? <span className={growth.stateBadge}>{discoveryLabel}</span> : null}
                        {lead.featured ? <span className={growth.featuredDataBadge}>{t.featured}</span> : null}
                        {lead.partnerBadge ? <span className={growth.partnerDataBadge}>{lead.partnerBadge}</span> : null}
                        {distance ? <span className={discovery.distanceBadge}>{distance}</span> : null}
                      </div> : null}
                      <h3>{lead.title}</h3><p className={styles.featuredLocation}>{eventLocation(lead)}</p>
                      <div className={styles.featuredFooter}><span>{t.hostedBy} <strong>{lead.organizer}</strong></span><strong>{t.view} <span aria-hidden="true">↗</span></strong></div>
                    </div>
                  </Link>
                  <div className={discovery.featuredActions}>
                    <div className={discovery.actionGroup}>
                      {mapHref ? <Link className={discovery.actionLink} href={mapHref}>{t.map} ↗</Link> : null}
                    </div>
                    <SavedEventButton eventId={lead.id} locale={locale} />
                  </div>
                </div>
              );
            })() : null}

            {remaining.length ? <div className={styles.grid}>{remaining.map((event) => {
              const date = formatEventDate(event, locale);
              const discoveryLabel = stateLabel(event);
              const mapHref = buildNoxaMapHref(event, locale);
              const distance = distanceLabel(event, userLocation, locale);
              return <article className={discovery.cardShell} key={event.id}>
                <Link className={styles.card} href={`${locale === "el" ? "/el" : ""}/meets/${event.slug}`}>
                  {event.coverImageUrl ? <div className={mediaStyles.cardMedia} style={coverStyle(event.coverImageUrl)} aria-hidden="true" /> : null}
                  <div className={styles.cardTop}>
                    <div className={styles.dateBadge} aria-label={`${date.weekday} ${date.day} ${date.month}`}><span>{date.weekday}</span><strong>{date.day}</strong><small>{date.month}</small></div>
                    <div className={styles.cardMeta}><span className={styles.category}>{CATEGORY[event.eventType] ?? "EVENT"}</span><span className={styles.time}>{date.time}</span></div>
                  </div>
                  {(discoveryLabel || event.featured || event.partnerBadge || distance) ? <div className={growth.discoveryBadges}>
                    {discoveryLabel ? <span className={growth.stateBadge}>{discoveryLabel}</span> : null}
                    {event.featured ? <span className={growth.featuredDataBadge}>{t.featured}</span> : null}
                    {event.partnerBadge ? <span className={growth.partnerDataBadge}>{event.partnerBadge}</span> : null}
                    {distance ? <span className={discovery.distanceBadge}>{distance}</span> : null}
                  </div> : null}
                  <h3>{event.title}</h3><p>{eventLocation(event)}</p>
                  <div className={styles.cardFooter}><small className={styles.organizer}>{event.organizer}</small><strong className={styles.cardLink}>{t.view} <span aria-hidden="true">↗</span></strong></div>
                </Link>
                <div className={discovery.cardActions}>
                  <div className={discovery.actionGroup}>
                    {mapHref ? <Link className={discovery.actionLink} href={mapHref}>{t.map}</Link> : null}
                  </div>
                  <SavedEventButton eventId={event.id} locale={locale} compact />
                </div>
              </article>;
            })}</div> : lead ? null : <div className={styles.empty}><strong>{personalMode === "saved" ? t.savedEmpty : personalMode === "nearby" ? t.nearbyEmpty : t.noEvents}</strong><p>{t.noEventsBody}</p>{hasActiveFilters ? <button type="button" onClick={resetFilters}>{t.reset}</button> : null}</div>}
          </div>
        </section>
      </main>

      <MobileDiscoveryDock
        locale={locale}
        nearbyActive={personalMode === "nearby"}
        weekendActive={dateFilter === "weekend" && personalMode === "all"}
        savedActive={personalMode === "saved"}
        savedCount={savedIds.length}
        onNearby={requestNearby}
        onWeekend={activateWeekend}
        onSaved={activateSaved}
        onFilters={() => setMobileFilterSignal((value) => value + 1)}
      />
    </div>
  );
}
