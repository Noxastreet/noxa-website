import { DocumentLanguage } from "@/components/i18n/DocumentLanguage";
import { SiteHeader } from "@/components/navigation/SiteHeader";
import { WaitlistForm } from "@/components/waitlist/WaitlistForm";
import { landingCopy, type Locale } from "@/i18n/landing-copy";

import styles from "./CultureLanding.module.css";

type CultureLandingProps = {
  locale: Locale;
};

const en = {
  nav: {
    community: "Community",
    meets: "Meetups",
    crews: "Crews",
    routes: "Routes",
    business: "Business",
    join: "Join Waitlist",
  },
  hero: {
    eyebrow: "NOXA AUTOMOTIVE CULTURE",
    title: "The automotive community, in one place.",
    body: "From local meets to long drives, crews to culture. NOXA connects drivers, riders and the scenes that bring them together.",
    primary: "Join Waitlist",
    secondary: "Explore Community",
  },
  signals: [
    ["CARS + MOTORCYCLES", "One culture"],
    ["MEETS + EVENTS", "Real gatherings"],
    ["CREWS", "Built to belong"],
    ["GREECE-WIDE", "Local scenes connected"],
  ],
  culture: {
    eyebrow: "ABOUT NOXA",
    title: "Built around real car culture.",
    body: "NOXA is where automotive people connect. We bring together meets, crews, local scenes and the open road into one focused community.",
    link: "Discover the community",
  },
  features: {
    eyebrow: "WHAT WE DO",
    title: "Meet. Drive. Belong.",
    cards: [
      {
        id: "meets",
        title: "MEETUPS",
        body: "Discover local car meets and automotive events. See what is happening around you and join the people already going.",
        className: "meetCard",
        href: "/meets",
      },
      {
        id: "crews",
        title: "CREWS",
        body: "Build your crew. Represent your scene. Connect with people who share the same cars, roads and culture.",
        className: "crewCard",
        href: "/crews",
      },
      {
        id: "routes",
        title: "ROUTES & DRIVES",
        body: "Turn a meetup into a drive. Plan routes, move together and make the road part of the community.",
        className: "routeCard",
        href: "/routes",
      },
    ],
  },
  movement: {
    eyebrow: "TOGETHER WE MOVE",
    title: "A community that moves together.",
    body: "The best memories happen beyond the screen — on the road, at the meet, with your crew and the people who understand the culture.",
    link: "See the NOXA vision",
  },
  business: {
    eyebrow: "FOR AUTOMOTIVE BUSINESSES",
    title: "Put your business inside the culture.",
    body: "Garages, detailers, tuners, shops, event organisers and automotive partners can meet an audience that is already looking for what they do.",
    link: "Partner with NOXA",
  },
  waitlist: {
    eyebrow: "BE PART OF NOXA",
    title: "Join NOXA early.",
    body: "Be among the first drivers, riders and automotive businesses shaping the community before public release.",
  },
  footer: {
    tagline: "The automotive community, in one place.",
    community: "Community",
    business: "Business",
    company: "NOXA",
    legal: "Legal",
    built: "Built for the culture. Made to move.",
    instagram: "Instagram · @noxa_app",
  },
} as const;

