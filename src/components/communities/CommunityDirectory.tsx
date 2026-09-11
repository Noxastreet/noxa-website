import Link from "next/link";

import { NoxaLogo } from "@/components/brand/NoxaLogo";
import { DocumentLanguage } from "@/components/i18n/DocumentLanguage";
import { InstagramIcon } from "@/components/social/InstagramIcon";
import type { Locale } from "@/i18n/landing-copy";

import { loadPublishedCommunities, type PublicCommunity } from "./community-data";
import styles from "./CrewDirectory.module.css";

type Props = {
  locale: Locale;
  query?: string;
  focus?: string;
  sort?: string;
};

type DirectoryCrew = PublicCommunity & {
  activity?: string;
  createdRank?: number;
  featured?: boolean;
  imagePosition?: string;
  memberCount?: number;
};

const IMAGE_CULTURE = "/api/media/culture-image?asset=culture";
const IMAGE_COMMUNITY = "/api/media/culture-image?asset=community";
const IMAGE_ORGANIZER = "/api/media/culture-image?asset=organizer";
const IMAGE_ROAD = "/api/media/culture-image?asset=heroFallback";

const fallbackImages = [IMAGE_CULTURE, IMAGE_COMMUNITY, IMAGE_ORGANIZER, IMAGE_ROAD] as const;

const mockCrews: DirectoryCrew[] = [
  {
    id: "preview-night-shift-thessaloniki",
    slug: "night-shift-thessaloniki",
    name: "Night Shift Thessaloniki",
    description: "Late nights. Better people.",
    city: "Thessaloniki",
    region: "Central Macedonia",
    country_code: "GR",
    focus: "car",
    scene_tags: ["JDM", "Night Drives", "Lifestyle"],
    logo_url: null,
    cover_image_url: IMAGE_CULTURE,
    instagram_url: null,
    website_url: null,
    verified: true,
    featured: true,
    memberCount: 256,
    activity: "Active this week",
    createdRank: 6,
    imagePosition: "center 55%",
  },
  {
    id: "preview-athens-street-society",
    slug: "athens-street-society",
    name: "Athens Street Society",
    description: "Streets, friends, cars, culture.",
    city: "Athens",
    region: "Attica",
    country_code: "GR",
    focus: "mixed",
    scene_tags: ["Meets", "European", "Lifestyle"],
    logo_url: null,
    cover_image_url: IMAGE_ORGANIZER,
    instagram_url: null,
    website_url: null,
    verified: true,
    featured: true,
    memberCount: 412,
    activity: "Active this week",
    createdRank: 4,
    imagePosition: "center 50%",
  },
  {
    id: "preview-hellenic-riders",
    slug: "hellenic-riders",
    name: "Hellenic Riders",
    description: "Two wheels. One family.",
    city: "Attica",
    region: "Attica",
    country_code: "GR",
    focus: "moto",
    scene_tags: ["Motorcycles", "Routes", "Lifestyle"],
    logo_url: null,
    cover_image_url: IMAGE_ROAD,
    instagram_url: null,
    website_url: null,
    verified: false,
    featured: true,
    memberCount: 318,
    activity: "Active this week",
    createdRank: 5,
    imagePosition: "center 64%",
  },
  {
    id: "preview-jdm-greece",
    slug: "jdm-greece",
    name: "JDM Greece",
    description: "Japanese machines. Greek roads.",
    city: "Athens",
    region: "Attica",
    country_code: "GR",
    focus: "car",
    scene_tags: ["JDM", "Meets", "Lifestyle"],
    logo_url: null,
    cover_image_url: IMAGE_COMMUNITY,
    instagram_url: null,
    website_url: null,
    verified: false,
    memberCount: 198,
    activity: "Active this week",
    createdRank: 3,
    imagePosition: "center 56%",
  },
  {
    id: "preview-mountain-explorers",
    slug: "mountain-explorers",
    name: "Mountain Explorers",
    description: "Mountains call. We go.",
    city: "Central Greece",
    region: "Central Greece",
    country_code: "GR",
    focus: "car",
    scene_tags: ["4x4", "Off-Road", "Adventure"],
    logo_url: null,
    cover_image_url: IMAGE_ROAD,
    instagram_url: null,
    website_url: null,
    verified: false,
    memberCount: 142,
    activity: "Active this week",
    createdRank: 2,
    imagePosition: "center 68%",
  },
  {
    id: "preview-classic-rebels",
    slug: "classic-rebels",
    name: "Classic Rebels",
    description: "Old cars. New stories.",
    city: "Thessaloniki",
    region: "Central Macedonia",
    country_code: "GR",
    focus: "car",
    scene_tags: ["Classics", "Meets", "Lifestyle"],
    logo_url: null,
    cover_image_url: IMAGE_ORGANIZER,
    instagram_url: null,
    website_url: null,
    verified: false,
    memberCount: 121,
    activity: "Active this week",
    createdRank: 1,
    imagePosition: "center 58%",
  },
  {
    id: "preview-track-addicts",
    slug: "track-addicts",
    name: "Track Addicts",
    description: "Braking later. Friendships longer.",
    city: "Athens",
    region: "Attica",
    country_code: "GR",
    focus: "car",
    scene_tags: ["Track", "Performance", "Lifestyle"],
    logo_url: null,
    cover_image_url: IMAGE_COMMUNITY,
    instagram_url: null,
    website_url: null,
    verified: false,
    memberCount: 167,
    activity: "Active this week",
    createdRank: 4,
    imagePosition: "center 60%",
  },
  {
    id: "preview-south-crew",
    slug: "south-crew",
    name: "South Crew",
    description: "Good roads. Better company.",
    city: "Crete",
    region: "Crete",
    country_code: "GR",
    focus: "mixed",
    scene_tags: ["Drives", "Meets", "Lifestyle"],
    logo_url: null,
    cover_image_url: IMAGE_ROAD,
    instagram_url: null,
    website_url: null,
    verified: false,
    memberCount: 93,
    activity: "Active this week",
    createdRank: 2,
    imagePosition: "center 61%",
  },
  {
    id: "preview-patras-street-unit",
    slug: "patras-street-unit",
    name: "Patras Street Unit",
    description: "Different city. Same passion.",
    city: "Patras",
    region: "Western Greece",
    country_code: "GR",
    focus: "car",
    scene_tags: ["Meets", "European", "Lifestyle"],
    logo_url: null,
    cover_image_url: IMAGE_CULTURE,
    instagram_url: null,
    website_url: null,
    verified: false,
    memberCount: 93,
    activity: "Active this week",
    createdRank: 5,
    imagePosition: "center 48%",
  },
];

