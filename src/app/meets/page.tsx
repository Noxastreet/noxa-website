import type { Metadata } from "next";

import { MeetsDirectoryPage } from "@/components/meets/MeetsDirectoryPage";

export const metadata: Metadata = {
  title: "NOXA Meets — Car & moto events across Greece",
  description: "Find public car meets, moto gatherings and automotive events across Greece with NOXA Meets.",
  alternates: {
    canonical: "https://noxastreetapp.com/meets",
    languages: {
      en: "https://noxastreetapp.com/meets",
      el: "https://noxastreetapp.com/el/meets",
    },
  },
};

export default function MeetsPage() {
  return <MeetsDirectoryPage locale="en" />;
}
