import Link from "next/link";

import { NoxaLogo } from "@/components/brand/NoxaLogo";
import { InstagramIcon } from "@/components/social/InstagramIcon";

import styles from "./BusinessPartnersPage.module.css";

const partners = [
  {
    name: "Raceworks Performance",
    meta: "Tuning / Performance / Motorsports",
    image: "https://images.pexels.com/photos/17716197/pexels-photo-17716197.jpeg?auto=compress&cs=tinysrgb&w=1400",
    position: "center 58%",
  },
  {
    name: "ClearRide Detailing",
    meta: "Detailing / PPF / Car Care",
    image: "https://images.pexels.com/photos/10559704/pexels-photo-10559704.jpeg?auto=compress&cs=tinysrgb&w=1400",
    position: "center 52%",
  },
  {
    name: "Fuel Café",
    meta: "Cars / Coffee / Community",
    image: "https://images.pexels.com/photos/36421096/pexels-photo-36421096.jpeg?auto=compress&cs=tinysrgb&w=1400",
    position: "center 62%",
  },
] as const;

const categories = [
  ["tools", "Tuning & Performance"],
  ["sparkles", "Detailing & Car Care"],
  ["wheel", "Tyres & Wheels"],
  ["car", "Car Services"],
  ["coffee", "Cafés & Hangouts"],
  ["bag", "Shops & Accessories"],
] as const;

type IconName = (typeof categories)[number][0];

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

function CategoryIcon({ name }: { name: IconName }) {
  if (name === "tools") {
    return <svg aria-hidden="true" viewBox="0 0 32 32"><path d="M11 7a6 6 0 0 0 7.2 7.2L27 23l-4 4-8.8-8.8A6 6 0 0 0 7 11l4 3 3-3-3-4Z"/><path d="m7 25 7-7"/></svg>;
  }
  if (name === "sparkles") {
    return <svg aria-hidden="true" viewBox="0 0 32 32"><path d="m16 5 1.4 4.1L22 11l-4.6 1.9L16 17l-1.4-4.1L10 11l4.6-1.9L16 5Z"/><path d="m24 17 .9 2.6L28 21l-3.1 1.4L24 25l-.9-2.6L20 21l3.1-1.4L24 17ZM8 17l.9 2.6L12 21l-3.1 1.4L8 25l-.9-2.6L4 21l3.1-1.4L8 17Z"/></svg>;
  }
  if (name === "wheel") {
    return <svg aria-hidden="true" viewBox="0 0 32 32"><circle cx="16" cy="16" r="11"/><circle cx="16" cy="16" r="5"/><path d="m16 5 2.4 6.4M27 16l-6.4 2.4M16 27l-2.4-6.4M5 16l6.4-2.4"/></svg>;
  }
  if (name === "car") {
    return <svg aria-hidden="true" viewBox="0 0 32 32"><path d="M6 20v-5l3-7h14l3 7v5"/><path d="M5 20h22v5H5zM9 25v2m14-2v2M9 16h2m10 0h2"/></svg>;
  }
  if (name === "coffee") {
    return <svg aria-hidden="true" viewBox="0 0 32 32"><path d="M7 10h16v8a8 8 0 0 1-16 0v-8Z"/><path d="M23 12h2a4 4 0 0 1 0 8h-3M9 6c0-1 1-1.6 1-2.5M15 6c0-1 1-1.6 1-2.5M21 6c0-1 1-1.6 1-2.5"/></svg>;
  }
  return <svg aria-hidden="true" viewBox="0 0 32 32"><path d="M8 11h16l2 16H6l2-16Z"/><path d="M12 12V9a4 4 0 0 1 8 0v3"/></svg>;
}

