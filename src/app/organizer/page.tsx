import type { Metadata } from "next";

import { OrganizerDashboard } from "@/components/organizers/OrganizerDashboard";

export const metadata: Metadata = {
  title: "Organizer Dashboard — NOXA",
  description: "Manage verified NOXA organizer events.",
  robots: { index: false, follow: false },
};

export default function OrganizerPage() {
  return <OrganizerDashboard locale="en" />;
}
