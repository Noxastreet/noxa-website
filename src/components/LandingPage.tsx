import { AfterStory } from "@/components/AfterStory";
import { HeroExperience } from "@/components/hero/HeroExperience";
import { DocumentLanguage } from "@/components/i18n/DocumentLanguage";
import { LegalFooterBar } from "@/components/legal/LegalFooterBar";
import { SiteHeader } from "@/components/navigation/SiteHeader";
import { ProductStory } from "@/components/product/ProductStory";
import { landingCopy, type Locale } from "@/i18n/landing-copy";

export function LandingPage({ locale }: { locale: Locale }) {
  const copy = landingCopy[locale];

  return (
    <>
      <DocumentLanguage locale={locale} />
      <a className="skip-link" href="#main-content">
        {copy.skipToContent}
      </a>
      <SiteHeader
        locale={locale}
        languageCopy={copy.language}
        navigationCopy={copy.navigation}
      />
      <main id="main-content" className="overflow-x-clip">
        <HeroExperience copy={copy.hero} phoneCopy={copy.phone} />
        <ProductStory copy={copy.product} phoneCopy={copy.phone} />
        <AfterStory
          locale={locale}
          communityCopy={copy.community}
          businessCopy={copy.business}
          waitlistCopy={copy.waitlist}
          footerCopy={copy.footer}
        />
        <LegalFooterBar copy={copy.legalFooter} />
      </main>
    </>
  );
}
