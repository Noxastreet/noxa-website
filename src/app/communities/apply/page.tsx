import type { Metadata } from "next";

import { CommunityApplicationForm } from "@/components/communities/CommunityApplicationForm";

export const metadata: Metadata = {
  title: "List your community — NOXA Communities",
  description: "Apply for a public NOXA profile for your automotive or motorcycle community, club or organiser page.",
  alternates: {
    canonical: "https://noxastreetapp.com/communities/apply",
    languages: {
      en: "https://noxastreetapp.com/communities/apply",
      el: "https://noxastreetapp.com/el/communities/apply",
    },
  },
};

export default function CommunityApplyPage() {
  return <CommunityApplicationForm locale="en" />;
}
