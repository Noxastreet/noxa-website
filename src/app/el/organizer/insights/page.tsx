import type { Metadata } from "next";

import { OrganizerInsights } from "@/components/organizers/OrganizerInsights";

export const metadata: Metadata = {
  title: "Event Insights — NOXA Organizer",
  description: "Private event performance insights for verified NOXA organizers.",
  robots: { index: false, follow: false },
};

export default function OrganizerInsightsPage() {
  return <OrganizerInsights locale="el" />;
}
