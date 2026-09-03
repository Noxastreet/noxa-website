import type { Metadata } from "next";

import { RadarSubmitForm } from "@/components/radar/RadarSubmitForm";

export const metadata: Metadata = {
  title: "Submit an event for review — NOXA Meets",
  description: "Suggest a public automotive or motorcycle event for NOXA review. Public submissions never publish directly.",
  alternates: {
    canonical: "https://noxastreetapp.com/radar/submit",
  },
};

export default function RadarSubmitPage() {
  return <RadarSubmitForm />;
}
