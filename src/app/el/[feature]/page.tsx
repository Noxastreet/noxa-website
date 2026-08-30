import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  FeatureDetailPage,
  isFeatureSlug,
  type FeatureSlug,
} from "@/components/culture/FeatureDetailPage";

const metadataByFeature: Record<FeatureSlug, Metadata> = {
  meets: {
    title: "NOXA Meetups — Βρες automotive συναντήσεις γύρω σου",
    description:
      "Δες πώς το NOXA συνδέει οδηγούς και αναβάτες με τοπικά car meets, automotive events και group drives.",
  },
  crews: {
    title: "NOXA Crews — Χτίσε την automotive κοινότητά σου",
    description:
      "Δες πώς τα NOXA Crews συνδέουν μέλη, meets, routes και πραγματική community δραστηριότητα.",
  },
  routes: {
    title: "NOXA Routes & Drives — Κινηθείτε μαζί",
    description:
      "Δες την κατεύθυνση του NOXA για routes, lobby και group drives μέσα σε automotive κοινότητες.",
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
      canonical: `https://noxastreetapp.com/el/${feature}`,
      languages: {
        en: `https://noxastreetapp.com/${feature}`,
        el: `https://noxastreetapp.com/el/${feature}`,
      },
    },
  };
}

export default async function GreekFeaturePage({ params }: PageProps) {
  const { feature } = await params;
  if (!isFeatureSlug(feature)) notFound();

  return <FeatureDetailPage locale="el" feature={feature} />;
}
