import type { Metadata } from "next";

import { RadarAdminSimpleConsole } from "@/components/radar/RadarAdminSimpleConsole";

export const metadata: Metadata = {
  title: "NOXA Meets Admin",
  description: "Private NOXA Meets administration console.",
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
  return <RadarAdminSimpleConsole />;
}
