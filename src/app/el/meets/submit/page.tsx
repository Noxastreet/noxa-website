import type { Metadata } from "next";

import { DocumentLanguage } from "@/components/i18n/DocumentLanguage";
import { RadarSubmitForm } from "@/components/radar/RadarSubmitForm";

export const metadata: Metadata = {
  title: "Πρόσθεσε Event — NOXA Meets",
  description: "Crews και NOXA Business/Partners μπορούν να υποβάλουν δημόσια car, moto ή motorsport events στην Ελλάδα για verification και δημοσίευση.",
  alternates: {
    canonical: "https://noxastreetapp.com/el/meets/submit",
    languages: {
      en: "https://noxastreetapp.com/meets/submit",
      el: "https://noxastreetapp.com/el/meets/submit",
    },
  },
};

export default function MeetsSubmitElPage() {
  return <><DocumentLanguage locale="el" /><RadarSubmitForm locale="el" /></>;
}
