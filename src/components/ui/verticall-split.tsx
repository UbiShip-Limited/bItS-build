"use client"

import { useRef, useState, useEffect } from "react"
import { useScroll, useTransform, PanInfo, useSpring, useMotionValue } from "framer-motion"
import { GalleryService, GalleryImage } from "../../lib/api/services/galleryService"
import { ApiClient } from "../../lib/api/apiClient"
import { 
  MobileCard, 
  DesktopCard, 
  BackgroundOrnaments, 
  ScrollIndicators,
  combineWithGalleryImages,
  BASE_SECTIONS
} from "./verticall-split/index"

export function VerticalSplitParallax() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [currentSection, setCurrentSection] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  })

  // Horizontal transform for the scrolling effect
  const x = useTransform(scrollYProgress, [0, 1], ["0%", "-66.66%"])

  // Combine base sections with gallery images
  const sections = combineWithGalleryImages(BASE_SECTIONS, galleryImages)

  // Handle swipe gestures (mobile only)
  const handlePan = (event: any, info: PanInfo) => {
    if (!isMobile) return;
    
    const swipeThreshold = 50
    
    if (Math.abs(info.offset.x) > swipeThreshold) {
      if (info.offset.x > 0 && currentSection > 0) {
        // Swipe right - go to previous section
        setCurrentSection(prev => Math.max(0, prev - 1))
      } else if (info.offset.x < 0 && currentSection < sections.length - 1) {
        // Swipe left - go to next section
        setCurrentSection(prev => Math.min(sections.length - 1, prev + 1))
      }
    }
  }

  // Calculate position based on current section for swipe mode
  const sectionMotionValue = useMotionValue(currentSection)
  const springValue = useSpring(sectionMotionValue, { stiffness: 300, damping: 30 })
  const swipeX = useTransform(
    springValue,
    [0, 1, 2],
    ["0%", "-33.33%", "-66.66%"]
  )
  
  // Update motion value when current section changes
  useEffect(() => {
    sectionMotionValue.set(currentSection)
  }, [currentSection, sectionMotionValue])

  // Fetch gallery images on component mount
  useEffect(() => {
    const fetchGalleryImages = async () => {
      try {
        setIsLoading(true)
        const apiClient = new ApiClient()
        const galleryService = new GalleryService(apiClient)
        
        // Fetch images from site_content folder with a higher limit to ensure variety
        const images = await galleryService.getSiteContentImages({ limit: 6 })
        
        console.log('🖼️ Fetched site_content images for horizontal split:', images)
        setGalleryImages(images)
      } catch (error) {
        console.error('❌ Failed to fetch gallery images:', error)
        // Keep empty array, component will use fallback images
      } finally {
        setIsLoading(false)
      }
    }

    fetchGalleryImages()
  }, [])

  // Handle mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return (
    <div ref={containerRef} className="min-h-screen bg-[#080808] relative py-8 md:py-16 overflow-hidden w-full max-w-full">
      {/* Ornamental background elements */}
      <BackgroundOrnaments />

      {/* Cards - Responsive layout */}
      <div className={`relative z-10 ${isMobile ? 'px-4 space-y-8' : 'max-w-7xl mx-auto px-4 space-y-12'}`}>
        {sections.map((section, index) => 
          isMobile ? (
            <MobileCard 
              key={section.id} 
              section={section} 
              index={index} 
              isLoading={isLoading}
              sectionsLength={sections.length}
            />
          ) : (
            <DesktopCard 
              key={section.id} 
              section={section} 
              index={index} 
              isLoading={isLoading}
              sectionsLength={sections.length}
            />
          )
        )}
      </div>

      {/* Scroll progress indicators */}
      <ScrollIndicators 
        sections={sections}
        isMobile={isMobile}
        currentSection={currentSection}
        onSectionClick={setCurrentSection}
      />
    </div>
  )
}