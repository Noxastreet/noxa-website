import Link from "next/link";

import { NoxaLogo } from "@/components/brand/NoxaLogo";
import { DocumentLanguage } from "@/components/i18n/DocumentLanguage";
import { InstagramIcon } from "@/components/social/InstagramIcon";
import type { Locale } from "@/i18n/landing-copy";

import {
  loadPublishedCommunities,
  type CommunityFocus,
  type PublicCommunity,
} from "./community-data";
import styles from "./CrewDirectory.module.css";

const INSTAGRAM_HREF = "https://www.instagram.com/noxa_app/";

const editorialImages = [
  "/api/media/culture-image?asset=culture",
  "/api/media/culture-image?asset=community",
  "/api/media/culture-image?asset=organizer",
  "/api/media/culture-image?asset=heroFallback",
  "/api/media/culture-image?asset=hero",
] as const;

const sceneCities = [
  ["Athens", "Street culture & meets"],
  ["Thessaloniki", "Night drives & JDM"],
  ["Patras", "Local crews & events"],
  ["Larissa", "Growing community"],
  ["Ioannina", "Mountain drives"],
  ["Heraklion", "Island car scene"],
] as const;

const styleFilters = [
  "jdm",
  "european",
  "classics",
  "supercars",
  "off-road",
  "drift",
  "track",
  "lifestyle",
] as const;

type StyleFilter = (typeof styleFilters)[number];
type SortMode = "trending" | "newest";

type Props = {
  locale: Locale;
  query?: string;
  focus?: string;
  style?: string;
  sort?: string;
};

type Copy = {
  eyebrow: string;
  title: string;
  body: string;
  editorialNote: string;
  searchPlaceholder: string;
  featuredTitle: string;
  featuredBody: string;
  viewAll: string;
  allTitle: string;
  sceneTitle: string;
  sceneBody: string;
  momentsTitle: string;
  momentsBody: string;
  ctaEyebrow: string;
  ctaTitle: string;
  ctaBody: string;
  create: string;
  learn: string;
  directoryOpening: string;
  directoryOpeningBody: string;
  noMatches: string;
  noMatchesBody: string;
  viewCrew: string;
  activeLabel: string;
  footerLine: string;
  skip: string;
  searchAria: string;
  navAria: string;
  menuAria: string;
  sortLabel: string;
  languageLabel: string;
};

