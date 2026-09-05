import type { Metadata } from "next";

import { MeetsArchivePage } from "@/components/meets/MeetsArchivePage";

export const metadata: Metadata = {
  title: "Past events — NOXA Meets",
  description: "Browse the archive of past car meets, moto gatherings and motorsport events on NOXA.",
  alternates: {
    canonical: "https://noxastreetapp.com/meets/archive",
    languages: {
      en: "https://noxastreetapp.com/meets/archive",
      el: "https://noxastreetapp.com/el/meets/archive",
    },
  },
};

export default function MeetsArchiveRoute() {
  return <MeetsArchivePage locale="en" />;
}
