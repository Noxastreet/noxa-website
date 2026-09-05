import Link from "next/link";
import { notFound } from "next/navigation";

import { DocumentLanguage } from "@/components/i18n/DocumentLanguage";
import { SiteHeader } from "@/components/navigation/SiteHeader";
import { landingCopy, type Locale } from "@/i18n/landing-copy";

import { loadCommunityBySlug, loadCommunityEvents, loadCommunityOrganizer } from "./community-data";
import styles from "./CommunityPlatform.module.css";

const copy = {
  en: {
    eyebrow: "NOXA COMMUNITY", about: "About", events: "Upcoming meets", noEvents: "No upcoming public meets are linked yet.", instagram: "Instagram", website: "Website", all: "All communities", verified: "VERIFIED", organizer: "Organizer", partner: "NOXA PARTNER",
  },
  el: {
    eyebrow: "NOXA COMMUNITY", about: "Σχετικά", events: "Επόμενα meets", noEvents: "Δεν υπάρχουν ακόμη συνδεδεμένα δημόσια meets.", instagram: "Instagram", website: "Website", all: "Όλες οι κοινότητες", verified: "VERIFIED", organizer: "Organizer", partner: "NOXA PARTNER",
  },
} as const;

function formatDate(value: string, timezone: string, locale: Locale) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale === "el" ? "el-GR" : "en-GB", { day: "2-digit", month: "short", timeZone: timezone || "Europe/Athens" }).format(date);
}

export async function CommunityProfile({ locale, slug }: { locale: Locale; slug: string }) {
  const community = await loadCommunityBySlug(slug);
  if (!community) notFound();

  const [events, organizer] = await Promise.all([loadCommunityEvents(community.id), loadCommunityOrganizer(community.id)]);
  const t = copy[locale];
  const base = locale === "el" ? "/el" : "";
  const landing = landingCopy[locale];
  const navigationCopy = {
    ...landing.navigation,
    join: locale === "el" ? "Early Access" : "Early Access",
    items: [
      ["Meets", `${base}/meets`],
      [locale === "el" ? "Κοινότητες" : "Communities", `${base}/communities`],
      ["Organizer", `${base}/organizer`],
    ] as const,
  };
  const coverStyle = community.cover_image_url
    ? { backgroundImage: `linear-gradient(180deg, rgba(5,5,5,.08), rgba(5,5,5,.84)), url("${community.cover_image_url}")` }
    : undefined;

  return (
    <div className={styles.page}>
      <DocumentLanguage locale={locale} />
      <SiteHeader
        locale={locale}
        languageCopy={landing.language}
        navigationCopy={navigationCopy}
        languagePaths={{ en: `/communities/${community.slug}`, el: `/el/communities/${community.slug}` }}
        homeHref={locale === "el" ? "/el" : "/"}
        joinHref={locale === "el" ? "/el#waitlist" : "/#waitlist"}
      />

      <main>
        <section className={styles.profileHero}>
          <div className={styles.shell}>
            <Link className={styles.eyebrow} href={`${base}/communities`}>← {t.all}</Link>
            <div className={styles.profileCover} style={coverStyle}>
              <div className={styles.profileHeader}>
                <p className={styles.eyebrow}>{t.eyebrow}</p>
                <h1 className={styles.profileTitle}>{community.name}</h1>
                <div className={styles.profileMeta}>
                  {community.verified ? <span>{t.verified}</span> : null}
                  <span>{community.focus.toUpperCase()}</span>
                  <span>{[community.city, community.region, community.country_code].filter(Boolean).join(" · ")}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className={`${styles.shell} ${styles.profileGrid}`}>
          <section>
            <p className={styles.eyebrow}>{t.about}</p>
            <h2 className={styles.sectionTitle}>{community.name}</h2>
            {community.description ? <p className={styles.aboutText}>{community.description}</p> : null}
            <div className={styles.tags}>
              <span className={styles.tag}>{community.focus}</span>
              {community.scene_tags.map((tag) => <span className={styles.tag} key={tag}>{tag}</span>)}
            </div>
            <div className={styles.externalLinks}>
              {organizer ? <Link className={styles.secondaryLink} href={`${base}/organizers/${organizer.slug}`}>{t.organizer}: {organizer.name}{organizer.partner ? ` · ${organizer.partner_label || t.partner}` : ""} →</Link> : null}
              {community.instagram_url ? <a className={styles.secondaryLink} href={community.instagram_url} target="_blank" rel="noreferrer">{t.instagram} ↗</a> : null}
              {community.website_url ? <a className={styles.secondaryLink} href={community.website_url} target="_blank" rel="noreferrer">{t.website} ↗</a> : null}
            </div>
          </section>

          <section>
            <p className={styles.eyebrow}>NOXA MEETS</p>
            <h2 className={styles.sectionTitle}>{t.events}</h2>
            {events.length ? (
              <div className={styles.eventList}>
                {events.map((event) => (
                  <Link className={styles.eventCard} href={`${base}/meets/${event.public_slug}`} key={event.id}>
                    <span className={styles.eventDate}>{formatDate(event.starts_at, event.timezone, locale)}</span>
                    <div><h3>{event.title}</h3><p>{event.city ?? event.location_text ?? event.region ?? community.country_code}</p></div>
                    <span className={styles.eventArrow}>→</span>
                  </Link>
                ))}
              </div>
            ) : <p className={styles.aboutText}>{t.noEvents}</p>}
          </section>
        </div>
      </main>

      <footer className={styles.footer}><div className={`${styles.shell} ${styles.footerInner}`}><span>© 2026 NOXA</span><span>{community.name} · NOXA Communities</span></div></footer>
    </div>
  );
}
