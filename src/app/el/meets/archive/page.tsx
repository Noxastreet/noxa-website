import type { Metadata } from "next";

import { MeetsArchivePage } from "@/components/meets/MeetsArchivePage";

export const metadata: Metadata = {
  title: "Προηγούμενα events — NOXA Meets",
  description: "Δες το αρχείο προηγούμενων car meets, moto gatherings και motorsport events στο NOXA.",
  alternates: {
    canonical: "https://noxastreetapp.com/el/meets/archive",
    languages: {
      en: "https://noxastreetapp.com/meets/archive",
      el: "https://noxastreetapp.com/el/meets/archive",
    },
  },
};

export default function GreekMeetsArchiveRoute() {
  return <MeetsArchivePage locale="el" />;
}
