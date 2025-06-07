import { DynamicGallery } from "@/src/components/gallery/dynamic-gallery";
import { AboutBowenIslandSection } from "@/src/components/ui/AboutBowenIsland";
import { TattooHero } from "@/src/components/ui/Hero";
import { HorizontalSplitParallax } from "@/src/components/ui/verticall-split";
import { ArtistShowcase } from "@/src/components/ui/ArtistShowcase";
import { CtaSection } from "@/src/components/ui/Cta";

export default function Home() {
  return (
    <div className="bg-white min-h-screen">
      <TattooHero />
      <HorizontalSplitParallax />
      <AboutBowenIslandSection />
      <ArtistShowcase />
      <DynamicGallery />
      <CtaSection />
    </div>
  );
}
