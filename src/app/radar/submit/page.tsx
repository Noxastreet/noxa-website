import type { Metadata } from "next";

import { RadarSubmitForm } from "@/components/radar/RadarSubmitForm";

export const metadata: Metadata = {
  title: "Submit an event — NOXA Radar",
  description: "Submit a public automotive or motorcycle event for review by NOXA Radar.",
  alternates: {
    canonical: "https://noxastreetapp.com/radar/submit",
  },
};

export default function RadarSubmitPage() {
  return <RadarSubmitForm />;
}
