import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PublicEventPage } from "@/components/events/PublicEventPage";
import { getPublicEventBySlug } from "@/lib/publicEvents";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const bundle = await getPublicEventBySlug(slug);
  if (!bundle) return {};

  const { event } = bundle;
  const description = event.summary?.trim() || `${event.title} στο NOXA Meets.`;
  const canonical = `https://noxastreetapp.com/el/meets/${event.public_slug}`;

  return {
    title: `${event.title} — NOXA Meets`,
    description,
    alternates: {
      canonical,
      languages: {
        en: `https://noxastreetapp.com/meets/${event.public_slug}`,
        el: canonical,
      },
    },
    openGraph: {
      type: "website",
      url: canonical,
      title: `${event.title} — NOXA Meets`,
      description,
    },
  };
}

export default async function EventPageEl({ params }: Props) {
  const { slug } = await params;
  const bundle = await getPublicEventBySlug(slug);
  if (!bundle) notFound();

  return <PublicEventPage bundle={bundle} locale="el" />;
}
