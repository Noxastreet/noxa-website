import type { Metadata } from "next";

import { MeetsDirectoryPage } from "@/components/meets/MeetsDirectoryPage";

const TITLE = "NOXA Meets — Car & Moto Events Across Greece";
const DESCRIPTION =
  "Find public car meets, moto gatherings and motorsport events across Greece with NOXA Meets.";

export const metadata: Metadata = {
  title: "Meets — Car & Moto Events Across Greece",
  description: DESCRIPTION,
  alternates: {
    canonical: "https://noxastreetapp.com/meets",
    languages: {
      en: "https://noxastreetapp.com/meets",
      el: "https://noxastreetapp.com/el/meets",
    },
  },
  openGraph: {
    type: "website",
    url: "https://noxastreetapp.com/meets",
    siteName: "NOXA",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/brand/noxa-og-preview.jpg"],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/brand/noxa-og-preview.jpg"],
  },
};

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function MeetsPage({ searchParams }: Props) {
  const params = await searchParams;

  return (
    <MeetsDirectoryPage
      locale="en"
      initialFilters={{
        country: first(params.country),
        city: first(params.city),
        type: first(params.type),
        date: first(params.date),
        q: first(params.q),
      }}
    />
  );
}
