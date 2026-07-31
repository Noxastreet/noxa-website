export function AfterStory() {
  return (
    <>
      <section className="section overflow-hidden border-b border-white/[0.06] bg-[#09090c]">
        <div className="page-shell">
          <div className="relative min-h-[620px] overflow-hidden rounded-[2.5rem] border border-white/[0.08] bg-black px-6 py-10 sm:px-10 md:min-h-[720px]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_48%_70%,rgba(200,16,46,.34),transparent_26%),linear-gradient(180deg,#09090c_0%,#040405_65%)]" />
            <div className="absolute inset-x-[-15%] bottom-[-11%] h-[48%] rotate-[-6deg] rounded-[50%] border-t border-white/15 bg-[linear-gradient(180deg,rgba(255,255,255,.07),transparent_40%)] shadow-[0_-30px_100px_rgba(200,16,46,.15)]" />
            <div className="absolute bottom-[21%] left-[18%] h-px w-[28%] rotate-[-10deg] bg-white/60 shadow-[0_0_22px_rgba(255,255,255,.55)]" />
            <div className="absolute bottom-[25%] right-[12%] h-px w-[34%] rotate-[8deg] bg-[#c8102e] shadow-[0_0_30px_rgba(200,16,46,.85)]" />

            <div className="relative z-10 max-w-2xl">
              <p className="eyebrow">Community, not content noise</p>
              <h2 className="text-[clamp(2.9rem,12vw,6.3rem)] font-semibold leading-[0.91] tracking-[-0.07em]">
                Not another social network.
              </h2>
              <p className="mt-6 max-w-lg text-lg leading-8 text-white/52">
                A place built around the way drivers actually discover, meet and move together.
              </p>
            </div>

            <div className="absolute bottom-8 left-6 right-6 z-10 grid grid-cols-3 gap-2 sm:left-10 sm:right-10 sm:gap-3">
              {[["Drivers", "Nearby"], ["Meets", "Tonight"], ["Crews", "Together"]].map(([title, meta]) => (
                <div key={title} className="rounded-2xl border border-white/10 bg-black/45 p-3 backdrop-blur-xl sm:p-4">
                  <p className="text-sm font-semibold sm:text-base">{title}</p>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-white/35 sm:text-xs">{meta}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section page-shell">
        <div className="grid gap-10 rounded-[2.5rem] border border-white/[0.09] bg-[#0a0a0d] p-6 sm:p-10 lg:grid-cols-[1.1fr_.9fr] lg:items-end lg:p-14">
          <div>
            <p className="eyebrow">For automotive business</p>
            <h2 className="max-w-3xl text-[clamp(2.7rem,11vw,5.8rem)] font-semibold leading-[0.92] tracking-[-0.065em]">
              Put your business where drivers already look.
            </h2>
            <p className="mt-6 max-w-xl text-[1.05rem] leading-8 text-white/52">
              A focused presence for detailing studios, garages, shops, partners and event organisers — directly on the automotive map.
            </p>
          </div>
          <div className="rounded-[2rem] border border-white/10 bg-black/35 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#e32c49]">Business profile</p>
                <p className="mt-3 text-2xl font-semibold tracking-[-0.035em]">Northline Detailing</p>
                <p className="mt-2 text-sm leading-6 text-white/45">Verified · 1.8 km · Open today</p>
              </div>
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white text-lg font-bold text-black">N</span>
            </div>
            <a className="secondary-button mt-8 w-full" href="#waitlist">
              Become a NOXA partner <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>
      </section>

      <section id="waitlist" className="section page-shell pt-0">
        <div className="relative overflow-hidden rounded-[2.6rem] bg-[#c8102e] p-6 sm:p-10 md:p-14">
          <div className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full border border-white/15" />
          <div className="pointer-events-none absolute -right-6 -top-10 size-44 rounded-full border border-white/15" />
          <div className="relative z-10">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/65">Early access</p>
            <h2 className="mt-4 max-w-3xl text-[clamp(3rem,13vw,6.7rem)] font-semibold leading-[0.89] tracking-[-0.075em]">
              Your automotive world. One map.
            </h2>
            <p className="mt-6 max-w-lg text-base leading-7 text-white/70">
              Join the first group of drivers and partners shaping NOXA before public release.
            </p>
            <form className="mt-9 flex max-w-2xl flex-col gap-3 sm:flex-row">
              <label className="sr-only" htmlFor="email">Email address</label>
              <input id="email" name="email" type="email" autoComplete="email" required placeholder="Email address" className="min-h-14 flex-1 rounded-full border border-white/20 bg-black/20 px-5 text-white outline-none placeholder:text-white/55 focus:border-white/70 focus:ring-2 focus:ring-white/25" />
              <button type="submit" className="min-h-14 rounded-full bg-white px-7 font-semibold text-black outline-none focus-visible:ring-2 focus-visible:ring-black/45">Join NOXA</button>
            </form>
            <p className="mt-4 text-xs leading-5 text-white/55">No noise. Only meaningful product updates and early-access information.</p>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/[0.06] py-10">
        <div className="page-shell flex flex-col gap-8 text-sm text-white/40 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-bold tracking-[0.22em] text-white">NOXA</p>
            <p className="mt-4">From drivers, for drivers.</p>
            <p className="mt-1">S. KARAKETIDIS</p>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-3">
            <a href="#top" className="transition-colors hover:text-white">Product</a>
            <a href="#waitlist" className="transition-colors hover:text-white">Early access</a>
            <span>© 2026 NOXA</span>
          </div>
        </div>
      </footer>
    </>
  );
}
