import type { Metadata } from "next";

import { CommunityAdminReview } from "@/components/communities/CommunityAdminReview";

export const metadata: Metadata = {
  title: "NOXA Communities Admin",
  description: "Private NOXA community application moderation console.",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function CommunityAdminPage() {
  return <CommunityAdminReview />;
}
