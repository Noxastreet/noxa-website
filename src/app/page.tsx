import { AfterStory } from "@/components/AfterStory";
import { HeroExperience } from "@/components/hero/HeroExperience";
import { LegalFooterBar } from "@/components/legal/LegalFooterBar";
import { SiteHeader } from "@/components/navigation/SiteHeader";
import { ProductStory } from "@/components/product/ProductStory";

export default function Home() {
  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <SiteHeader />
      <main id="main-content" className="overflow-x-clip">
        <HeroExperience />
        <ProductStory />
        <AfterStory />
        <LegalFooterBar />
      </main>
    </>
  );
}
