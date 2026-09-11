import type { Metadata } from "next";

import { RadarSubmitForm } from "@/components/radar/RadarSubmitForm";

export const metadata: Metadata = {
  title: "Add an Event — NOXA Meets",
  description: "Crews and NOXA Business/Partners can submit public car, moto or motorsport events in Greece for verification and publication.",
  alternates: {
    canonical: "https://noxastreetapp.com/meets/submit",
    languages: {
      en: "https://noxastreetapp.com/meets/submit",
      el: "https://noxastreetapp.com/el/meets/submit",
    },
  },
};

export default function MeetsSubmitPage() {
  return <RadarSubmitForm locale="en" />;
}
