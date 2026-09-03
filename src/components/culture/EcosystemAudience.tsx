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
        body: "Keep your own name and identity. Publish events, grow your reach and build a visible history around your community.",
        cta: "For communities",
        href: "#community",
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
    promiseTitle: "Your community stays yours.",
    promiseBody: "NOXA should not replace clubs, organisers or local scenes. It should make them easier to discover and give them better tools to reach the people who care.",
    benefits: [
      ["Identity", "Your name, visual identity and voice stay yours."],
      ["Events", "Publish meets and make them discoverable beyond social posts."],
      ["Reach", "Be found by drivers and riders outside your existing audience."],
      ["Reputation", "Build a visible record of organised activity over time."],
    ],
    promiseCta: "Bring your community to NOXA",
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
        body: "Κράτα το όνομα και την ταυτότητά σου. Δημοσίευσε events, μεγάλωσε το reach σου και χτίσε ορατή παρουσία για την κοινότητά σου.",
        cta: "Για κοινότητες",
        href: "#community",
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
    promiseTitle: "Η κοινότητά σου παραμένει δική σου.",
    promiseBody: "Το NOXA δεν πρέπει να αντικαθιστά clubs, organisers ή τοπικές σκηνές. Πρέπει να τα κάνει πιο εύκολα να ανακαλυφθούν και να τους δίνει καλύτερα εργαλεία για να φτάνουν στους σωστούς ανθρώπους.",
    benefits: [
      ["Identity", "Το όνομα, το visual identity και η φωνή σας παραμένουν δικά σας."],
      ["Events", "Δημοσίευσε meets που παραμένουν ορατά πέρα από ένα social post."],
      ["Reach", "Βρες νέους οδηγούς και αναβάτες έξω από το υπάρχον κοινό σου."],
      ["Reputation", "Χτίσε ορατό ιστορικό οργανωμένης δραστηριότητας με τον χρόνο."],
    ],
    promiseCta: "Φέρε την κοινότητά σου στο NOXA",
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
            <a className={styles.promiseCta} href="#waitlist">
              {text.promiseCta} <Arrow />
            </a>
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
