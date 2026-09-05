"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";

import { NoxaLogo } from "@/components/brand/NoxaLogo";

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

function PinIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <path d="M12 21s6-5.1 6-11a6 6 0 1 0-12 0c0 5.9 6 11 6 11Z" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="10" r="2.2" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 7.5V12l3.2 2" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <path d="m9 6 6 6-6 6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

function NoxaMark() {
  return <Image alt="NOXA" className={styles.logoMark} height={300} src="/icon.png" width={300} />;
}

function EventCard({ event }: { event: RadarEvent }) {
  const place = event.city && event.city !== event.location
    ? `${event.location} · ${event.city}`
    : event.location;

  return (
    <article className={`${styles.eventCard} !rounded-[18px] !p-4`}>
      <div className={styles.eventTopline}>
        <span className={styles.eventDate}>{event.dateLabel}</span>
        <span className={`${styles.eventCategory} !rounded-lg !px-2.5 !py-1.5`}>{event.category}</span>
      </div>

      <h3 className="!mt-4 !max-w-none !text-[24px] !leading-[1.05]">{event.title}</h3>

      <dl className="mt-4 grid gap-2.5">
        <div className="grid grid-cols-[20px_1fr] items-start gap-3">
          <span className="mt-0.5 size-4 text-white/45"><PinIcon /></span>
          <dt className="sr-only">Where</dt>
          <dd className="m-0 text-[13px] leading-5 text-white/85">{place}</dd>
        </div>
        <div className="grid grid-cols-[20px_1fr] items-start gap-3">
          <span className="mt-0.5 size-4 text-white/45"><ClockIcon /></span>
          <dt className="sr-only">When</dt>
          <dd className="m-0 text-[13px] leading-5 text-white/85">{event.dateDetail}</dd>
        </div>
      </dl>

      <details className="group mt-4 border-t border-white/[.07] pt-1">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 text-[12px] font-bold text-white/75 [&::-webkit-details-marker]:hidden">
          <span>Details & source</span>
          <span className="size-4 text-white/40 transition-transform group-open:rotate-90"><ChevronIcon /></span>
        </summary>
        <div className="pb-1 pt-1">
          <p className={styles.eventDescription}>{event.description}</p>
          <div className={`${styles.eventSourceRow} !mt-4 !pt-3`}>
            <div>
              <span className={styles.verifiedDot} aria-hidden="true" />
              <span>Public source · {event.sourceName}</span>
            </div>
            <a className="!rounded-xl" href={event.sourceUrl} target="_blank" rel="noreferrer">
              Open original <span aria-hidden="true">↗</span>
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
        <Link className={styles.brand} href="/" aria-label="NOXA home"><NoxaLogo /></Link>
        <button
          aria-label={`Change country. Current country: ${selectedName}`}
          className={`${styles.countryChip} !rounded-xl !bg-[#0d0e10]`}
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
          style={{ minHeight: "clamp(230px, 29svh, 330px)" }}
        >
          <div className={styles.heroShade} />
          <div
            className={`${styles.heroContent} !px-5 !pb-7`}
            style={{ minHeight: "clamp(230px, 29svh, 330px)" }}
          >
            <p className={styles.eyebrow}>LIVE NOXA MEETS</p>
            <h1 className="!mt-3 !max-w-[12ch] !text-[clamp(36px,9vw,54px)]">Find your next meet.</h1>
            <p className="!mt-3 !max-w-[31rem] !text-[14px]">Car meets, Cars & Coffee, group drives, moto gatherings and motorsport — in one clear feed.</p>
          </div>
        </section>

        <section className={`${styles.feed} !pt-5`} aria-labelledby="country-events-heading">
          <div className={`${styles.feedHeading} !items-center`}>
            <div>
              <p className={styles.eyebrow}>UPCOMING IN</p>
              <h2 id="country-events-heading" className="!text-[30px]">{selectedName}</h2>
            </div>
            <button
              className={`${styles.inlineChange} !min-h-10 !rounded-xl !border !border-white/10 !bg-white/[.035] !px-3.5 !text-[12px]`}
              onClick={() => setGateOpen(true)}
              type="button"
            >
              Change
            </button>
          </div>

          {selectedEvents.length > 0 ? (
            <>
              <div className={filterStyles.filters} aria-label="Event filters">
                <div className={filterStyles.filterChips}>
                  {([
                    ["all", "All"],
                    ["meets", "Meets"],
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

              <div className="mt-3 flex items-center justify-between gap-3 border-b border-white/[.07] pb-3">
                <div className="min-w-0">
                  <p className="m-0 text-[14px] font-semibold text-white/85">
                    {visibleEvents.length} upcoming event{visibleEvents.length === 1 ? "" : "s"}
                  </p>
                  <p className="mt-1 text-[11px] leading-4 text-white/35">Public sources · confirm details before travelling.</p>
                </div>
                <Link
                  href="/radar/submit"
                  className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[.035] px-3.5 text-[12px] font-bold text-white no-underline transition-colors active:bg-white/[.08]"
                >
                  <span className="text-base leading-none text-[#e32c49]" aria-hidden="true">＋</span>
                  Add event
                </Link>
              </div>

              {visibleEvents.length > 0 ? (
                <div className={`${styles.eventList} !mt-4`}>
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
                className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[.04] px-4 text-[13px] font-bold text-white no-underline"
              >
                <span className="text-[#e32c49]" aria-hidden="true">＋</span>
                Add event
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
