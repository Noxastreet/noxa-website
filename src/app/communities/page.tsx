import type { Metadata } from "next";

import { CommunityDirectory } from "@/components/communities/CommunityDirectory";

export const metadata: Metadata = {
  title: "NOXA Crew Directory — Automotive communities across Greece",
  description: "Discover automotive crews, clubs, riding groups and local car communities across Greece on NOXA.",
  alternates: {
    canonical: "https://noxastreetapp.com/communities",
    languages: {
      en: "https://noxastreetapp.com/communities",
      el: "https://noxastreetapp.com/el/communities",
    },
  },
};

type PageProps = {
  searchParams: Promise<{ q?: string; focus?: string; sort?: string }>;
};

export default async function CommunitiesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  return <CommunityDirectory locale="en" query={params.q} focus={params.focus} sort={params.sort} />;
}
