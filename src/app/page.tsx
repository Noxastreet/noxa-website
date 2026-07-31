import { AfterStory } from "@/components/AfterStory";
import { HeroExperience } from "@/components/hero/HeroExperience";
import { SiteHeader } from "@/components/navigation/SiteHeader";
import { ProductStory } from "@/components/product/ProductStory";

export default function Home() {
  return (
    <main className="overflow-x-clip">
      <SiteHeader />
      <HeroExperience />
      <ProductStory />
      <AfterStory />
    </main>
  );
}
