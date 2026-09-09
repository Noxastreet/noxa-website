import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { OrganizerApplicationForm } from "@/components/organizers/OrganizerApplicationForm";
import { loadOrganizerBySlug } from "@/components/organizers/organizer-data";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const organizer = await loadOrganizerBySlug(slug);
  if (!organizer || organizer.organizer_type === "community") return {};
  return {
    title: `Claim ${organizer.name} — NOXA Organizer`,
    description: `Request reviewed owner access to the ${organizer.name} organizer profile on NOXA.`,
    alternates: {
      canonical: `https://noxastreetapp.com/organizers/${organizer.slug}/claim`,
      languages: {
        en: `https://noxastreetapp.com/organizers/${organizer.slug}/claim`,
        el: `https://noxastreetapp.com/el/organizers/${organizer.slug}/claim`,
      },
    },
  };
}

export default async function OrganizerClaimPage({ params }: Props) {
  const { slug } = await params;
  const organizer = await loadOrganizerBySlug(slug);
  if (!organizer || organizer.organizer_type === "community") notFound();

  return (
    <OrganizerApplicationForm
      locale="en"
      claimTarget={{
        id: organizer.id,
        name: organizer.name,
        organizerType: organizer.organizer_type,
        city: organizer.city,
        instagramUrl: organizer.instagram_url,
        websiteUrl: organizer.website_url,
      }}
    />
  );
}
