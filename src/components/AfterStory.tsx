import { NoxaLogo } from "@/components/brand/NoxaLogo";
import { WaitlistForm } from "@/components/waitlist/WaitlistForm";
import type { LandingCopy, Locale } from "@/i18n/landing-copy";

type AfterStoryProps = {
  businessCopy: LandingCopy["business"];
  communityCopy: LandingCopy["community"];
  footerCopy: LandingCopy["footer"];
  locale: Locale;
  waitlistCopy: LandingCopy["waitlist"];
};

export function AfterStory({
  businessCopy,
  communityCopy,
  footerCopy,
  locale,
  waitlistCopy,
}: AfterStoryProps) {
  const communitySignals = communityCopy.signals;

  return (
    <>
      <section
        id="community"
        className="section below-fold-section overflow-hidden border-b border-white/[0.06] bg-[#09090c]"
      >
        <div className="page-shell">
          <div className="content-card relative overflow-hidden border bg-black px-5 py-8 sm:px-8 sm:py-10 md:px-10 lg:grid lg:grid-cols-[.88fr_1.12fr] lg:items-stretch lg:px-14 lg:py-14 xl:px-16">
            <div className="absolute inset-0 bg-[linear-gradient(135deg,#09090c_0%,#040405_70%)]" aria-hidden="true" />

            <div className="relative z-10 flex max-w-2xl flex-col lg:justify-between lg:pr-12">
              <div>
                <p className="eyebrow">{communityCopy.eyebrow}</p>
                <h2 className="max-w-[38rem] text-[clamp(42px,12vw,6.3rem)] font-semibold leading-[0.94] tracking-[-0.055em] [text-wrap:balance] lg:text-[clamp(4.6rem,5.7vw,6.6rem)]">
                  {communityCopy.title}
                </h2>
                <p className="mt-6 max-w-[38rem] text-base leading-6 text-[var(--color-text-secondary)] lg:text-lg lg:leading-7">
                  {communityCopy.body}
                </p>
              </div>

              <div className="mt-12 hidden max-w-[38rem] border-t border-white/[0.08] pt-5 text-sm leading-5 text-[var(--color-text-secondary)] lg:block">
                {communityCopy.detail}
              </div>
            </div>

            <div className="relative mt-14 flex items-end lg:mt-0">
              <div className="grid w-full grid-cols-3 gap-2 sm:gap-3">
                {communitySignals.map(([title, meta]) => (
                  <div
                    key={title}
                    className="rounded-2xl border border-white/10 bg-black/70 p-3 sm:p-4 lg:p-5"
                  >
                    <p className="min-w-0 [overflow-wrap:anywhere] text-sm font-semibold sm:text-base">{title}</p>
                    <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-white/70 sm:text-xs">
                      {meta}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="business" className="section below-fold-section page-shell">
        <div className="content-card relative overflow-hidden border bg-[#0a0a0d] p-5 sm:p-8 md:p-10 lg:grid lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:gap-16 lg:p-14 xl:gap-24 xl:p-16">
          <div className="relative z-10 min-w-0">
            <p className="eyebrow">{businessCopy.eyebrow}</p>
            <h2 className="max-w-[38rem] text-[clamp(40px,11vw,5.8rem)] font-semibold leading-[0.94] tracking-[-0.055em] [text-wrap:balance] lg:text-[clamp(4.4rem,5.2vw,6rem)]">
              {businessCopy.title}
            </h2>
            <p className="mt-6 max-w-[38rem] text-base leading-6 text-[var(--color-text-secondary)] lg:text-lg lg:leading-7">
              {businessCopy.body}
            </p>

            <div className="mt-9 hidden grid-cols-3 gap-3 lg:grid">
              {businessCopy.features.map(([number, label]) => (
                <div key={number} className="border-t border-white/[0.08] pt-4">
                  <p className="text-xs font-bold leading-4 tracking-[0.14em] text-[#e32c49]">{number}</p>
                  <p className="mt-2 text-sm leading-5 text-[var(--color-text-secondary)]">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 mt-10 rounded-[24px] border border-[var(--color-border-subtle)] bg-black/55 p-5 shadow-[var(--shadow-card)] md:rounded-[32px] lg:mt-0 lg:p-7">
            <div className="flex min-w-0 items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase leading-4 tracking-[0.16em] text-[#e32c49]">
                  {businessCopy.profile}
                </p>
                <p className="mt-3 [overflow-wrap:anywhere] text-2xl font-semibold tracking-[-0.035em] lg:text-3xl">
                  {businessCopy.name}
                </p>
                <p className="mt-2 text-sm leading-5 text-[var(--color-text-secondary)]">{businessCopy.status}</p>
              </div>
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-white text-lg font-bold text-black" aria-hidden="true">
                N
              </span>
            </div>

            <div className="mt-8 rounded-[24px] border border-white/[0.08] bg-[#0d0d11] p-4">
              <div className="flex items-center justify-between gap-3 text-xs leading-4 text-[var(--color-text-secondary)]">
                <span>{businessCopy.mapStatus}</span>
                <span>{businessCopy.distance}</span>
              </div>
            </div>

            <a className="secondary-button mt-6 w-full" href="#waitlist">
              {businessCopy.cta} <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>
      </section>

      <section id="waitlist" className="section below-fold-section page-shell pt-0">
        <div className="relative overflow-hidden rounded-[24px] bg-[#c8102e] p-5 sm:p-8 md:rounded-[32px] md:p-10 lg:grid lg:grid-cols-[.88fr_1.12fr] lg:items-center lg:gap-16 lg:p-14 xl:gap-24 xl:p-16">
          <div className="relative z-10 min-w-0">
            <p className="text-xs font-bold uppercase leading-4 tracking-[0.18em] text-white">{waitlistCopy.eyebrow}</p>
            <h2 className="mt-4 max-w-[38rem] text-[clamp(42px,13vw,6.7rem)] font-semibold leading-[0.94] tracking-[-0.055em] [text-wrap:balance] lg:text-[clamp(4.6rem,5.6vw,6.8rem)]">
              {waitlistCopy.title}
            </h2>
            <p className="mt-6 max-w-[38rem] text-base leading-6 text-white lg:text-lg lg:leading-7">
              {waitlistCopy.body}
            </p>
          </div>

          <div className="adaptive-backdrop relative z-10 mt-10 rounded-[24px] border border-white/20 bg-black/20 p-4 backdrop-blur-[8px] sm:p-6 lg:mt-0 lg:p-7">
            <WaitlistForm copy={waitlistCopy} locale={locale} />
            <p className="mt-4 text-sm leading-5 text-white">
              {waitlistCopy.note}
            </p>
          </div>
        </div>
      </section>

      <footer className="site-footer below-fold-section border-t border-[var(--color-border-subtle)] py-8 lg:py-10">
        <div className="page-shell flex flex-col gap-6 text-sm leading-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <NoxaLogo className="h-auto w-[120px]" />
            <p className="mt-4">{footerCopy.tagline}</p>
            <p className="mt-1">S. KARAKETIDIS</p>
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 lg:gap-x-7">
            <a href="#product" className="transition-colors duration-[180ms] hover:text-white">{footerCopy.product}</a>
            <a href="#community" className="transition-colors duration-[180ms] hover:text-white">{footerCopy.community}</a>
            <a href="#business" className="transition-colors duration-[180ms] hover:text-white">{footerCopy.business}</a>
            <a href="#waitlist" className="transition-colors duration-[180ms] hover:text-white">{footerCopy.earlyAccess}</a>
            <span>© 2026 NOXA</span>
          </div>
        </div>
      </footer>
    </>
  );
}
