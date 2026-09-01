"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import type { RadarEvent } from "./radarEvents";
import styles from "./RadarCountryGate.module.css";
import filterStyles from "./RadarFilters.module.css";

const COUNTRY_CODES = "AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS XK YE YT ZA ZM ZW".split(" ");

const MEET_TYPES = new Set(["car_meet", "cars_and_coffee", "group_drive", "show", "festival"]);
const MOTORSPORT_TYPES = new Set(["track_day", "drag", "drift", "rally"]);

type EventFilter = "all" | "meets" | "motorsport" | "moto";

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

function matchesFilter(event: RadarEvent, filter: EventFilter) {
  if (filter === "all") return true;
  if (filter === "meets") return MEET_TYPES.has(event.eventType);
  if (filter === "motorsport") return MOTORSPORT_TYPES.has(event.eventType);
  return event.eventType === "moto_meet";
}

function NoxaMark() {
  return (
    <svg aria-label="NOXA" className={styles.logoMark} role="img" viewBox="180 220 650 590">
      <path d="M408 265 265 654h90l79-182 130 286h103l129-363H694l-79 182-130-312Z" fill="currentColor" />
      <path d="M263 655h-37v100Z" fill="currentColor" />
    </svg>
  );
}

function EventCard({ event }: { event: RadarEvent }) {
  const place = event.city && event.city !== event.location
    ? `${event.location} · ${event.city}`
    : event.location;

  return (
    <article className={styles.eventCard}>
      <div className={styles.eventTopline}>
        <span className={styles.eventDate}>{event.dateLabel}</span>
        <span className={styles.eventCategory}>{event.category}</span>
      </div>

      <h3>{event.title}</h3>

      <dl className={styles.eventDetails}>
        <div>
          <dt>Where</dt>
          <dd>{place}</dd>
        </div>
        <div>
          <dt>When</dt>
          <dd>{event.dateDetail}</dd>
        </div>
      </dl>

      <details className="mt-5 border-t border-white/[.07] pt-3">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 text-[12px] font-bold text-white/75 [&::-webkit-details-marker]:hidden">
          <span>Details & source</span>
          <span className="text-base font-normal text-white/45" aria-hidden="true">＋</span>
        </summary>
        <div className="pb-1 pt-1">
          <p className={styles.eventDescription}>{event.description}</p>
          <div className={styles.eventSourceRow}>
            <div>
              <span className={styles.verifiedDot} aria-hidden="true" />
              <span>Public source · {event.sourceName}</span>
            </div>
            <a href={event.sourceUrl} target="_blank" rel="noreferrer">
              Original source <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>
      </details>
    </article>
  );
}

type RadarCountryGateProps = {
  detectedCountryCode: string;
  events: RadarEvent[];
};

