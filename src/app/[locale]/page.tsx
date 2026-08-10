import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { NoxaLanding } from "@/components/landing/NoxaLanding";
import { isLocale, siteCopy, siteLocales } from "@/i18n/site-copy";

type LocalePageProps = {
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return siteLocales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: LocalePageProps): Promise<Metadata> {
  const { locale } = await params;

  if (!isLocale(locale)) return {};

  const copy = siteCopy[locale];

  return {
    title: { absolute: copy.meta.title },
    description: copy.meta.description,
    alternates: {
      canonical: `/${locale}`,
      languages: {
        el: "/el",
        en: "/en",
        ru: "/ru",
        "x-default": "/",
      },
    },
    openGraph: {
      type: "website",
      url: `https://noxastreetapp.com/${locale}`,
      locale,
      siteName: "NOXA",
      title: copy.meta.title,
      description: copy.meta.description,
    },
    twitter: {
      card: "summary_large_image",
      title: copy.meta.title,
      description: copy.meta.description,
    },
  };
}

export default async function LocalePage({ params }: LocalePageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) notFound();

  return <NoxaLanding locale={locale} copy={siteCopy[locale]} />;
}
