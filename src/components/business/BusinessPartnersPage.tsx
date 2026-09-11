import Image from "next/image";
import Link from "next/link";

import { InstagramIcon } from "@/components/social/InstagramIcon";

import styles from "./BusinessPartnersPage.module.css";

type CategoryIconName =
  | "tuning"
  | "detailing"
  | "tyres"
  | "service"
  | "cafe"
  | "shop";

const partners = [
  {
    name: "Raceworks Performance",
    meta: "Tuning / Performance / Motorsports",
    image:
      "https://images.pexels.com/photos/36421096/pexels-photo-36421096.jpeg?auto=compress&cs=tinysrgb&w=1600",
    alt: "Modified enthusiast cars lined up together",
  },
  {
    name: "ClearRide Detailing",
    meta: "Detailing / PPF / Car Care",
    image:
      "https://images.pexels.com/photos/10559704/pexels-photo-10559704.jpeg?auto=compress&cs=tinysrgb&w=1600",
    alt: "Premium automotive business atmosphere",
  },
  {
    name: "Fuel Café",
    meta: "Cars / Coffee / Community",
    image:
      "https://images.pexels.com/photos/17716197/pexels-photo-17716197.jpeg?auto=compress&cs=tinysrgb&w=1600",
    alt: "Cars gathered at an automotive meetup at night",
  },
] as const;

const categories: ReadonlyArray<{
  label: string;
  icon: CategoryIconName;
}> = [
  { label: "Tuning & Performance", icon: "tuning" },
  { label: "Detailing & Car Care", icon: "detailing" },
  { label: "Tyres & Wheels", icon: "tyres" },
  { label: "Car Services", icon: "service" },
  { label: "Cafés & Hangouts", icon: "cafe" },
  { label: "Shops & Accessories", icon: "shop" },
];

function SearchIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="m16 16 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <path d="M4 7h16M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function ArrowIcon({ diagonal = false }: { diagonal?: boolean }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      {diagonal ? (
        <>
          <path d="M7 17 17 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M9 7h8v8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </>
      ) : (
        <>
          <path d="M5 12h13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="m14 8 4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
    </svg>
  );
}

function CategoryIcon({ name }: { name: CategoryIconName }) {
  if (name === "tuning") {
    return (
      <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <path d="M8 7 25 24M7 25l7-7M18 14l7-7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        <circle cx="7" cy="7" r="2" stroke="currentColor" strokeWidth="1.7" />
        <circle cx="25" cy="25" r="2" stroke="currentColor" strokeWidth="1.7" />
      </svg>
    );
  }

  if (name === "detailing") {
    return (
      <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <path d="M16 5v5M16 22v5M5 16h5M22 16h5M8.2 8.2l3.5 3.5M20.3 20.3l3.5 3.5M23.8 8.2l-3.5 3.5M11.7 20.3l-3.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="16" cy="16" r="3.2" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    );
  }

  if (name === "tyres") {
    return (
      <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <circle cx="16" cy="16" r="10" stroke="currentColor" strokeWidth="1.7" />
        <circle cx="16" cy="16" r="5" stroke="currentColor" strokeWidth="1.7" />
        <path d="M16 11v10M11 16h10M12.5 12.5l7 7M19.5 12.5l-7 7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    );
  }

  if (name === "service") {
    return (
      <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <path d="M7 18.5 9.5 12h13l2.5 6.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M6 20.5c0-1.1.9-2 2-2h16c1.1 0 2 .9 2 2v4H6v-4Z" stroke="currentColor" strokeWidth="1.7" />
        <circle cx="10" cy="24.5" r="1.7" fill="currentColor" />
        <circle cx="22" cy="24.5" r="1.7" fill="currentColor" />
      </svg>
    );
  }

  if (name === "cafe") {
    return (
      <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <path d="M8 12h14v7.5A5.5 5.5 0 0 1 16.5 25h-3A5.5 5.5 0 0 1 8 19.5V12Z" stroke="currentColor" strokeWidth="1.7" />
        <path d="M22 14h2.5a3.5 3.5 0 0 1 0 7H22M10 8c1-1 1-2 0-3M15 8c1-1 1-2 0-3M20 8c1-1 1-2 0-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="M8 11h16l1 15H7l1-15Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M12 11V9a4 4 0 0 1 8 0v2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function BusinessHeader() {
  const nav = [
    ["Home", "/"],
    ["Map", "/map"],
    ["Community", "/communities"],
    ["Events", "/meets"],
    ["Business", "/business"],
  ] as const;

  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <Link className={styles.brand} href="/" aria-label="NOXASTREET home">
          NOXASTREET
        </Link>

        <nav className={styles.desktopNav} aria-label="Business page navigation">
          {nav.map(([label, href]) => (
            <Link
              className={label === "Business" ? styles.activeNavItem : styles.navItem}
              href={href}
              key={href}
              aria-current={label === "Business" ? "page" : undefined}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className={styles.headerActions}>
          <Link className={styles.searchButton} href="/meets" aria-label="Search events">
            <SearchIcon />
          </Link>
          <Link className={styles.joinButton} href="#partner-cta">
            Join
          </Link>
          <details className={styles.mobileNav}>
            <summary aria-label="Open navigation">
              <MenuIcon />
            </summary>
            <nav aria-label="Mobile business page navigation">
              {nav.map(([label, href]) => (
                <Link href={href} key={href} aria-current={label === "Business" ? "page" : undefined}>
                  {label}
                </Link>
              ))}
              <Link href="#partner-cta">Join as a Partner</Link>
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}

function SectionHeading({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className={styles.sectionHeading}>
      <div>
        <h2>{title}</h2>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      {action ? <div className={styles.sectionAction}>{action}</div> : null}
    </div>
  );
}

export function BusinessPartnersPage() {
  return (
    <div className={styles.page}>
      <a className="skip-link" href="#business-main">
        Skip to content
      </a>
      <BusinessHeader />

      <main id="business-main">
        <section className={styles.hero} aria-labelledby="business-hero-title">
          <Image
            alt="Premium automotive culture scene at night"
            className={styles.heroImage}
            fill
            priority
            sizes="100vw"
            src="https://images.pexels.com/photos/36421096/pexels-photo-36421096.jpeg?auto=compress&cs=tinysrgb&w=2200"
          />
          <div className={styles.heroOverlay} aria-hidden="true" />
          <div className={styles.heroInner}>
            <div className={styles.heroCopy}>
              <p className={styles.eyebrow}>BUSINESS &amp; PARTNERS</p>
              <h1 id="business-hero-title">
                Grow your presence
                <br />
                in Greece’s
                <br />
                automotive culture.
              </h1>
              <p className={styles.heroBody}>
                Connect with an engaged community of car enthusiasts.
                <br className={styles.desktopBreak} /> Build trust, create opportunities, and drive what’s next.
              </p>
              <div className={styles.heroActions}>
                <Link className={styles.primaryButton} href="#partner-cta">
                  Join as a Partner <ArrowIcon />
                </Link>
                <Link className={styles.secondaryButton} href="#categories">
                  View Opportunities
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.partnersSection} id="partners" aria-labelledby="featured-partners-title">
          <div className={styles.shell}>
            <SectionHeading
              title="Featured Partners"
              subtitle="Trusted businesses. A stronger automotive community."
              action={
                <a className={styles.textLink} href="#partners">
                  View all partners <ArrowIcon />
                </a>
              }
            />
            <div className={styles.partnerRail}>
              {partners.map((partner) => (
                <article className={styles.partnerCard} key={partner.name}>
                  <div className={styles.partnerImageWrap}>
                    <Image
                      alt={partner.alt}
                      className={styles.partnerImage}
                      fill
                      sizes="(max-width: 767px) 82vw, (max-width: 1100px) 46vw, 33vw"
                      src={partner.image}
                    />
                    <div className={styles.partnerImageShade} aria-hidden="true" />
                  </div>
                  <div className={styles.partnerInfo}>
                    <div>
                      <h3>{partner.name}</h3>
                      <p>{partner.meta}</p>
                    </div>
                    <span className={styles.cardArrow} aria-hidden="true">
                      <ArrowIcon />
                    </span>
                  </div>
                </article>
              ))}
            </div>
            <div className={styles.railIndicator} aria-hidden="true">
              <span />
            </div>
          </div>
        </section>

        <section className={styles.categoriesSection} id="categories" aria-labelledby="business-categories-title">
          <div className={styles.shell}>
            <SectionHeading
              title="Business Categories"
              subtitle="Find the right partners for your business."
            />
            <div className={styles.categoriesGrid}>
              {categories.map((category) => (
                <div className={styles.categoryCard} key={category.label}>
                  <CategoryIcon name={category.icon} />
                  <span>{category.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.finalCta} id="partner-cta" aria-labelledby="partner-cta-title">
          <Image
            alt="Cars driving together on a mountain road"
            className={styles.finalImage}
            fill
            sizes="100vw"
            src="https://images.pexels.com/photos/6325583/pexels-photo-6325583.jpeg?auto=compress&cs=tinysrgb&w=2200"
          />
          <div className={styles.finalOverlay} aria-hidden="true" />
          <div className={styles.finalInner}>
            <div className={styles.finalCopy}>
              <h2 id="partner-cta-title">
                Let’s Drive
                <br />
                What’s Next. Together.
              </h2>
              <p>
                Partner with NOXASTREET and be part of a stronger,
                <br className={styles.desktopBreak} /> more connected automotive culture in Greece.
              </p>
            </div>
            <a
              className={styles.primaryButton}
              href="https://www.instagram.com/noxa_app/"
              target="_blank"
              rel="noreferrer"
            >
              Join as a Partner <ArrowIcon />
            </a>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <Link className={styles.footerBrand} href="/" aria-label="NOXASTREET home">
            NOXASTREET
          </Link>
          <p className={styles.footerStatement}>A STRONGER CAR CULTURE FOR GREECE</p>
          <div className={styles.footerRight}>
            <Link href="/business">Business</Link>
            <a href="https://www.instagram.com/noxa_app/" target="_blank" rel="noreferrer">
              Contact
            </a>
            <a
              className={styles.socialLink}
              href="https://www.instagram.com/noxa_app/"
              target="_blank"
              rel="noreferrer"
              aria-label="NOXA on Instagram"
            >
              <InstagramIcon />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
