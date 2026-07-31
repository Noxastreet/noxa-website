import { AfterStory } from "@/components/AfterStory";
import { HeroExperience } from "@/components/hero/HeroExperience";
import { ProductStory } from "@/components/product/ProductStory";

export default function Home() {
  return (
    <main className="overflow-x-clip">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.06] bg-[#050505]/72 backdrop-blur-2xl">
        <div className="page-shell flex h-16 items-center justify-between">
          <a
            className="rounded-md text-sm font-bold tracking-[0.24em] outline-none focus-visible:ring-2 focus-visible:ring-[#c8102e]"
            href="#top"
            aria-label="NOXA home"
          >
            NOXA
          </a>
          <a
            className="inline-flex min-h-11 items-center rounded-full border border-white/10 bg-white/[0.04] px-4 text-sm font-semibold text-white/80 outline-none transition-colors hover:bg-white/[0.08] focus-visible:ring-2 focus-visible:ring-[#c8102e]"
            href="#waitlist"
          >
            Join NOXA
          </a>
        </div>
      </header>

      <HeroExperience />
      <ProductStory />
      <AfterStory />
    </main>
  );
}
