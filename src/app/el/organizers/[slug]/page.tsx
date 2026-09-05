import type { Metadata } from "next";

import { PublicOrganizerPage } from "@/components/organizers/PublicOrganizerPage";
import { loadPublicOrganizer } from "@/components/organizers/public-organizer-data";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const result = await loadPublicOrganizer(slug);
  const title = result ? `${result.organizer.name} — Organizer στο NOXA` : "Organizer — NOXA";
  const description = result ? `Επόμενα και προηγούμενα automotive events από ${result.organizer.name} στο NOXA Meets.` : "Automotive organizer profile στο NOXA.";
  return { title, description, alternates: { canonical: `https://noxastreetapp.com/el/organizers/${slug}`, languages: { en: `https://noxastreetapp.com/organizers/${slug}`, el: `https://noxastreetapp.com/el/organizers/${slug}` } } };
}

export default async function GreekOrganizerPublicRoute({ params }: Props) {
  const { slug } = await params;
  return <PublicOrganizerPage slug={slug} locale="el" />;
}
