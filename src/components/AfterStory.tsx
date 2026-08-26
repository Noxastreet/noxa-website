import { WaitlistForm } from "@/components/waitlist/WaitlistForm";

const communitySignals = [
  ["Drivers", "Nearby"],
  ["Meets", "Tonight"],
  ["Crews", "Together"],
] as const;

export function AfterStory() {
  return (
    <>
      <section
        id="community"
        className="section below-fold-section overflow-hidden border-b border-white/[0.06] bg-[#09090c]"
      >
        <div className="page-shell">
          <div className="content-card relative min-h-[620px] overflow-hidden border bg-black px-5 py-8 sm:px-8 sm:py-10 md:min-h-[720px] md:px-10 lg:grid lg:min-h-[680px] lg:grid-cols-[.88fr_1.12fr] lg:items-stretch lg:px-14 lg:py-14 xl:px-16">
            <div
              className="absolute inset-0 bg-[radial-gradient(circle_at_68%_66%,rgba(200,16,46,.32),transparent_28%),linear-gradient(135deg,#09090c_0%,#040405_70%)]"
              aria-hidden="true"
            />

            <div className="relative z-10 flex max-w-2xl flex-col lg:justify-between lg:pr-12">
              <div>
                <p className="eyebrow">Community, not content noise</p>
                <h2 className="max-w-[38rem] text-[clamp(42px,12vw,6.3rem)] font-semibold leading-[0.94] tracking-[-0.055em] [text-wrap:balance] lg:text-[clamp(4.6rem,5.7vw,6.6rem)]">
                  Not another social network.
                </h2>
                <p className="mt-6 max-w-[38rem] text-base leading-6 text-[var(--color-text-secondary)] lg:text-lg lg:leading-7">
                  A place built around the way drivers actually discover, meet and move together.
                </p>
              </div>

              <div className="mt-12 hidden max-w-[38rem] border-t border-white/[0.08] pt-5 text-sm leading-5 text-[var(--color-text-secondary)] lg:block">
                NOXA keeps the interaction close to the road: less content noise, more local activity, real routes and communities that exist beyond the screen.
              </div>
            </div>

            <div className="relative mt-14 min-h-[340px] lg:mt-0 lg:min-h-0">
              <div className="absolute inset-x-[-18%] bottom-[-16%] h-[62%] rotate-[-7deg] rounded-[50%] border-t border-white/15 bg-[linear-gradient(180deg,rgba(255,255,255,.075),transparent_42%)] shadow-[0_-30px_110px_rgba(200,16,46,.18)]" aria-hidden="true" />
              <div className="absolute bottom-[38%] left-[8%] h-px w-[34%] rotate-[-11deg] bg-white/65 shadow-[0_0_24px_rgba(255,255,255,.6)]" aria-hidden="true" />
              <div className="absolute bottom-[43%] right-[2%] h-px w-[42%] rotate-[8deg] bg-[#c8102e] shadow-[0_0_34px_rgba(200,16,46,.9)]" aria-hidden="true" />
              <div className="absolute left-[18%] top-[12%] size-3 rounded-full bg-[#c8102e] shadow-[0_0_0_10px_rgba(200,16,46,.12),0_0_28px_rgba(200,16,46,.55)]" aria-hidden="true" />
              <div className="absolute right-[16%] top-[30%] size-2.5 rounded-full bg-white/80 shadow-[0_0_0_9px_rgba(255,255,255,.08)]" aria-hidden="true" />

              <div className="absolute inset-x-0 bottom-0 z-10 grid grid-cols-3 gap-2 sm:gap-3 lg:bottom-2">
                {communitySignals.map(([title, meta]) => (
                  <div
                    key={title}
                    className="rounded-2xl border border-white/10 bg-black/70 p-3 sm:p-4 lg:p-5"
                  >
                    <p className="text-sm font-semibold sm:text-base">{title}</p>
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
          <div
            className="decorative-glow pointer-events-none absolute -right-36 -top-40 size-[420px] rounded-full bg-[#c8102e]/10 blur-[48px] lg:blur-[100px]"
            aria-hidden="true"
          />

          <div className="relative z-10 min-w-0">
            <p className="eyebrow">For automotive business</p>
            <h2 className="max-w-[38rem] text-[clamp(40px,11vw,5.8rem)] font-semibold leading-[0.94] tracking-[-0.055em] [text-wrap:balance] lg:text-[clamp(4.4rem,5.2vw,6rem)]">
              Put your business where drivers already look.
            </h2>
            <p className="mt-6 max-w-[38rem] text-base leading-6 text-[var(--color-text-secondary)] lg:text-lg lg:leading-7">
              A focused presence for detailing studios, garages, shops, partners and event organisers — directly on the automotive map.
            </p>

            <div className="mt-9 hidden grid-cols-3 gap-3 lg:grid">
              {[
                ["01", "Map presence"],
                ["02", "Verified profile"],
                ["03", "Driver discovery"],
              ].map(([number, label]) => (
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
                  Business profile
                </p>
                <p className="mt-3 [overflow-wrap:anywhere] text-2xl font-semibold tracking-[-0.035em] lg:text-3xl">
                  Northline Detailing
                </p>
                <p className="mt-2 text-sm leading-5 text-[var(--color-text-secondary)]">Verified · 1.8 km · Open today</p>
              </div>
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-white text-lg font-bold text-black" aria-hidden="true">
                N
              </span>
            </div>

            <div className="mt-8 rounded-[24px] border border-white/[0.08] bg-[#0d0d11] p-4">
              <div className="flex items-center justify-between gap-3 text-xs leading-4 text-[var(--color-text-secondary)]">
                <span>Live on NOXA map</span>
                <span>1.8 km</span>
              </div>
              <div className="relative mt-4 h-28 overflow-hidden rounded-[18px] bg-[radial-gradient(circle_at_62%_40%,rgba(200,16,46,.22),transparent_28%),linear-gradient(145deg,#15161b,#090a0d)]" aria-hidden="true">
                <div className="absolute inset-0 opacity-45 [background-image:linear-gradient(rgba(255,255,255,.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.035)_1px,transparent_1px)] [background-size:28px_28px]" />
                <div className="absolute left-[22%] top-[54%] h-0.5 w-[62%] -rotate-6 bg-[#c8102e] shadow-[0_0_18px_rgba(200,16,46,.75)]" />
                <div className="absolute right-[18%] top-[36%] flex size-9 items-center justify-center rounded-full border-2 border-black bg-white text-xs font-bold text-black shadow-xl">
                  N
                </div>
              </div>
            </div>

            <a className="secondary-button mt-6 w-full" href="#waitlist">
              Become a NOXA partner <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>
      </section>

      <section id="waitlist" className="section below-fold-section page-shell pt-0">
        <div className="relative overflow-hidden rounded-[24px] bg-[#c8102e] p-5 sm:p-8 md:rounded-[32px] md:p-10 lg:grid lg:grid-cols-[.88fr_1.12fr] lg:items-center lg:gap-16 lg:p-14 xl:gap-24 xl:p-16">
          <div className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full border border-white/15 lg:size-[420px]" aria-hidden="true" />
          <div className="pointer-events-none absolute -right-6 -top-10 size-44 rounded-full border border-white/15 lg:size-64" aria-hidden="true" />

          <div className="relative z-10 min-w-0">
            <p className="text-xs font-bold uppercase leading-4 tracking-[0.18em] text-white">Early access</p>
            <h2 className="mt-4 max-w-[38rem] text-[clamp(42px,13vw,6.7rem)] font-semibold leading-[0.94] tracking-[-0.055em] [text-wrap:balance] lg:text-[clamp(4.6rem,5.6vw,6.8rem)]">
              Your automotive world. One map.
            </h2>
            <p className="mt-6 max-w-[38rem] text-base leading-6 text-white lg:text-lg lg:leading-7">
              Join the first group of drivers and partners shaping NOXA before public release.
            </p>
          </div>

          <div className="adaptive-backdrop relative z-10 mt-10 rounded-[24px] border border-white/20 bg-black/20 p-4 backdrop-blur-[8px] sm:p-6 lg:mt-0 lg:p-7">
            <WaitlistForm />
            <p className="mt-4 text-sm leading-5 text-white">
              No noise. Only meaningful product updates and early-access information.
            </p>
          </div>
        </div>
      </section>

      <footer className="site-footer below-fold-section border-t border-[var(--color-border-subtle)] py-8 lg:py-10">
        <div className="page-shell flex flex-col gap-6 text-sm leading-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-bold tracking-[0.22em] text-white">NOXA</p>
            <p className="mt-4">From drivers, for drivers.</p>
            <p className="mt-1">S. KARAKETIDIS</p>
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 lg:gap-x-7">
            <a href="#product" className="transition-colors duration-[180ms] hover:text-white">Product</a>
            <a href="#community" className="transition-colors duration-[180ms] hover:text-white">Community</a>
            <a href="#business" className="transition-colors duration-[180ms] hover:text-white">For Business</a>
            <a href="#waitlist" className="transition-colors duration-[180ms] hover:text-white">Early access</a>
            <span>© 2026 NOXA</span>
          </div>
        </div>
      </footer>
    </>
  );
}
