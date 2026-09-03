import Link from "next/link";

import type { Locale } from "@/i18n/landing-copy";

import styles from "./EcosystemAudience.module.css";

const copy = {
  en: {
    eyebrow: "BUILT FOR THE WHOLE SCENE",
    title: "One platform. Three ways in.",
    body: "NOXA is being built as shared infrastructure for the automotive and motorcycle scene — useful to the people who attend, the communities that organise and the partners that support them.",
    cards: [
      {
        number: "01",
        title: "ENTHUSIASTS",
        body: "Find real meets, discover crews and see what is happening around you without searching through dozens of stories and group chats.",
        cta: "Explore NOXA Meets",
        href: "/radar",
      },
      {
        number: "02",
        title: "COMMUNITIES",
        body: "Build a public presence, publish events, grow your reach and make your community easier to discover.",
        cta: "Explore communities",
        href: "/communities",
      },
      {
        number: "03",
        title: "PARTNERS",
        body: "Reach an audience that is already active in automotive culture through relevant events, locations, offers and collaborations.",
        cta: "For partners",
        href: "#business",
      },
    ],
    promiseEyebrow: "FOR COMMUNITIES",
    promiseTitle: "Built for established communities.",
    promiseBody: "NOXA gives clubs, organisers and local scenes a structured way to publish events, improve discovery and build a visible presence around real activity.",
    benefits: [
      ["Identity", "Build a clear public profile for your community."],
      ["Events", "Publish meets and make them discoverable beyond social posts."],
      ["Reach", "Be found by drivers and riders outside your existing audience."],
      ["Reputation", "Build a visible record of organised activity over time."],
    ],
    promiseCta: "Explore NOXA Communities",
    promiseHref: "/communities",
  },
  el: {
    eyebrow: "ΓΙΑ ΟΛΗ ΤΗ ΣΚΗΝΗ",
    title: "Μία πλατφόρμα. Τρεις τρόποι συμμετοχής.",
    body: "Το NOXA χτίζεται ως κοινή υποδομή για την automotive και moto σκηνή — χρήσιμη για όσους συμμετέχουν, για τις κοινότητες που οργανώνουν και για τους partners που τις υποστηρίζουν.",
    cards: [
      {
        number: "01",
        title: "ENTHUSIASTS",
        body: "Βρες πραγματικά meets, ανακάλυψε crews και δες τι συμβαίνει γύρω σου χωρίς να ψάχνεις δεκάδες stories και group chats.",
        cta: "Άνοιξε το NOXA Meets",
        href: "/radar",
      },
      {
        number: "02",
        title: "COMMUNITIES",
        body: "Χτίσε δημόσια παρουσία, δημοσίευσε events, μεγάλωσε το reach σου και κάνε την κοινότητά σου πιο εύκολο να ανακαλυφθεί.",
        cta: "Δες τις κοινότητες",
        href: "/el/communities",
      },
      {
        number: "03",
        title: "PARTNERS",
        body: "Φτάσε σε κοινό που ήδη συμμετέχει ενεργά στην automotive κουλτούρα μέσα από events, τοποθεσίες, offers και συνεργασίες.",
        cta: "Για partners",
        href: "#business",
      },
    ],
    promiseEyebrow: "ΓΙΑ ΚΟΙΝΟΤΗΤΕΣ",
    promiseTitle: "Σχεδιασμένο για οργανωμένες κοινότητες.",
    promiseBody: "Το NOXA δίνει σε clubs, organisers και τοπικές σκηνές έναν δομημένο τρόπο να δημοσιεύουν events, να αυξάνουν την προβολή τους και να χτίζουν σταθερή παρουσία γύρω από πραγματική δραστηριότητα.",
    benefits: [
      ["Identity", "Χτίσε ένα καθαρό δημόσιο profile για την κοινότητά σου."],
      ["Events", "Δημοσίευσε meets που παραμένουν ορατά πέρα από ένα social post."],
      ["Reach", "Βρες νέους οδηγούς και αναβάτες έξω από το υπάρχον κοινό σου."],
      ["Reputation", "Χτίσε ορατό ιστορικό οργανωμένης δραστηριότητας με τον χρόνο."],
    ],
    promiseCta: "Δες το NOXA Communities",
    promiseHref: "/el/communities",
  },
} as const;

function Arrow() {
  return <span aria-hidden="true">→</span>;
}

export function EcosystemAudience({ locale }: { locale: Locale }) {
  const text = copy[locale];

  return (
    <section className={styles.section} aria-labelledby="ecosystem-audience-title">
      <div className={styles.shell}>
        <div className={styles.heading}>
          <div>
            <p className={styles.eyebrow}>{text.eyebrow}</p>
            <h2 id="ecosystem-audience-title">{text.title}</h2>
          </div>
          <p>{text.body}</p>
        </div>

        <div className={styles.audienceGrid}>
          {text.cards.map((card) => (
            <Link className={styles.audienceCard} href={card.href} key={card.number}>
              <div className={styles.cardTopline}>
                <span>{card.number}</span>
                <span aria-hidden="true">↗</span>
              </div>
              <h3>{card.title}</h3>
              <p>{card.body}</p>
              <strong>{card.cta} <Arrow /></strong>
            </Link>
          ))}
        </div>

        <div className={styles.promise}>
          <div className={styles.promiseCopy}>
            <p className={styles.eyebrow}>{text.promiseEyebrow}</p>
            <h2>{text.promiseTitle}</h2>
            <p>{text.promiseBody}</p>
            <Link className={styles.promiseCta} href={text.promiseHref}>
              {text.promiseCta} <Arrow />
            </Link>
          </div>

          <div className={styles.benefitGrid}>
            {text.benefits.map(([title, body]) => (
              <div className={styles.benefit} key={title}>
                <strong>{title}</strong>
                <p>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
