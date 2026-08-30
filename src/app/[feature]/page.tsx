import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  FeatureDetailPage,
  isFeatureSlug,
  type FeatureSlug,
} from "@/components/culture/FeatureDetailPage";

const metadataByFeature: Record<FeatureSlug, Metadata> = {
  meets: {
    title: "NOXA Meetups — Find automotive meets around you",
    description:
      "Discover how NOXA connects drivers and riders with local car meets, automotive events and group drives.",
  },
  crews: {
    title: "NOXA Crews — Build your automotive community",
    description:
      "See how NOXA Crews connect members, meets, routes and real automotive community activity.",
  },
  routes: {
    title: "NOXA Routes & Drives — Move together",
    description:
      "Explore NOXA's route, lobby and group-drive vision for automotive communities that move together.",
  },
};

type PageProps = {
  params: Promise<{ feature: string }>;
};

export function generateStaticParams() {
  return [{ feature: "meets" }, { feature: "crews" }, { feature: "routes" }];
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { feature } = await params;
  if (!isFeatureSlug(feature)) return {};

  return {
    ...metadataByFeature[feature],
    alternates: {
      canonical: `https://noxastreetapp.com/${feature}`,
      languages: {
        en: `https://noxastreetapp.com/${feature}`,
        el: `https://noxastreetapp.com/el/${feature}`,
      },
    },
  };
}

export default async function FeaturePage({ params }: PageProps) {
  const { feature } = await params;
  if (!isFeatureSlug(feature)) notFound();

  return <FeatureDetailPage locale="en" feature={feature} />;
}
