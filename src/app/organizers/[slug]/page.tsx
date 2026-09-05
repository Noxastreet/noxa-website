import type { Metadata } from "next";

import { OrganizerProfile } from "@/components/organizers/OrganizerProfile";
import { loadOrganizerBySlug } from "@/components/organizers/organizer-data";

type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> { const { slug } = await params; const organizer = await loadOrganizerBySlug(slug); if (!organizer) return {}; return { title: `${organizer.name} — NOXA Organizer`, description: `${organizer.name} automotive events on NOXA.`, alternates: { canonical: `https://noxastreetapp.com/organizers/${organizer.slug}`, languages: { en: `https://noxastreetapp.com/organizers/${organizer.slug}`, el: `https://noxastreetapp.com/el/organizers/${organizer.slug}` } } }; }
export default async function OrganizerPage({ params }: Props) { const { slug } = await params; return <OrganizerProfile locale="en" slug={slug} />; }
