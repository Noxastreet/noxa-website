import type { Metadata } from "next";

import { AppMarketingPage } from "@/components/marketing/AppMarketingPage";

const DESCRIPTION =
  "Meet the NOXA mobile app for automotive maps, crews, live drives, profiles, garages and events across Greece.";

export const metadata: Metadata = {
  title: "App — The Full NOXA Experience",
  description: DESCRIPTION,
  alternates: {
    canonical: "https://noxastreetapp.com/app",
    languages: {
      en: "https://noxastreetapp.com/app",
      el: "https://noxastreetapp.com/el/app",
    },
  },
  openGraph: {
    type: "website",
    url: "https://noxastreetapp.com/app",
    siteName: "NOXA",
    title: "NOXA App — Built for the Road",
    description: DESCRIPTION,
    images: ["/brand/noxa-og-preview.jpg"],
  },
};

export default function AppPage() {
  return <AppMarketingPage locale="en" />;
}
