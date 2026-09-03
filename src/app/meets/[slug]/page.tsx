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
  const description = event.summary?.trim() || `${event.title} on NOXA Meets.`;
  const canonical = `https://noxastreetapp.com/meets/${event.public_slug}`;

  return {
    title: `${event.title} — NOXA Meets`,
    description,
    alternates: {
      canonical,
      languages: {
        en: canonical,
        el: `https://noxastreetapp.com/el/meets/${event.public_slug}`,
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

export default async function EventPage({ params }: Props) {
  const { slug } = await params;
  const bundle = await getPublicEventBySlug(slug);
  if (!bundle) notFound();

  return <PublicEventPage bundle={bundle} locale="en" />;
}