const copy = {
  en: {
    eyebrow: "COMMUNITY",
    title: "Find your crew.",
    intro: "Discover automotive communities, local crews and driving groups across Greece.",
    scribble: "More than cars. A community.",
    search: "Search crews, cities, styles…",
    featured: "Featured Crews",
    featuredBody: "Communities shaping the automotive scene.",
    allCrews: "All Crews",
    scene: "Explore the Scene",
    sceneBody: "See what’s happening around Greece.",
    moments: "Community Moments",
    momentsBody: "Same roads. Different stories.",
    createEyebrow: "CREATE A CREW",
    createTitle: "Built something worth joining?",
    createBody: "Bring your crew to NOXA and give your community a place to be discovered.",
    create: "Create a Crew",
    learn: "Learn More",
    viewAll: "View all crews",
    join: "Join",
    nearby: "Near Me",
    sort: "Sort",
    active: "Active this week",
    footer: "Built for Greece’s automotive culture.",
    noResults: "No crews match these filters yet.",
  },
  el: {
    eyebrow: "COMMUNITY",
    title: "Βρες την crew σου.",
    intro: "Ανακάλυψε automotive κοινότητες, local crews και driving groups σε όλη την Ελλάδα.",
    scribble: "Περισσότερο από αυτοκίνητα. Κοινότητα.",
    search: "Αναζήτησε crews, πόλεις, styles…",
    featured: "Featured Crews",
    featuredBody: "Κοινότητες που διαμορφώνουν την automotive σκηνή.",
    allCrews: "Όλες οι Crews",
    scene: "Explore the Scene",
    sceneBody: "Δες τι συμβαίνει στην Ελλάδα.",
    moments: "Community Moments",
    momentsBody: "Ίδιοι δρόμοι. Διαφορετικές ιστορίες.",
    createEyebrow: "CREATE A CREW",
    createTitle: "Έχτισες κάτι που αξίζει να συμμετέχεις;",
    createBody: "Φέρε την crew σου στο NOXA και δώσε στην κοινότητά σου χώρο να ανακαλυφθεί.",
    create: "Create a Crew",
    learn: "Μάθε περισσότερα",
    viewAll: "Όλες οι crews",
    join: "Join",
    nearby: "Κοντά μου",
    sort: "Sort",
    active: "Active this week",
    footer: "Built for Greece’s automotive culture.",
    noResults: "Δεν βρέθηκαν crews με αυτά τα φίλτρα.",
  },
} as const;