function Header() {
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
        <Link className={styles.brand} href="/" aria-label="NOXA home">
          <NoxaLogo className={styles.brandLogo} />
        </Link>

        <nav className={styles.desktopNav} aria-label="Primary navigation">
          {nav.map(([label, href]) => (
            <Link
              key={href}
              className={href === "/business" ? styles.navActive : undefined}
              href={href}
              aria-current={href === "/business" ? "page" : undefined}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className={styles.headerActions}>
          <Link className={styles.searchButton} href="/meets" aria-label="Search events">
            <SearchIcon />
          </Link>
          <a className={styles.joinButton} href="#partner">Join</a>
          <details className={styles.mobileMenu}>
            <summary aria-label="Open navigation menu">
              <span /><span />
            </summary>
            <div className={styles.mobileMenuPanel}>
              <nav aria-label="Mobile navigation">
                {nav.map(([label, href]) => (
                  <Link
                    key={href}
                    className={href === "/business" ? styles.mobileNavActive : undefined}
                    href={href}
                    aria-current={href === "/business" ? "page" : undefined}
                  >
                    {label}
                  </Link>
                ))}
              </nav>
              <a href="#partner">Join as a Partner <span aria-hidden="true">→</span></a>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}

export function BusinessPartnersPage() {
  return (
    <div className={styles.page}>
      <a className="skip-link" href="#business-main">Skip to content</a>
      <Header />

      <main id="business-main">
        <section className={styles.hero} aria-labelledby="business-hero-title">
          <div className={styles.heroMedia} aria-hidden="true" />
          <div className={styles.heroShade} aria-hidden="true" />
          <div className={styles.heroContent}>
            <p className={styles.eyebrow}>Business &amp; Partners</p>
            <h1 id="business-hero-title">Grow your presence<br />in Greece’s<br />automotive culture.</h1>
            <p className={styles.heroBody}>
              Connect with an engaged community of car enthusiasts.<br className={styles.desktopBreak} />
              Build trust, create opportunities, and drive what’s next.
            </p>
            <div className={styles.heroActions}>
              <a className={styles.primaryButton} href="#partner">Join as a Partner <ArrowIcon /></a>
              <a className={styles.secondaryButton} href="#categories">View Opportunities</a>
            </div>
          </div>
        </section>

        <section className={styles.partnersSection} id="partners" aria-labelledby="featured-partners-title">
          <div className={styles.sectionHeadingRow}>
            <div>
              <h2 id="featured-partners-title">Featured Partners</h2>
              <p>Trusted businesses. A stronger automotive community.</p>
            </div>
            <a className={styles.viewAll} href="#partners">View all partners <ArrowIcon /></a>
          </div>

          <div className={styles.partnerRail}>
            {partners.map((partner) => (
              <article className={styles.partnerCard} key={partner.name}>
                <div
                  className={styles.partnerImage}
                  role="img"
                  aria-label={`${partner.name} automotive partner`}
                  style={{ backgroundImage: `url(${partner.image})`, backgroundPosition: partner.position }}
                />
                <div className={styles.partnerInfo}>
                  <div>
                    <h3>{partner.name}</h3>
                    <p>{partner.meta}</p>
                  </div>
                  <a href="#partner" aria-label={`Learn more about ${partner.name}`}><ArrowIcon /></a>
                </div>
              </article>
            ))}
          </div>
          <div className={styles.railIndicator} aria-hidden="true"><span /></div>
        </section>

        <section className={styles.categoriesSection} id="categories" aria-labelledby="business-categories-title">
          <div className={styles.sectionHeadingRow}>
            <div>
              <h2 id="business-categories-title">Business Categories</h2>
              <p>Find the right partners for your business.</p>
            </div>
          </div>
          <div className={styles.categoriesGrid}>
            {categories.map(([icon, label]) => (
              <a className={styles.categoryCard} href="#partner" key={label}>
                <CategoryIcon name={icon} />
                <span>{label}</span>
              </a>
            ))}
          </div>
        </section>

        <section className={styles.finalCta} id="partner" aria-labelledby="partner-cta-title">
          <div className={styles.finalCtaMedia} aria-hidden="true" />
          <div className={styles.finalCtaShade} aria-hidden="true" />
          <div className={styles.finalCtaInner}>
            <div>
              <h2 id="partner-cta-title">Let’s Drive<br />What’s Next. Together.</h2>
              <p>Partner with NOXASTREET and be part of a stronger,<br className={styles.desktopBreak} /> more connected automotive culture in Greece.</p>
            </div>
            <a className={styles.primaryButton} href="mailto:hello@noxastreetapp.com?subject=NOXA%20Partner%20Enquiry">Join as a Partner <ArrowIcon /></a>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <Link className={styles.footerBrand} href="/" aria-label="NOXA home"><NoxaLogo /></Link>
          <p>A STRONGER CAR CULTURE FOR GREECE</p>
          <nav aria-label="Footer navigation">
            <Link href="/business">Business</Link>
            <a href="mailto:hello@noxastreetapp.com">Contact</a>
            <a className={styles.socialLink} href="https://www.instagram.com/noxa_app/" target="_blank" rel="noreferrer" aria-label="NOXA on Instagram"><InstagramIcon /></a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
