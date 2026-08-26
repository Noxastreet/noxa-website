export type Locale = "en" | "el";

export type NoxaPhoneMode = "discover" | "meet" | "crew" | "drive";

export type LandingCopy = {
  skipToContent: string;
  language: {
    label: string;
    english: string;
    greek: string;
  };
  navigation: {
    homeLabel: string;
    primaryLabel: string;
    mobileLabel: string;
    openMenu: string;
    closeMenu: string;
    menuTitle: string;
    join: string;
    items: ReadonlyArray<readonly [string, string]>;
  };
  hero: {
    eyebrow: string;
    titleFirst: string;
    titleSecond: string;
    body: string;
    join: string;
    explore: string;
    builtAround: string;
    pillars: string;
    scroll: string;
    signals: ReadonlyArray<readonly [string, string]>;
  };
  phone: {
    previewAriaPrefix: string;
    searchCompact: string;
    search: string;
    liveOnMap: string;
    previews: Record<
      NoxaPhoneMode,
      { label: string; title: string; meta: string; action: string }
    >;
  };
  product: {
    eyebrow: string;
    tablistLabel: string;
    liveMap: string;
    online: string;
    chapters: ReadonlyArray<
      readonly [string, string, string, string, NoxaPhoneMode]
    >;
  };
  community: {
    eyebrow: string;
    title: string;
    body: string;
    detail: string;
    signals: ReadonlyArray<readonly [string, string]>;
  };
  business: {
    eyebrow: string;
    title: string;
    body: string;
    features: ReadonlyArray<readonly [string, string]>;
    profile: string;
    name: string;
    status: string;
    mapStatus: string;
    distance: string;
    cta: string;
  };
  waitlist: {
    eyebrow: string;
    title: string;
    body: string;
    note: string;
    email: string;
    city: string;
    optional: string;
    cityPlaceholder: string;
    website: string;
    consentBeforePrivacy: string;
    privacy: string;
    consentBetweenLinks: string;
    terms: string;
    consentAfterTerms: string;
    joining: string;
    joined: string;
    join: string;
    reviewFields: string;
    alreadyJoined: string;
    success: string;
    offline: string;
    errors: Record<string, string>;
  };
  footer: {
    tagline: string;
    product: string;
    community: string;
    business: string;
    earlyAccess: string;
  };
  legalFooter: {
    summary: string;
    privacy: string;
    terms: string;
  };
};

