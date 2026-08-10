export const siteLocales = ["el", "en", "ru"] as const;

export type Locale = (typeof siteLocales)[number];

type Feature = {
  number: string;
  title: string;
  body: string;
  meta: string;
};

type Step = {
  number: string;
  title: string;
  body: string;
};

export type WaitlistCopy = {
  eyebrow: string;
  title: string;
  body: string;
  email: string;
  city: string;
  optional: string;
  emailPlaceholder: string;
  cityPlaceholder: string;
  consentBeforePrivacy: string;
  privacy: string;
  consentBetween: string;
  terms: string;
  consentAfterTerms: string;
  submit: string;
  submitting: string;
  joined: string;
  joining: string;
  alreadyJoined: string;
  success: string;
  note: string;
  errors: Record<string, string>;
};

export type SiteCopy = {
  meta: { title: string; description: string };
  languageSelector: string;
  navigationLabel: string;
  footerNavigationLabel: string;
  homeLabel: string;
  conceptPreviewLabel: string;
  capabilitiesLabel: string;
  nav: {
    product: string;
    how: string;
    community: string;
    business: string;
  };
  cta: string;
  hero: {
    eyebrow: string;
    lineOne: string;
    lineTwo: string;
    body: string;
    primary: string;
    secondary: string;
    status: string;
    tested: string;
  };
  map: {
    live: string;
    nearby: string;
    drivers: string;
    meets: string;
    tonight: string;
    meetName: string;
    location: string;
    going: string;
    route: string;
  };
  featureIntro: { eyebrow: string; title: string; body: string };
  features: Feature[];
  how: { eyebrow: string; title: string; steps: Step[] };
  community: {
    eyebrow: string;
    title: string;
    body: string;
    points: string[];
  };
  business: {
    eyebrow: string;
    title: string;
    body: string;
    points: string[];
    action: string;
    partnerLabel: string;
    location: string;
  };
  waitlist: WaitlistCopy;
  footer: {
    statement: string;
    product: string;
    privacy: string;
    terms: string;
    legalNote: string;
  };
};

export const defaultLocale: Locale = "el";

