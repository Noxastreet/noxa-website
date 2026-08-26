import type { Metadata } from "next";

import { LandingPage } from "@/components/LandingPage";

export const metadata: Metadata = {
  title: "NOXA — Ο δρόμος γίνεται κοινωνικός",
  description:
    "Ανακάλυψε οδηγούς, συναντήσεις, ομάδες, διαδρομές και αυτοκινητιστικές εκδηλώσεις κοντά σου με το NOXA.",
  alternates: {
    canonical: "/el",
    languages: {
      en: "/",
      el: "/el",
    },
  },
  openGraph: {
    url: "https://noxastreetapp.com/el",
    locale: "el_GR",
    title: "NOXA — Ο δρόμος γίνεται κοινωνικός",
    description:
      "Ανακάλυψε οδηγούς, συναντήσεις, ομάδες, διαδρομές και αυτοκινητιστικές εκδηλώσεις κοντά σου με το NOXA.",
  },
};

export default function GreekHome() {
  return <LandingPage locale="el" />;
}
