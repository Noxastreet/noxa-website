import type { Metadata } from "next";

import { OrganizerDashboardFlow } from "@/components/organizers/OrganizerDashboardFlow";

export const metadata: Metadata = {
  title: "Organizer Dashboard — NOXA",
  description: "Manage verified NOXA organizer events.",
  robots: { index: false, follow: false },
};

export default function OrganizerPage() {
  return <OrganizerDashboardFlow locale="en" />;
}
