const navigationItems = [
  ["Product", "#product"],
  ["Community", "#community"],
  ["For Business", "#business"],
] as const;

export function SiteHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.06] bg-[#050505]/76 backdrop-blur-2xl">
      <div className="page-shell flex h-16 items-center justify-between lg:h-[72px]">
        <a
          className="rounded-md text-sm font-bold tracking-[0.24em] outline-none focus-visible:ring-2 focus-visible:ring-[#c8102e]"
          href="#top"
          aria-label="NOXA home"
        >
          NOXA
        </a>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary navigation">
          {navigationItems.map(([label, href]) => (
            <a
              key={href}
              href={href}
              className="rounded-full px-4 py-2 text-sm font-medium text-white/48 outline-none transition-colors hover:bg-white/[0.05] hover:text-white focus-visible:ring-2 focus-visible:ring-[#c8102e]"
            >
              {label}
            </a>
          ))}
        </nav>

        <a
          className="inline-flex min-h-11 items-center rounded-full border border-white/10 bg-white/[0.04] px-4 text-sm font-semibold text-white/82 outline-none transition-colors hover:border-white/20 hover:bg-white/[0.08] focus-visible:ring-2 focus-visible:ring-[#c8102e] lg:px-5"
          href="#waitlist"
        >
          Join NOXA
          <span className="ml-2 hidden text-white/35 sm:inline" aria-hidden="true">
            ↗
          </span>
        </a>
      </div>
    </header>
  );
}
