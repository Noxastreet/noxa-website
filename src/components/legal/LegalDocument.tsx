import type { ReactNode } from "react";
import Link from "next/link";

type LegalSection = {
  id: string;
  title: string;
  content: ReactNode;
};

type LegalDocumentProps = {
  eyebrow: string;
  title: string;
  updated: string;
  intro: ReactNode;
  sections: LegalSection[];
};

export function LegalDocument({
  eyebrow,
  title,
  updated,
  intro,
  sections,
}: LegalDocumentProps) {
  return (
    <main className="min-h-screen bg-[#050505] text-[#f5f5f7]">
      <header className="border-b border-white/[0.08]">
        <div className="page-shell flex min-h-20 items-center justify-between gap-6">
          <Link
            href="/"
            className="text-sm font-bold tracking-[0.28em] text-white transition-opacity hover:opacity-70"
          >
            NOXA
          </Link>
          <Link
            href="/"
            className="text-sm text-white/55 transition-colors hover:text-white"
          >
            Back to website
          </Link>
        </div>
      </header>

      <div className="page-shell py-16 sm:py-20 lg:grid lg:grid-cols-[240px_minmax(0,760px)] lg:gap-20 lg:py-28">
        <aside className="hidden lg:block">
          <nav className="sticky top-28 border-l border-white/10 pl-5" aria-label={`${title} sections`}>
            <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.18em] text-[#e32c49]">
              On this page
            </p>
            <div className="space-y-3">
              {sections.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="block text-sm leading-5 text-white/40 transition-colors hover:text-white"
                >
                  {section.title}
                </a>
              ))}
            </div>
          </nav>
        </aside>

        <article>
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="max-w-3xl text-[clamp(3.2rem,12vw,6.7rem)] font-semibold leading-[0.9] tracking-[-0.07em]">
            {title}
          </h1>
          <p className="mt-5 text-sm text-white/38">Last updated: {updated}</p>
          <div className="mt-9 max-w-2xl text-base leading-8 text-white/62 sm:text-lg">
            {intro}
          </div>

          <div className="mt-16 space-y-14 sm:mt-20 sm:space-y-16">
            {sections.map((section) => (
              <section
                key={section.id}
                id={section.id}
                className="scroll-mt-28 border-t border-white/[0.08] pt-8"
              >
                <h2 className="text-2xl font-semibold tracking-[-0.035em] sm:text-3xl">
                  {section.title}
                </h2>
                <div className="legal-copy mt-5 space-y-5 text-[0.98rem] leading-7 text-white/58 sm:text-base sm:leading-8">
                  {section.content}
                </div>
              </section>
            ))}
          </div>
        </article>
      </div>

      <footer className="border-t border-white/[0.08] py-8">
        <div className="page-shell flex flex-col gap-4 text-sm text-white/42 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 NOXA · S. KARAKETIDIS</p>
          <div className="flex gap-5">
            <Link href="/privacy" className="transition-colors hover:text-white">
              Privacy
            </Link>
            <Link href="/terms" className="transition-colors hover:text-white">
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
