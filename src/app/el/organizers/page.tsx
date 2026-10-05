import type { Metadata } from "next";

import { OrganizersMarketingPage } from "@/components/marketing/OrganizersMarketingPage";

const DESCRIPTION =
  "Στείλε car, moto και motorsport events στο NOXA για έλεγχο και δημόσια ανακάλυψη στην Ελλάδα.";

export const metadata: Metadata = {
  title: "Organizers — Πρόσθεσε το Event σου",
  description: DESCRIPTION,
  alternates: {
    canonical: "https://noxastreetapp.com/el/organizers",
    languages: {
      en: "https://noxastreetapp.com/organizers",
      el: "https://noxastreetapp.com/el/organizers",
    },
  },
  openGraph: {
    url: "https://noxastreetapp.com/el/organizers",
    locale: "el_GR",
    title: "NOXA για Διοργανωτές",
    description: DESCRIPTION,
    images: ["/brand/noxa-og-preview.jpg"],
  },
};

export default function GreekOrganizersPage() {
  return <OrganizersMarketingPage locale="el" />;
}
