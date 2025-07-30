"use client"

import { useRef, useState, useEffect } from "react"
import { useScroll, motion } from "framer-motion"
import { GalleryService, GalleryImage } from "../../lib/api/services/galleryService"
import { ApiClient } from "../../lib/api/apiClient"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { typography, colors, effects, layout, components } from '@/src/lib/styles/globalStyleConstants'
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

  // Combine base sections with gallery images
  const sections = combineWithGalleryImages(BASE_SECTIONS, galleryImages)

  // Fetch gallery images on component mount
  useEffect(() => {
    const fetchGalleryImages = async () => {
      try {
        setIsLoading(true)
        const apiClient = new ApiClient()
        const galleryService = new GalleryService(apiClient)
        
        // Fetch images from site_content folder with a higher limit to ensure variety
        const images = await galleryService.getSiteContentImages({ limit: 6 })
        
        console.log('🖼️ Fetched site_content images for vertical split:', images)
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
    <div id="services" ref={containerRef} className="min-h-screen bg-[#080808] relative overflow-hidden w-full max-w-full">
      {/* Ornamental background elements */}
      <BackgroundOrnaments />
      
      {/* Header Section */}
      <motion.div 
        className="relative z-10 text-center pt-16 pb-12 md:pt-24 md:pb-16"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <div className={`${layout.containerLg} mx-auto ${layout.padding.mobile} ${layout.padding.tablet} ${layout.padding.desktop}`}>
          {/* Ornamental divider */}
          <div className="flex items-center justify-center mb-8">
            <div className={components.ornament.lineLong}></div>
            <div className={`mx-6 ${components.ornament.dot} relative`}>
              <div className="absolute inset-0 bg-gold-500/10 rounded-full blur-md scale-[2]"></div>
            </div>
            <div className={components.ornament.lineLong}></div>
          </div>
          
          <h2 className={`${typography.h1} ${colors.textPrimary} mb-6`}>
            Our Process
          </h2>
          <p className={`${typography.paragraphLarge} ${colors.textSecondary} max-w-3xl mx-auto`}>
            From consultation to completion, every step is crafted with precision and care. 
            Experience the journey of creating your perfect tattoo on Bowen Island.
          </p>
        </div>
      </motion.div>

      {/* Cards - Responsive layout */}
      <div className={`relative z-10 ${isMobile ? 'px-4 space-y-8 pb-12' : 'max-w-7xl mx-auto px-4 space-y-12 pb-16'}`}>
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

      {/* Scroll progress indicators - only show on desktop */}
      {!isMobile && (
        <ScrollIndicators 
          sections={sections}
          isMobile={isMobile}
          currentSection={currentSection}
          onSectionClick={setCurrentSection}
        />
      )}
      
      {/* Bottom CTA Section - Enhanced */}
      <motion.div 
        className="relative z-10 text-center py-16 md:py-24 bg-gradient-to-b from-transparent via-obsidian/50 to-obsidian"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        {/* Background glow effect */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-gold-500/5 rounded-full blur-[100px]" />
        </div>
        <div className={`relative z-10 ${layout.containerLg} mx-auto ${layout.padding.mobile} ${layout.padding.tablet} ${layout.padding.desktop}`}>
          {/* Enhanced ornamental divider */}
          <div className="flex items-center justify-center mb-10">
            <div className="w-32 sm:w-40 md:w-48 h-px bg-gradient-to-r from-transparent via-gold-500/50 to-gold-500/20" />
            <div className="mx-6 relative">
              <div className="w-4 h-4 bg-gold-500/50 rounded-full" />
              <div className="absolute inset-0 bg-gold-500/30 rounded-full blur-lg scale-[4] animate-pulse" />
            </div>
            <div className="w-32 sm:w-40 md:w-48 h-px bg-gradient-to-l from-transparent via-gold-500/50 to-gold-500/20" />
          </div>
          
          {/* Enhanced heading */}
          <h3 className={`${typography.h2} ${colors.textPrimary} mb-4`}>
            Ready to Start Your Journey?
          </h3>
          
          <p className={`${typography.paragraphLarge} ${colors.textSecondary} mb-10 max-w-2xl mx-auto`}>
            Transform your vision into a lasting work of art. Book your consultation today and take the first step toward your perfect tattoo.
          </p>
          
          {/* Enhanced button with glow effect */}
          <div className="relative inline-block">
            {/* Button glow */}
            <div className="absolute inset-0 bg-gold-500/20 rounded-2xl blur-xl scale-110 animate-pulse" />
            
            <Link href="/tattooRequest" className="relative block">
              <button
                className={`${components.button.base} bg-gradient-to-r from-gold-500 to-gold-400 text-obsidian hover:from-gold-400 hover:to-gold-300 ${effects.transitionNormal} group shadow-xl hover:shadow-2xl hover:shadow-gold-500/30 px-10 py-5 text-lg font-semibold`}
              >
                <span className="relative z-10 flex items-center justify-center">
                  Book Your Consultation
                  <ChevronRight className="ml-3 h-6 w-6 transition-transform duration-200 group-hover:translate-x-2" />
                </span>
              </button>
            </Link>
          </div>
          
          {/* Trust indicators */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-sm ${colors.textMuted}">
            <span className="flex items-center gap-2">
              <span className="text-gold-500">✓</span> Professional Artists
            </span>
            <span className="flex items-center gap-2">
              <span className="text-gold-500">✓</span> Private Studio
            </span>
            <span className="flex items-center gap-2">
              <span className="text-gold-500">✓</span> By Appointment Only
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  )
}