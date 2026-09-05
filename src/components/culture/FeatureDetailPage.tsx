import Image from "next/image";

import { NoxaLogo } from "@/components/brand/NoxaLogo";
import { DocumentLanguage } from "@/components/i18n/DocumentLanguage";
import { SiteHeader } from "@/components/navigation/SiteHeader";
import { landingCopy, type Locale } from "@/i18n/landing-copy";

import styles from "./FeatureDetailPage.module.css";

export type FeatureSlug = "meets" | "crews" | "routes";

type FeatureDetailPageProps = {
  locale: Locale;
  feature: FeatureSlug;
};

type FeatureCopy = {
  eyebrow: string;
  title: string;
  lead: string;
  heroImage: string;
  heroAlt: string;
  introTitle: string;
  introBody: string;
  checklistTitle: string;
  checklistLead: string;
  checklist: ReadonlyArray<{
    title: string;
    body: string;
  }>;
  flowTitle: string;
  flow: ReadonlyArray<readonly [string, string]>;
  ctaTitle: string;
  ctaBody: string;
  cta: string;
};

const featureCopy: Record<Locale, Record<FeatureSlug, FeatureCopy>> = {
  en: {
    meets: {
      eyebrow: "NOXA MEETUPS",
      title: "Find the scene. Know what is happening. Show up together.",
      lead:
        "Meetups are the real-world heartbeat of NOXA — local gatherings, organised events and spontaneous automotive moments made easier to discover and join.",
      heroImage:
        "https://images.pexels.com/photos/17716197/pexels-photo-17716197.jpeg?auto=compress&cs=tinysrgb&w=2200",
      heroAlt: "Enthusiast cars gathered at an automotive meetup at night",
      introTitle: "A meetup should feel clear before you leave home.",
      introBody:
        "NOXA is built to remove the usual friction around automotive gatherings: where it is, when it starts, who is going, what kind of event it is and what happens next.",
      checklistTitle: "What Meetups mean inside NOXA",
      checklistLead: "Open each point to see how the experience is designed.",
      checklist: [
        {
          title: "Discover what is happening around you",
          body:
            "Nearby meets and events are designed to surface through NOXA's map and event discovery experience, so the local scene is visible instead of being scattered across private chats and stories.",
        },
        {
          title: "Understand the event before joining",
          body:
            "Location, date, time, distance, organiser context and participant activity give you enough information to decide whether the meetup is relevant to you.",
        },
        {
          title: "Say you are going and see the community form",
          body:
            "The participation flow is designed around a clear going status and visible attendance, turning an event card into a real group of people who intend to meet.",
        },
        {
          title: "Move from the meetup into the drive",
          body:
            "NOXA's product flow connects gatherings with lobby, route and group-drive experiences so a meet can naturally continue onto the road when the organiser chooses.",
        },
        {
          title: "Keep location and participation intentional",
          body:
            "Location visibility and check-in behaviour are designed around user control. Being part of a meetup should not mean exposing more information than necessary.",
        },
      ],
      flowTitle: "The simple flow",
      flow: [
        ["01", "Discover a meetup"],
        ["02", "Open the details"],
        ["03", "Join the people going"],
        ["04", "Meet — and drive together"],
      ],
      ctaTitle: "The culture already exists. NOXA makes it easier to find.",
      ctaBody:
        "Join early access and help shape how automotive gatherings should work across Greece.",
      cta: "Join NOXA early",
    },
    crews: {
      eyebrow: "NOXA CREWS",
      title: "More than a group chat. A real automotive identity.",
      lead:
        "Crews give people a place to belong inside NOXA — a shared identity around cars, motorcycles, local scenes, events and the roads they enjoy together.",
      heroImage:
        "https://images.pexels.com/photos/36421096/pexels-photo-36421096.jpeg?auto=compress&cs=tinysrgb&w=2200",
      heroAlt: "Modified enthusiast cars lined up together",
      introTitle: "A crew should represent something real.",
      introBody:
        "Instead of creating another disconnected group, NOXA is designed to connect crew identity with members, meets, events and drives in the same automotive ecosystem.",
      checklistTitle: "What Crews mean inside NOXA",
      checklistLead: "Open each point to see how a crew fits into the product.",
      checklist: [
        {
          title: "Create a recognisable crew identity",
          body:
            "A crew has its own presence, name and community context so members can represent the group consistently inside the wider NOXA ecosystem.",
        },
        {
          title: "Bring the right people together",
          body:
            "Crew membership is designed around a real group of drivers and riders rather than a passive follower count — people who actually meet, organise and drive together.",
        },
        {
          title: "Connect crews with meets and events",
          body:
            "The product direction links crew activity directly to real gatherings, making it easier to organise participation and understand what the group is doing next.",
        },
        {
          title: "Turn a crew into a moving community",
          body:
            "Routes, lobbies and group-drive flows are designed to give crews a practical way to move together, not just exist as a profile.",
        },
        {
          title: "Build reputation through real activity",
          body:
            "NOXA prioritises visible real-world participation and useful community context over vanity metrics. The goal is a crew people recognise because it is active.",
        },
      ],
      flowTitle: "The crew loop",
      flow: [
        ["01", "Create or join"],
        ["02", "Build the crew identity"],
        ["03", "Organise meets and drives"],
        ["04", "Grow through real activity"],
      ],
      ctaTitle: "Your crew should exist beyond a private chat.",
      ctaBody:
        "NOXA is building a home for the teams, clubs and communities that shape automotive culture.",
      cta: "Join NOXA early",
    },
    routes: {
      eyebrow: "NOXA ROUTES & DRIVES",
      title: "The meetup is only the beginning. The road is part of the community.",
      lead:
        "Routes & Drives connect the social side of NOXA with the reason many enthusiasts meet in the first place: to get on the road together.",
      heroImage:
        "https://images.pexels.com/photos/6325583/pexels-photo-6325583.jpeg?auto=compress&cs=tinysrgb&w=2200",
      heroAlt: "Cars travelling together on an open road",
      introTitle: "Group driving needs more than a destination pin.",
      introBody:
        "NOXA's route experience is designed around the full group context — where people start, who is ready, where the route goes and how the group stays oriented while moving.",
      checklistTitle: "What Routes & Drives mean inside NOXA",
      checklistLead: "Open each point to understand the driving flow.",
      checklist: [
        {
          title: "Start from a real meetup or plan a drive",
          body:
            "A route can be part of the same social flow as a gathering, so organisers do not have to move the community into another app just to continue the experience.",
        },
        {
          title: "Give the group one clear route context",
          body:
            "Start point, destination and route information are designed to be visible in one place so everyone understands the plan before moving.",
        },
        {
          title: "Use a lobby before the group leaves",
          body:
            "The lobby concept gives participants a shared readiness moment before the drive begins — useful when several cars or motorcycles are leaving together.",
        },
        {
          title: "Keep the drive connected to the live map",
          body:
            "NOXA's map-first architecture is designed to support route guidance and group context without pushing the core experience into an external mapping app.",
        },
        {
          title: "Make driving social without making it distracting",
          body:
            "The interface direction is intentionally minimal while moving: the important information should be understandable at a glance, with safety taking priority over social noise.",
        },
      ],
      flowTitle: "From gathering to road",
      flow: [
        ["01", "Choose the drive"],
        ["02", "Gather in the lobby"],
        ["03", "Follow the route"],
        ["04", "Move as one group"],
      ],
      ctaTitle: "Built for people who do not just own vehicles. They drive them.",
      ctaBody:
        "Join early access and help NOXA build a better group-driving experience for real automotive communities.",
      cta: "Join NOXA early",
    },
  },
  el: {
    meets: {
      eyebrow: "NOXA MEETUPS",
      title: "Βρες τη σκηνή. Δες τι συμβαίνει. Πήγαινε μαζί με την κοινότητα.",
      lead:
        "Τα Meetups είναι η πραγματική καρδιά του NOXA — τοπικές συναντήσεις, οργανωμένα events και αυθόρμητες automotive στιγμές που γίνονται πιο εύκολο να τις βρεις και να συμμετέχεις.",
      heroImage:
        "https://images.pexels.com/photos/17716197/pexels-photo-17716197.jpeg?auto=compress&cs=tinysrgb&w=2200",
      heroAlt: "Αυτοκίνητα σε βραδινό automotive meetup",
      introTitle: "Ένα meetup πρέπει να είναι ξεκάθαρο πριν φύγεις από το σπίτι.",
      introBody:
        "Το NOXA μειώνει την τριβή γύρω από τις automotive συναντήσεις: πού είναι, πότε ξεκινά, ποιοι θα πάνε, τι είδους event είναι και τι μπορεί να ακολουθήσει.",
      checklistTitle: "Τι σημαίνουν τα Meetups μέσα στο NOXA",
      checklistLead: "Άνοιξε κάθε σημείο για να δεις πώς σχεδιάζεται η εμπειρία.",
      checklist: [
        {
          title: "Βρες τι συμβαίνει γύρω σου",
          body:
            "Τα κοντινά meets και events σχεδιάζονται να εμφανίζονται μέσα από τον χάρτη και το event discovery του NOXA, αντί να χάνονται σε ιδιωτικά chats και stories.",
        },
        {
          title: "Κατάλαβε το event πριν συμμετέχεις",
          body:
            "Τοποθεσία, ημερομηνία, ώρα, απόσταση, διοργανωτής και δραστηριότητα συμμετεχόντων δίνουν το απαραίτητο context πριν αποφασίσεις.",
        },
        {
          title: "Δήλωσε ότι θα πας και δες την ομάδα να σχηματίζεται",
          body:
            "Η ροή συμμετοχής βασίζεται σε ξεκάθαρο going status και ορατή συμμετοχή, ώστε ένα event card να μετατρέπεται σε πραγματική συνάντηση ανθρώπων.",
        },
        {
          title: "Από το meetup στη διαδρομή",
          body:
            "Η κατεύθυνση του NOXA συνδέει meetups με lobby, route και group-drive εμπειρίες, ώστε η συνάντηση να μπορεί φυσικά να συνεχιστεί στον δρόμο.",
        },
        {
          title: "Έλεγχος σε τοποθεσία και συμμετοχή",
          body:
            "Η ορατότητα τοποθεσίας και το check-in σχεδιάζονται γύρω από τον έλεγχο του χρήστη. Η συμμετοχή σε meetup δεν πρέπει να σημαίνει υπερβολική έκθεση προσωπικών δεδομένων.",
        },
      ],
      flowTitle: "Η απλή ροή",
      flow: [
        ["01", "Βρες ένα meetup"],
        ["02", "Δες τις λεπτομέρειες"],
        ["03", "Μπες στους συμμετέχοντες"],
        ["04", "Συναντηθείτε — και οδηγήστε μαζί"],
      ],
      ctaTitle: "Η κουλτούρα υπάρχει ήδη. Το NOXA την κάνει πιο εύκολο να τη βρεις.",
      ctaBody:
        "Μπες στο early access και βοήθησε να διαμορφώσουμε το πώς πρέπει να λειτουργούν οι automotive συναντήσεις στην Ελλάδα.",
      cta: "Μπες νωρίς στο NOXA",
    },
    crews: {
      eyebrow: "NOXA CREWS",
      title: "Περισσότερο από ένα group chat. Μια πραγματική automotive ταυτότητα.",
      lead:
        "Τα Crews δίνουν στους ανθρώπους ένα μέρος να ανήκουν μέσα στο NOXA — κοινή ταυτότητα γύρω από αυτοκίνητα, μοτοσυκλέτες, τοπικές σκηνές, events και διαδρομές.",
      heroImage:
        "https://images.pexels.com/photos/36421096/pexels-photo-36421096.jpeg?auto=compress&cs=tinysrgb&w=2200",
      heroAlt: "Βελτιωμένα enthusiast αυτοκίνητα σε κοινή παράταξη",
      introTitle: "Ένα crew πρέπει να εκπροσωπεί κάτι πραγματικό.",
      introBody:
        "Αντί για άλλη μία απομονωμένη ομάδα, το NOXA συνδέει την ταυτότητα ενός crew με μέλη, meets, events και drives μέσα στο ίδιο automotive οικοσύστημα.",
      checklistTitle: "Τι σημαίνουν τα Crews μέσα στο NOXA",
      checklistLead: "Άνοιξε κάθε σημείο για να δεις πώς λειτουργεί η ιδέα.",
      checklist: [
        {
          title: "Δημιούργησε αναγνωρίσιμη ταυτότητα crew",
          body:
            "Το crew έχει δική του παρουσία, όνομα και community context ώστε τα μέλη να μπορούν να το εκπροσωπούν με συνέπεια μέσα στο NOXA.",
        },
        {
          title: "Φέρε μαζί τους σωστούς ανθρώπους",
          body:
            "Η συμμετοχή σχεδιάζεται γύρω από πραγματική ομάδα οδηγών και αναβατών — ανθρώπους που συναντιούνται, οργανώνουν και κινούνται μαζί.",
        },
        {
          title: "Σύνδεσε το crew με meets και events",
          body:
            "Η κατεύθυνση του προϊόντος συνδέει τη δραστηριότητα του crew με πραγματικές συναντήσεις ώστε να είναι πιο εύκολη η οργάνωση και η συμμετοχή.",
        },
        {
          title: "Κάνε το crew μια κοινότητα που κινείται",
          body:
            "Routes, lobbies και group-drive flows δίνουν στο crew πρακτικό τρόπο να οδηγήσει μαζί, όχι απλώς να υπάρχει σαν profile.",
        },
        {
          title: "Χτίσε φήμη μέσα από πραγματική δραστηριότητα",
          body:
            "Το NOXA δίνει προτεραιότητα στην πραγματική συμμετοχή και χρήσιμο community context αντί για vanity metrics.",
        },
      ],
      flowTitle: "Ο κύκλος του crew",
      flow: [
        ["01", "Δημιούργησε ή μπες"],
        ["02", "Χτίσε την ταυτότητα"],
        ["03", "Οργάνωσε meets και drives"],
        ["04", "Μεγάλωσε μέσα από δράση"],
      ],
      ctaTitle: "Το crew σου πρέπει να υπάρχει πέρα από ένα private chat.",
      ctaBody:
        "Το NOXA χτίζει ένα σπίτι για teams, clubs και κοινότητες που διαμορφώνουν την automotive κουλτούρα.",
      cta: "Μπες νωρίς στο NOXA",
    },
    routes: {
      eyebrow: "NOXA ROUTES & DRIVES",
      title: "Το meetup είναι μόνο η αρχή. Ο δρόμος είναι μέρος της κοινότητας.",
      lead:
        "Τα Routes & Drives συνδέουν την κοινωνική πλευρά του NOXA με τον λόγο που πολλοί enthusiasts συναντιούνται εξαρχής: για να οδηγήσουν μαζί.",
      heroImage:
        "https://images.pexels.com/photos/6325583/pexels-photo-6325583.jpeg?auto=compress&cs=tinysrgb&w=2200",
      heroAlt: "Αυτοκίνητα που κινούνται μαζί σε ανοιχτό δρόμο",
      introTitle: "Η ομαδική οδήγηση χρειάζεται περισσότερα από ένα destination pin.",
      introBody:
        "Η εμπειρία route του NOXA σχεδιάζεται γύρω από όλο το group context — πού ξεκινάτε, ποιοι είναι έτοιμοι, πού πηγαίνει η διαδρομή και πώς παραμένει η ομάδα προσανατολισμένη.",
      checklistTitle: "Τι σημαίνουν τα Routes & Drives μέσα στο NOXA",
      checklistLead: "Άνοιξε κάθε σημείο για να δεις τη driving ροή.",
      checklist: [
        {
          title: "Ξεκίνα από ένα meetup ή οργάνωσε drive",
          body:
            "Μια διαδρομή μπορεί να είναι μέρος της ίδιας κοινωνικής ροής με ένα gathering, χωρίς να χρειάζεται να μεταφερθεί όλη η ομάδα σε άλλη εφαρμογή.",
        },
        {
          title: "Ένα ξεκάθαρο route context για όλους",
          body:
            "Start point, destination και route information σχεδιάζονται να βρίσκονται σε ένα μέρος ώστε όλοι να καταλαβαίνουν το πλάνο πριν ξεκινήσουν.",
        },
        {
          title: "Lobby πριν ξεκινήσει η ομάδα",
          body:
            "Το lobby δίνει σε όλους μια κοινή στιγμή ετοιμότητας πριν την εκκίνηση — χρήσιμο όταν πολλά αυτοκίνητα ή μοτοσυκλέτες φεύγουν μαζί.",
        },
        {
          title: "Η διαδρομή παραμένει συνδεδεμένη με τον live χάρτη",
          body:
            "Η map-first αρχιτεκτονική του NOXA σχεδιάζεται για route guidance και group context χωρίς να πετάει τη βασική εμπειρία σε εξωτερικό mapping app.",
        },
        {
          title: "Social οδήγηση χωρίς περισπασμούς",
          body:
            "Η σχεδιαστική κατεύθυνση είναι σκόπιμα minimal όταν το όχημα κινείται: τα σημαντικά δεδομένα πρέπει να καταλαβαίνονται με μια ματιά και η ασφάλεια να έχει προτεραιότητα.",
        },
      ],
      flowTitle: "Από τη συνάντηση στον δρόμο",
      flow: [
        ["01", "Επίλεξε drive"],
        ["02", "Μαζευτείτε στο lobby"],
        ["03", "Ακολούθησε το route"],
        ["04", "Κινηθείτε σαν μία ομάδα"],
      ],
      ctaTitle: "Για ανθρώπους που δεν έχουν απλώς οχήματα. Τα οδηγούν.",
      ctaBody:
        "Μπες στο early access και βοήθησε το NOXA να χτίσει καλύτερη group-driving εμπειρία για πραγματικές automotive κοινότητες.",
      cta: "Μπες νωρίς στο NOXA",
    },
  },
};

