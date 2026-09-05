import Link from "next/link";

import { DocumentLanguage } from "@/components/i18n/DocumentLanguage";
import { SiteHeader } from "@/components/navigation/SiteHeader";
import { landingCopy, type Locale } from "@/i18n/landing-copy";

import { loadPublishedCommunities, type CommunityFocus } from "./community-data";
import styles from "./CommunityPlatform.module.css";

type CommunityDirectoryProps = { locale: Locale; query?: string; focus?: string };

const text = {
  en: {
    eyebrow: "NOXA COMMUNITIES", title: "Find your scene.", body: "Discover automotive and motorcycle communities, organisers and local scenes across Greece. One public directory, connected to real events.", searchLabel: "Search communities", searchPlaceholder: "Name, city or scene", all: "All", car: "Car", moto: "Moto", mixed: "Mixed", found: "communities", view: "View community", emptyTitle: "The directory is opening now.", emptyBody: "NOXA only lists real communities. As communities are reviewed and published, they will appear here instead of using placeholder profiles or fake numbers.", emptyCta: "List your community", footer: "Public community discovery by NOXA.",
  },
  el: {
    eyebrow: "NOXA COMMUNITIES", title: "Βρες τη σκηνή σου.", body: "Ανακάλυψε automotive και moto κοινότητες, διοργανωτές και local scenes σε όλη την Ελλάδα. Ένας δημόσιος κατάλογος συνδεδεμένος με πραγματικά events.", searchLabel: "Αναζήτηση κοινοτήτων", searchPlaceholder: "Όνομα, πόλη ή scene", all: "Όλα", car: "Car", moto: "Moto", mixed: "Mixed", found: "κοινότητες", view: "Δες την κοινότητα", emptyTitle: "Ο κατάλογος ανοίγει τώρα.", emptyBody: "Το NOXA εμφανίζει μόνο πραγματικές κοινότητες. Καθώς ελέγχονται και δημοσιεύονται, θα εμφανίζονται εδώ χωρίς placeholder profiles ή ψεύτικους αριθμούς.", emptyCta: "Καταχώρισε την κοινότητά σου", footer: "Public community discovery by NOXA.",
  },
} as const;

function focusHref(locale: Locale, focus?: CommunityFocus) {
  const base = locale === "el" ? "/el/communities" : "/communities";
  return focus ? `${base}?focus=${focus}` : base;
}

export async function CommunityDirectory({ locale, query = "", focus = "" }: CommunityDirectoryProps) {
  const copy = landingCopy[locale];
  const t = text[locale];
  const communities = await loadPublishedCommunities();
  const normalizedQuery = query.trim().toLocaleLowerCase(locale === "el" ? "el-GR" : "en-GB");
  const selectedFocus = (["car", "moto", "mixed"] as const).includes(focus as CommunityFocus) ? focus as CommunityFocus : undefined;
  const filtered = communities.filter((community) => {
    if (selectedFocus && community.focus !== selectedFocus) return false;
    if (!normalizedQuery) return true;
    const haystack = [community.name, community.city, community.region, community.focus, ...community.scene_tags].filter(Boolean).join(" ").toLocaleLowerCase(locale === "el" ? "el-GR" : "en-GB");
    return haystack.includes(normalizedQuery);
  });

  const base = locale === "el" ? "/el" : "";
  const navigationCopy = {
    ...copy.navigation,
    join: "Early Access",
    items: [
      ["Meets", `${base}/meets`],
      [locale === "el" ? "Κοινότητες" : "Communities", `${base}/communities`],
      ["Organizer", `${base}/organizer`],
    ] as const,
  };

  return (
    <div className={styles.page}>
      <DocumentLanguage locale={locale} />
      <SiteHeader locale={locale} languageCopy={copy.language} navigationCopy={navigationCopy} languagePaths={{ en: "/communities", el: "/el/communities" }} homeHref={locale === "el" ? "/el" : "/"} joinHref={locale === "el" ? "/el#waitlist" : "/#waitlist"} />

      <main>
        <section className={styles.hero}><div className={styles.shell}><p className={styles.eyebrow}>{t.eyebrow}</p><h1>{t.title}</h1><p className={styles.heroBody}>{t.body}</p></div></section>
        <div className={styles.shell}>
          <form className={styles.toolbar} method="get">
            <div className={styles.searchGroup}><label htmlFor="community-search">{t.searchLabel}</label><input id="community-search" className={styles.searchInput} name="q" defaultValue={query} placeholder={t.searchPlaceholder} type="search" />{selectedFocus ? <input type="hidden" name="focus" value={selectedFocus} /> : null}</div>
            <div><span className={styles.filterLabel}>Focus</span><div className={styles.filters}><Link className={!selectedFocus ? styles.filterActive : styles.filter} href={focusHref(locale)}>{t.all}</Link><Link className={selectedFocus === "car" ? styles.filterActive : styles.filter} href={focusHref(locale, "car")}>{t.car}</Link><Link className={selectedFocus === "moto" ? styles.filterActive : styles.filter} href={focusHref(locale, "moto")}>{t.moto}</Link><Link className={selectedFocus === "mixed" ? styles.filterActive : styles.filter} href={focusHref(locale, "mixed")}>{t.mixed}</Link></div></div>
          </form>
          <div className={styles.resultsMeta}><span>{filtered.length} {t.found}</span><span>Greece · GR</span></div>
          {filtered.length ? <div className={styles.grid}>{filtered.map((community) => {
            const href = `${base}/communities/${community.slug}`;
            const coverStyle = community.cover_image_url ? { backgroundImage: `linear-gradient(180deg, rgba(5,5,5,.04), rgba(5,5,5,.55)), url("${community.cover_image_url}")` } : undefined;
            return <Link className={styles.card} href={href} key={community.id}><div className={styles.cover} style={coverStyle} /><div className={styles.cardBody}><div className={styles.cardTop}><h2>{community.name}</h2>{community.verified ? <span className={styles.verified}>VERIFIED</span> : null}</div><p className={styles.location}>{[community.city, community.region, community.country_code].filter(Boolean).join(" · ")}</p>{community.description ? <p className={styles.description}>{community.description}</p> : null}<div className={styles.tags}><span className={styles.tag}>{community.focus}</span>{community.scene_tags.slice(0, 4).map((tag) => <span className={styles.tag} key={tag}>{tag}</span>)}</div><span className={styles.cardCta}>{t.view} →</span></div></Link>;
          })}</div> : <section className={styles.empty}><h2>{t.emptyTitle}</h2><p>{t.emptyBody}</p><Link className={styles.primaryLink} href={locale === "el" ? "/el/communities/apply" : "/communities/apply"}>{t.emptyCta} →</Link></section>}
        </div>
      </main>
      <footer className={styles.footer}><div className={`${styles.shell} ${styles.footerInner}`}><span>© 2026 NOXA</span><span>{t.footer}</span></div></footer>
    </div>
  );
}
