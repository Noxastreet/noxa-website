import type { Metadata } from "next";

import { LandingPage } from "@/components/LandingPage";

export const metadata: Metadata = {
  title: "NOXA — Car & Moto Events στην Ελλάδα",
  description:
    "Ανακάλυψε car και moto events σε όλη την Ελλάδα και εξερεύνησέ τα στο NOXA automotive map.",
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
    title: "NOXA — Car & Moto Events στην Ελλάδα",
    description:
      "Ανακάλυψε car και moto events σε όλη την Ελλάδα και εξερεύνησέ τα στο NOXA automotive map.",
  },
};

export default function GreekHome() {
  return <LandingPage locale="el" />;
}
