import type { Metadata } from "next";

import { OrganizersMarketingPage } from "@/components/marketing/OrganizersMarketingPage";

const DESCRIPTION =
  "Submit car, moto and motorsport events to NOXA for review and public discovery across Greece.";

export const metadata: Metadata = {
  title: "Organizers — Add Your Event",
  description: DESCRIPTION,
  alternates: {
    canonical: "https://noxastreetapp.com/organizers",
    languages: {
      en: "https://noxastreetapp.com/organizers",
      el: "https://noxastreetapp.com/el/organizers",
    },
  },
  openGraph: {
    type: "website",
    url: "https://noxastreetapp.com/organizers",
    siteName: "NOXA",
    title: "NOXA for Organizers",
    description: DESCRIPTION,
    images: ["/brand/noxa-og-preview.jpg"],
  },
};

export default function OrganizersPage() {
  return <OrganizersMarketingPage locale="en" />;
}