const filters = [
  ["", "All"],
  ["near", "Near Me"],
  ["cars", "Cars"],
  ["motorcycles", "Motorcycles"],
  ["jdm", "JDM"],
  ["european", "European"],
  ["classics", "Classics"],
  ["supercars", "Supercars"],
  ["off-road", "Off-Road"],
  ["drift", "Drift"],
  ["track", "Track"],
  ["lifestyle", "Lifestyle"],
] as const;

const sceneCities = [
  ["Athens", "Street culture & meets", IMAGE_CULTURE],
  ["Thessaloniki", "Night drives & JDM", IMAGE_ORGANIZER],
  ["Patras", "Local crews & events", IMAGE_COMMUNITY],
  ["Larissa", "Growing community", IMAGE_ROAD],
  ["Ioannina", "Mountain drives", IMAGE_ROAD],
  ["Heraklion", "Island car scene", IMAGE_CULTURE],
] as const;

function SearchIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <circle cx="10.8" cy="10.8" r="6.2" />
      <path d="m15.4 15.4 4.2 4.2" />
    </svg>
  );
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function locationLabel(crew: DirectoryCrew) {
  const value = [crew.city, crew.country_code === "GR" ? "Greece" : crew.country_code].filter(Boolean);
  return value.join(", ");
}

function withFallbackData(communities: PublicCommunity[]) {
  if (!communities.length) return mockCrews;
  return communities.map<DirectoryCrew>((crew, index) => ({
    ...crew,
    featured: index < 3,
    cover_image_url: crew.cover_image_url || fallbackImages[index % fallbackImages.length],
    imagePosition: "center",
  }));
}

function matchesFocus(crew: DirectoryCrew, selected: string) {
  if (!selected) return true;
  if (selected === "cars") return crew.focus === "car" || crew.focus === "mixed";
  if (selected === "motorcycles") return crew.focus === "moto" || crew.focus === "mixed";
  if (selected === "near") return true;
  const normalized = selected.replace("-", "").toLowerCase();
  return crew.scene_tags.some((tag) => tag.replace(/[-\s]/g, "").toLowerCase().includes(normalized));
}

function imageStyle(crew: DirectoryCrew) {
  return {
    backgroundImage: `linear-gradient(180deg, rgba(5,5,5,.02), rgba(5,5,5,.18)), url("${crew.cover_image_url || IMAGE_COMMUNITY}")`,
    backgroundPosition: crew.imagePosition || "center",
  };
}

function logoStyle(crew: DirectoryCrew) {
  return crew.logo_url ? { backgroundImage: `url("${crew.logo_url}")` } : undefined;
}

function CrewLogo({ crew, className = "" }: { crew: DirectoryCrew; className?: string }) {
  return (
    <div
      className={`${styles.logoCircle} ${className}`}
      style={logoStyle(crew)}
      role={crew.logo_url ? "img" : undefined}
      aria-label={crew.logo_url ? `${crew.name} logo` : undefined}
    >
      {crew.logo_url ? null : initials(crew.name)}
    </div>
  );
}