const el = {
  nav: {
    community: "Κοινότητα",
    meets: "Συναντήσεις",
    crews: "Ομάδες",
    routes: "Διαδρομές",
    business: "Επιχειρήσεις",
    join: "Μπες στη λίστα",
  },
  hero: {
    eyebrow: "NOXA AUTOMOTIVE CULTURE",
    title: "Η automotive κοινότητα, σε ένα μέρος.",
    body: "Από τοπικά meets μέχρι μεγάλες διαδρομές, crews και κουλτούρα. Το NOXA συνδέει οδηγούς, αναβάτες και τις κοινότητες που τους φέρνουν κοντά.",
    primary: "Μπες στη λίστα",
    secondary: "Δες την κοινότητα",
  },
  signals: [
    ["ΑΥΤΟΚΙΝΗΤΑ + ΜΟΤΟ", "Μία κουλτούρα"],
    ["MEETS + EVENTS", "Πραγματικές συναντήσεις"],
    ["CREWS", "Ανήκεις κάπου"],
    ["ΣΕ ΟΛΗ ΤΗΝ ΕΛΛΑΔΑ", "Τοπικές σκηνές ενωμένες"],
  ],
  culture: {
    eyebrow: "ΣΧΕΤΙΚΑ ΜΕ ΤΟ NOXA",
    title: "Χτισμένο γύρω από την πραγματική car culture.",
    body: "Το NOXA είναι το μέρος όπου συναντιέται η automotive κοινότητα. Meets, crews, τοπικές σκηνές και δρόμοι σε μία καθαρή, ενιαία εμπειρία.",
    link: "Ανακάλυψε την κοινότητα",
  },
  features: {
    eyebrow: "ΤΙ ΚΑΝΟΥΜΕ",
    title: "Meet. Drive. Belong.",
    cards: [
      {
        id: "meets",
        title: "MEETUPS",
        body: "Βρες τοπικά car meets και automotive events. Δες τι συμβαίνει γύρω σου και ποιοι ήδη συμμετέχουν.",
        className: "meetCard",
        href: "/el/meets",
      },
      {
        id: "crews",
        title: "CREWS",
        body: "Χτίσε την ομάδα σου, εκπροσώπησε τη σκηνή σου και συνδέσου με ανθρώπους που μοιράζονται την ίδια κουλτούρα.",
        className: "crewCard",
        href: "/el/crews",
      },
      {
        id: "routes",
        title: "ROUTES & DRIVES",
        body: "Μετέτρεψε ένα meet σε κοινή διαδρομή. Οργάνωσε routes, κινηθείτε μαζί και κάντε τον δρόμο μέρος της κοινότητας.",
        className: "routeCard",
        href: "/el/routes",
      },
    ],
  },
  movement: {
    eyebrow: "TOGETHER WE MOVE",
    title: "Μια κοινότητα που κινείται μαζί.",
    body: "Οι καλύτερες στιγμές γίνονται έξω από την οθόνη — στον δρόμο, στο meet, με το crew σου και τους ανθρώπους που ζουν την ίδια κουλτούρα.",
    link: "Δες το όραμα του NOXA",
  },
  business: {
    eyebrow: "ΓΙΑ AUTOMOTIVE ΕΠΙΧΕΙΡΗΣΕΙΣ",
    title: "Βάλε την επιχείρησή σου μέσα στην κουλτούρα.",
    body: "Συνεργεία, detailers, tuners, καταστήματα, διοργανωτές και automotive partners μπορούν να βρεθούν μπροστά σε κοινό που ήδη τους αναζητά.",
    link: "Συνεργάσου με το NOXA",
  },
  waitlist: {
    eyebrow: "ΓΙΝΕ ΜΕΡΟΣ ΤΟΥ NOXA",
    title: "Μπες νωρίς στο NOXA.",
    body: "Γίνε ένας από τους πρώτους οδηγούς, αναβάτες και automotive partners που θα διαμορφώσουν την κοινότητα πριν το public release.",
  },
  footer: {
    tagline: "Η automotive κοινότητα, σε ένα μέρος.",
    community: "Κοινότητα",
    business: "Επιχειρήσεις",
    company: "NOXA",
    legal: "Νομικά",
    built: "Built for the culture. Made to move.",
    instagram: "Instagram · @noxa_app",
  },
} as const;

function Arrow() {
  return <span aria-hidden="true">→</span>;
}

function CommunityIcon() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="11" cy="11" r="4" />
      <circle cx="22" cy="12" r="3.5" />
      <path d="M4 25c.8-5 3.5-7.5 7.5-7.5S18.3 20 19 25M18 20c1.2-1.6 2.8-2.4 5-2.4 3.2 0 5.2 2.3 5.8 6.4" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <path d="M16 3 27 7v8c0 7.1-4.2 11.6-11 14C9.2 26.6 5 22.1 5 15V7l11-4Z" />
      <path d="m11.5 16 3 3 6-7" />
    </svg>
  );
}

function RouteIcon() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <path d="M8 6a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm16 12a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" />
      <path d="M8 14v3c0 2 1.5 3 3.5 3h8" />
    </svg>
  );
}

