import type { Metadata } from "next";

import { EventDetailPage, loadPublicEvent, localizePublicEvent } from "@/components/meets/EventDetailPage";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const event = await loadPublicEvent(slug);
  if (!event) return {};
  const content = localizePublicEvent(event, "en");
  return {
    title: `${content.title} — NOXA Meets`,
    description: content.summary?.trim() || `${content.title} — ${event.city ?? event.country_code}.`,
    alternates: {
      canonical: `https://noxastreetapp.com/meets/${event.public_slug}`,
      languages: {
        en: `https://noxastreetapp.com/meets/${event.public_slug}`,
        el: `https://noxastreetapp.com/el/meets/${event.public_slug}`,
      },
    },
    openGraph: {
      type: "article",
      title: content.title,
      description: content.summary?.trim() || `${content.title} on NOXA Meets`,
      url: `https://noxastreetapp.com/meets/${event.public_slug}`,
    },
  };
}

export default async function EventPage({ params }: Props) {
  const { slug } = await params;
  return <EventDetailPage locale="en" slug={slug} />;
}
