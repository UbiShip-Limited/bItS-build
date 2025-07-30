import { DynamicGallery } from "@/src/components/gallery/dynamic-gallery";
import { AboutBowenIslandSection } from "@/src/components/ui/AboutBowenIsland";
import { TattooHero } from "@/src/components/ui/Hero";
import { VerticalSplitParallax } from "@/src/components/ui/verticall-split";
import { ArtistShowcase } from "@/src/components/ui/ArtistShowcase";
import { TattooAftercareGuide } from "@/src/components/ui/TattooAftercareGuide";
import { SectionSpacer } from "@/src/components/ui/SectionSpacer";
import { FrequentlyAskedQuestionsAccordion } from "@/src/components/ui/FrequentlyAskedQuestionsAccordion";
import { CtaSection } from "@/src/components/ui/Cta";

export default function Home() {
  return (
    <div className="min-h-screen overflow-x-hidden" style={{ backgroundColor: 'var(--obsidian, #0A0A0A)' }}>
      <TattooHero />
      
      <SectionSpacer size="medium" dividerStyle="ornament" />
      <VerticalSplitParallax />
      
      <SectionSpacer size="medium" dividerStyle="line" />
      <AboutBowenIslandSection />
      
      <SectionSpacer size="medium" dividerStyle="dots" />
      <ArtistShowcase />
      
      <SectionSpacer size="medium" dividerStyle="ornament" />
      <DynamicGallery />

      <SectionSpacer size="medium" dividerStyle="dots" />
      <FrequentlyAskedQuestionsAccordion />

      <SectionSpacer size="medium" dividerStyle="line" />
      <TattooAftercareGuide />

      <SectionSpacer size="medium" showDivider={false} />
      <CtaSection />
    </div>
  );
}
