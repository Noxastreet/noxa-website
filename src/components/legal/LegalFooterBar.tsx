import Link from "next/link";

export function LegalFooterBar() {
  return (
    <div className="border-t border-white/[0.06] bg-[#050505] py-6">
      <div className="page-shell flex flex-col gap-3 text-xs text-white/38 sm:flex-row sm:items-center sm:justify-between">
        <p>Legal information for the NOXA website and early-access waitlist.</p>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          <Link href="/privacy" className="transition-colors hover:text-white">
            Privacy Policy
          </Link>
          <Link href="/terms" className="transition-colors hover:text-white">
            Terms of Use
          </Link>
        </div>
      </div>
    </div>
  );
}
