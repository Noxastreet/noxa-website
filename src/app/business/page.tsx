import type { Metadata } from "next";

import { BusinessPartnersPage } from "@/components/business/BusinessPartnersPage";

export const metadata: Metadata = {
  title: "Business & Partners — NOXA",
  description:
    "Connect your business with Greece's automotive culture through NOXA partnerships.",
  alternates: {
    canonical: "https://noxastreetapp.com/business",
  },
};

export default function BusinessPage() {
  return <BusinessPartnersPage />;
}