function Header({ locale }: { locale: Locale }) {
  const base = locale === "el" ? "/el" : "";
  const nav = [
    ["Home", base || "/"],
    ["Map", `${base}/map`],
    ["Community", `${base}/communities`],
    ["Events", `${base}/meets`],
    ["Business", "/business"],
  ] as const;

  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <Link className={styles.brand} href={base || "/"} aria-label="NOXA home">
          <NoxaLogo className={styles.brandLogo} />
        </Link>
        <nav className={styles.desktopNav} aria-label="Primary navigation">
          {nav.map(([label, href]) => (
            <Link
              key={`${label}-${href}`}
              className={label === "Community" ? styles.navActive : undefined}
              href={href}
              aria-current={label === "Community" ? "page" : undefined}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className={styles.headerActions}>
          <a className={styles.iconButton} href="#crew-search" aria-label="Search crews">
            <SearchIcon />
          </a>
          <a className={styles.joinButton} href={`${base || ""}/#app`}>{copy[locale].join}</a>
          <details className={styles.mobileMenu}>
            <summary className={styles.menuSummary} aria-label="Open navigation menu"><span /></summary>
            <div className={styles.mobileMenuPanel}>
              {nav.map(([label, href]) => (
                <Link
                  key={`mobile-${label}-${href}`}
                  className={label === "Community" ? styles.mobileNavActive : undefined}
                  href={href}
                >
                  {label}
                </Link>
              ))}
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}

function GreeceSceneMap() {
  return (
    <div className={styles.greeceMap} role="img" aria-label="Stylized map of Greece with community hotspots in Athens, Thessaloniki, Patras, Larissa, Ioannina and Heraklion">
      <svg viewBox="0 0 320 300" aria-hidden="true" focusable="false">
        <path className={styles.mapShape} d="M116 28l28 7 15 23-7 19 16 14 25 8 2 18-18 14 8 20 19 11-5 22-18 8-10 25-21 5-8 29-17-7 1-26-17-17 12-20-18-18 10-21-16-14 9-22-13-12 13-21 6-26 18-7-1-14z" />
        <path className={styles.mapShape} d="M178 202l18 6 7 15-12 14-20-7-6-14zM210 220l13 4 5 10-8 9-14-4-3-10zM225 254l34 7 17 11-8 12-34-4-18-13z" />
        <ellipse className={styles.mapShape} cx="242" cy="200" rx="8" ry="5" />
        <ellipse className={styles.mapShape} cx="263" cy="216" rx="5" ry="3" />
        <ellipse className={styles.mapShape} cx="280" cy="239" rx="4" ry="3" />
        <circle className={styles.hotspotGlow} cx="154" cy="178" r="14" /><circle className={styles.hotspot} cx="154" cy="178" r="4" />
        <circle className={styles.hotspotGlow} cx="125" cy="64" r="14" /><circle className={styles.hotspot} cx="125" cy="64" r="4" />
        <circle className={styles.hotspotGlow} cx="89" cy="176" r="12" /><circle className={styles.hotspot} cx="89" cy="176" r="3.5" />
        <circle className={styles.hotspotGlow} cx="133" cy="113" r="12" /><circle className={styles.hotspot} cx="133" cy="113" r="3.5" />
        <circle className={styles.hotspotGlow} cx="72" cy="126" r="12" /><circle className={styles.hotspot} cx="72" cy="126" r="3.5" />
        <circle className={styles.hotspotGlow} cx="246" cy="268" r="14" /><circle className={styles.hotspot} cx="246" cy="268" r="4" />
      </svg>
    </div>
  );
}

function FeaturedCard({ crew, base }: { crew: DirectoryCrew; base: string }) {
  return (
    <Link className={styles.featuredCard} href={`${base}/communities/${crew.slug}`}>
      <div className={styles.featuredMedia} style={imageStyle(crew)} role="img" aria-label={`${crew.name} automotive community`} />
      <CrewLogo crew={crew} className={styles.featuredLogo} />
      <div className={styles.featuredBody}>
        <div className={styles.titleRow}>
          <h3>{crew.name}</h3>
          {crew.verified ? <span className={styles.verified} aria-label="Verified">✓</span> : null}
        </div>
        <p className={styles.metaLine}>⌖ {locationLabel(crew)}</p>
        <p className={styles.identity}>{crew.description || "Automotive community in Greece."}</p>
        <p className={styles.memberLine}>
          <span aria-hidden="true">♟</span>
          {crew.memberCount ? <span>{crew.memberCount} members</span> : <span>NOXA community</span>}
        </p>
        <div className={styles.tags}>{crew.scene_tags.slice(0, 3).map((tag) => <span className={styles.tag} key={tag}>{tag}</span>)}</div>
        <span className={styles.arrowButton} aria-hidden="true">→</span>
      </div>
    </Link>
  );
}

function CrewCard({ crew, base, activeText }: { crew: DirectoryCrew; base: string; activeText: string }) {
  return (
    <Link className={styles.crewCard} href={`${base}/communities/${crew.slug}`}>
      <div className={styles.crewMedia} style={imageStyle(crew)} role="img" aria-label={`${crew.name} community scene`} />
      <div className={styles.crewBody}>
        <CrewLogo crew={crew} />
        <div className={styles.crewInfo}>
          <h3>{crew.name}</h3>
          <p className={styles.metaLine}>⌖ {locationLabel(crew)}</p>
          <p className={styles.identity}>{crew.description || "A local automotive community."}</p>
          <p className={styles.memberLine}>
            {crew.memberCount ? <span>{crew.memberCount} members</span> : <span>NOXA community</span>}
            <span className={styles.activityDot} aria-hidden="true" />
            <span>{crew.activity || activeText}</span>
          </p>
          <div className={styles.tags}>{crew.scene_tags.slice(0, 3).map((tag) => <span className={styles.tag} key={tag}>{tag}</span>)}</div>
        </div>
      </div>
      <span className={styles.arrowButton} aria-hidden="true">›</span>
    </Link>
  );
}

function filterHref(base: string, q: string, focus: string, sort: string) {
  if (focus === "near") return `${base}/map`;
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (focus) params.set("focus", focus);
  if (sort && sort !== "trending") params.set("sort", sort);
  const query = params.toString();
  return `${base}/communities${query ? `?${query}` : ""}`;
}

export async function CommunityDirectory({ locale, query = "", focus = "", sort = "trending" }: Props) {
  const t = copy[locale];
  const base = locale === "el" ? "/el" : "";
  const liveCommunities = await loadPublishedCommunities();
  const source = withFallbackData(liveCommunities);
  const normalizedQuery = query.trim().toLocaleLowerCase(locale === "el" ? "el-GR" : "en-GB");
  const selectedFocus = focus.trim().toLowerCase();
  const selectedSort = sort === "newest" ? "newest" : "trending";

  const filtered = source
    .filter((crew) => matchesFocus(crew, selectedFocus))
    .filter((crew) => {
      if (!normalizedQuery) return true;
      return [crew.name, crew.city, crew.region, crew.description, ...crew.scene_tags]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase(locale === "el" ? "el-GR" : "en-GB")
        .includes(normalizedQuery);
    })
    .sort((a, b) => {
      if (selectedSort === "newest") return (b.createdRank || 0) - (a.createdRank || 0);
      return (b.memberCount || Number(b.verified)) - (a.memberCount || Number(a.verified));
    });

  const featured = source.filter((crew) => crew.featured || crew.verified).slice(0, 3);
  const allCrews = filtered.slice(0, 9);
  const isPreview = liveCommunities.length === 0;

  return (
    <div className={styles.page}>
      <DocumentLanguage locale={locale} />
      <a className="skip-link" href="#crew-main">Skip to content</a>
      <Header locale={locale} />

      <main id="crew-main">
        <section className={styles.intro} aria-labelledby="crew-title">
          <div className={`${styles.shell} ${styles.introGrid}`}>
            <div className={styles.introCopy}>
              <p className={styles.eyebrow}>{t.eyebrow}</p>
              <h1 id="crew-title">{t.title}</h1>
              <p>{t.intro}</p>
              <p className={styles.scribble}>{t.scribble}</p>
            </div>
            <div className={styles.collage} aria-label="NOXA automotive community scenes">
              <div className={styles.collageTile} style={{ backgroundImage: `url("${IMAGE_CULTURE}")`, backgroundPosition: "center 55%" }} role="img" aria-label="Night automotive meet in Greece"><span className={styles.collageNote}>Different drivers.<br />Same roads.</span></div>
              <div className={styles.collageTile} style={{ backgroundImage: `url("${IMAGE_ORGANIZER}")`, backgroundPosition: "center 45%" }} role="img" aria-label="Crew members around cars" />
              <div className={styles.collageTile} style={{ backgroundImage: `url("${IMAGE_ROAD}")`, backgroundPosition: "center 62%" }} role="img" aria-label="Driving group on a road" />
              <div className={styles.collageTile} style={{ backgroundImage: `url("${IMAGE_COMMUNITY}")`, backgroundPosition: "center 57%" }} role="img" aria-label="Automotive community gathering"><span className={styles.collageNote}>People. Cars. Culture.<br />Across Greece.</span></div>
            </div>
          </div>
        </section>

        <section className={styles.discovery} aria-label="Crew discovery controls">
          <div className={`${styles.shell} ${styles.discoveryBar}`}>
            <form className={styles.searchWrap} method="get" action={`${base}/communities`}>
              <SearchIcon />
              <label className="sr-only" htmlFor="crew-search">{t.search}</label>
              <input id="crew-search" className={styles.searchInput} name="q" defaultValue={query} type="search" placeholder={t.search} />
              {selectedFocus ? <input type="hidden" name="focus" value={selectedFocus} /> : null}
              {selectedSort !== "trending" ? <input type="hidden" name="sort" value={selectedSort} /> : null}
            </form>
            <nav className={styles.filterRail} aria-label="Crew filters">
              {filters.map(([value, label]) => (
                <Link
                  key={label}
                  className={selectedFocus === value ? styles.filterActive : styles.filter}
                  href={filterHref(base, query, value, selectedSort)}
                  aria-current={selectedFocus === value ? "page" : undefined}
                >
                  {value === "near" ? t.nearby : label}
                </Link>
              ))}
            </nav>
            <details className={styles.sortDetails}>
              <summary>{t.sort}: <strong>{selectedSort === "newest" ? "Newest" : "Trending"}</strong></summary>
              <div className={styles.sortMenu}>
                <Link className={selectedSort === "trending" ? styles.sortActive : undefined} href={filterHref(base, query, selectedFocus, "trending")}>Trending</Link>
                <Link className={selectedSort === "newest" ? styles.sortActive : undefined} href={filterHref(base, query, selectedFocus, "newest")}>Newest</Link>
                <Link href={`${base}/map`}>Nearby</Link>
              </div>
            </details>
          </div>
        </section>

        <section className={`${styles.shell} ${styles.section}`} aria-labelledby="featured-crews-title">
          <div className={styles.sectionHeading}>
            <div>
              <h2 id="featured-crews-title">{t.featured}</h2>
              <p>{t.featuredBody}</p>
            </div>
            <a className={styles.viewAll} href="#all-crews">{t.viewAll} →</a>
          </div>
          <div className={styles.featuredRail}>
            {featured.map((crew) => <FeaturedCard key={crew.id} crew={crew} base={base} />)}
          </div>
        </section>

        <section className={`${styles.shell} ${styles.directorySceneGrid}`}>
          <div className={styles.allCrews} id="all-crews">
            <div className={styles.sectionHeadingCompact}>
              <div><h2>{t.allCrews}</h2></div>
              <div className={styles.smallFilters} aria-hidden="true"><span>All</span><span>Cars</span><span>Motorcycles</span><span>JDM</span><span>European</span><span>Classics</span><span>Off-Road</span><span>Drift</span><span>Track</span></div>
            </div>
            {allCrews.length ? (
              <div className={styles.crewGrid}>{allCrews.map((crew) => <CrewCard key={crew.id} crew={crew} base={base} activeText={t.active} />)}</div>
            ) : (
              <div style={{ border: "1px solid rgba(255,255,255,.1)", borderRadius: 8, padding: 24, color: "#8d8d93", fontSize: 13 }}>{t.noResults}</div>
            )}
          </div>

          <aside className={styles.scenePanel} aria-labelledby="scene-title">
            <div className={styles.sectionHeadingCompact}>
              <div><h2 id="scene-title">{t.scene}</h2><p>{t.sceneBody}</p></div>
            </div>
            <div className={styles.sceneCard}>
              <GreeceSceneMap />
              <div className={styles.sceneList}>
                {sceneCities.map(([city, description, image]) => (
                  <Link className={styles.sceneItem} href={`${base}/map`} key={city}>
                    <span className={styles.sceneThumb} style={{ backgroundImage: `url("${image}")` }} aria-hidden="true" />
                    <span className={styles.sceneText}><strong>{city}</strong><span>{description}</span></span>
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </section>

        <section className={`${styles.shell} ${styles.momentsSection}`} aria-labelledby="moments-title">
          <div className={styles.sectionHeadingCompact}>
            <div><h2 id="moments-title">{t.moments}</h2><p>{t.momentsBody}</p></div>
          </div>
          <div className={styles.momentsRail}>
            {[
              [IMAGE_CULTURE, "People make the scene"],
              [IMAGE_ORGANIZER, "Crews become stories"],
              [IMAGE_ROAD, "Same roads. Different stories."],
              [IMAGE_COMMUNITY, "Cars. Friends. Places."],
              [IMAGE_CULTURE, "Night drives"],
              [IMAGE_ROAD, "Greece drives together"],
            ].map(([image, label], index) => (
              <div key={`${image}-${index}`} className={styles.momentMedia} style={{ backgroundImage: `url("${image}")`, backgroundPosition: index % 2 ? "center 58%" : "center 48%" }} role="img" aria-label={label}>
                {index === 0 || index === 2 || index === 5 ? <span className={styles.momentText}>{label}</span> : null}
              </div>
            ))}
          </div>
        </section>

        <section className={styles.ctaSection} aria-labelledby="create-crew-title">
          <div className={`${styles.shell} ${styles.ctaInner}`}>
            <div className={styles.ctaCopy}>
              <p className={styles.eyebrow}>{t.createEyebrow}</p>
              <h2 id="create-crew-title">{t.createTitle}</h2>
              <p>{t.createBody}</p>
            </div>
            <div className={styles.ctaActions}>
              <Link className={styles.primaryButton} href={`${base}/communities/apply`}>{t.create}</Link>
              <a className={styles.secondaryButton} href="#featured-crews-title">{t.learn}</a>
            </div>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={`${styles.shell} ${styles.footerInner}`}>
          <Link className={styles.footerBrand} href={base || "/"} aria-label="NOXA home"><NoxaLogo /></Link>
          <nav className={styles.footerNav} aria-label="Footer navigation">
            <Link href={`${base}/communities`}>Community</Link>
            <Link href={`${base}/meets`}>Events</Link>
            <Link href={`${base}/map`}>Map</Link>
            <Link href="/business">Business</Link>
            <Link href={base || "/"}>About</Link>
          </nav>
          <div className={styles.footerRight}>
            <div className={styles.socialRow}><a href="https://www.instagram.com/noxa_app/" target="_blank" rel="noreferrer" aria-label="NOXA on Instagram"><InstagramIcon /></a></div>
            <span className={styles.brandLine}>{t.footer}{isPreview ? " · Preview data" : ""}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
