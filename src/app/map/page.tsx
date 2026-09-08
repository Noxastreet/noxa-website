import type { Metadata } from "next";

import { AutomotiveMap } from "@/components/map/AutomotiveMap";

export const metadata: Metadata = {
  title: "NOXA Map — Automotive Greece",
  description: "Explore verified automotive events, tracks, routes and places across Greece on the NOXA Automotive Map.",
  alternates: {
    canonical: "https://noxastreetapp.com/map",
    languages: {
      en: "https://noxastreetapp.com/map",
      el: "https://noxastreetapp.com/el/map",
    },
  },
};

export default function MapPage() {
  return <AutomotiveMap locale="en" />;
}
