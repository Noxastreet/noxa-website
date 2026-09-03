import type { Metadata } from "next";

import { loadCommunityBySlug } from "@/components/communities/community-data";
import { CommunityProfile } from "@/components/communities/CommunityProfile";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const community = await loadCommunityBySlug(slug);
  if (!community) return {};

  return {
    title: `${community.name} — NOXA Communities`,
    description: community.description ?? `Ανακάλυψε το ${community.name} στο NOXA Communities.`,
    alternates: {
      canonical: `https://noxastreetapp.com/el/communities/${community.slug}`,
      languages: {
        en: `https://noxastreetapp.com/communities/${community.slug}`,
        el: `https://noxastreetapp.com/el/communities/${community.slug}`,
      },
    },
  };
}

export default async function GreekCommunityPage({ params }: PageProps) {
  const { slug } = await params;
  return <CommunityProfile locale="el" slug={slug} />;
}
