"use client"

import React, { useRef, useState, useEffect } from "react"
import { motion, useScroll, useTransform, PanInfo, useSpring, useMotionValue } from "framer-motion"
import Image from "next/image"
import { GalleryService, GalleryImage } from "../../lib/api/services/galleryService"
import { ApiClient } from "../../lib/api/apiClient"
import Link from "next/link"

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

  // Base section data - will be enhanced with real gallery images
  const baseSections = [
    {
      id: 1,
      title: "TRIBAL ARTISTRY",
      subtitle: "TRADITIONAL EXCELLENCE",
      description: "Experience the raw power of traditional tribal designs, where ancient symbols meet modern technique in perfect harmony.",
      accent: "Authentic",
      fallbackImage: "/images/shop-pic2.png"
    },
    {
      id: 2,
      title: "CUSTOM DESIGNS",
      subtitle: "PERSONALIZED EXCELLENCE", 
      description: "Every piece tells a story. Our master artists work with you to create completely original designs that reflect your unique vision.",
      accent: "Bespoke",
      fallbackImage: "/images/shop-pic2.png"
    },
    {
      id: 3,
      title: "MASTER ARTISTS",
      subtitle: "DECADES OF EXPERIENCE",
      description: "Our award-winning artists bring decades of experience and unmatched skill to every piece they create.",
      accent: "Expert",
      fallbackImage: "/images/shop-pic2.png"
    }
  ]

  // Combine base sections with gallery images - cycle through available images
  const sections = baseSections.map((section, index) => {
    // If we have gallery images, cycle through them
    const galleryImage = galleryImages.length > 0 
      ? galleryImages[index % galleryImages.length] 
      : null
    
    return {
      ...section,
      image: galleryImage?.mediumUrl || galleryImage?.url || section.fallbackImage,
      alt: galleryImage?.alt || section.title,
      artist: galleryImage?.artist || "Bowen Island Tattoo"
    }
  })

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

  // Mobile card component
  const MobileCard = ({ section, index }: { section: any; index: number }) => (
    <motion.div 
      key={section.id} 
      className="relative mb-8"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
    >
      <div className="bg-[#080808] border border-[#C9A449]/20 rounded-lg overflow-hidden group hover:border-[#C9A449]/40 transition-all duration-500">
        {/* Mobile Image Section - Full width, larger height */}
        <div className="relative h-64 overflow-hidden">
          {isLoading ? (
            <div className="w-full h-full bg-[#080808] flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-[#C9A449]/30 border-t-[#C9A449] rounded-full animate-spin"></div>
            </div>
          ) : (
            <Image
              src={section.image}
              alt={section.alt}
              fill
              sizes="100vw"
              className="object-cover brightness-40 group-hover:brightness-50 transition-all duration-500"
              priority={index === 0}
            />
          )}
          {/* Gold overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#080808]/90 via-[#C9A449]/5 to-transparent group-hover:via-[#C9A449]/10 transition-all duration-500"></div>
          
          {/* Mobile Ornamental elements */}
          <div className="absolute top-4 left-4">
            <div className="w-8 h-8 border border-[#C9A449]/50 rotate-45 relative">
              <div className="absolute inset-1.5 border border-[#C9A449]/30 rotate-45"></div>
            </div>
          </div>
          <div className="absolute top-4 right-4">
            <div className="relative">
              <div className="w-8 h-8 border border-[#C9A449]/40 rotate-12"></div>
              <div className="absolute top-1/2 left-1/2 w-1.5 h-1.5 bg-[#C9A449]/60 rotate-45 -translate-x-1/2 -translate-y-1/2"></div>
            </div>
          </div>

          {/* Artist credit overlay for mobile */}
          {section.artist && section.artist !== "Bowen Island Tattoo" && (
            <div className="absolute bottom-3 left-4 text-xs text-[#C9A449]/60 font-body tracking-wide">
              Artist: {section.artist}
            </div>
          )}

          {/* Accent label overlay */}
          <div className="absolute bottom-3 right-4">
            <div className="inline-block bg-[#C9A449]/10 border border-[#C9A449]/50 px-2 py-1 text-xs font-semibold text-[#C9A449] uppercase tracking-wider font-body backdrop-blur-sm">
              {section.accent}
            </div>
          </div>
        </div>

        {/* Mobile Content Section */}
        <div className="relative p-6">
          {/* Background pattern */}
          <div className="absolute top-0 right-0 w-16 h-16 opacity-[0.02]">
            <Image 
              src="/images/bowen-logo.svg" 
              alt="Background Logo" 
              fill
              sizes="64px"
              className="object-contain brightness-0 invert"
            />
          </div>

          {/* Ornamental corner elements for mobile */}
          <div className="absolute top-4 right-4">
            <div className="w-4 h-4 border-t border-r border-[#C9A449]/30 relative">
              <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 border border-[#C9A449]/50 rotate-45"></div>
            </div>
          </div>
          <div className="absolute bottom-4 left-4">
            <div className="w-4 h-4 border-b border-l border-[#C9A449]/30 relative">
              <div className="absolute -bottom-0.5 -left-0.5 w-1.5 h-1.5 border border-[#C9A449]/50 rotate-45"></div>
            </div>
          </div>

          {/* Content */}
          <div className="relative z-10">
            {/* Ornamental line above content */}
            <div className="flex items-center mb-4">
              <div className="w-6 h-[0.5px] bg-gradient-to-r from-transparent to-[#C9A449]/60"></div>
              <div className="mx-2 flex items-center justify-center">
                <span className="text-[#C9A449] text-xs">✦</span>
              </div>
              <div className="w-6 h-[0.5px] bg-gradient-to-l from-transparent to-[#C9A449]/60"></div>
            </div>

            {/* Main title */}
            <h2 className="font-heading text-2xl mb-2 text-white leading-tight tracking-wide">
              {section.title}
            </h2>

            {/* Subtitle */}
            <h3 className="font-body text-sm text-[#C9A449]/80 mb-4 uppercase tracking-wide font-light">
              {section.subtitle}
            </h3>

            {/* Ornamental divider */}
            <div className="flex items-center mb-4">
              <div className="w-8 h-[0.5px] bg-gradient-to-r from-[#C9A449]/80 to-[#C9A449]/20"></div>
              <div className="w-1.5 h-1.5 border border-[#C9A449]/50 rotate-45 mx-2"></div>
            </div>

            {/* Description */}
            <p className="font-body text-sm text-white/80 leading-relaxed mb-6 italic">
              {section.description}
            </p>

            {/* CTA Button - Mobile optimized */}
            <Link 
              href="/tattooRequest" 
              className="group relative overflow-hidden bg-transparent border border-[#C9A449]/70 text-white hover:bg-[#C9A449]/10 hover:border-[#C9A449] transition-all duration-300 px-6 py-3 font-body tracking-widest uppercase text-xs font-medium w-full flex items-center justify-center min-h-[44px] active:scale-95"
            >
              <span className="relative z-10">Learn More</span>
              <div className="absolute inset-0 bg-[#C9A449]/5 transform translate-x-full group-hover:translate-x-0 transition-transform duration-300"></div>
            </Link>
          </div>
        </div>
      </div>
      
      {/* Mobile card separator line */}
      {index < sections.length - 1 && (
        <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 flex items-center">
          <div className="w-12 h-[0.5px] bg-gradient-to-r from-transparent via-[#C9A449]/30 to-transparent"></div>
          <div className="mx-3 w-1.5 h-1.5 border border-[#C9A449]/40 rotate-45"></div>
          <div className="w-12 h-[0.5px] bg-gradient-to-l from-transparent via-[#C9A449]/30 to-transparent"></div>
        </div>
      )}
    </motion.div>
  );

  // Desktop card component
  const DesktopCard = ({ section, index }: { section: any; index: number }) => {
    const isReversed = index % 2 === 1;
    
    return (
      <motion.div 
        key={section.id} 
        className="relative"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6, delay: index * 0.2 }}
      >
        <div className={`flex ${isReversed ? 'flex-row-reverse' : 'flex-row'} bg-[#080808] border border-[#C9A449]/20 rounded-lg overflow-hidden min-h-[400px] group hover:border-[#C9A449]/40 transition-all duration-500`}>
          {/* Image Section */}
          <div className="w-1/2 relative overflow-hidden">
            {isLoading ? (
              <div className="w-full h-full bg-[#080808] flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-[#C9A449]/30 border-t-[#C9A449] rounded-full animate-spin"></div>
              </div>
            ) : (
              <Image
                src={section.image}
                alt={section.alt}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover brightness-40 group-hover:brightness-50 transition-all duration-500"
                priority={index === 0}
              />
            )}
            {/* Gold overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#C9A449]/10 to-[#C9A449]/20 group-hover:via-[#C9A449]/15 group-hover:to-[#C9A449]/25 transition-all duration-500"></div>
            
            {/* Ornamental elements */}
            <div className={`absolute top-6 ${isReversed ? 'right-6' : 'left-6'}`}>
              <div className="w-10 h-10 border border-[#C9A449]/50 rotate-45 relative">
                <div className="absolute inset-2 border border-[#C9A449]/30 rotate-45"></div>
              </div>
            </div>
            <div className={`absolute bottom-6 ${isReversed ? 'left-6' : 'right-6'}`}>
              <div className="relative">
                <div className="w-12 h-12 border border-[#C9A449]/40 rotate-12"></div>
                <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-[#C9A449]/60 rotate-45 -translate-x-1/2 -translate-y-1/2"></div>
              </div>
            </div>

            {/* Artist credit (if available) */}
            {section.artist && section.artist !== "Bowen Island Tattoo" && (
              <div className={`absolute bottom-4 ${isReversed ? 'right-4' : 'left-4'} text-xs text-[#C9A449]/60 font-body tracking-wide`}>
                Artist: {section.artist}
              </div>
            )}
          </div>

          {/* Content Section */}
          <div className="w-1/2 relative flex flex-col justify-center px-8 py-8">
            {/* Background pattern */}
            <div className={`absolute top-0 ${isReversed ? 'left-0' : 'right-0'} w-24 h-24 opacity-[0.03]`}>
              <Image 
                src="/images/bowen-logo.svg" 
                alt="Background Logo" 
                fill
                sizes="96px"
                className="object-contain brightness-0 invert"
              />
            </div>

            {/* Ornamental corner elements */}
            <div className={`absolute top-4 ${isReversed ? 'left-4' : 'right-4'}`}>
              <div className={`w-6 h-6 ${isReversed ? 'border-t border-l' : 'border-t border-r'} border-[#C9A449]/30 relative`}>
                <div className={`absolute ${isReversed ? '-top-1 -left-1' : '-top-1 -right-1'} w-2 h-2 border border-[#C9A449]/50 rotate-45`}></div>
              </div>
            </div>
            <div className={`absolute bottom-4 ${isReversed ? 'right-4' : 'left-4'}`}>
              <div className={`w-6 h-6 ${isReversed ? 'border-b border-r' : 'border-b border-l'} border-[#C9A449]/30 relative`}>
                <div className={`absolute ${isReversed ? '-bottom-1 -right-1' : '-bottom-1 -left-1'} w-2 h-2 border border-[#C9A449]/50 rotate-45`}></div>
              </div>
            </div>

            {/* Content */}
            <div className="relative z-10">
              {/* Ornamental line above content */}
              <div className="flex items-center mb-4">
                <div className="w-8 h-[0.5px] bg-gradient-to-r from-transparent to-[#C9A449]/60"></div>
                <div className="mx-3 flex items-center justify-center">
                  <span className="text-[#C9A449] text-xs">✦</span>
                </div>
                <div className="w-8 h-[0.5px] bg-gradient-to-l from-transparent to-[#C9A449]/60"></div>
              </div>

              {/* Accent label */}
              <div className="inline-block bg-transparent border border-[#C9A449]/50 px-3 py-1 text-xs font-semibold text-[#C9A449] mb-4 uppercase tracking-widest font-body">
                {section.accent}
              </div>

              {/* Main title */}
              <h2 className="font-heading text-3xl md:text-4xl mb-3 text-white leading-tight tracking-wide">
                {section.title}
              </h2>

              {/* Subtitle */}
              <h3 className="font-body text-base text-[#C9A449]/80 mb-4 uppercase tracking-wide font-light">
                {section.subtitle}
              </h3>

              {/* Ornamental divider */}
              <div className="flex items-center mb-6">
                <div className="w-12 h-[0.5px] bg-gradient-to-r from-[#C9A449]/80 to-[#C9A449]/20"></div>
                <div className="w-2 h-2 border border-[#C9A449]/50 rotate-45 mx-3"></div>
              </div>

              {/* Description */}
              <p className="font-body text-sm text-white/80 leading-relaxed max-w-md mb-6 italic">
                {section.description}
              </p>

              {/* CTA Button */}
              <Link 
                href="/tattooRequest" 
                className="group relative overflow-hidden bg-transparent border border-[#C9A449]/70 text-white hover:bg-[#C9A449]/10 hover:border-[#C9A449] transition-all duration-300 px-6 py-3 font-body tracking-widest uppercase text-xs font-medium"
              >
                <span className="relative z-10">Learn More</span>
                <div className="absolute inset-0 bg-[#C9A449]/5 transform translate-x-full group-hover:translate-x-0 transition-transform duration-300"></div>
              </Link>
            </div>
          </div>
        </div>
        
        {/* Card separator line */}
        {index < sections.length - 1 && (
          <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 flex items-center">
            <div className="w-16 h-[0.5px] bg-gradient-to-r from-transparent via-[#C9A449]/30 to-transparent"></div>
            <div className="mx-4 w-2 h-2 border border-[#C9A449]/40 rotate-45"></div>
            <div className="w-16 h-[0.5px] bg-gradient-to-l from-transparent via-[#C9A449]/30 to-transparent"></div>
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <div ref={containerRef} className="min-h-screen bg-[#080808] relative py-8 md:py-16 overflow-hidden">
      {/* Ornamental background elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/6 w-32 h-32 opacity-[0.02]">
          <Image 
            src="/images/bowen-logo.svg" 
            alt="Background Logo" 
            fill
            sizes="128px"
            className="object-contain brightness-0 invert"
          />
        </div>
        <div className="absolute top-3/4 right-1/6 w-24 h-24 opacity-[0.02] rotate-45">
          <Image 
            src="/images/bowen-logo.svg" 
            alt="Background Logo" 
            fill
            sizes="96px"
            className="object-contain brightness-0 invert"
          />
        </div>
        <div className="absolute top-1/2 left-1/2 w-16 h-16 opacity-[0.01] -translate-x-1/2 -translate-y-1/2">
          <Image 
            src="/images/bowen-logo.svg" 
            alt="Background Logo" 
            fill
            sizes="64px"
            className="object-contain brightness-0 invert"
          />
        </div>
      </div>

      {/* Cards - Responsive layout */}
      <div className={`relative z-10 ${isMobile ? 'px-4 space-y-8' : 'max-w-7xl mx-auto px-4 space-y-12'}`}>
        {sections.map((section, index) => 
          isMobile ? (
            <MobileCard key={section.id} section={section} index={index} />
          ) : (
            <DesktopCard key={section.id} section={section} index={index} />
          )
        )}
      </div>

      {/* Scroll progress indicators - Enhanced for mobile */}
      <div className={`fixed ${isMobile ? 'bottom-4' : 'bottom-8'} left-1/2 transform -translate-x-1/2 flex items-center space-x-3 md:space-x-4 z-20`}>
        {/* Ornamental line */}
        <div className={`${isMobile ? 'w-6' : 'w-8'} h-[0.5px] bg-gradient-to-r from-transparent to-[#C9A449]/40`}></div>
        
        {/* Indicators */}
        <div className={`flex ${isMobile ? 'space-x-2' : 'space-x-3'}`}>
          {sections.map((_, index) => (
            <motion.div
              key={index}
              className={`${isMobile ? 'w-1.5 h-1.5' : 'w-2 h-2'} border border-[#C9A449]/40 rotate-45 relative cursor-pointer`}
              whileInView={{ scale: 1.2 }}
              viewport={{ margin: "-200px" }}
              onClick={() => isMobile && setCurrentSection(index)}
            >
              <motion.div
                className="absolute inset-0.5 bg-[#C9A449] rotate-45"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ margin: "-200px" }}
                transition={{ duration: 0.3 }}
              />
            </motion.div>
          ))}
        </div>
        
        {/* Ornamental line */}
        <div className={`${isMobile ? 'w-6' : 'w-8'} h-[0.5px] bg-gradient-to-l from-transparent to-[#C9A449]/40`}></div>
      </div>
    </div>
  )
}