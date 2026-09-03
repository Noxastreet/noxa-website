import type { Metadata } from "next";

import { OrganizerAdminConsole } from "@/components/organizers/OrganizerAdminConsole";

export const metadata: Metadata = {
  title: "NOXA Organizers Admin",
  description: "Private NOXA organizer access and invitation console.",
  robots: { index: false, follow: false },
};

export default function OrganizerAdminPage() {
  return <OrganizerAdminConsole />;
}
