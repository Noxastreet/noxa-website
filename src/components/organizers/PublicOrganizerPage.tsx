import Link from "next/link";
import { notFound } from "next/navigation";

import { NoxaLogo } from "@/components/brand/NoxaLogo";
import { FollowPrompt } from "@/components/meets/FollowPrompt";
import { isEventCurrentlyVisible } from "@/lib/meets/eventVisibility";

import { loadPublicOrganizer } from "./public-organizer-data";
import styles from "./PublicOrganizerPage.module.css";

const CATEGORY: Record<string, string> = {
  car_meet: "CAR MEET", moto_meet: "MOTO MEET", track_day: "TRACK DAY", drag: "DRAG", drift: "DRIFT", rally: "RALLY", show: "AUTO SHOW", cars_and_coffee: "CARS & COFFEE", group_drive: "GROUP DRIVE", festival: "FESTIVAL", other: "EVENT",
};

function formatDate(value: string, timezone: string | null, locale: "en" | "el") {
  return new Intl.DateTimeFormat(locale === "el" ? "el-GR" : "en-GB", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: timezone || "Europe/Athens",
  }).format(new Date(value));
}

export async function PublicOrganizerPage({ slug, locale }: { slug: string; locale: "en" | "el" }) {
  const result = await loadPublicOrganizer(slug);
  if (!result) notFound();
  const { organizer, events } = result;
  const upcoming = events.filter((event) => isEventCurrentlyVisible(event.startsAt, event.endsAt));
  const past = events.filter((event) => !isEventCurrentlyVisible(event.startsAt, event.endsAt)).reverse().slice(0, 12);
  const base = locale === "el" ? "/el" : "";
  const t = locale === "el" ? {
    back: "Meets", verified: "VERIFIED", partner: "NOXA PARTNER", location: "ΒΑΣΗ", upcoming: "ΕΠΟΜΕΝΑ EVENTS", past: "ΠΡΟΗΓΟΥΜΕΝΑ EVENTS", none: "Δεν υπάρχουν προγραμματισμένα events αυτή τη στιγμή.", source: "Επίσημες σελίδες", community: "Community", view: "Δες Event",
  } : {
    back: "Meets", verified: "VERIFIED", partner: "NOXA PARTNER", location: "BASED IN", upcoming: "UPCOMING EVENTS", past: "PAST EVENTS", none: "No upcoming events right now.", source: "Official pages", community: "Community", view: "View Event",
  };

  return <div className={styles.page}>
    <header className={styles.header}>
      <Link className={styles.brand} href={base || "/"} aria-label="NOXA home"><NoxaLogo /></Link>
      <Link className={styles.back} href={`${base}/meets`}>← {t.back}</Link>
    </header>
    <main>
      <section className={styles.hero}>
        <div className={styles.glow} aria-hidden="true" />
        <div className={styles.shell}>
          <p className={styles.eyebrow}>NOXA ORGANIZER</p>
          <div className={styles.badges}>{organizer.verified ? <span>{t.verified}</span> : null}{organizer.partner ? <span>{organizer.partnerLabel || t.partner}</span> : null}</div>
          <h1>{organizer.name}</h1>
          <p className={styles.meta}>{[organizer.organizerType?.replaceAll("_", " "), organizer.city, organizer.countryCode].filter(Boolean).join(" · ")}</p>
          <div className={styles.heroActions}>
            <FollowPrompt targetType="organizer" targetKey={organizer.slug} targetLabel={organizer.name} locale={locale} />
            {organizer.websiteUrl ? <a href={organizer.websiteUrl} target="_blank" rel="noreferrer">Website ↗</a> : null}
            {organizer.instagramUrl ? <a href={organizer.instagramUrl} target="_blank" rel="noreferrer">Instagram ↗</a> : null}
          </div>
        </div>
      </section>

      <section className={styles.content}><div className={styles.shell}>
        {organizer.community ? <div className={styles.communityLink}><span>{t.community}</span><Link href={`${base}/communities/${organizer.community.slug}`}>{organizer.community.name} →</Link></div> : null}

        <div className={styles.sectionHeading}><span>{t.upcoming}</span><strong>{upcoming.length}</strong></div>
        {upcoming.length ? <div className={styles.grid}>{upcoming.map((event) => <Link className={styles.card} href={`${base}/meets/${event.slug}`} key={event.id}>
          <div className={styles.cardTop}><span>{CATEGORY[event.eventType] ?? "EVENT"}</span><strong>{formatDate(event.startsAt, event.timezone, locale)}</strong></div>
          <h2>{event.title}</h2><p>{[event.location, event.city].filter(Boolean).join(" · ")}</p><b>{t.view} →</b>
        </Link>)}</div> : <div className={styles.empty}>{t.none}</div>}

        {past.length ? <><div className={styles.sectionHeading}><span>{t.past}</span><strong>{past.length}</strong></div><div className={styles.pastGrid}>{past.map((event) => <Link className={styles.pastCard} href={`${base}/meets/${event.slug}`} key={event.id}><span>{formatDate(event.startsAt, event.timezone, locale)}</span><strong>{event.title}</strong><small>{event.city}</small></Link>)}</div></> : null}
      </div></section>
    </main>
  </div>;
}