export const siteCopy: Record<Locale, SiteCopy> = {
  el: {
    meta: {
      title: "NOXA — Ο δρόμος γίνεται κοινωνικός",
      description:
        "Ανακάλυψε οδηγούς, car meets, crews, διαδρομές και automotive events γύρω σου με το NOXA.",
    },
    languageSelector: "Επιλογή γλώσσας",
    navigationLabel: "Κύρια πλοήγηση",
    footerNavigationLabel: "Πλοήγηση υποσέλιδου",
    homeLabel: "Αρχική σελίδα NOXA",
    conceptPreviewLabel: "Ενδεικτική προεπισκόπηση της εφαρμογής NOXA",
    capabilitiesLabel: "Δυνατότητες του NOXA",
    nav: {
      product: "Προϊόν",
      how: "Πώς λειτουργεί",
      community: "Κοινότητα",
      business: "Για επιχειρήσεις",
    },
    cta: "Early access",
    hero: {
      eyebrow: "Η κοινωνική πλατφόρμα για οδηγούς",
      lineOne: "Ο δρόμος",
      lineTwo: "γίνεται κοινωνικός.",
      body: "Ανακάλυψε οδηγούς, car meets, crews, διαδρομές και automotive events γύρω σου — σε έναν ζωντανό χάρτη.",
      primary: "Μπες στο early access",
      secondary: "Δες τι προσφέρει",
      status: "Android MVP",
      tested: "Βασικές ροές δοκιμασμένες",
    },
    map: {
      live: "ΘΕΣΣΑΛΟΝΙΚΗ · LIVE",
      nearby: "Κοντά σου τώρα",
      drivers: "οδηγοί",
      meets: "ενεργά meets",
      tonight: "Απόψε",
      meetName: "Toumba Night Meet",
      location: "Τούμπα · 2,4 km",
      going: "12 συμμετέχουν",
      route: "Διαδρομή",
    },
    featureIntro: {
      eyebrow: "Ένα automotive οικοσύστημα",
      title: "Όσα χρειάζεσαι για να βγεις στον δρόμο.",
      body: "Το NOXA ενώνει τις βασικές εμπειρίες του αυτοκινήτου χωρίς περιττό content noise. Κάθε λειτουργία οδηγεί σε πραγματική δραστηριότητα.",
    },
    features: [
      {
        number: "01",
        title: "Ζωντανός χάρτης",
        body: "Δες οδηγούς και δραστηριότητα γύρω σου με καθαρή, privacy-first παρουσία.",
        meta: "Drivers nearby",
      },
      {
        number: "02",
        title: "Meets & Events",
        body: "Βρες τι συμβαίνει σήμερα, ποιοι θα πάνε και πώς θα φτάσεις εκεί.",
        meta: "Real-world activity",
      },
      {
        number: "03",
        title: "Crews",
        body: "Δημιούργησε ή βρες την ομάδα σου και οργάνωσε την επόμενη έξοδο.",
        meta: "Local communities",
      },
      {
        number: "04",
        title: "Garage & ταυτότητα",
        body: "Δείξε το αυτοκίνητό σου και δημιούργησε ένα προφίλ που σε αντιπροσωπεύει.",
        meta: "Your automotive profile",
      },
      {
        number: "05",
        title: "Διαδρομές & Follow",
        body: "Άνοιξε μία διαδρομή και ακολούθησέ την μέσα από την εμπειρία του NOXA.",
        meta: "Built for the drive",
      },
    ],
    how: {
      eyebrow: "Απλό από την πρώτη διαδρομή",
      title: "Από το προφίλ στον δρόμο σε τρία βήματα.",
      steps: [
        {
          number: "01",
          title: "Φτιάξε το προφίλ σου",
          body: "Πρόσθεσε την πόλη, το αυτοκίνητο και ό,τι θέλεις να γνωρίζει η κοινότητα.",
        },
        {
          number: "02",
          title: "Ανακάλυψε τι είναι κοντά",
          body: "Ο χάρτης συγκεντρώνει οδηγούς, meets, events και διαδρομές σε μία εικόνα.",
        },
        {
          number: "03",
          title: "Συνδέσου και οδήγησε",
          body: "Μπες σε ένα meet, ακολούθησε μία διαδρομή ή βρες το crew σου.",
        },
      ],
    },
    community: {
      eyebrow: "Community, όχι content noise",
      title: "Λιγότερος θόρυβος. Περισσότερος δρόμος.",
      body: "Το NOXA σχεδιάζεται γύρω από το πώς οι οδηγοί γνωρίζονται, οργανώνονται και κινούνται μαζί — όχι γύρω από ατελείωτο scrolling.",
      points: [
        "Τοπική δραστηριότητα",
        "Πραγματικές συναντήσεις",
        "Crews με ταυτότητα",
      ],
    },
    business: {
      eyebrow: "NOXA for Business",
      title: "Η επιχείρησή σου εκεί που κοιτούν οι οδηγοί.",
      body: "Ένα στοχευμένο προφίλ για detailing studios, συνεργεία, καταστήματα, διοργανωτές και automotive partners.",
      points: [
        "Παρουσία στον χάρτη",
        "Verified business profile",
        "Ανακάλυψη από οδηγούς",
      ],
      action: "Ενδιαφέρομαι ως partner",
      partnerLabel: "VERIFIED PARTNER",
      location: "Θεσσαλονίκη · 1,8 km",
    },
    waitlist: {
      eyebrow: "Early access",
      title: "Μπες στους πρώτους οδηγούς του NOXA.",
      body: "Λάβε ενημέρωση όταν ανοίξει η επόμενη φάση δοκιμών και βοήθησέ μας να χτίσουμε την automotive κοινότητα της Ελλάδας.",
      email: "Email",
      city: "Πόλη",
      optional: "προαιρετικό",
      emailPlaceholder: "you@example.com",
      cityPlaceholder: "Θεσσαλονίκη",
      consentBeforePrivacy:
        "Συμφωνώ ότι το NOXA μπορεί να αποθηκεύσει το email και, προαιρετικά, την πόλη μου και να μου στέλνει ενημερώσεις early access όπως περιγράφεται στην ",
      privacy: "Πολιτική Απορρήτου",
      consentBetween: ". Έχω επίσης διαβάσει τους ",
      terms: "Όρους Χρήσης",
      consentAfterTerms:
        ". Μπορώ να ανακαλέσω τη συγκατάθεσή μου ανά πάσα στιγμή.",
      submit: "Μπες στο NOXA",
      submitting: "Γίνεται εγγραφή…",
      joined: "Έγινε εγγραφή",
      joining: "Σε προσθέτουμε στη λίστα early access του NOXA…",
      alreadyJoined: "Είσαι ήδη στη λίστα early access του NOXA.",
      success: "Η εγγραφή ολοκληρώθηκε. Θα επικοινωνήσουμε μαζί σου όταν ανοίξει το early access.",
      note: "Χωρίς spam. Μόνο ουσιαστικές ενημερώσεις προϊόντος και early access.",
      errors: {
        invalid_email: "Συμπλήρωσε μια έγκυρη διεύθυνση email.",
        consent_required: "Η συγκατάθεση είναι απαραίτητη για την εγγραφή.",
        invalid_submission_timing: "Έλεγξε τη φόρμα και δοκίμασε ξανά.",
        rate_limited: "Πολλές προσπάθειες. Δοκίμασε ξανά σε λίγα λεπτά.",
        service_unavailable: "Το early access δεν είναι προσωρινά διαθέσιμο.",
        submission_failed: "Δεν μπορέσαμε να αποθηκεύσουμε το αίτημά σου. Δοκίμασε ξανά.",
      },
    },
    footer: {
      statement: "From drivers, for drivers.",
      product: "Προϊόν",
      privacy: "Απόρρητο",
      terms: "Όροι",
      legalNote: "Νομικές πληροφορίες για τον ιστότοπο και τη λίστα early access του NOXA.",
    },
  },
  en: {
    meta: {
      title: "NOXA — The road becomes social",
      description:
        "Discover drivers, car meets, crews, routes and automotive events around you with NOXA.",
    },
    languageSelector: "Choose language",
    navigationLabel: "Primary navigation",
    footerNavigationLabel: "Footer navigation",
    homeLabel: "NOXA home",
    conceptPreviewLabel: "NOXA application concept preview",
    capabilitiesLabel: "NOXA capabilities",
    nav: {
      product: "Product",
      how: "How it works",
      community: "Community",
      business: "For business",
    },
    cta: "Early access",
    hero: {
      eyebrow: "The social platform for drivers",
      lineOne: "The road",
      lineTwo: "becomes social.",
      body: "Discover drivers, car meets, crews, routes and automotive events around you — on one live map.",
      primary: "Join early access",
      secondary: "Explore the product",
      status: "Android MVP",
      tested: "Core flows tested",
    },
    map: {
      live: "THESSALONIKI · LIVE",
      nearby: "Nearby now",
      drivers: "drivers",
      meets: "active meets",
      tonight: "Tonight",
      meetName: "Toumba Night Meet",
      location: "Toumba · 2.4 km",
      going: "12 going",
      route: "Route",
    },
    featureIntro: {
      eyebrow: "One automotive ecosystem",
      title: "Everything you need to get on the road.",
      body: "NOXA brings the core automotive experiences together without the content noise. Every feature leads toward real activity.",
    },
    features: [
      {
        number: "01",
        title: "Live map",
        body: "See drivers and activity around you with a focused, privacy-first presence.",
        meta: "Drivers nearby",
      },
      {
        number: "02",
        title: "Meets & Events",
        body: "Find what is happening today, who is joining and how to get there.",
        meta: "Real-world activity",
      },
      {
        number: "03",
        title: "Crews",
        body: "Create or discover your community and organise the next drive together.",
        meta: "Local communities",
      },
      {
        number: "04",
        title: "Garage & identity",
        body: "Show your car and build an automotive profile that represents you.",
        meta: "Your automotive profile",
      },
      {
        number: "05",
        title: "Routes & Follow",
        body: "Open a route and follow it inside the focused NOXA driving experience.",
        meta: "Built for the drive",
      },
    ],
    how: {
      eyebrow: "Simple from the first drive",
      title: "From profile to road in three steps.",
      steps: [
        {
          number: "01",
          title: "Build your profile",
          body: "Add your city, your vehicle and what you want the community to know.",
        },
        {
          number: "02",
          title: "Discover what is nearby",
          body: "The map brings drivers, meets, events and routes into one clear view.",
        },
        {
          number: "03",
          title: "Connect and drive",
          body: "Join a meet, follow a route or find the crew that fits you.",
        },
      ],
    },
    community: {
      eyebrow: "Community, not content noise",
      title: "Less noise. More road.",
      body: "NOXA is designed around how drivers meet, organise and move together — not around endless scrolling.",
      points: ["Local activity", "Real-world meets", "Crews with identity"],
    },
    business: {
      eyebrow: "NOXA for Business",
      title: "Put your business where drivers already look.",
      body: "A focused presence for detailing studios, garages, shops, organisers and automotive partners.",
      points: [
        "Presence on the map",
        "Verified business profile",
        "Driver discovery",
      ],
      action: "Become a partner",
      partnerLabel: "VERIFIED PARTNER",
      location: "Thessaloniki · 1.8 km",
    },
    waitlist: {
      eyebrow: "Early access",
      title: "Be among the first drivers on NOXA.",
      body: "Get notified when the next testing phase opens and help us shape Greece's automotive community.",
      email: "Email",
      city: "City",
      optional: "optional",
      emailPlaceholder: "you@example.com",
      cityPlaceholder: "Thessaloniki",
      consentBeforePrivacy:
        "I agree that NOXA may store my email and optional city and send early-access updates as described in the ",
      privacy: "Privacy Policy",
      consentBetween: ". I have also read the ",
      terms: "Terms of Use",
      consentAfterTerms: ". I can withdraw my consent at any time.",
      submit: "Join NOXA",
      submitting: "Joining…",
      joined: "Joined",
      joining: "Joining the NOXA early-access list…",
      alreadyJoined: "You are already on the NOXA early-access list.",
      success: "You’re in. We’ll contact you when NOXA early access opens.",
      note: "No noise. Only meaningful product updates and early-access information.",
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
      statement: "From drivers, for drivers.",
      product: "Product",
      privacy: "Privacy",
      terms: "Terms",
      legalNote: "Legal information for the NOXA website and early-access waitlist.",
    },
  },
  ru: {
    meta: {
      title: "NOXA — Дорога становится социальной",
      description:
        "Находите водителей, автомобильные встречи, команды, маршруты и события рядом с помощью NOXA.",
    },
    languageSelector: "Выбрать язык",
    navigationLabel: "Основная навигация",
    footerNavigationLabel: "Навигация в подвале",
    homeLabel: "Главная страница NOXA",
    conceptPreviewLabel: "Концептуальный экран приложения NOXA",
    capabilitiesLabel: "Возможности NOXA",
    nav: {
      product: "Продукт",
      how: "Как это работает",
      community: "Сообщество",
      business: "Для бизнеса",
    },
    cta: "Ранний доступ",
    hero: {
      eyebrow: "Социальная платформа для водителей",
      lineOne: "Дорога",
      lineTwo: "становится социальной.",
      body: "Находите водителей, автомобильные встречи, команды, маршруты и события рядом — на одной живой карте.",
      primary: "Получить ранний доступ",
      secondary: "Посмотреть возможности",
      status: "Android MVP",
      tested: "Основные сценарии проверены",
    },
    map: {
      live: "САЛОНИКИ · LIVE",
      nearby: "Сейчас рядом",
      drivers: "водителей",
      meets: "активных встреч",
      tonight: "Сегодня вечером",
      meetName: "Toumba Night Meet",
      location: "Тумба · 2,4 км",
      going: "12 участников",
      route: "Маршрут",
    },
    featureIntro: {
      eyebrow: "Единая автомобильная экосистема",
      title: "Всё необходимое, чтобы выйти на дорогу.",
      body: "NOXA объединяет главные автомобильные сценарии без информационного шума. Каждая функция ведёт к реальной активности.",
    },
    features: [
      {
        number: "01",
        title: "Живая карта",
        body: "Водители и активность рядом с понятным и бережным отношением к приватности.",
        meta: "Водители рядом",
      },
      {
        number: "02",
        title: "Встречи и события",
        body: "Узнайте, что проходит сегодня, кто собирается и как туда добраться.",
        meta: "Активность в реальном мире",
      },
      {
        number: "03",
        title: "Команды",
        body: "Создайте или найдите своё сообщество и организуйте следующую поездку.",
        meta: "Локальные сообщества",
      },
      {
        number: "04",
        title: "Гараж и профиль",
        body: "Покажите свой автомобиль и создайте узнаваемую автомобильную идентичность.",
        meta: "Ваш автомобильный профиль",
      },
      {
        number: "05",
        title: "Маршруты и Follow",
        body: "Откройте маршрут и следуйте по нему внутри NOXA.",
        meta: "Создано для поездки",
      },
    ],
    how: {
      eyebrow: "Просто с первой поездки",
      title: "От профиля до дороги — три шага.",
      steps: [
        {
          number: "01",
          title: "Создайте профиль",
          body: "Добавьте город, автомобиль и то, что хотите рассказать сообществу.",
        },
        {
          number: "02",
          title: "Посмотрите, что рядом",
          body: "Карта объединяет водителей, встречи, события и маршруты в одном месте.",
        },
        {
          number: "03",
          title: "Общайтесь и выезжайте",
          body: "Присоединитесь ко встрече, выберите маршрут или найдите свою команду.",
        },
      ],
    },
    community: {
      eyebrow: "Сообщество без информационного шума",
      title: "Меньше шума. Больше дороги.",
      body: "NOXA строится вокруг того, как водители знакомятся, организуются и выезжают вместе, а не вокруг бесконечной ленты.",
      points: [
        "Активность рядом",
        "Реальные встречи",
        "Команды с характером",
      ],
    },
    business: {
      eyebrow: "NOXA для бизнеса",
      title: "Ваш бизнес там, где его ищут водители.",
      body: "Профессиональный профиль для детейлинга, сервисов, магазинов, организаторов и автомобильных партнёров.",
      points: [
        "Присутствие на карте",
        "Подтверждённый профиль",
        "Новые клиенты среди водителей",
      ],
      action: "Стать партнёром",
      partnerLabel: "ПОДТВЕРЖДЁННЫЙ ПАРТНЁР",
      location: "Салоники · 1,8 км",
    },
    waitlist: {
      eyebrow: "Ранний доступ",
      title: "Станьте одним из первых водителей NOXA.",
      body: "Узнайте об открытии следующего этапа тестирования и помогите сформировать автомобильное сообщество Греции.",
      email: "Email",
      city: "Город",
      optional: "необязательно",
      emailPlaceholder: "you@example.com",
      cityPlaceholder: "Салоники",
      consentBeforePrivacy:
        "Я согласен, что NOXA может хранить мой email и указанный город и отправлять новости раннего доступа в соответствии с ",
      privacy: "Политикой конфиденциальности",
      consentBetween: ". Я также ознакомился с ",
      terms: "Условиями использования",
      consentAfterTerms: ". Согласие можно отозвать в любое время.",
      submit: "Присоединиться к NOXA",
      submitting: "Отправляем…",
      joined: "Вы в списке",
      joining: "Добавляем вас в список раннего доступа NOXA…",
      alreadyJoined: "Этот email уже есть в списке раннего доступа NOXA.",
      success: "Вы в списке. Мы свяжемся с вами, когда откроется ранний доступ NOXA.",
      note: "Без спама. Только важные новости продукта и раннего доступа.",
      errors: {
        invalid_email: "Введите корректный адрес электронной почты.",
        consent_required: "Для записи в список необходимо согласие.",
        invalid_submission_timing: "Проверьте форму и попробуйте ещё раз.",
        rate_limited: "Слишком много попыток. Повторите через несколько минут.",
        service_unavailable: "Ранний доступ временно недоступен.",
        submission_failed: "Не удалось сохранить запрос. Попробуйте ещё раз.",
      },
    },
    footer: {
      statement: "From drivers, for drivers.",
      product: "Продукт",
      privacy: "Конфиденциальность",
      terms: "Условия",
      legalNote: "Юридическая информация о сайте NOXA и списке раннего доступа.",
    },
  },
};

export function isLocale(value: string | undefined | null): value is Locale {
  return siteLocales.includes(value as Locale);
}

export function localeFromAcceptLanguage(value: string | null): Locale {
  if (!value) return defaultLocale;

  const requested = value
    .split(",")
    .map((part) => part.trim().split(";")[0]?.toLowerCase())
    .filter(Boolean);

  for (const language of requested) {
    if (language?.startsWith("el")) return "el";
    if (language?.startsWith("ru")) return "ru";
    if (language?.startsWith("en")) return "en";
  }

  return defaultLocale;
}
