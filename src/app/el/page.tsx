import type { Metadata } from "next";

import { LandingPage } from "@/components/LandingPage";

const DESCRIPTION =
  "Ανακάλυψε car και moto events στην Ελλάδα και γνώρισε το NOXA app για map, crews, live drives, profiles και garage.";

export const metadata: Metadata = {
  title: "NOXA — Automotive Platform για την Ελλάδα",
  description: DESCRIPTION,
  alternates: {
    canonical: "/el",
    languages: {
      en: "/",
      el: "/el",
    },
  },
  openGraph: {
    url: "https://noxastreetapp.com/el",
    locale: "el_GR",
    title: "NOXA — Automotive Platform για την Ελλάδα",
    description: DESCRIPTION,
  },
};

export default function GreekHome() {
  return <LandingPage locale="el" />;
}
