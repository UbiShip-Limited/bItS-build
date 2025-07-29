"use client"

// 🎯 SMART COST-EFFECTIVE GALLERY: Progressive loading strategy
// - Phase 1: 6 featured images (immediate load)
// - Phase 2: 8 more images (on user engagement)
// - Phase 3: Extended collection (on explicit request)

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import { ZoomIn, Loader2, RefreshCw } from "lucide-react"
import { GalleryService, GalleryImage } from "@/src/lib/api/services/galleryService"
import { apiClient } from "@/src/lib/api/apiClient"
import { Button } from "@/src/components/ui/button"
import { typography, colors, effects, layout, components } from '@/src/lib/styles/globalStyleConstants'
import { Lightbox } from '@/src/components/ui/Lightbox'
import { GAEvents } from '@/src/lib/analytics/ga-events'

const galleryService = new GalleryService(apiClient);

// Load all images at once
const INITIAL_LOAD = 1000;  // Load all images immediately

export function DynamicGallery() {
  // Simplified state
  const [galleryItems, setGalleryItems] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  
  // Mobile state
  const [isMobile, setIsMobile] = useState(false);
  
  const galleryRef = useRef<HTMLDivElement>(null);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Simple intersection observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    )

    if (galleryRef.current) {
      observer.observe(galleryRef.current)
    }

    return () => observer.disconnect()
  }, [])

  // Load initial images
  useEffect(() => {
    if (isVisible) {
      loadInitialImages();
    }
  }, [isVisible]);

  const loadInitialImages = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const initialImages = await galleryService.getInitialGalleryImages(INITIAL_LOAD);
      setGalleryItems(initialImages);
      
    } catch (err) {
      console.error('Failed to load gallery images:', err);
      setError('Failed to load gallery images. Please try again.');
    } finally {
      setLoading(false);
    }
  };


  // Handle lightbox navigation
  const handleLightboxNavigate = (index: number) => {
    setSelectedIndex(index);
    if (galleryItems[index]) {
      GAEvents.galleryImageViewed(galleryItems[index].publicId || `image_${index}`);
    }
  };
  
  const handleLightboxClose = () => {
    setSelectedIndex(-1);
  };

  // Error state
  if (error && !loading && galleryItems.length === 0) {
    return (
      <div className="bg-obsidian py-20 px-6 sm:px-8 md:px-12 lg:px-20">
        <div className="container mx-auto text-center">
          <h2 className="font-heading text-4xl md:text-5xl font-bold text-white mb-6 tracking-wide">
            Artist Gallery
          </h2>
          <div className="text-red-400 mb-6">{error}</div>
          <Button
            onClick={loadInitialImages}
            variant="primary"
            size="md"
          >
            <RefreshCw size={20} className="mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div ref={galleryRef} className="bg-obsidian py-20 md:py-32 px-6 sm:px-8 md:px-12 lg:px-20">
      <div className="container mx-auto">
        {/* Gallery Header */}
        <motion.div 
          className="mb-8 md:mb-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-block relative mb-6">
            <div className="absolute -top-3 -left-3 h-4 w-4 border-t border-l border-gold-500/50"></div>
            <div className="absolute -top-3 -right-3 h-4 w-4 border-t border-r border-gold-500/50"></div>
            <div className="absolute -bottom-3 -left-3 h-4 w-4 border-b border-l border-gold-500/50"></div>
            <div className="absolute -bottom-3 -right-3 h-4 w-4 border-b border-r border-gold-500/50"></div>
            <h2 className={`font-heading ${isMobile ? 'text-3xl' : 'text-4xl md:text-5xl lg:text-6xl'} font-medium text-white px-6 md:px-8 tracking-wide`}>
              The Gallery
            </h2>
          </div>
          <div className="h-px w-32 md:w-40 mx-auto bg-gradient-to-r from-gold-500 to-gold-500/0 mb-2"></div>
          <div className="h-px w-32 md:w-40 mx-auto bg-gradient-to-l from-gold-500 to-gold-500/0 mb-6 md:mb-8"></div>
          <p className={`text-white/80 max-w-2xl mx-auto font-body ${isMobile ? 'text-base px-4' : 'text-lg'} mb-6 leading-relaxed`}>
            Explore our collection of tattoos we hope it inspires you. We make sure each piece represents our commitment 
            to quality, creativity, and personal expression.
          </p>
          
        </motion.div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col justify-center items-center py-16 md:py-24">
            <Loader2 className="animate-spin text-gold-500 mb-6" size={isMobile ? 36 : 48} />
            <p className={`text-white/60 font-body ${isMobile ? 'text-sm' : 'text-base'} tracking-wide`}>Loading gallery...</p>
          </div>
        )}

        {/* Simplified Gallery Grid */}
        {!loading && galleryItems.length > 0 && (
          <motion.div 
            className={isMobile 
              ? 'grid grid-cols-2 gap-3' 
              : 'columns-1 sm:columns-2 lg:columns-3 gap-4 md:gap-6 space-y-4 md:space-y-6'
            }
            initial={{ opacity: 0 }}
            animate={isVisible ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            {galleryItems.map((item, index) => (
              <motion.div
                key={item.id}
                className={`relative overflow-hidden rounded-lg ${isMobile ? 'mb-4' : 'mb-4 md:mb-6 break-inside-avoid'}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: Math.min(index * 0.05, 1) }}
                onMouseEnter={() => !isMobile && setHoveredItem(item.id)}
                onMouseLeave={() => !isMobile && setHoveredItem(null)}
                onClick={() => {
                  setSelectedIndex(index);
                  GAEvents.galleryLightboxOpened();
                  GAEvents.galleryImageViewed(item.publicId || `image_${index}`);
                }}
                style={{
                  height: isMobile 
                    ? '200px' 
                    : `${Math.max(200, Math.min(400, item.height * 0.3))}px`,
                }}
              >
                <div className="relative w-full h-full group cursor-pointer border border-gold-500/0 hover:border-gold-500/40 transition-all duration-300 overflow-hidden">
                  <Image
                    src={item.thumbnailUrl || item.url}
                    alt={item.alt}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes={isMobile ? "100vw" : "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"}
                    loading={index < 6 ? "eager" : "lazy"}
                  />

                  {/* Simplified overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-obsidian/80 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300"></div>

                  {/* Corner accents - simplified for mobile */}
                  {!isMobile && (
                    <>
                      <div className="absolute -top-1 -left-1 h-6 w-6 border-t border-l border-gold-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="absolute -top-1 -right-1 h-6 w-6 border-t border-r border-gold-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="absolute -bottom-1 -left-1 h-6 w-6 border-b border-l border-gold-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="absolute -bottom-1 -right-1 h-6 w-6 border-b border-r border-gold-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </>
                  )}

                  {/* Info overlay - always visible on mobile */}
                  <div className={`absolute bottom-0 left-0 right-0 ${isMobile ? 'p-2' : 'p-3 md:p-4'} transition-transform duration-300 ${
                    isMobile ? "translate-y-0 opacity-100" : hoveredItem === item.id ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
                  }`}>
                    <h3 className={`text-white font-medium ${isMobile ? 'text-xs line-clamp-1' : 'text-base mb-1'}`}>
                      {item.alt === item.publicId ? 'Tattoo Artwork' : item.alt}
                    </h3>
                    {!isMobile && (
                      <p className="text-white/80 text-sm">
                        {item.artist}
                      </p>
                    )}
                  </div>

                  {/* Zoom icon - always visible on mobile */}
                  <div className={`absolute ${isMobile ? 'top-2 right-2' : 'top-4 right-4'} bg-gold-500 ${isMobile ? 'p-1' : 'p-2'} rounded-full transition-opacity duration-300 shadow-subtle ${
                    isMobile ? "opacity-90" : hoveredItem === item.id ? "opacity-100" : "opacity-0"
                  }`}>
                    <ZoomIn size={isMobile ? 12 : 16} className="text-obsidian" />
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}


        {/* Empty State */}
        {!loading && galleryItems.length === 0 && (
          <div className="text-center py-12 md:py-20">
            <p className={`text-white/60 ${isMobile ? 'text-lg' : 'text-xl'} mb-4`}>No images found</p>
          </div>
        )}
      </div>

      {/* Lightbox for viewing images */}
      <Lightbox
        images={galleryItems}
        currentIndex={selectedIndex}
        isOpen={selectedIndex >= 0}
        onClose={handleLightboxClose}
        onNavigate={handleLightboxNavigate}
      />
    </div>
  )
}