import type { Metadata } from "next";

import { OrganizerDashboardFlow } from "@/components/organizers/OrganizerDashboardFlow";
import { OrganizerInsightsShortcut } from "@/components/organizers/OrganizerInsightsShortcut";

export const metadata: Metadata = {
  title: "Organizer Dashboard — NOXA",
  description: "Διαχείριση verified NOXA organizer events.",
  robots: { index: false, follow: false },
};

export default function OrganizerPageEl() {
  return (
    <>
      <OrganizerDashboardFlow locale="el" />
      <OrganizerInsightsShortcut locale="el" />
    </>
  );
}
