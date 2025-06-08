import { DynamicGallery } from "@/src/components/gallery/dynamic-gallery";
import { AboutBowenIslandSection } from "@/src/components/ui/AboutBowenIsland";
import { TattooHero } from "@/src/components/ui/Hero";
import { VerticalSplitParallax } from "@/src/components/ui/verticall-split";
import { ArtistShowcase } from "@/src/components/ui/ArtistShowcase";
import { ProcessShowcase } from "@/src/components/ui/ProcessShowcase";
import { CtaSection } from "@/src/components/ui/Cta";

export default function Home() {
  return (
    <div className="bg-white min-h-screen">
      <TattooHero />
      <VerticalSplitParallax />
      <AboutBowenIslandSection />
      <ArtistShowcase />
      <DynamicGallery />
      <ProcessShowcase />
      <CtaSection />
    </div>
  );
}
