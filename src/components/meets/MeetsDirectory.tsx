"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { NoxaLogo } from "@/components/brand/NoxaLogo";
import { FollowPrompt } from "./FollowPrompt";
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
  organizerSlug?: string | null;
  featured?: boolean;
  partnerBadge?: string | null;
};

type Filter = "all" | "car" | "moto" | "motorsport";
type DateFilter = "all" | "now" | "today" | "tomorrow" | "weekend" | "month" | "saved";

const SAVED_KEY = "noxa.savedEvents.v1";
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

function normalize(value: string) {
  return value.trim().toLocaleLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function readSavedIds() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(SAVED_KEY) ?? "[]");
    return new Set<string>(Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : []);
  } catch {
    return new Set<string>();
  }
}

function endMs(event: MeetsDirectoryEvent) {
  const explicitEnd = event.endsAt ? new Date(event.endsAt).getTime() : Number.NaN;
  return Number.isFinite(explicitEnd) ? explicitEnd : new Date(event.startsAt).getTime() + 3 * 60 * 60 * 1000;
}

function isHappeningNow(event: MeetsDirectoryEvent, now = Date.now()) {
  const start = new Date(event.startsAt).getTime();
  return Number.isFinite(start) && start <= now && endMs(event) >= now;
}

function startOfDay(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function matchesType(event: MeetsDirectoryEvent, filter: Filter) {
  if (filter === "all") return true;
  if (filter === "moto") return MOTO.has(event.eventType);
  if (filter === "motorsport") return MOTORSPORT.has(event.eventType);
  return !MOTO.has(event.eventType) && !MOTORSPORT.has(event.eventType);
}

function matchesDate(event: MeetsDirectoryEvent, filter: DateFilter, savedIds: Set<string>) {
  if (filter === "all") return true;
  if (filter === "saved") return savedIds.has(event.id);
  if (filter === "now") return isHappeningNow(event);

  const now = new Date();
  const eventDate = new Date(event.startsAt);
  const today = startOfDay(now);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const afterTomorrow = new Date(tomorrow);
  afterTomorrow.setDate(afterTomorrow.getDate() + 1);

  if (filter === "today") return eventDate >= today && eventDate < tomorrow;
  if (filter === "tomorrow") return eventDate >= tomorrow && eventDate < afterTomorrow;
  if (filter === "month") return eventDate.getFullYear() === now.getFullYear() && eventDate.getMonth() === now.getMonth();

  const daysUntilSaturday = now.getDay() === 6 ? 0 : (6 - now.getDay() + 7) % 7;
  const weekendStart = new Date(today);
  weekendStart.setDate(weekendStart.getDate() + daysUntilSaturday);
  const weekendEnd = new Date(weekendStart);
  weekendEnd.setDate(weekendEnd.getDate() + 2);
  return eventDate >= weekendStart && eventDate < weekendEnd;
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
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [city, setCity] = useState("all");
  const [query, setQuery] = useState("");
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [locationState, setLocationState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [locationMessage, setLocationMessage] = useState("");

  useEffect(() => {
    const syncSaved = () => setSavedIds(readSavedIds());
    const timer = window.setTimeout(syncSaved, 0);
    window.addEventListener("storage", syncSaved);
    window.addEventListener("focus", syncSaved);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("storage", syncSaved);
      window.removeEventListener("focus", syncSaved);
    };
  }, []);

  const countryEvents = useMemo(() => events.filter((event) => event.countryCode === country), [events, country]);
  const cities = useMemo(() => Array.from(new Set(countryEvents.map((event) => event.city).filter(Boolean))).sort((a, b) => a.localeCompare(b)), [countryEvents]);
  const search = normalize(query);
  const visible = useMemo(() => countryEvents
    .filter((event) => matchesType(event, filter))
    .filter((event) => city === "all" || event.city === city)
    .filter((event) => matchesDate(event, dateFilter, savedIds))
    .filter((event) => !search || normalize([event.title, event.organizer, event.city, event.region, event.location, CATEGORY[event.eventType] ?? ""].join(" ")).includes(search))
    .sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)) || new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()),
  [countryEvents, filter, city, dateFilter, savedIds, search]);
  const happeningCount = useMemo(() => countryEvents.filter((event) => isHappeningNow(event)).length, [countryEvents]);
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
    date: "Πότε",
    search: "Αναζήτηση",
    searchPlaceholder: "Event, organizer ή πόλη",
    near: "Κοντά μου",
    locating: "Εντοπισμός…",
    all: "Όλα",
    car: "Cars",
    moto: "Moto",
    motorsport: "Motorsport",
    allCities: "Όλες οι πόλεις",
    noCities: "Δεν υπάρχουν πόλεις",
    noEvents: "Δεν υπάρχουν events με αυτά τα φίλτρα.",
    noEventsBody: "Δοκίμασε άλλη πόλη, ημερομηνία ή κατηγορία για να δεις περισσότερα.",
    view: "Δες Event",
    reset: "Καθαρισμός φίλτρων",
    found: "events",
    featured: "FEATURED",
    hostedBy: "Διοργάνωση",
    discoverIn: "Discover in",
    now: "Τώρα",
    today: "Σήμερα",
    tomorrow: "Αύριο",
    weekend: "Σαββατοκύριακο",
    month: "Αυτόν τον μήνα",
    saved: "Αποθηκευμένα",
    archive: "Προηγούμενα events",
    live: "LIVE",
    locationNoCity: "Βρήκαμε τη χώρα σου, αλλά δεν υπάρχει ακόμη event στην πόλη σου.",
    locationError: "Δεν μπορέσαμε να βρούμε την τοποθεσία σου.",
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
    date: "When",
    search: "Search",
    searchPlaceholder: "Event, organizer or city",
    near: "Near me",
    locating: "Locating…",
    all: "All",
    car: "Cars",
    moto: "Moto",
    motorsport: "Motorsport",
    allCities: "All cities",
    noCities: "No cities yet",
    noEvents: "No events match these filters.",
    noEventsBody: "Try another city, date or category to discover more events.",
    view: "View Event",
    reset: "Reset filters",
    found: "events",
    featured: "FEATURED",
    hostedBy: "Hosted by",
    discoverIn: "Discover in",
    now: "Happening now",
    today: "Today",
    tomorrow: "Tomorrow",
    weekend: "This weekend",
    month: "This month",
    saved: "Saved",
    archive: "Past events",
    live: "LIVE",
    locationNoCity: "We found your country, but there are no events in your city yet.",
    locationError: "We could not detect your location.",
  };

  async function detectMyLocation() {
    if (!navigator.geolocation) {
      setLocationState("error");
      setLocationMessage(t.locationError);
      return;
    }
    setLocationState("loading");
    setLocationMessage("");
    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        const params = new URLSearchParams({ lat: String(position.coords.latitude), lon: String(position.coords.longitude) });
        const response = await fetch(`/api/meets/reverse-geocode?${params.toString()}`);
        if (!response.ok) throw new Error("lookup failed");
        const data = await response.json() as { countryCode?: string; city?: string };
        const nextCountry = (data.countryCode ?? "").toUpperCase();
        if (nextCountry && countries.includes(nextCountry)) setCountry(nextCountry);
        const candidates = events.filter((event) => !nextCountry || event.countryCode === nextCountry).map((event) => event.city).filter(Boolean);
        const found = data.city ? candidates.find((name) => normalize(name) === normalize(data.city ?? "")) : undefined;
        setCity(found ?? "all");
        setLocationState("done");
        setLocationMessage(found ? data.city ?? "" : t.locationNoCity);
      } catch {
        setLocationState("error");
        setLocationMessage(t.locationError);
      }
    }, () => {
      setLocationState("error");
      setLocationMessage(t.locationError);
    }, { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 });
  }

  const hasActiveFilters = city !== "all" || filter !== "all" || dateFilter !== "all" || Boolean(query.trim());
  const countryLabel = countryName(country, locale);
  const base = locale === "el" ? "/el" : "";

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link className={styles.brand} href={base || "/"} aria-label="NOXA home">
          <NoxaLogo />
        </Link>
        <div className={styles.headerActions}>
          <a className={styles.headerExplore} href="#events">{t.explore}</a>
          <Link className={styles.addHeader} href={`${base}/meets/submit`}>＋ {t.add}</Link>
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
                <Link className={styles.secondaryAction} href={`${base}/meets/submit`}>{t.add}<span aria-hidden="true">＋</span></Link>
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

            <div className={styles.discoveryTools}>
              <div className={styles.quickRow} aria-label={t.date}>
                {([["now", `${t.now}${happeningCount ? ` · ${happeningCount}` : ""}`], ["today", t.today], ["weekend", t.weekend], ["saved", `${t.saved}${savedIds.size ? ` · ${savedIds.size}` : ""}`]] as const).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    className={dateFilter === value ? styles.quickActive : styles.quickButton}
                    onClick={() => setDateFilter(dateFilter === value ? "all" : value)}
                    aria-pressed={dateFilter === value}
                  >
                    {value === "now" && happeningCount ? <span className={styles.liveDot} aria-hidden="true" /> : null}
                    {label}
                  </button>
                ))}
              </div>
              <Link className={styles.archiveLink} href={`${base}/meets/archive`}>{t.archive} →</Link>
            </div>

            <div className={styles.discoveryPanel} aria-label="Meet filters">
              <label className={styles.searchControl}>
                <span className={styles.controlLabel}>{t.search}</span>
                <span className={styles.searchShell}>
                  <span aria-hidden="true">⌕</span>
                  <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t.searchPlaceholder} />
                </span>
              </label>

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
                    <select aria-label={t.city} value={city} disabled={!cities.length} onChange={(event) => setCity(event.target.value)}>
                      <option value="all">{cities.length ? t.allCities : t.noCities}</option>
                      {cities.map((name) => <option key={name} value={name}>{name}</option>)}
                    </select>
                    <span className={styles.chevron} aria-hidden="true">⌄</span>
                  </span>
                </label>
              </div>

              <div className={styles.nearRow}>
                <button className={styles.nearButton} type="button" disabled={locationState === "loading"} onClick={() => void detectMyLocation()}>
                  <span aria-hidden="true">◎</span>{locationState === "loading" ? t.locating : t.near}
                </button>
                {locationMessage ? <span className={locationState === "error" ? styles.locationError : styles.locationMessage}>{locationMessage}</span> : null}
              </div>

              {city !== "all" ? (
                <div className={styles.followWrap}>
                  <FollowPrompt targetType="city" targetKey={`${country}:${normalize(city)}`} targetLabel={`${city}, ${countryName(country, locale)}`} locale={locale} compact />
                </div>
              ) : null}

              <div className={styles.filterGrid}>
                <div className={styles.typeRow}>
                  <span className={styles.controlLabel}>{t.type}</span>
                  <div className={styles.chips}>
                    {([["all", t.all], ["car", t.car], ["moto", t.moto], ["motorsport", t.motorsport]] as const).map(([value, label]) => (
                      <button className={filter === value ? styles.chipActive : styles.chip} key={value} onClick={() => setFilter(value)} type="button" aria-pressed={filter === value}>{label}</button>
                    ))}
                  </div>
                </div>
                <div className={styles.typeRow}>
                  <span className={styles.controlLabel}>{t.date}</span>
                  <div className={styles.chips}>
                    {([["all", t.all], ["today", t.today], ["tomorrow", t.tomorrow], ["weekend", t.weekend], ["month", t.month]] as const).map(([value, label]) => (
                      <button className={dateFilter === value ? styles.chipActive : styles.chip} key={value} onClick={() => setDateFilter(value)} type="button" aria-pressed={dateFilter === value}>{label}</button>
                    ))}
                  </div>
                </div>
              </div>

              <div className={styles.filterFooter}>
                <span>{visible.length} {t.found}</span>
                {hasActiveFilters ? (
                  <button className={styles.resetButton} type="button" onClick={() => { setFilter("all"); setDateFilter("all"); setCity("all"); setQuery(""); }}>{t.reset}</button>
                ) : null}
              </div>
            </div>

            {featured ? (() => {
              const date = formatEventDate(featured, locale);
              const live = isHappeningNow(featured);
              return (
                <Link className={styles.featuredCard} href={`${base}/meets/${featured.slug}`}>
                  <div className={styles.featuredMedia} aria-hidden="true">
                    <span className={styles.featuredCategory}>{CATEGORY[featured.eventType] ?? "EVENT"}</span>
                    <span className={styles.featuredIndex}>01</span>
                  </div>
                  <div className={styles.featuredContent}>
                    <div className={styles.featuredTopline}>
                      <span>{live ? t.live : t.featured}</span>
                      <span>{date.weekday} · {date.day} {date.month} · {live ? t.live : date.time}</span>
                    </div>
                    <div className={styles.badges}>
                      {featured.partnerBadge ? <span>{featured.partnerBadge}</span> : null}
                      {savedIds.has(featured.id) ? <span>★ {t.saved}</span> : null}
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
                  const live = isHappeningNow(event);
                  return (
                    <Link className={styles.card} href={`${base}/meets/${event.slug}`} key={event.id}>
                      <div className={styles.cardNumber} aria-hidden="true">{String(index + 2).padStart(2, "0")}</div>
                      <div className={styles.cardTop}>
                        <div className={styles.dateBadge} aria-label={`${date.weekday} ${date.day} ${date.month}`}>
                          <span>{date.weekday}</span>
                          <strong>{date.day}</strong>
                          <small>{date.month}</small>
                        </div>
                        <div className={styles.cardMeta}>
                          <span className={styles.category}>{CATEGORY[event.eventType] ?? "EVENT"}</span>
                          <span className={styles.time}>{live ? <><span className={styles.liveDot} aria-hidden="true" />{t.live}</> : date.time}</span>
                        </div>
                      </div>
                      <div className={styles.badges}>
                        {event.featured ? <span>{t.featured}</span> : null}
                        {event.partnerBadge ? <span>{event.partnerBadge}</span> : null}
                        {savedIds.has(event.id) ? <span>★ {t.saved}</span> : null}
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
                {hasActiveFilters ? <button type="button" onClick={() => { setFilter("all"); setDateFilter("all"); setCity("all"); setQuery(""); }}>{t.reset}</button> : null}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
