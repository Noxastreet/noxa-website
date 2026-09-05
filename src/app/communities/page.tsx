import type { Metadata } from "next";

import { CommunityDirectory } from "@/components/communities/CommunityDirectory";

export const metadata: Metadata = {
  title: "NOXA Communities — Automotive communities across Greece",
  description: "Discover real car and motorcycle communities, clubs and local automotive scenes across Greece on NOXA.",
  alternates: {
    canonical: "https://noxastreetapp.com/communities",
    languages: {
      en: "https://noxastreetapp.com/communities",
      el: "https://noxastreetapp.com/el/communities",
    },
  },
};

type PageProps = {
  searchParams: Promise<{ q?: string; focus?: string }>;
};

export default async function CommunitiesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  return <CommunityDirectory locale="en" query={params.q} focus={params.focus} />;
}
