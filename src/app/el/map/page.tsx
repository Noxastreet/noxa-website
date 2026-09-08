import type { Metadata } from "next";

import { AutomotiveMap } from "@/components/map/AutomotiveMap";

export const metadata: Metadata = {
  title: "NOXA Map — Automotive Greece",
  description: "Ανακάλυψε επαληθευμένα automotive events, πίστες, διαδρομές και μέρη σε όλη την Ελλάδα.",
  alternates: {
    canonical: "https://noxastreetapp.com/el/map",
    languages: {
      en: "https://noxastreetapp.com/map",
      el: "https://noxastreetapp.com/el/map",
    },
  },
};

export default function GreekMapPage() {
  return <AutomotiveMap locale="el" />;
}
