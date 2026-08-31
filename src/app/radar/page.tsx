import type { Metadata } from "next";
import { headers } from "next/headers";

import { RadarCountryGate } from "@/components/radar/RadarCountryGate";

export const metadata: Metadata = {
  title: "NOXA — Automotive events by country",
  description:
    "Discover public automotive and motorcycle gatherings by country with NOXA.",
  alternates: {
    canonical: "https://noxastreetapp.com/radar",
  },
};

function fallbackCountryFromLanguage(value: string | null) {
  if (!value) return "GR";
  const match = value.match(/[-_]([A-Za-z]{2})(?:[,;]|$)/);
  return match?.[1]?.toUpperCase() ?? "GR";
}

export default async function RadarPage() {
  const requestHeaders = await headers();
  const detectedCountryCode =
    requestHeaders.get("x-vercel-ip-country") ??
    fallbackCountryFromLanguage(requestHeaders.get("accept-language"));

  return <RadarCountryGate detectedCountryCode={detectedCountryCode} />;
}