export const landingCopy: Record<Locale, LandingCopy> = {
  en: {
    skipToContent: "Skip to content",
    language: {
      label: "Language",
      english: "English",
      greek: "Greek",
    },
    navigation: {
      homeLabel: "NOXA home",
      primaryLabel: "Primary navigation",
      mobileLabel: "Mobile navigation",
      openMenu: "Open navigation menu",
      closeMenu: "Close navigation menu",
      menuTitle: "Navigation",
      join: "Join NOXA",
      items: [
        ["Product", "#product"],
        ["Community", "#community"],
        ["For Business", "#business"],
      ],
    },
    hero: {
      eyebrow: "A social platform for drivers",
      titleFirst: "The road",
      titleSecond: "becomes social.",
      body: "Discover drivers, meets, crews and automotive events around you — on one live map.",
      join: "Join the waitlist",
      explore: "Explore NOXA",
      builtAround: "Built around real roads",
      pillars: "Drivers · Meets · Crews · Routes",
      scroll: "Scroll to explore",
      signals: [
        ["Nearby now", "18 drivers"],
        ["Tonight", "6 active meets"],
        ["Live route", "12.6 km"],
      ],
    },
    phone: {
      previewAriaPrefix: "NOXA mobile app preview showing",
      searchCompact: "Search the live map",
      search: "Search drivers, meets or places",
      liveOnMap: "Live on the map",
      previews: {
        discover: {
          label: "Nearby",
          title: "Night Run Thessaloniki",
          meta: "2.4 km · 18 drivers",
          action: "Open meet",
        },
        meet: {
          label: "Car meet",
          title: "Harbour Night Session",
          meta: "Tonight · 21:30 · 34 joined",
          action: "Join event",
        },
        crew: {
          label: "Crew",
          title: "Northern Drivers",
          meta: "128 members · Thessaloniki",
          action: "View crew",
        },
        drive: {
          label: "Live drive",
          title: "Following the coastal route",
          meta: "18 min · 12.6 km remaining",
          action: "Follow route",
        },
      },
    },
    product: {
      eyebrow: "One automotive world",
      tablistLabel: "NOXA product chapters",
      liveMap: "NOXA live map",
      online: "Thessaloniki · online",
      chapters: [
        ["01", "Discover", "See what moves around you.", "Drivers, meets, events and automotive places appear on one focused live map.", "discover"],
        ["02", "Meet", "Turn activity into a real connection.", "Open a meet, see who is joining and start the route without leaving NOXA.", "meet"],
        ["03", "Belong", "Find the crew that feels like yours.", "Build local communities around shared cars, roads and culture.", "crew"],
        ["04", "Drive", "From discovery to the road.", "Plan the route, enter follow mode and move together in real time.", "drive"],
      ],
    },
    community: {
      eyebrow: "Community, not content noise",
      title: "Not another social network.",
      body: "A place built around the way drivers actually discover, meet and move together.",
      detail: "NOXA keeps the interaction close to the road: less content noise, more local activity, real routes and communities that exist beyond the screen.",
      signals: [
        ["Drivers", "Nearby"],
        ["Meets", "Tonight"],
        ["Crews", "Together"],
      ],
    },
    business: {
      eyebrow: "For automotive business",
      title: "Put your business where drivers already look.",
      body: "A focused presence for detailing studios, garages, shops, partners and event organisers — directly on the automotive map.",
      features: [
        ["01", "Map presence"],
        ["02", "Verified profile"],
        ["03", "Driver discovery"],
      ],
      profile: "Business profile",
      name: "Northline Detailing",
      status: "Verified · 1.8 km · Open today",
      mapStatus: "Live on NOXA map",
      distance: "1.8 km",
      cta: "Become a NOXA partner",
    },
    waitlist: {
      eyebrow: "Early access",
      title: "Your automotive world. One map.",
      body: "Join the first group of drivers and partners shaping NOXA before public release.",
      note: "No noise. Only meaningful product updates and early-access information.",
      email: "Email",
      city: "City",
      optional: "optional",
      cityPlaceholder: "Thessaloniki",
      website: "Website",
      consentBeforePrivacy: "I agree that NOXA may store my email and optional city and send early-access updates as described in the ",
      privacy: "Privacy Policy",
      consentBetweenLinks: ". I have also read the ",
      terms: "Terms of Use",
      consentAfterTerms: ". I can withdraw my consent at any time.",
      joining: "Joining…",
      joined: "Joined",
      join: "Join NOXA",
      reviewFields: "Review the highlighted fields and try again.",
      alreadyJoined: "You are already on the NOXA early-access list.",
      success: "You’re in. We’ll contact you when NOXA early access opens.",
      offline: "You appear to be offline. Check your connection and try again.",
      errors: {
        invalid_email: "Enter a valid email address.",
        consent_required: "Consent is required to join the early-access list.",
        invalid_submission_timing: "Please review the form and try again.",
        rate_limited: "Too many attempts. Please try again in a few minutes.",
        service_unavailable: "Early access is temporarily unavailable.",
        submission_failed: "We could not save your request. Please try again.",
      },
    },
    footer: {
      tagline: "From drivers, for drivers.",
      product: "Product",
      community: "Community",
      business: "For Business",
      earlyAccess: "Early access",
    },
    legalFooter: {
      summary: "Legal information for the NOXA website and early-access waitlist.",
      privacy: "Privacy Policy",
      terms: "Terms of Use",
    },
  },
  el: {
    skipToContent: "Μετάβαση στο περιεχόμενο",
    language: {
      label: "Γλώσσα",
      english: "Αγγλικά",
      greek: "Ελληνικά",
    },
    navigation: {
      homeLabel: "Αρχική σελίδα NOXA",
      primaryLabel: "Κύρια πλοήγηση",
      mobileLabel: "Πλοήγηση για κινητά",
      openMenu: "Άνοιγμα μενού πλοήγησης",
      closeMenu: "Κλείσιμο μενού πλοήγησης",
      menuTitle: "Πλοήγηση",
      join: "Μπες στο NOXA",
      items: [
        ["Προϊόν", "#product"],
        ["Κοινότητα", "#community"],
        ["Για επιχειρήσεις", "#business"],
      ],
    },
    hero: {
      eyebrow: "Μια κοινωνική πλατφόρμα για οδηγούς",
      titleFirst: "Ο δρόμος",
      titleSecond: "γίνεται κοινωνικός.",
      body: "Ανακάλυψε οδηγούς, συναντήσεις, ομάδες και αυτοκινητιστικές εκδηλώσεις κοντά σου — σε έναν ζωντανό χάρτη.",
      join: "Μπες στη λίστα αναμονής",
      explore: "Ανακάλυψε το NOXA",
      builtAround: "Σχεδιασμένο για πραγματικούς δρόμους",
      pillars: "Οδηγοί · Συναντήσεις · Ομάδες · Διαδρομές",
      scroll: "Κύλησε για να εξερευνήσεις",
      signals: [
        ["Κοντά σου τώρα", "18 οδηγοί"],
        ["Απόψε", "6 ενεργές συναντήσεις"],
        ["Ζωντανή διαδρομή", "12,6 χλμ."],
      ],
    },
    phone: {
      previewAriaPrefix: "Προεπισκόπηση της εφαρμογής NOXA με",
      searchCompact: "Αναζήτηση στον ζωντανό χάρτη",
      search: "Αναζήτησε οδηγούς, συναντήσεις ή μέρη",
      liveOnMap: "Ζωντανά στον χάρτη",
      previews: {
        discover: {
          label: "Κοντά σου",
          title: "Night Run Thessaloniki",
          meta: "2,4 χλμ. · 18 οδηγοί",
          action: "Άνοιξε",
        },
        meet: {
          label: "Συνάντηση αυτοκινήτων",
          title: "Harbour Night Session",
          meta: "Απόψε · 21:30 · 34 συμμετοχές",
          action: "Συμμετοχή",
        },
        crew: {
          label: "Ομάδα",
          title: "Οδηγοί Βορρά",
          meta: "128 μέλη · Θεσσαλονίκη",
          action: "Δες την ομάδα",
        },
        drive: {
          label: "Ζωντανή οδήγηση",
          title: "Ακολουθείς την παραλιακή διαδρομή",
          meta: "18 λεπτά · απομένουν 12,6 χλμ.",
          action: "Ακολούθησε",
        },
      },
    },
    product: {
      eyebrow: "Ένας κόσμος για το αυτοκίνητο",
      tablistLabel: "Ενότητες προϊόντος NOXA",
      liveMap: "Ζωντανός χάρτης NOXA",
      online: "Θεσσαλονίκη · online",
      chapters: [
        ["01", "Ανακάλυψε", "Δες τι κινείται γύρω σου.", "Οδηγοί, συναντήσεις, εκδηλώσεις και χώροι για το αυτοκίνητο εμφανίζονται σε έναν εστιασμένο ζωντανό χάρτη.", "discover"],
        ["02", "Συναντήσου", "Μετέτρεψε τη δραστηριότητα σε πραγματική σύνδεση.", "Άνοιξε μια συνάντηση, δες ποιοι συμμετέχουν και ξεκίνα τη διαδρομή χωρίς να φύγεις από το NOXA.", "meet"],
        ["03", "Ανήκεις", "Βρες την ομάδα που σου ταιριάζει.", "Δημιούργησε τοπικές κοινότητες γύρω από κοινά αυτοκίνητα, δρόμους και κουλτούρα.", "crew"],
        ["04", "Οδήγησε", "Από την ανακάλυψη στον δρόμο.", "Σχεδίασε τη διαδρομή, μπες σε λειτουργία ακολούθησης και κινήσου μαζί με άλλους σε πραγματικό χρόνο.", "drive"],
      ],
    },
    community: {
      eyebrow: "Κοινότητα, όχι θόρυβος περιεχομένου",
      title: "Όχι ακόμη ένα κοινωνικό δίκτυο.",
      body: "Ένας χώρος σχεδιασμένος γύρω από τον τρόπο που οι οδηγοί ανακαλύπτουν, συναντιούνται και κινούνται μαζί.",
      detail: "Το NOXA κρατά την αλληλεπίδραση κοντά στον δρόμο: λιγότερος θόρυβος περιεχομένου, περισσότερη τοπική δραστηριότητα, πραγματικές διαδρομές και κοινότητες που υπάρχουν πέρα από την οθόνη.",
      signals: [
        ["Οδηγοί", "Κοντά σου"],
        ["Συναντήσεις", "Απόψε"],
        ["Ομάδες", "Μαζί"],
      ],
    },
    business: {
      eyebrow: "Για επιχειρήσεις του κλάδου αυτοκινήτου",
      title: "Βάλε την επιχείρησή σου εκεί που ήδη κοιτούν οι οδηγοί.",
      body: "Στοχευμένη παρουσία για στούντιο περιποίησης, συνεργεία, καταστήματα, συνεργάτες και διοργανωτές εκδηλώσεων — απευθείας στον αυτοκινητιστικό χάρτη.",
      features: [
        ["01", "Παρουσία στον χάρτη"],
        ["02", "Επαληθευμένο προφίλ"],
        ["03", "Ανακάλυψη από οδηγούς"],
      ],
      profile: "Επαγγελματικό προφίλ",
      name: "Northline Detailing",
      status: "Επαληθευμένο · 1,8 χλμ. · Ανοιχτά σήμερα",
      mapStatus: "Ζωντανά στον χάρτη NOXA",
      distance: "1,8 χλμ.",
      cta: "Γίνε συνεργάτης του NOXA",
    },
    waitlist: {
      eyebrow: "Πρώιμη πρόσβαση",
      title: "Ο κόσμος του αυτοκινήτου σου. Ένας χάρτης.",
      body: "Γίνε μέλος της πρώτης ομάδας οδηγών και συνεργατών που διαμορφώνουν το NOXA πριν από τη δημόσια κυκλοφορία.",
      note: "Χωρίς θόρυβο. Μόνο ουσιαστικές ενημερώσεις προϊόντος και πληροφορίες πρώιμης πρόσβασης.",
      email: "Email",
      city: "Πόλη",
      optional: "προαιρετικά",
      cityPlaceholder: "Θεσσαλονίκη",
      website: "Ιστότοπος",
      consentBeforePrivacy: "Συμφωνώ ότι το NOXA μπορεί να αποθηκεύσει το email και την προαιρετική πόλη μου και να μου στέλνει ενημερώσεις πρώιμης πρόσβασης, όπως περιγράφεται στην ",
      privacy: "Πολιτική Απορρήτου (στα αγγλικά)",
      consentBetweenLinks: ". Έχω επίσης διαβάσει τους ",
      terms: "Όρους Χρήσης (στα αγγλικά)",
      consentAfterTerms: ". Μπορώ να ανακαλέσω τη συγκατάθεσή μου ανά πάσα στιγμή.",
      joining: "Υποβολή…",
      joined: "Ολοκληρώθηκε",
      join: "Μπες στο NOXA",
      reviewFields: "Έλεγξε τα επισημασμένα πεδία και δοκίμασε ξανά.",
      alreadyJoined: "Βρίσκεσαι ήδη στη λίστα πρώιμης πρόσβασης του NOXA.",
      success: "Είσαι στη λίστα. Θα επικοινωνήσουμε μαζί σου όταν ανοίξει η πρώιμη πρόσβαση στο NOXA.",
      offline: "Φαίνεται ότι είσαι εκτός σύνδεσης. Έλεγξε τη σύνδεσή σου και δοκίμασε ξανά.",
      errors: {
        invalid_email: "Εισήγαγε μια έγκυρη διεύθυνση email.",
        consent_required: "Απαιτείται συγκατάθεση για τη λίστα πρώιμης πρόσβασης.",
        invalid_submission_timing: "Έλεγξε τη φόρμα και δοκίμασε ξανά.",
        rate_limited: "Πάρα πολλές προσπάθειες. Δοκίμασε ξανά σε λίγα λεπτά.",
        service_unavailable: "Η πρώιμη πρόσβαση δεν είναι διαθέσιμη αυτή τη στιγμή.",
        submission_failed: "Δεν μπορέσαμε να αποθηκεύσουμε το αίτημά σου. Δοκίμασε ξανά.",
      },
    },
    footer: {
      tagline: "Από οδηγούς, για οδηγούς.",
      product: "Προϊόν",
      community: "Κοινότητα",
      business: "Για επιχειρήσεις",
      earlyAccess: "Πρώιμη πρόσβαση",
    },
    legalFooter: {
      summary: "Νομικές πληροφορίες για τον ιστότοπο και τη λίστα πρώιμης πρόσβασης του NOXA.",
      privacy: "Πολιτική Απορρήτου (Αγγλικά)",
      terms: "Όροι Χρήσης (Αγγλικά)",
    },
  },
};
