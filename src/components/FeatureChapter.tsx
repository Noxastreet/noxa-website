import { Reveal } from "@/components/motion/Reveal";
import { NoxaPhone } from "@/components/visuals/NoxaPhone";
import type { LandingCopy, NoxaPhoneMode } from "@/i18n/landing-copy";

type FeatureChapterProps = {
  number: string;
  eyebrow: string;
  title: string;
  body: string;
  mode: NoxaPhoneMode;
  phoneCopy: LandingCopy["phone"];
  reversed?: boolean;
};

export function FeatureChapter({
  number,
  eyebrow,
  title,
  body,
  mode,
  phoneCopy,
  reversed = false,
}: FeatureChapterProps) {
  return (
    <article className="feature-chapter">
      <div
        className={`grid items-center gap-12 lg:grid-cols-2 lg:gap-20 ${
          reversed ? "lg:[&>*:first-child]:order-2" : ""
        }`}
      >
        <Reveal>
          <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.18em] text-white/[0.35]">
            <span className="text-[#e32c49]">{number}</span>
            <span className="h-px w-8 bg-white/15" />
            <span>{eyebrow}</span>
          </div>
          <h3 className="mt-5 max-w-xl text-[clamp(2.7rem,12vw,5.2rem)] font-semibold leading-[0.94] tracking-[-0.06em]">
            {title}
          </h3>
          <p className="mt-6 max-w-lg text-[1.05rem] leading-7 text-white/[0.52]">{body}</p>
        </Reveal>

        <Reveal delay={0.08} distance={32}>
          <div className="relative isolate overflow-hidden rounded-[2.35rem] border border-white/10 bg-[#0a0a0d] px-5 pb-0 pt-10 shadow-[0_30px_90px_rgba(0,0,0,.28)] sm:px-10 sm:pt-12">
            <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_14%,rgba(200,16,46,.22),transparent_36%)]" />
            <div className="pointer-events-none absolute inset-x-10 top-8 -z-10 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
            <NoxaPhone
              copy={phoneCopy}
              mode={mode}
              className="translate-y-12"
            />
          </div>
        </Reveal>
      </div>
    </article>
  );
}
