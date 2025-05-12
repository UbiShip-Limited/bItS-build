import Image from "next/image";
import { DynamicGallery } from "./components/gallery/dynamic-Gallery";
import { ParallaxSections } from "./components/layout/parallax-section";
import { TattooHero } from "./components/ui/Hero";


export default function Home() {
  return (
    <div className="bg-[#0F0F0F] min-h-screen">
      <TattooHero />
    <ParallaxSections />
     <DynamicGallery />
    </div>
  );
}
