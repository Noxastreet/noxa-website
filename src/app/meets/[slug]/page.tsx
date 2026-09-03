import type { Metadata } from "next";

import { EventDetailPage, loadPublicEvent } from "@/components/meets/EventDetailPage";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const event = await loadPublicEvent(slug);
  if (!event) return {};
  return {
    title: `${event.title} — NOXA Meets`,
    description: event.summary?.trim() || `${event.title} — ${event.city ?? event.country_code}.`,
    alternates: {
      canonical: `https://noxastreetapp.com/meets/${event.public_slug}`,
      languages: {
        en: `https://noxastreetapp.com/meets/${event.public_slug}`,
        el: `https://noxastreetapp.com/el/meets/${event.public_slug}`,
      },
    },
    openGraph: {
      type: "article",
      title: event.title,
      description: event.summary?.trim() || `${event.title} on NOXA Meets`,
      url: `https://noxastreetapp.com/meets/${event.public_slug}`,
    },
  };
}

export default async function EventPage({ params }: Props) {
  const { slug } = await params;
  return <EventDetailPage locale="en" slug={slug} />;
}
