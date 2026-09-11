import type { Metadata } from "next";

import { FounderAnalyticsDashboard } from "@/components/radar/FounderAnalyticsDashboard";

export const metadata: Metadata = {
  title: "NOXA Founder Analytics",
  description: "Private NOXA founder analytics dashboard.",
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
  return <FounderAnalyticsDashboard />;
}
