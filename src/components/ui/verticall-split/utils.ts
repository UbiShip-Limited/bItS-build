import { GalleryImage } from "../../../lib/api/services/galleryService";
import { BaseSection, Section } from "./types";

/**
 * Combines base sections with gallery images
 * Cycles through available images if there are more sections than images
 */
export function combineWithGalleryImages(
  baseSections: BaseSection[], 
  galleryImages: GalleryImage[]
): Section[] {
  return baseSections.map((section, index) => {
    // If we have gallery images, cycle through them
    const galleryImage = galleryImages.length > 0 
      ? galleryImages[index % galleryImages.length] 
      : null;
    
    return {
      ...section,
      image: galleryImage?.mediumUrl || galleryImage?.url || section.fallbackImage,
      alt: galleryImage?.alt || section.title,
      artist: galleryImage?.artist || "Bowen Island Tattoo"
    };
  });
} 