export function CultureLanding({ locale }: CultureLandingProps) {
  const baseCopy = landingCopy[locale];
  const copy = locale === "el" ? el : en;
  const navigationItems = locale === "el"
    ? ([
        [copy.nav.community, "#community"],
        [copy.nav.meets, "/el/meets"],
        [copy.nav.crews, "/el/crews"],
        [copy.nav.routes, "/el/routes"],
        [copy.nav.business, "#business"],
      ] as const)
    : ([
        [copy.nav.community, "#community"],
        [copy.nav.meets, "/meets"],
        [copy.nav.crews, "/crews"],
        [copy.nav.routes, "/routes"],
        [copy.nav.business, "#business"],
      ] as const);

  const navigationCopy = {
    ...baseCopy.navigation,
    join: copy.nav.join,
    items: navigationItems,
  };

  return (
    <div className={styles.site}>
      <DocumentLanguage locale={locale} />
      <a className="skip-link" href="#main-content">
        {baseCopy.skipToContent}
      </a>
      <SiteHeader
        locale={locale}
        languageCopy={baseCopy.language}
        navigationCopy={navigationCopy}
      />

      <main id="main-content">
        <section id="top" className={styles.hero}>
          <div className={styles.heroOverlay} />
          <div className={styles.shell}>
            <div className={styles.heroCopy}>
              <p className={styles.eyebrow}>{copy.hero.eyebrow}</p>
              <h1>{copy.hero.title}</h1>
              <p className={styles.heroBody}>{copy.hero.body}</p>
              <div className={styles.heroActions}>
                <a className={styles.primaryAction} href="#waitlist">
                  {copy.hero.primary} <Arrow />
                </a>
                <a className={styles.textAction} href="#community">
                  {copy.hero.secondary} <Arrow />
                </a>
              </div>
            </div>

            <div className={styles.signalBar} aria-label="NOXA community pillars">
              {copy.signals.map(([title, detail]) => (
                <div className={styles.signal} key={title}>
                  <span>{title}</span>
                  <strong>{detail}</strong>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="community" className={styles.cultureSection}>
          <div className={`${styles.shell} ${styles.splitGrid}`}>
            <div className={styles.sectionCopy}>
              <p className={styles.eyebrow}>{copy.culture.eyebrow}</p>
              <h2>{copy.culture.title}</h2>
              <p>{copy.culture.body}</p>
              <a className={styles.textAction} href="#product">
                {copy.culture.link} <Arrow />
              </a>
            </div>
            <div
              className={`${styles.photoPanel} ${styles.culturePhoto}`}
              role="img"
              aria-label="Modified cars and enthusiasts at an automotive gathering"
            />
          </div>
        </section>

        <section id="product" className={styles.featuresSection}>
          <div className={styles.shell}>
            <div className={styles.centerHeading}>
              <p className={styles.eyebrow}>{copy.features.eyebrow}</p>
              <h2>{copy.features.title}</h2>
            </div>

            <div className={styles.featureGrid}>
              {copy.features.cards.map((card, index) => {
                const Icon = index === 0 ? CommunityIcon : index === 1 ? ShieldIcon : RouteIcon;
                return (
                  <a
                    id={card.id}
                    key={card.id}
                    href={card.href}
                    className={`${styles.featureCard} ${styles[card.className]}`}
                    aria-label={`${card.title}: ${card.body}`}
                  >
                    <div className={styles.cardShade} />
                    <div className={styles.featureContent}>
                      <div className={styles.featureIcon}>
                        <Icon />
                      </div>
                      <h3>{card.title}</h3>
                      <p>{card.body}</p>
                      <span className={styles.cardArrow} aria-hidden="true">
                        →
                      </span>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        </section>

        <section className={styles.movementSection}>
          <div className={styles.movementShade} />
          <div className={`${styles.shell} ${styles.movementGrid}`}>
            <div className={styles.movementCopy}>
              <p className={styles.eyebrow}>{copy.movement.eyebrow}</p>
              <h2>{copy.movement.title}</h2>
              <p>{copy.movement.body}</p>
              <a className={styles.textAction} href="#waitlist">
                {copy.movement.link} <Arrow />
              </a>
            </div>
          </div>
        </section>

        <section id="business" className={styles.businessSection}>
          <div className={`${styles.shell} ${styles.splitGrid}`}>
            <div className={styles.sectionCopy}>
              <p className={styles.eyebrow}>{copy.business.eyebrow}</p>
              <h2>{copy.business.title}</h2>
              <p>{copy.business.body}</p>
              <a className={styles.textAction} href="#waitlist">
                {copy.business.link} <Arrow />
              </a>
            </div>
            <div
              className={`${styles.photoPanel} ${styles.businessPhoto}`}
              role="img"
              aria-label="Automotive workshop at night"
            />
          </div>
        </section>

        <section id="waitlist" className={styles.waitlistSection}>
          <div className={styles.waitlistShade} />
          <div className={`${styles.shell} ${styles.waitlistInner}`}>
            <p className={styles.eyebrow}>{copy.waitlist.eyebrow}</p>
            <h2>{copy.waitlist.title}</h2>
            <p>{copy.waitlist.body}</p>
            <div className={styles.waitlistFormWrap}>
              <WaitlistForm copy={baseCopy.waitlist} locale={locale} />
            </div>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={`${styles.shell} ${styles.footerGrid}`}>
          <div className={styles.footerBrand}>
            <a href="#top" aria-label="NOXA home">NOXA</a>
            <p>{copy.footer.tagline}</p>
            <a
              className={styles.instagramLink}
              href="https://www.instagram.com/noxa_app/"
              target="_blank"
              rel="noreferrer"
              aria-label="NOXA on Instagram @noxa_app"
            >
              {copy.footer.instagram} <span aria-hidden="true">↗</span>
            </a>
          </div>
          <div>
            <strong>{copy.footer.community}</strong>
            <a href={locale === "el" ? "/el/meets" : "/meets"}>{copy.nav.meets}</a>
            <a href={locale === "el" ? "/el/crews" : "/crews"}>{copy.nav.crews}</a>
            <a href={locale === "el" ? "/el/routes" : "/routes"}>{copy.nav.routes}</a>
          </div>
          <div>
            <strong>{copy.footer.business}</strong>
            <a href="#business">Partners</a>
            <a href="#business">Garages</a>
            <a href="#business">Organisers</a>
          </div>
          <div>
            <strong>{copy.footer.company}</strong>
            <a href="#community">About</a>
            <a href="#waitlist">Early access</a>
          </div>
          <div>
            <strong>{copy.footer.legal}</strong>
            <a href="/privacy">{baseCopy.legalFooter.privacy}</a>
            <a href="/terms">{baseCopy.legalFooter.terms}</a>
          </div>
        </div>
        <div className={`${styles.shell} ${styles.footerBottom}`}>
          <span>© 2026 NOXA.</span>
          <span>{copy.footer.built}</span>
          <span className={styles.signature}>S. KARAKETIDIS</span>
        </div>
      </footer>
    </div>
  );
}