const copy: Record<Locale, Copy> = {
  en: {
    eyebrow: "COMMUNITY",
    title: "Find your crew.",
    body: "Discover automotive communities, local crews and driving groups across Greece.",
    editorialNote: "More than cars. A community.",
    searchPlaceholder: "Search crews, cities, styles…",
    featuredTitle: "Featured Crews",
    featuredBody: "Communities shaping the automotive scene.",
    viewAll: "View all crews",
    allTitle: "All Crews",
    sceneTitle: "Explore the Scene",
    sceneBody: "See what’s happening around Greece.",
    momentsTitle: "Community Moments",
    momentsBody: "Same roads. Different stories.",
    ctaEyebrow: "CREATE A CREW",
    ctaTitle: "Built something worth joining?",
    ctaBody: "Bring your crew to NOXA and give your community a place to be discovered.",
    create: "Create a Crew",
    learn: "Learn More",
    directoryOpening: "The crew directory is opening now.",
    directoryOpeningBody: "NOXA only publishes real crews after review. Your community can be among the first discovered here.",
    noMatches: "No crews match these filters yet.",
    noMatchesBody: "Try a broader scene filter or clear the search. Published crews will appear here automatically.",
    viewCrew: "View crew",
    activeLabel: "Active community",
    footerLine: "Built for Greece’s automotive culture.",
    skip: "Skip to crew directory",
    searchAria: "Search crews",
    navAria: "Primary navigation",
    menuAria: "Open navigation menu",
    sortLabel: "Sort",
    languageLabel: "ΕΛ",
  },
  el: {
    eyebrow: "COMMUNITY",
    title: "Βρες το crew σου.",
    body: "Ανακάλυψε automotive κοινότητες, local crews και driving groups σε όλη την Ελλάδα.",
    editorialNote: "Περισσότερο από αυτοκίνητα. Μια κοινότητα.",
    searchPlaceholder: "Αναζήτηση crews, πόλεων, styles…",
    featuredTitle: "Featured Crews",
    featuredBody: "Κοινότητες που διαμορφώνουν την automotive σκηνή.",
    viewAll: "Όλα τα crews",
    allTitle: "All Crews",
    sceneTitle: "Explore the Scene",
    sceneBody: "Δες τι συμβαίνει σε όλη την Ελλάδα.",
    momentsTitle: "Community Moments",
    momentsBody: "Ίδιοι δρόμοι. Διαφορετικές ιστορίες.",
    ctaEyebrow: "CREATE A CREW",
    ctaTitle: "Έχτισες κάτι που αξίζει να συμμετέχεις;",
    ctaBody: "Φέρε το crew σου στο NOXA και δώσε στην κοινότητά σου ένα μέρος για να ανακαλυφθεί.",
    create: "Create a Crew",
    learn: "Learn More",
    directoryOpening: "Το crew directory ανοίγει τώρα.",
    directoryOpeningBody: "Το NOXA δημοσιεύει μόνο πραγματικά crews μετά από έλεγχο. Η κοινότητά σου μπορεί να είναι από τις πρώτες εδώ.",
    noMatches: "Δεν υπάρχουν ακόμη crews με αυτά τα φίλτρα.",
    noMatchesBody: "Δοκίμασε πιο γενικό φίλτρο ή καθάρισε την αναζήτηση. Τα published crews θα εμφανίζονται αυτόματα.",
    viewCrew: "Δες το crew",
    activeLabel: "Ενεργή κοινότητα",
    footerLine: "Built for Greece’s automotive culture.",
    skip: "Μετάβαση στο crew directory",
    searchAria: "Αναζήτηση crews",
    navAria: "Κύρια πλοήγηση",
    menuAria: "Άνοιγμα μενού πλοήγησης",
    sortLabel: "Sort",
    languageLabel: "EN",
  },
};

function ArrowIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20">
      <path d="M4 10h11M11 6l4 4-4 4" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <circle cx="10.8" cy="10.8" r="6.3" />
      <path d="m15.5 15.5 4.2 4.2" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20">
      <path d="M10 18s5-4.7 5-9a5 5 0 1 0-10 0c0 4.3 5 9 5 9Z" />
      <circle cx="10" cy="9" r="1.8" />
    </svg>
  );
}

function PeopleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20">
      <circle cx="7" cy="7" r="2.3" />
      <circle cx="13.7" cy="8" r="1.8" />
      <path d="M2.8 15c.4-2.7 2-4 4.3-4s4 1.3 4.4 4M11.7 12c2.6 0 4 .9 4.5 3" />
    </svg>
  );
}