export function isFeatureSlug(value: string): value is FeatureSlug {
  return value === "meets" || value === "crews" || value === "routes";
}

export function FeatureDetailPage({ locale, feature }: FeatureDetailPageProps) {
  const baseCopy = landingCopy[locale];
  const copy = featureCopy[locale][feature];
  const home = locale === "el" ? "/el" : "/";
  const localePaths = {
    en: `/${feature}`,
    el: `/el/${feature}`,
  } as const;

  const navItems = locale === "el"
    ? ([
        ["Κοινότητα", `${home}#community`],
        ["Συναντήσεις", "/el/meets"],
        ["Ομάδες", "/el/crews"],
        ["Διαδρομές", "/el/routes"],
        ["Early access", `${home}#waitlist`],
      ] as const)
    : ([
        ["Community", `${home}#community`],
        ["Meetups", "/meets"],
        ["Crews", "/crews"],
        ["Routes", "/routes"],
        ["Waitlist", `${home}#waitlist`],
      ] as const);

  return (
    <div className={styles.page}>
      <DocumentLanguage locale={locale} />
      <a className="skip-link" href="#feature-content">
        {baseCopy.skipToContent}
      </a>
      <SiteHeader
        locale={locale}
        languageCopy={baseCopy.language}
        languagePaths={localePaths}
        homeHref={home}
        joinHref={`${home}#waitlist`}
        navigationCopy={{
          ...baseCopy.navigation,
          join: locale === "el" ? "Μπες στη λίστα" : "Join Waitlist",
          items: navItems,
        }}
      />

      <main id="feature-content">
        <section className={styles.hero}>
          <Image
            src={copy.heroImage}
            alt={copy.heroAlt}
            fill
            priority
            sizes="100vw"
            className={styles.heroImage}
          />
          <div className={styles.heroShade} />
          <div className={styles.shell}>
            <a className={styles.backLink} href={home}>
              <span aria-hidden="true">←</span> {locale === "el" ? "Πίσω στο NOXA" : "Back to NOXA"}
            </a>
            <div className={styles.heroCopy}>
              <p className={styles.eyebrow}>{copy.eyebrow}</p>
              <h1>{copy.title}</h1>
              <p>{copy.lead}</p>
            </div>
          </div>
        </section>

        <section className={styles.introSection}>
          <div className={`${styles.shell} ${styles.introGrid}`}>
            <p className={styles.sectionNumber}>01</p>
            <div>
              <h2>{copy.introTitle}</h2>
              <p>{copy.introBody}</p>
            </div>
          </div>
        </section>

        <section className={styles.checklistSection}>
          <div className={styles.shell}>
            <div className={styles.sectionHeading}>
              <p className={styles.eyebrow}>NOXA PRODUCT FLOW</p>
              <h2>{copy.checklistTitle}</h2>
              <p>{copy.checklistLead}</p>
            </div>
            <div className={styles.checklist}>
              {copy.checklist.map((item, index) => (
                <details className={styles.checkItem} key={item.title} open={index === 0}>
                  <summary>
                    <span className={styles.checkMark} aria-hidden="true">✓</span>
                    <span>{item.title}</span>
                    <span className={styles.expandMark} aria-hidden="true">+</span>
                  </summary>
                  <p>{item.body}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.flowSection}>
          <div className={styles.shell}>
            <div className={styles.sectionHeading}>
              <p className={styles.eyebrow}>HOW IT CONNECTS</p>
              <h2>{copy.flowTitle}</h2>
            </div>
            <div className={styles.flowGrid}>
              {copy.flow.map(([number, label]) => (
                <div className={styles.flowStep} key={number}>
                  <span>{number}</span>
                  <strong>{label}</strong>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.ctaSection}>
          <div className={styles.ctaShade} />
          <div className={`${styles.shell} ${styles.ctaInner}`}>
            <h2>{copy.ctaTitle}</h2>
            <p>{copy.ctaBody}</p>
            <a href={`${home}#waitlist`} className={styles.ctaButton}>
              {copy.cta} <span aria-hidden="true">→</span>
            </a>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={`${styles.shell} ${styles.footerRow}`}>
          <div>
            <a aria-label="NOXA home" className={styles.wordmark} href={home}><NoxaLogo /></a>
            <p>{locale === "el" ? "Η automotive κοινότητα, σε ένα μέρος." : "The automotive community, in one place."}</p>
          </div>
          <div className={styles.footerLinks}>
            <a href="https://www.instagram.com/noxa_app/" target="_blank" rel="noreferrer">Instagram · @noxa_app</a>
            <a href={`${home}#waitlist`}>{locale === "el" ? "Early access" : "Join early access"}</a>
          </div>
        </div>
        <div className={`${styles.shell} ${styles.footerBottom}`}>
          <span>© 2026 NOXA.</span>
          <span className={styles.signature}>S. KARAKETIDIS</span>
        </div>
      </footer>
    </div>
  );
}
