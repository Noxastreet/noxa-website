import type { Metadata } from "next";

import { MeetsDirectoryPage } from "@/components/meets/MeetsDirectoryPage";

export const metadata: Metadata = {
  title: "NOXA Meets — Car & moto events στην Ελλάδα",
  description: "Βρες δημόσια car meets, moto gatherings και automotive events σε όλη την Ελλάδα με το NOXA Meets.",
  alternates: {
    canonical: "https://noxastreetapp.com/el/meets",
    languages: {
      en: "https://noxastreetapp.com/meets",
      el: "https://noxastreetapp.com/el/meets",
    },
  },
};

export default function GreekMeetsPage() {
  return <MeetsDirectoryPage locale="el" />;
}
