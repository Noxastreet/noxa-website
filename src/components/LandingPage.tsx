import { CultureLanding } from "@/components/culture/CultureLanding";
import type { Locale } from "@/i18n/landing-copy";

export function LandingPage({ locale }: { locale: Locale }) {
  return <CultureLanding locale={locale} />;
}
