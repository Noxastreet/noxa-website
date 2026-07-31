const chapters = [
  {
    number: "01",
    title: "Discover",
    body: "See drivers, meets, events and crews around you on one live automotive map.",
  },
  {
    number: "02",
    title: "Meet",
    body: "Find nearby gatherings, see who is joining and navigate directly to the event.",
  },
  {
    number: "03",
    title: "Belong",
    body: "Join crews, build local communities and stay connected beyond a single drive.",
  },
  {
    number: "04",
    title: "Drive",
    body: "Plan routes, follow the road and share live driving moments with your community.",
  },
];

export default function Home() {
  return (
    <main className="overflow-x-clip">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-black/45 backdrop-blur-xl">
        <div className="page-shell flex h-16 items-center justify-between">
          <a className="text-sm font-bold tracking-[0.24em]" href="#top">
            NOXA
          </a>
          <a
            className="flex min-h-11 items-center rounded-full border border-white/10 px-4 text-sm text-white/80"
            href="#waitlist"
          >
            Join NOXA
          </a>
        </div>
      </header>

      <section
        id="top"
        className="page-shell flex min-h-[100svh] flex-col justify-center pb-12 pt-28"
      >
        <div className="max-w-xl">
          <p className="eyebrow">Built for drivers</p>
          <h1 className="text-[clamp(3rem,13vw,5.5rem)] font-semibold leading-[0.93] tracking-[-0.065em]">
            The road becomes social.
          </h1>
          <p className="mt-6 max-w-md text-[1.0625rem] leading-7 text-white/60">
            Discover drivers, meets, crews and automotive events around you.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href="#waitlist"
              className="flex min-h-14 items-center justify-center rounded-full bg-[#c8102e] px-7 font-semibold"
            >
              Join the waitlist
            </a>
            <a
              href="#product"
              className="flex min-h-14 items-center justify-center rounded-full border border-white/10 px-7 text-white/75"
            >
              Explore NOXA
            </a>
          </div>
        </div>

        <div className="relative mt-14 min-h-[420px] overflow-hidden rounded-[2.25rem] border border-white/10 bg-[#0b0b0d] p-4 shadow-2xl shadow-red-950/20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(200,16,46,0.22),transparent_38%)]" />
          <div className="relative mx-auto h-[520px] max-w-[300px] rounded-[2.5rem] border border-white/15 bg-black p-2 shadow-2xl">
            <div className="relative h-full overflow-hidden rounded-[2rem] bg-[#111114]">
              <div className="absolute inset-0 opacity-70 [background-image:linear-gradient(rgba(255,255,255,.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.04)_1px,transparent_1px)] [background-size:36px_36px]" />
              <div className="absolute left-[18%] top-[22%] size-3 rounded-full bg-[#c8102e] shadow-[0_0_0_8px_rgba(200,16,46,.13)]" />
              <div className="absolute right-[22%] top-[42%] size-3 rounded-full bg-white/80 shadow-[0_0_0_8px_rgba(255,255,255,.08)]" />
              <div className="absolute bottom-[29%] left-[38%] size-3 rounded-full bg-white/80 shadow-[0_0_0_8px_rgba(255,255,255,.08)]" />
              <div className="absolute left-[21%] top-[25%] h-[46%] w-[48%] rotate-[-17deg] rounded-[50%] border-r-2 border-[#c8102e]" />
              <div className="absolute inset-x-4 bottom-4 rounded-3xl border border-white/10 bg-black/70 p-4 backdrop-blur-xl">
                <p className="text-xs uppercase tracking-[0.16em] text-[#c8102e]">Nearby</p>
                <p className="mt-2 text-lg font-semibold">Night Run Thessaloniki</p>
                <p className="mt-1 text-sm text-white/50">2.4 km · 18 drivers</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="product" className="section page-shell">
        <p className="eyebrow">One automotive world</p>
        <h2 className="max-w-3xl text-[clamp(2.5rem,10vw,4.75rem)] font-semibold leading-[0.98] tracking-[-0.055em]">
          Everything around your drive, on one map.
        </h2>

        <div className="mt-16 grid gap-5 md:grid-cols-2">
          {chapters.map((chapter) => (
            <article
              key={chapter.number}
              className="min-h-[310px] rounded-[2rem] border border-white/10 bg-[#0b0b0d] p-6 md:p-8"
            >
              <p className="text-sm font-semibold text-[#c8102e]">{chapter.number}</p>
              <h3 className="mt-24 text-4xl font-semibold tracking-[-0.045em]">
                {chapter.title}
              </h3>
              <p className="mt-4 max-w-sm leading-7 text-white/55">{chapter.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section border-y border-white/5 bg-[#0b0b0d]">
        <div className="page-shell">
          <p className="eyebrow">Community</p>
          <h2 className="max-w-3xl text-[clamp(2.5rem,10vw,4.75rem)] font-semibold leading-[0.98] tracking-[-0.055em]">
            Not another social network.
          </h2>
          <p className="mt-6 max-w-xl text-lg leading-8 text-white/55">
            A place built around the way drivers actually discover, meet and move together.
          </p>
        </div>
      </section>

      <section className="section page-shell">
        <div className="rounded-[2rem] border border-white/10 bg-[#0b0b0d] p-6 md:p-10">
          <p className="eyebrow">For business</p>
          <h2 className="max-w-2xl text-4xl font-semibold tracking-[-0.045em] md:text-6xl">
            Put your automotive business on the map.
          </h2>
          <p className="mt-5 max-w-xl leading-7 text-white/55">
            Built for detailing studios, garages, shops, partners and event organisers.
          </p>
          <a
            className="mt-8 inline-flex min-h-14 items-center rounded-full border border-white/10 px-7 font-semibold"
            href="#waitlist"
          >
            Become a NOXA partner
          </a>
        </div>
      </section>

      <section id="waitlist" className="section page-shell">
        <div className="rounded-[2rem] bg-[#c8102e] p-6 md:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-white/70">
            Early access
          </p>
          <h2 className="mt-4 max-w-2xl text-[clamp(2.75rem,11vw,5.5rem)] font-semibold leading-[0.94] tracking-[-0.06em]">
            Your automotive world. One map.
          </h2>
          <form className="mt-9 flex flex-col gap-3 sm:max-w-xl sm:flex-row">
            <label className="sr-only" htmlFor="email">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="Email address"
              className="min-h-14 flex-1 rounded-full border border-white/20 bg-black/20 px-5 text-white outline-none placeholder:text-white/55 focus:border-white/60"
            />
            <button
              type="submit"
              className="min-h-14 rounded-full bg-white px-7 font-semibold text-black"
            >
              Join NOXA
            </button>
          </form>
        </div>
      </section>

      <footer className="border-t border-white/5 py-10">
        <div className="page-shell flex flex-col gap-5 text-sm text-white/45 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-bold tracking-[0.2em] text-white">NOXA</p>
            <p className="mt-3">From drivers, for drivers.</p>
            <p>S. KARAKETIDIS</p>
          </div>
          <p>© 2026 NOXA</p>
        </div>
      </footer>
    </main>
  );
}
