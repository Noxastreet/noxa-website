import type { Metadata } from "next";

import { OrganizerDashboardP2 } from "@/components/organizers/OrganizerDashboardP2";
import { OrganizerInsightsShortcut } from "@/components/organizers/OrganizerInsightsShortcut";

export const metadata: Metadata = {
  title: "Organizer Dashboard — NOXA",
  description: "Manage approved NOXA organizer events.",
  robots: { index: false, follow: false },
  alternates: {
    canonical: "https://noxastreetapp.com/organizer",
    languages: {
      en: "https://noxastreetapp.com/organizer",
      el: "https://noxastreetapp.com/el/organizer",
    },
  },
};

export default function OrganizerPage() {
  return <><OrganizerDashboardP2 locale="en" /><OrganizerInsightsShortcut locale="en" /></>;
}
