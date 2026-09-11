import type { Metadata } from "next";

import { FounderAnalyticsDashboard } from "@/components/radar/FounderAnalyticsDashboard";
import { FounderAnalyticsReturnIntent } from "@/components/radar/FounderAnalyticsReturnIntent";

export const metadata: Metadata = {
  title: "NOXA — Аналитика",
  description: "Приватная аналитика сайта NOXA для Founder.",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function FounderAnalyticsPage() {
  return (
    <>
      <FounderAnalyticsReturnIntent />
      <FounderAnalyticsDashboard />
    </>
  );
}
