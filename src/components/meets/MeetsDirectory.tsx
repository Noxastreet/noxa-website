"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

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

function matchesType(event: MeetsDirectoryEvent, filter: Filter) {
  if (filter === "all") return true;
  if (filter === "moto") return MOTO.has(event.eventType);
  if (filter === "motorsport") return MOTORSPORT.has(event.eventType);
  return !MOTO.has(event.eventType) && !MOTORSPORT.has(event.eventType);
}

function endMs(event: MeetsDirectoryEvent) {
  const end = event.endsAt ? new Date(event.endsAt).getTime() : Number.NaN;
  if (Number.isFinite(end)) return end;
  return new Date(event.startsAt).getTime() + 3 * 60 * 60 * 1000;
}

function isHappeningNow(event: MeetsDirectoryEvent, now = Date.now()) {
  const start = new Date(event.startsAt).getTime();
  return Number.isFinite(start) && start <= now && endMs(event) >= now;
}

function startOfDay(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
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

  if (filter === "month") {
    return eventDate.getFullYear() === now.getFullYear() && eventDate.getMonth() === now.getMonth();
  }

  const day = now.getDay();
  const daysUntilSaturday = day === 6 ? 0 : (6 - day + 7) % 7;
  const weekendStart = new Date(today);
  weekendStart.setDate(weekendStart.getDate() + daysUntilSaturday);
  const weekendEnd = new Date(weekendStart);
  weekendEnd.setDate(weekendEnd.getDate() + 2);
  return eventDate >= weekendStart && eventDate < weekendEnd;
}

