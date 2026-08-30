import Link from "next/link";

import type { LandingCopy } from "@/i18n/landing-copy";

export function LegalFooterBar({
  copy,
}: {
  copy: LandingCopy["legalFooter"];
}) {
  return (
    <div className="legal-footer bg-[#050505] py-5">
      <div className="page-shell flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <p className="max-w-[38rem]">{copy.summary}</p>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
          <Link href="/privacy" className="transition-colors duration-[180ms] hover:text-white">
            {copy.privacy}
          </Link>
          <Link href="/terms" className="transition-colors duration-[180ms] hover:text-white">
            {copy.terms}
          </Link>
        </div>
      </div>
    </div>
  );
}
