import type { Metadata } from "next";

import { OrganizerDirectory } from "@/components/organizers/OrganizerDirectory";
import { loadPublicOrganizers } from "@/components/organizers/organizer-data";

export const metadata: Metadata = { title: "NOXA Organizers — Ελλάδα", description: "Verified automotive event organizers στο NOXA.", alternates: { canonical: "https://noxastreetapp.com/el/organizers", languages: { en: "https://noxastreetapp.com/organizers", el: "https://noxastreetapp.com/el/organizers" } } };
export default async function OrganizersPage() { return <OrganizerDirectory locale="el" organizers={await loadPublicOrganizers()} />; }
