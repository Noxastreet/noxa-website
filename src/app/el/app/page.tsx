import type { Metadata } from "next";

import { AppMarketingPage } from "@/components/marketing/AppMarketingPage";

const DESCRIPTION =
  "Γνώρισε το NOXA mobile app για automotive map, crews, live drives, profiles, garage και events στην Ελλάδα.";

export const metadata: Metadata = {
  title: "App — Η πλήρης εμπειρία NOXA",
  description: DESCRIPTION,
  alternates: {
    canonical: "https://noxastreetapp.com/el/app",
    languages: {
      en: "https://noxastreetapp.com/app",
      el: "https://noxastreetapp.com/el/app",
    },
  },
  openGraph: {
    url: "https://noxastreetapp.com/el/app",
    locale: "el_GR",
    title: "NOXA App — Φτιαγμένο για τον δρόμο",
    description: DESCRIPTION,
    images: ["/brand/noxa-og-preview.jpg"],
  },
};

export default function GreekAppPage() {
  return <AppMarketingPage locale="el" />;
}