function normalize(value: string) {
  return value.trim().toLocaleLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
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
    try {
      const raw = window.localStorage.getItem(SAVED_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) setSavedIds(new Set(parsed.filter((item): item is string => typeof item === "string")));
    } catch {
      setSavedIds(new Set());
    }
  }, []);

  const countryEvents = useMemo(() => events.filter((event) => event.countryCode === country), [events, country]);
  const cities = useMemo(() => Array.from(new Set(countryEvents.map((event) => event.city).filter(Boolean))).sort((a, b) => a.localeCompare(b)), [countryEvents]);
  const search = normalize(query);
  const visible = useMemo(() => countryEvents
    .filter((event) => matchesType(event, filter))
    .filter((event) => city === "all" || event.city === city)
    .filter((event) => matchesDate(event, dateFilter, savedIds))
    .filter((event) => {
      if (!search) return true;
      return normalize([event.title, event.organizer, event.city, event.region, event.location, CATEGORY[event.eventType] ?? ""].join(" ")).includes(search);
    })
    .sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)) || new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()),
  [countryEvents, filter, city, dateFilter, savedIds, search]);

  const happeningCount = useMemo(() => countryEvents.filter((event) => isHappeningNow(event)).length, [countryEvents]);

  const t = locale === "el" ? {
    eyebrow: "NOXA MEETS", title: "Βρες το επόμενο meet σου.", body: "Car meets, moto events και motorsport σε ένα μέρος.",
    upcoming: "Ανακάλυψε", add: "Πρόσθεσε Event", country: "Χώρα", city: "Πόλη", type: "Τύπος", date: "Πότε", search: "Αναζήτηση",
    searchPlaceholder: "Event, organizer ή πόλη", near: "Κοντά μου", locating: "Εντοπισμός…", all: "Όλα", car: "Cars", moto: "Moto", motorsport: "Motorsport",
    allCities: "Όλες οι πόλεις", noCities: "Δεν υπάρχουν πόλεις", noEvents: "Δεν υπάρχουν events με αυτά τα φίλτρα.", view: "Δες Event", reset: "Καθαρισμός", found: "events",
    now: "Τώρα", today: "Σήμερα", tomorrow: "Αύριο", weekend: "Σαββατοκύριακο", month: "Αυτόν τον μήνα", saved: "Αποθηκευμένα", archive: "Προηγούμενα events",
    live: "LIVE", featured: "FEATURED", locationNoCity: "Βρήκαμε τη χώρα σου, αλλά δεν υπάρχει ακόμη event στην πόλη σου.", locationError: "Δεν μπορέσαμε να βρούμε την τοποθεσία σου.",
  } : {
    eyebrow: "NOXA MEETS", title: "Find your next meet.", body: "Car meets, moto events and motorsport in one place.",
    upcoming: "Discover", add: "Add Event", country: "Country", city: "City", type: "Type", date: "When", search: "Search",
    searchPlaceholder: "Event, organizer or city", near: "Near me", locating: "Locating…", all: "All", car: "Cars", moto: "Moto", motorsport: "Motorsport",
    allCities: "All cities", noCities: "No cities yet", noEvents: "No events match these filters.", view: "View Event", reset: "Reset", found: "events",
    now: "Happening now", today: "Today", tomorrow: "Tomorrow", weekend: "This weekend", month: "This month", saved: "Saved", archive: "Past events",
    live: "LIVE", featured: "FEATURED", locationNoCity: "We found your country, but there are no events in your city yet.", locationError: "We could not detect your location.",
  };

  async function useMyLocation() {
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
        if (!response.ok) throw new Error("location lookup failed");
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

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link className={styles.brand} href={locale === "el" ? "/el" : "/"} aria-label="NOXA home"><NoxaLogo /></Link>
        <Link className={styles.addHeader} href={locale === "el" ? "/el/meets/submit" : "/meets/submit"}>＋ {t.add}</Link>
      </header>

      <main>
        <section className={styles.hero}>
          <div className={styles.heroMedia} aria-hidden="true" /><div className={styles.heroShade} aria-hidden="true" />
          <div className={styles.shell}><p className={styles.eyebrow}>{t.eyebrow}</p><h1>{t.title}</h1><p>{t.body}</p></div>
        </section>

        <section className={styles.feed}>
          <div className={styles.shell}>
            <div className={styles.feedTop}><span>{t.upcoming}</span><div className={styles.feedMeta}><strong>{visible.length} {t.found}</strong><Link href={`${locale === "el" ? "/el" : ""}/meets/archive`}>{t.archive} →</Link></div></div>

            <div className={styles.quickRow} aria-label={t.date}>
              {([["now", `${t.now}${happeningCount ? ` · ${happeningCount}` : ""}`], ["today", t.today], ["weekend", t.weekend], ["saved", `${t.saved}${savedIds.size ? ` · ${savedIds.size}` : ""}`]] as const).map(([value, label]) => (
                <button key={value} type="button" className={dateFilter === value ? styles.quickActive : styles.quickButton} onClick={() => setDateFilter(dateFilter === value ? "all" : value)}>{value === "now" && happeningCount ? <span className={styles.liveDot} aria-hidden="true" /> : null}{label}</button>
              ))}
            </div>

            <div className={styles.discoveryPanel} aria-label="Meet filters">
              <label className={styles.searchControl}>
                <span className={styles.controlLabel}>{t.search}</span>
                <span className={styles.searchShell}><span aria-hidden="true">⌕</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t.searchPlaceholder} /></span>
              </label>

              <div className={styles.locationGrid}>
                <label className={styles.locationControl}><span className={styles.controlLabel}>{t.country}</span><span className={styles.selectShell}><span className={styles.flag} aria-hidden="true">{countryFlag(country)}</span><select aria-label={t.country} value={country} onChange={(event) => { setCountry(event.target.value); setCity("all"); }}>{(countries.length ? countries : [country]).map((code) => <option key={code} value={code}>{countryName(code, locale)}</option>)}</select><span className={styles.chevron} aria-hidden="true">⌄</span></span></label>
                <label className={styles.locationControl}><span className={styles.controlLabel}>{t.city}</span><span className={styles.selectShell}><span className={styles.pin} aria-hidden="true">●</span><select aria-label={t.city} value={city} disabled={!cities.length} onChange={(event) => setCity(event.target.value)}><option value="all">{cities.length ? t.allCities : t.noCities}</option>{cities.map((name) => <option key={name} value={name}>{name}</option>)}</select><span className={styles.chevron} aria-hidden="true">⌄</span></span></label>
              </div>

              <div className={styles.nearRow}><button className={styles.nearButton} type="button" disabled={locationState === "loading"} onClick={() => void useMyLocation()}><span aria-hidden="true">◎</span>{locationState === "loading" ? t.locating : t.near}</button>{locationMessage ? <span className={locationState === "error" ? styles.locationError : styles.locationMessage}>{locationMessage}</span> : null}</div>

              <div className={styles.filterGrid}>
                <div className={styles.typeRow}><span className={styles.controlLabel}>{t.type}</span><div className={styles.chips}>{([["all", t.all], ["car", t.car], ["moto", t.moto], ["motorsport", t.motorsport]] as const).map(([value, label]) => <button className={filter === value ? styles.chipActive : styles.chip} key={value} onClick={() => setFilter(value)} type="button">{label}</button>)}</div></div>
                <div className={styles.typeRow}><span className={styles.controlLabel}>{t.date}</span><div className={styles.chips}>{([["all", t.all], ["today", t.today], ["tomorrow", t.tomorrow], ["weekend", t.weekend], ["month", t.month]] as const).map(([value, label]) => <button className={dateFilter === value ? styles.chipActive : styles.chip} key={value} onClick={() => setDateFilter(value)} type="button">{label}</button>)}</div></div>
              </div>

              {hasActiveFilters ? <button className={styles.resetButton} type="button" onClick={() => { setFilter("all"); setDateFilter("all"); setCity("all"); setQuery(""); }}>{t.reset}</button> : null}
            </div>

            {visible.length ? <div className={styles.grid}>{visible.map((event) => { const date = formatEventDate(event, locale); const live = isHappeningNow(event); return (
              <Link className={`${styles.card} ${event.featured ? styles.featuredCard : ""}`} href={`${locale === "el" ? "/el" : ""}/meets/${event.slug}`} key={event.id}>
                <div className={styles.cardTop}><div className={styles.dateBadge} aria-label={`${date.weekday} ${date.day} ${date.month}`}><span>{date.weekday}</span><strong>{date.day}</strong><small>{date.month}</small></div><div className={styles.cardMeta}><span className={styles.time}>{live ? <><span className={styles.liveDot} aria-hidden="true" />{t.live}</> : date.time}</span><span className={styles.category}>{CATEGORY[event.eventType] ?? "EVENT"}</span></div></div>
                <div className={styles.badges}>{event.featured ? <span>{t.featured}</span> : null}{event.partnerBadge ? <span>{event.partnerBadge}</span> : null}{savedIds.has(event.id) ? <span>★ {t.saved}</span> : null}</div>
                <h3>{event.title}</h3><p>{[event.location, event.city].filter(Boolean).join(" · ")}</p><small className={styles.organizer}>{event.organizer}</small><strong className={styles.cardLink}>{t.view} →</strong>
              </Link>
            ); })}</div> : <div className={styles.empty}>{t.noEvents}</div>}
          </div>
        </section>
      </main>
    </div>
  );
}