export function RadarCountryGate({ detectedCountryCode, events }: RadarCountryGateProps) {
  const detectedCode = normalizeCountryCode(detectedCountryCode);
  const [selectedCode, setSelectedCode] = useState(detectedCode);
  const [gateOpen, setGateOpen] = useState(false);
  const [countriesOpen, setCountriesOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [eventFilter, setEventFilter] = useState<EventFilter>("all");
  const [cityFilter, setCityFilter] = useState("all");

  const selectedName = useMemo(() => countryName(selectedCode), [selectedCode]);
  const selectedEvents = useMemo(
    () => events.filter((event) => event.countryCode === selectedCode),
    [events, selectedCode],
  );
  const cities = useMemo(
    () => Array.from(new Set(selectedEvents.map((event) => event.city.trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    [selectedEvents],
  );
  const visibleEvents = useMemo(
    () => selectedEvents.filter((event) =>
      matchesFilter(event, eventFilter) && (cityFilter === "all" || event.city === cityFilter)),
    [selectedEvents, eventFilter, cityFilter],
  );
  const filteredCountries = useMemo(() => {
    const query = search.trim().toLowerCase();
    return COUNTRY_CODES.map((code) => ({ code, name: countryName(code) }))
      .filter(({ code, name }) => !query || code.toLowerCase().includes(query) || name.toLowerCase().includes(query))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [search]);

  function confirmCountry() {
    setGateOpen(false);
  }

  function chooseCountry(code: string) {
    setSelectedCode(code);
    setCityFilter("all");
    setCountriesOpen(false);
    setSearch("");
  }

  function resetFilters() {
    setEventFilter("all");
    setCityFilter("all");
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link className={styles.brand} href="/" aria-label="NOXA home">NOXA</Link>
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
        <section
          className={styles.hero}
          style={{ minHeight: "clamp(280px, 36svh, 420px)" }}
        >
          <div className={styles.heroShade} />
          <div
            className={styles.heroContent}
            style={{ minHeight: "clamp(280px, 36svh, 420px)" }}
          >
            <p className={styles.eyebrow}>LIVE NOXA RADAR</p>
            <h1 className="!max-w-[12ch] !text-[clamp(40px,10vw,64px)]">Find your next meet.</h1>
            <p>Car meets, Cars & Coffee, group drives, moto gatherings and motorsport — in one clear feed.</p>
          </div>
        </section>

        <section className={styles.feed} aria-labelledby="country-events-heading">
          <div className={styles.feedHeading}>
            <div>
              <p className={styles.eyebrow}>UPCOMING IN</p>
              <h2 id="country-events-heading">{selectedName}</h2>
            </div>
            <button className={styles.inlineChange} onClick={() => setGateOpen(true)} type="button">Change</button>
          </div>

          {selectedEvents.length > 0 ? (
            <>
              <div className={filterStyles.filters} aria-label="Event filters">
                <div className={filterStyles.filterChips}>
                  {([
                    ["all", "All"],
                    ["meets", "Meets & drives"],
                    ["moto", "Moto"],
                    ["motorsport", "Motorsport"],
                  ] as const).map(([value, label]) => (
                    <button
                      aria-pressed={eventFilter === value}
                      className={eventFilter === value ? filterStyles.filterChipActive : filterStyles.filterChip}
                      key={value}
                      onClick={() => setEventFilter(value)}
                      type="button"
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {cities.length > 0 ? (
                  <label className={filterStyles.cityFilter}>
                    <span>City</span>
                    <select onChange={(event) => setCityFilter(event.target.value)} value={cityFilter}>
                      <option value="all">All cities</option>
                      {cities.map((city) => <option key={city} value={city}>{city}</option>)}
                    </select>
                  </label>
                ) : null}
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-y border-white/[.07] py-3">
                <div className={styles.feedIntro + " !mt-0"}>
                  <p>{visibleEvents.length} upcoming event{visibleEvents.length === 1 ? "" : "s"}</p>
                  <span>Public sources · always confirm final details with the organizer.</span>
                </div>
                <Link
                  href="/radar/submit"
                  className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/10 bg-white/[.035] px-4 text-[12px] font-bold text-white no-underline"
                >
                  Submit a meet <span className="ml-2 text-white/50" aria-hidden="true">＋</span>
                </Link>
              </div>

              {visibleEvents.length > 0 ? (
                <div className={styles.eventList}>
                  {visibleEvents.map((event) => <EventCard event={event} key={event.id} />)}
                </div>
              ) : (
                <div className={filterStyles.filteredEmpty}>
                  <strong>No events match these filters.</strong>
                  <button onClick={resetFilters} type="button">Show all events</button>
                </div>
              )}
            </>
          ) : (
            <div className={styles.emptyState}>
              <span className={styles.emptyFlag} aria-hidden="true">{countryFlag(selectedCode)}</span>
              <h3>No events found at the moment.</h3>
              <p>New public meets and events will appear here when they are discovered.</p>
              <Link
                href="/radar/submit"
                className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full border border-white/10 bg-white/[.04] px-5 text-[13px] font-bold text-white no-underline"
              >
                Submit an event <span className="ml-2" aria-hidden="true">＋</span>
              </Link>
            </div>
          )}
        </section>
      </main>

      {gateOpen ? (
        <div className={styles.modalLayer}>
          <div className={styles.backdrop} aria-hidden="true" />
          <section aria-labelledby="country-gate-title" aria-modal="true" className={styles.countryModal} role="dialog">
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
              Explore {selectedName}<span aria-hidden="true">→</span>
            </button>
          </section>
        </div>
      ) : null}

      {countriesOpen ? (
        <div className={styles.countryPickerLayer}>
          <button aria-label="Close country list" className={styles.pickerBackdrop} onClick={() => setCountriesOpen(false)} type="button" />
          <section aria-labelledby="country-picker-title" aria-modal="true" className={styles.countryPicker} role="dialog">
            <div className={styles.pickerHandle} aria-hidden="true" />
            <div className={styles.pickerHeader}>
              <div><p className={styles.eyebrow}>NOXA</p><h2 id="country-picker-title">Choose country</h2></div>
              <button aria-label="Close" className={styles.closeButton} onClick={() => setCountriesOpen(false)} type="button">×</button>
            </div>

            <label className={styles.searchField}>
              <span className="sr-only">Search countries</span>
              <input autoFocus onChange={(event) => setSearch(event.target.value)} placeholder="Search country" type="search" value={search} />
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
