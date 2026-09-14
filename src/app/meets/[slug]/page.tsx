import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { EventDetailPage, loadPublicEvent, localizePublicEvent } from "@/components/meets/EventDetailPage";
import {
  buildEventJsonLd,
  buildEventSeoDescription,
  eventOgImageUrl,
  eventPublicUrl,
  serializeJsonLd,
} from "@/lib/meets/eventSeo";
import { isEventCurrentlyVisible } from "@/lib/meets/eventVisibility";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const event = await loadPublicEvent(slug);
  if (!event || !isEventCurrentlyVisible(event.starts_at, event.ends_at)) return {};

  const content = localizePublicEvent(event, "en");
  const description = buildEventSeoDescription(event, content, "en");
  const url = eventPublicUrl(event, "en");
  const image = eventOgImageUrl(event);

  return {
    title: `${content.title} — NOXA Meets`,
    description,
    alternates: {
      canonical: url,
      languages: {
        en: eventPublicUrl(event, "en"),
        el: eventPublicUrl(event, "el"),
      },
    },
    openGraph: {
      type: "article",
      title: content.title,
      description,
      url,
      images: [{ url: image, alt: content.coverImageAlt?.trim() || content.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: content.title,
      description,
      images: [image],
    },
  };
}

export default async function EventPage({ params }: Props) {
  const { slug } = await params;
  const event = await loadPublicEvent(slug);
  if (!event || !isEventCurrentlyVisible(event.starts_at, event.ends_at)) notFound();

  const content = localizePublicEvent(event, "en");
  const jsonLd = buildEventJsonLd(event, content, "en");

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      <EventDetailPage locale="en" slug={slug} />
    </>
  );
}
