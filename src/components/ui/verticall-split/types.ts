import { GalleryImage } from "@/src/lib/api/services/galleryService";

export interface BaseSection {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  accent: string;
  fallbackImage: string;
}

export interface Section extends BaseSection {
  image: string;
  alt: string;
  artist: string;
}

export interface SectionCardProps {
  section: Section;
  index: number;
  isLoading?: boolean;
  sectionsLength: number;
}

export interface ParallaxState {
  currentSection: number;
  isMobile: boolean;
  galleryImages: GalleryImage[];
  isLoading: boolean;
} 