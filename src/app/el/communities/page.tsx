import type { Metadata } from "next";

import { CommunityDirectory } from "@/components/communities/CommunityDirectory";

export const metadata: Metadata = {
  title: "NOXA Crew Directory — Automotive κοινότητες στην Ελλάδα",
  description: "Ανακάλυψε automotive crews, clubs, riding groups και local κοινότητες σε όλη την Ελλάδα στο NOXA.",
  alternates: {
    canonical: "https://noxastreetapp.com/el/communities",
    languages: {
      en: "https://noxastreetapp.com/communities",
      el: "https://noxastreetapp.com/el/communities",
    },
  },
};

type PageProps = {
  searchParams: Promise<{ q?: string; focus?: string; sort?: string }>;
};

export default async function GreekCommunitiesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  return <CommunityDirectory locale="el" query={params.q} focus={params.focus} sort={params.sort} />;
}
