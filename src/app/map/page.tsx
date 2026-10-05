import type { Metadata } from "next";

import { AutomotiveMap } from "@/components/map/AutomotiveMap";

const TITLE = "NOXA Map — Automotive Greece";
const DESCRIPTION =
  "Explore verified automotive events, tracks, routes and places across Greece on the NOXA Map.";

export const metadata: Metadata = {
  title: "Map — Automotive Greece",
  description: DESCRIPTION,
  alternates: {
    canonical: "https://noxastreetapp.com/map",
    languages: {
      en: "https://noxastreetapp.com/map",
      el: "https://noxastreetapp.com/el/map",
    },
  },
  openGraph: {
    type: "website",
    url: "https://noxastreetapp.com/map",
    siteName: "NOXA",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/brand/noxa-og-preview.jpg"],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/brand/noxa-og-preview.jpg"],
  },
};

export default function MapPage() {
  return (
    <>
      <h1 className="sr-only">Explore automotive events, routes and places across Greece</h1>
      <AutomotiveMap locale="en" />
    </>
  );
}
