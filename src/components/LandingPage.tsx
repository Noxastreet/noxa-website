import { CultureLandingV2 } from "@/components/culture/CultureLandingV2";
import type { Locale } from "@/i18n/landing-copy";

export function LandingPage({ locale }: { locale: Locale }) {
  return <CultureLandingV2 locale={locale} />;
}
