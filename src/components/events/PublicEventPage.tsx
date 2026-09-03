import Link from "next/link";

import { EventActions } from "./EventActions";
import styles from "./PublicEventPage.module.css";
import { eventTypeLabel, formatEventDateTime, type PublicEventBundle } from "@/lib/publicEvents";

type Props = {
  bundle: PublicEventBundle;
  locale: "en" | "el";
};

const copy = {
  en: {
    back: "All Meets",
    organizedBy: "Organized by",
    verified: "Verified organizer",
    when: "When",
    where: "Where",
    about: "About",
    source: "Original source",
    sourceNote: "Check final details with the organizer before travelling.",
    noDescription: "Event details are available from the original organizer source.",
  },
  el: {
    back: "Όλα τα Meets",
    organizedBy: "Διοργάνωση",
    verified: "Verified organizer",
    when: "Πότε",
    where: "Πού",
    about: "Πληροφορίες",
    source: "Αρχική πηγή",
    sourceNote: "Έλεγξε τις τελικές πληροφορίες με τον διοργανωτή πριν ξεκινήσεις.",
    noDescription: "Οι πληροφορίες του event είναι διαθέσιμες στην αρχική πηγή του διοργανωτή.",
  },
} as const;

export function PublicEventPage({ bundle, locale }: Props) {
  const { event, organizer } = bundle;
  const t = copy[locale];
  const meetsHref = locale === "el" ? "/el/meets" : "/meets";
  const eventUrl = `https://noxastreetapp.com${locale === "el" ? "/el" : ""}/meets/${event.public_slug}`;
  const place = [event.location_text, event.city, event.region].filter(Boolean).join(" · ");
  const mapQuery = [event.location_text, event.city, event.region, event.country_code].filter(Boolean).join(", ");
  const start = formatEventDateTime(event.starts_at, event.timezone, locale);
  const end = event.ends_at ? formatEventDateTime(event.ends_at, event.timezone, locale) : null;
  const organizerName = organizer?.name || event.organizer_name || event.source_name;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link className={styles.brand} href={locale === "el" ? "/el" : "/"}>NOXA</Link>
        <Link className={styles.back} href={meetsHref}>← {t.back}</Link>
      </header>

      <main>
        <section className={styles.hero}>
          <div className={styles.heroGlow} aria-hidden="true" />
          <div className={styles.shell}>
            <div className={styles.heroMeta}>
              <span>{eventTypeLabel(event.event_type)}</span>
              <span>{event.country_code}</span>
            </div>
            <h1>{event.title}</h1>
            <div className={styles.organizerLine}>
              <span>{t.organizedBy}</span>
              <strong>{organizerName}</strong>
              {organizer?.verified ? <small>✓ {t.verified}</small> : null}
            </div>
            <EventActions
              eventId={event.id}
              eventTitle={event.title}
              eventUrl={eventUrl}
              locale={locale}
              locationQuery={mapQuery || place || event.country_code}
            />
          </div>
        </section>

        <section className={styles.details}>
          <div className={styles.shell}>
            <div className={styles.factGrid}>
              <article>
                <span>{t.when}</span>
                <strong>{start}</strong>
                {end ? <small>→ {end}</small> : null}
              </article>
              <article>
                <span>{t.where}</span>
                <strong>{place || event.country_code}</strong>
                {event.city ? <small>{event.city}</small> : null}
              </article>
            </div>

            <div className={styles.contentGrid}>
              <article className={styles.about}>
                <span>{t.about}</span>
                <p>{event.summary?.trim() || t.noDescription}</p>
              </article>

              <aside className={styles.sourceCard}>
                <span>{t.source}</span>
                <strong>{event.source_name}</strong>
                <a href={event.source_url} rel="noreferrer" target="_blank">Open source ↗</a>
                <p>{t.sourceNote}</p>
              </aside>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
