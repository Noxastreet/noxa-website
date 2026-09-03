import type { Metadata } from "next";

import { CommunityApplicationForm } from "@/components/communities/CommunityApplicationForm";

export const metadata: Metadata = {
  title: "Καταχώρισε την κοινότητά σου — NOXA Communities",
  description: "Κάνε αίτηση για δημόσιο NOXA profile για automotive ή moto κοινότητα, club ή organiser page.",
  alternates: {
    canonical: "https://noxastreetapp.com/el/communities/apply",
    languages: {
      en: "https://noxastreetapp.com/communities/apply",
      el: "https://noxastreetapp.com/el/communities/apply",
    },
  },
};

export default function CommunityApplyElPage() {
  return <CommunityApplicationForm locale="el" />;
}
