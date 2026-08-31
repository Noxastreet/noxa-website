import type { Metadata } from "next";

import { RadarAdminConsole } from "@/components/radar/RadarAdminConsole";

export const metadata: Metadata = {
  title: "NOXA Radar Admin",
  description: "Private NOXA Radar administration console.",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function RadarAdminPage() {
  return <RadarAdminConsole />;
}
