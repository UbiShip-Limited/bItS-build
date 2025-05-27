import { DynamicGallery } from "@/src/components/gallery/dynamic-gallery";
import { ParallaxSections } from "@/src/components/ui/parrallax-section";
import { TattooHero } from "@/src/components/ui/Hero";
import { HorizontalSplitParallax } from "@/src/components/ui/horiztonal-split";
import { ArtistShowcase } from "@/src/components/ui/ArtistShowcase";
import { CtaSection } from "@/src/components/ui/CtaSection";

export default function Home() {
  return (
    <div className="bg-white min-h-screen">
      <TattooHero />
      <HorizontalSplitParallax />
      <ArtistShowcase />
      <ParallaxSections />
      <DynamicGallery />
      <CtaSection />
    </div>
  );
}