function normalizeTag(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function isStyleFilter(value?: string): value is StyleFilter {
  return Boolean(value && styleFilters.includes(value as StyleFilter));
}

function isSortMode(value?: string): value is SortMode {
  return value === "newest" || value === "trending";
}

function directoryHref(
  locale: Locale,
  options: { focus?: CommunityFocus; style?: StyleFilter; sort?: SortMode } = {},
) {
  const base = locale === "el" ? "/el/communities" : "/communities";
  const params = new URLSearchParams();
  if (options.focus) params.set("focus", options.focus);
  if (options.style) params.set("style", options.style);
  if (options.sort && options.sort !== "trending") params.set("sort", options.sort);
  const query = params.toString();
  return query ? `${base}?${query}` : base;
}

function Header({ locale, t }: { locale: Locale; t: Copy }) {
  const base = locale === "el" ? "/el" : "";
  const communityHref = `${base}/communities`;
  const nav = [
    ["Home", base || "/"],
    ["Map", `${base}/map`],
    ["Community", communityHref],
    ["Events", `${base}/meets`],
    ["Business", "/business"],
  ] as const;
  const languageHref = locale === "el" ? "/communities" : "/el/communities";

  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <Link className={styles.brand} href={base || "/"} aria-label="NOXA home">
          <NoxaLogo className={styles.brandLogo} />
        </Link>

        <nav className={styles.desktopNav} aria-label={t.navAria}>
          {nav.map(([label, href]) => (
            <Link
              key={href}
              className={href === communityHref ? styles.navActive : undefined}
              href={href}
              aria-current={href === communityHref ? "page" : undefined}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className={styles.headerActions}>
          <a className={styles.iconButton} href="#crew-search" aria-label={t.searchAria}>
            <SearchIcon />
          </a>
          <Link className={styles.languageLink} href={languageHref} aria-label="Change language">
            {t.languageLabel}
          </Link>
          <Link className={styles.profileLink} href={`${base}/communities/apply`}>
            <span className={styles.profileMark} aria-hidden="true">N</span>
            <span>{t.create}</span>
          </Link>
          <details className={styles.mobileMenu}>
            <summary aria-label={t.menuAria}>
              <span />
              <span />
            </summary>
            <div className={styles.mobileMenuPanel}>
              <nav aria-label={t.navAria}>
                {nav.map(([label, href]) => (
                  <Link
                    key={href}
                    className={href === communityHref ? styles.mobileNavActive : undefined}
                    href={href}
                    aria-current={href === communityHref ? "page" : undefined}
                  >
                    {label}
                  </Link>
                ))}
              </nav>
              <Link href={`${base}/communities/apply`}>{t.create} <span aria-hidden="true">→</span></Link>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}

function HeroCollage() {
  return (
    <div className={styles.collage} aria-hidden="true">
      <div className={`${styles.collageTile} ${styles.collageLarge}`} style={{ backgroundImage: `url("${editorialImages[0]}")` }}>
        <span>Different drivers.<br />Same roads.</span>
      </div>
      <div className={`${styles.collageTile} ${styles.collageTop}`} style={{ backgroundImage: `url("${editorialImages[1]}")` }} />
      <div className={`${styles.collageTile} ${styles.collageSmall}`} style={{ backgroundImage: `url("${editorialImages[2]}")` }} />
      <div className={`${styles.collageTile} ${styles.collageWide}`} style={{ backgroundImage: `url("${editorialImages[3]}")` }} />
      <div className={`${styles.collageTile} ${styles.collageBottom}`} style={{ backgroundImage: `url("${editorialImages[4]}")` }}>
        <span>People. Cars.<br />Places. Stories.</span>
      </div>
    </div>
  );
}

function CrewLogo({ community }: { community: PublicCommunity }) {
  if (community.logo_url) {
    return (
      <span
        className={styles.crewLogo}
        role="img"
        aria-label={`${community.name} logo`}
        style={{ backgroundImage: `url("${community.logo_url}")` }}
      />
    );
  }

  return (
    <span className={`${styles.crewLogo} ${styles.crewLogoFallback}`} aria-hidden="true">
      {community.name
        .split(/\s+/)
        .slice(0, 2)
        .map((word) => word[0])
        .join("")
        .toUpperCase()}
    </span>
  );
}

function LocationLine({ community }: { community: PublicCommunity }) {
  const location = [community.city, community.region].filter(Boolean).join(", ") || "Greece";
  return (
    <p className={styles.locationLine}>
      <PinIcon />
      <span>{location}{location === "Greece" ? "" : ", Greece"}</span>
    </p>
  );
}

function FeaturedCrewCard({ community, index, locale, t }: { community: PublicCommunity; index: number; locale: Locale; t: Copy }) {
  const base = locale === "el" ? "/el" : "";
  const image = community.cover_image_url || editorialImages[index % editorialImages.length];

  return (
    <Link className={styles.featuredCard} href={`${base}/communities/${community.slug}`}>
      <div
        className={styles.featuredImage}
        role="img"
        aria-label={`${community.name} crew cover`}
        style={{ backgroundImage: `linear-gradient(180deg,rgba(5,5,5,.02),rgba(5,5,5,.32)),url("${image}")` }}
      />
      <div className={styles.featuredBody}>
        <CrewLogo community={community} />
        <div className={styles.featuredTitleRow}>
          <h3>{community.name}</h3>
          {community.verified ? <span className={styles.verifiedBadge} aria-label="Verified crew">✓</span> : null}
        </div>
        <LocationLine community={community} />
        <p className={styles.crewDescription}>{community.description || t.activeLabel}</p>
        <div className={styles.featuredMetaRow}>
          <span className={styles.communityMeta}><PeopleIcon /> NOXA community</span>
          <span className={styles.arrowCircle} aria-label={t.viewCrew}><ArrowIcon /></span>
        </div>
        <div className={styles.tags}>
          {[community.focus, ...community.scene_tags].slice(0, 3).map((tag, tagIndex) => <span key={`${tag}-${tagIndex}`}>{tag}</span>)}
        </div>
      </div>
    </Link>
  );
}

function EmptyFeaturedCard({ index, locale, t }: { index: number; locale: Locale; t: Copy }) {
  const base = locale === "el" ? "/el" : "";
  return (
    <Link className={`${styles.featuredCard} ${styles.featuredPlaceholder}`} href={`${base}/communities/apply`}>
      <div className={styles.featuredImage} aria-hidden="true" style={{ backgroundImage: `linear-gradient(180deg,rgba(5,5,5,.04),rgba(5,5,5,.62)),url("${editorialImages[index % editorialImages.length]}")` }} />
      <div className={styles.featuredBody}>
        <span className={`${styles.crewLogo} ${styles.crewLogoFallback}`} aria-hidden="true">N</span>
        <p className={styles.placeholderLabel}>NOXA CREW DIRECTORY</p>
        <h3>{index === 0 ? t.directoryOpening : t.create}</h3>
        <p className={styles.crewDescription}>{index === 0 ? t.directoryOpeningBody : t.ctaBody}</p>
        <span className={styles.placeholderCta}>{t.create} <ArrowIcon /></span>
      </div>
    </Link>
  );
}

function CompactCrewCard({ community, index, locale, t }: { community: PublicCommunity; index: number; locale: Locale; t: Copy }) {
  const base = locale === "el" ? "/el" : "";
  const image = community.cover_image_url || editorialImages[(index + 1) % editorialImages.length];

  return (
    <Link className={styles.compactCard} href={`${base}/communities/${community.slug}`}>
      <div
        className={styles.compactImage}
        role="img"
        aria-label={`${community.name} crew cover`}
        style={{ backgroundImage: `url("${image}")` }}
      >
        <CrewLogo community={community} />
      </div>
      <div className={styles.compactBody}>
        <div className={styles.compactTitleRow}>
          <h3>{community.name}</h3>
          {community.verified ? <span className={styles.verifiedBadge} aria-label="Verified crew">✓</span> : null}
        </div>
        <LocationLine community={community} />
        <p className={styles.compactDescription}>{community.description || t.activeLabel}</p>
        <div className={styles.compactBottom}>
          <div className={styles.tags}>
            {[community.focus, ...community.scene_tags].slice(0, 3).map((tag, tagIndex) => <span key={`${tag}-${tagIndex}`}>{tag}</span>)}
          </div>
          <span className={styles.compactArrow} aria-label={t.viewCrew}>›</span>
        </div>
      </div>
    </Link>
  );
}

function GreeceSceneMap() {
  return (
    <div className={styles.mapPanel}>
      <svg className={styles.greeceMap} viewBox="0 0 520 360" role="img" aria-label="Stylized map of Greece with automotive scene hotspots">
        <g className={styles.mapLand}>
          <path d="M206 40l48 18 21 38-12 37 35 30-18 31 25 31-29 19-9 42-38 9-25-25-33-12-6-36-29-20 12-38-31-34 20-37 39-8 10-32 20-13Z" />
          <path d="M291 223l29 8 23 28-13 30-37-2-18-26 16-38Z" />
          <path d="M352 178l30 14-5 22-29-4-7-20 11-12Z" />
          <path d="M404 216l19 8-7 14-20-4 8-18Z" />
          <path d="M429 255l41 7-5 19-45 1-11-14 20-13Z" />
          <path d="M250 314l31 5-8 15-34-2 11-18Z" />
        </g>
        <g className={styles.mapRoads} aria-hidden="true">
          <path d="M182 76c54 21 50 63 71 97 17 27 30 51 27 102" />
          <path d="M149 159c54-4 94 22 125 56" />
        </g>
        <g className={styles.mapHotspots}>
          <g transform="translate(278 222)"><circle r="5"/><circle className={styles.hotspotPulse} r="12"/></g>
          <g transform="translate(192 98)"><circle r="5"/><circle className={styles.hotspotPulse} r="12"/></g>
          <g transform="translate(186 220)"><circle r="5"/><circle className={styles.hotspotPulse} r="12"/></g>
          <g transform="translate(220 159)"><circle r="5"/><circle className={styles.hotspotPulse} r="12"/></g>
          <g transform="translate(142 170)"><circle r="5"/><circle className={styles.hotspotPulse} r="12"/></g>
          <g transform="translate(440 268)"><circle r="5"/><circle className={styles.hotspotPulse} r="12"/></g>
        </g>
        <g className={styles.mapLabels}>
          <text x="288" y="222">Athens</text>
          <text x="202" y="94">Thessaloniki</text>
          <text x="196" y="220">Patras</text>
          <text x="230" y="155">Larissa</text>
          <text x="100" y="166">Ioannina</text>
          <text x="405" y="300">Heraklion</text>
        </g>
      </svg>
    </div>
  );
}

export async function CommunityDirectory({ locale, query = "", focus = "", style = "", sort = "trending" }: Props) {
  const t = copy[locale];
  const communities = await loadPublishedCommunities();
  const normalizedQuery = query.trim().toLocaleLowerCase(locale === "el" ? "el-GR" : "en-GB");
  const selectedFocus = (["car", "moto", "mixed"] as const).includes(focus as CommunityFocus)
    ? (focus as CommunityFocus)
    : undefined;
  const selectedStyle = isStyleFilter(style) ? style : undefined;
  const selectedSort = isSortMode(sort) ? sort : "trending";

  const filtered = communities.filter((community) => {
    if (selectedFocus && community.focus !== selectedFocus) return false;
    if (selectedStyle && !community.scene_tags.some((tag) => normalizeTag(tag) === selectedStyle)) return false;
    if (!normalizedQuery) return true;

    return [community.name, community.city, community.region, community.focus, ...community.scene_tags]
      .filter(Boolean)
      .join(" ")
      .toLocaleLowerCase(locale === "el" ? "el-GR" : "en-GB")
      .includes(normalizedQuery);
  });

  const sorted = [...filtered].sort((a, b) => {
    if (selectedSort === "newest") {
      const aDate = a.published_at ? Date.parse(a.published_at) : 0;
      const bDate = b.published_at ? Date.parse(b.published_at) : 0;
      return bDate - aDate;
    }
    if (a.verified !== b.verified) return a.verified ? -1 : 1;
    return a.name.localeCompare(b.name, locale === "el" ? "el-GR" : "en-GB");
  });

  const featured = [
    ...sorted.filter((community) => community.verified),
    ...sorted.filter((community) => !community.verified),
  ].slice(0, 3);

  const base = locale === "el" ? "/el" : "";
  const hasDirectoryData = communities.length > 0;
  const allHref = `${base}/communities#all-crews`;
  const activeFilterLabel = selectedFocus ?? selectedStyle ?? "all";

  const filters: Array<{ label: string; href?: string; key: string }> = [
    { label: "All", key: "all", href: directoryHref(locale, { sort: selectedSort }) },
    { label: "Near Me", key: "near" },
    { label: "Cars", key: "car", href: directoryHref(locale, { focus: "car", sort: selectedSort }) },
    { label: "Motorcycles", key: "moto", href: directoryHref(locale, { focus: "moto", sort: selectedSort }) },
    { label: "JDM", key: "jdm", href: directoryHref(locale, { style: "jdm", sort: selectedSort }) },
    { label: "European", key: "european", href: directoryHref(locale, { style: "european", sort: selectedSort }) },
    { label: "Classics", key: "classics", href: directoryHref(locale, { style: "classics", sort: selectedSort }) },
    { label: "Supercars", key: "supercars", href: directoryHref(locale, { style: "supercars", sort: selectedSort }) },
    { label: "Off-Road", key: "off-road", href: directoryHref(locale, { style: "off-road", sort: selectedSort }) },
    { label: "Drift", key: "drift", href: directoryHref(locale, { style: "drift", sort: selectedSort }) },
    { label: "Track", key: "track", href: directoryHref(locale, { style: "track", sort: selectedSort }) },
    { label: "Lifestyle", key: "lifestyle", href: directoryHref(locale, { style: "lifestyle", sort: selectedSort }) },
  ];

  return (
    <div className={styles.page}>
      <DocumentLanguage locale={locale} />
      <a className="skip-link" href="#crew-directory-main">{t.skip}</a>
      <Header locale={locale} t={t} />

      <main id="crew-directory-main">
        <section className={styles.intro} id="community-intro" aria-labelledby="crew-directory-title">
          <div className={styles.introCopy}>
            <p className={styles.eyebrow}>{t.eyebrow}</p>
            <h1 id="crew-directory-title">{t.title}</h1>
            <p className={styles.introBody}>{t.body}</p>
            <p className={styles.editorialNote}>{t.editorialNote}</p>
          </div>
          <HeroCollage />
        </section>

        <section className={styles.discoveryBar} aria-label="Crew discovery controls">
          <form className={styles.searchForm} method="get">
            <label className={styles.searchBox} htmlFor="crew-search">
              <SearchIcon />
              <span className={styles.srOnly}>{t.searchAria}</span>
              <input id="crew-search" name="q" type="search" defaultValue={query} placeholder={t.searchPlaceholder} />
            </label>
            {selectedFocus ? <input type="hidden" name="focus" value={selectedFocus} /> : null}
            {selectedStyle ? <input type="hidden" name="style" value={selectedStyle} /> : null}
            {selectedSort !== "trending" ? <input type="hidden" name="sort" value={selectedSort} /> : null}
          </form>

          <nav className={styles.filterRail} aria-label="Crew style filters">
            {filters.map((filter) => filter.href ? (
              <Link
                key={filter.key}
                className={activeFilterLabel === filter.key ? styles.filterActive : styles.filterChip}
                href={filter.href}
                aria-current={activeFilterLabel === filter.key ? "page" : undefined}
              >
                {filter.label}
              </Link>
            ) : (
              <span className={`${styles.filterChip} ${styles.filterDisabled}`} aria-disabled="true" key={filter.key} title="Location-based crew discovery will activate when location data is available.">
                {filter.label}
              </span>
            ))}
          </nav>

          <details className={styles.sortControl}>
            <summary><span>{t.sortLabel}:</span> {selectedSort === "newest" ? "Newest" : "Trending"}</summary>
            <div className={styles.sortMenu}>
              <Link className={selectedSort === "trending" ? styles.sortActive : undefined} href={directoryHref(locale, { focus: selectedFocus, style: selectedStyle, sort: "trending" })}>Trending</Link>
              <Link className={selectedSort === "newest" ? styles.sortActive : undefined} href={directoryHref(locale, { focus: selectedFocus, style: selectedStyle, sort: "newest" })}>Newest</Link>
              <span aria-disabled="true" title="Nearby sorting requires user location and geocoded crew profiles.">Nearby</span>
            </div>
          </details>
        </section>

        <section className={styles.section} aria-labelledby="featured-crews-title">
          <div className={styles.sectionHeading}>
            <div>
              <h2 id="featured-crews-title">{t.featuredTitle}</h2>
              <p>{t.featuredBody}</p>
            </div>
            <a className={styles.viewAll} href={allHref}>{t.viewAll} <ArrowIcon /></a>
          </div>

          <div className={styles.featuredRail}>
            {featured.length
              ? featured.map((community, index) => <FeaturedCrewCard community={community} index={index} key={community.id} locale={locale} t={t} />)
              : [0, 1, 2].map((index) => <EmptyFeaturedCard index={index} key={index} locale={locale} t={t} />)}
          </div>
        </section>

        <section className={`${styles.section} ${styles.directorySceneSection}`} id="all-crews" aria-labelledby="all-crews-title">
          <div className={styles.directoryColumn}>
            <div className={styles.sectionHeadingCompact}>
              <h2 id="all-crews-title">{t.allTitle}</h2>
              {hasDirectoryData ? <span>{sorted.length} published</span> : null}
            </div>

            {sorted.length ? (
              <div className={styles.compactGrid}>
                {sorted.map((community, index) => <CompactCrewCard community={community} index={index} key={community.id} locale={locale} t={t} />)}
              </div>
            ) : (
              <div className={styles.directoryEmpty}>
                <div className={styles.emptyThumb} aria-hidden="true" style={{ backgroundImage: `url("${editorialImages[1]}")` }} />
                <div>
                  <p className={styles.placeholderLabel}>{hasDirectoryData ? "NO MATCHES" : "NOXA CREW DIRECTORY"}</p>
                  <h3>{hasDirectoryData ? t.noMatches : t.directoryOpening}</h3>
                  <p>{hasDirectoryData ? t.noMatchesBody : t.directoryOpeningBody}</p>
                </div>
                <Link href={`${base}/communities/apply`} aria-label={t.create}><ArrowIcon /></Link>
              </div>
            )}
          </div>

          <aside className={styles.sceneColumn} aria-labelledby="scene-title">
            <div className={styles.sceneHeading}>
              <h2 id="scene-title">{t.sceneTitle}</h2>
              <p>{t.sceneBody}</p>
            </div>
            <div className={styles.sceneLayout}>
              <GreeceSceneMap />
              <div className={styles.cityList}>
                {sceneCities.map(([city, description]) => (
                  <Link href={`${base}/map`} key={city}>
                    <div>
                      <strong>{city}</strong>
                      <span>{description}</span>
                    </div>
                    <span aria-hidden="true">›</span>
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </section>

        <section className={`${styles.section} ${styles.momentsSection}`} aria-labelledby="community-moments-title">
          <div className={styles.sectionHeading}>
            <div>
              <h2 id="community-moments-title">{t.momentsTitle}</h2>
              <p>{t.momentsBody}</p>
            </div>
          </div>
          <div className={styles.momentsRail} aria-label="Automotive community photography">
            {[0, 1, 2, 3, 4, 0].map((imageIndex, index) => (
              <div
                className={`${styles.moment} ${[styles.moment1, styles.moment2, styles.moment3, styles.moment4, styles.moment5, styles.moment6][index]}`}
                key={`${imageIndex}-${index}`}
                role="img"
                aria-label={index === 0 ? "Automotive community gathering" : index === 1 ? "Crew members at a car meet" : index === 2 ? "Motorcycle community gathering" : index === 3 ? "Mountain road automotive scene" : index === 4 ? "Garage automotive culture" : "Night roadside gathering"}
                style={{ backgroundImage: `linear-gradient(180deg,rgba(5,5,5,.02),rgba(5,5,5,.28)),url("${editorialImages[imageIndex]}")` }}
              />
            ))}
          </div>
        </section>

        <section className={styles.cta} aria-labelledby="create-crew-title">
          <div className={styles.ctaMedia} aria-hidden="true" />
          <div className={styles.ctaShade} aria-hidden="true" />
          <div className={styles.ctaInner}>
            <div>
              <p className={styles.ctaEyebrow}>{t.ctaEyebrow}</p>
              <h2 id="create-crew-title">{t.ctaTitle}</h2>
              <p>{t.ctaBody}</p>
            </div>
            <div className={styles.ctaActions}>
              <Link className={styles.primaryButton} href={`${base}/communities/apply`}>{t.create}</Link>
              <Link className={styles.secondaryButton} href={`${base}/communities/apply`}>{t.learn}</Link>
            </div>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <Link className={styles.footerBrand} href={base || "/"} aria-label="NOXA home"><NoxaLogo /></Link>
          <nav aria-label="Footer navigation">
            <Link href={`${base}/communities`}>Community</Link>
            <Link href={`${base}/meets`}>Events</Link>
            <Link href={`${base}/map`}>Map</Link>
            <Link href="/business">Business</Link>
            <Link href={base || "/"}>About</Link>
          </nav>
          <div className={styles.footerSocial}>
            <a href={INSTAGRAM_HREF} target="_blank" rel="noreferrer" aria-label="NOXA on Instagram"><InstagramIcon /></a>
            <span>{t.footerLine}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
