"use client"

// 🎯 SMART COST-EFFECTIVE GALLERY: Progressive loading strategy
// - Phase 1: 6 featured images (immediate load)
// - Phase 2: 8 more images (on user engagement)
// - Phase 3: Extended collection (on explicit request)

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { X, ZoomIn, Loader2, RefreshCw, Eye } from "lucide-react"
import { GalleryService, GalleryImage } from "@/src/lib/api/services/galleryService"
import { apiClient } from "@/src/lib/api/apiClient"

const galleryService = new GalleryService(apiClient);

// Enhanced loading strategy - Load more images for better showcase
const INITIAL_LOAD = 18;  // Load immediately - increased for better first impression
const LOAD_MORE_COUNT = 12; // Load when user clicks "Load More" - bigger batches

export function DynamicGallery() {
  // Simplified state
  const [galleryItems, setGalleryItems] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<GalleryImage | null>(null);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [canLoadMore, setCanLoadMore] = useState(true);
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
      
      // Check if we can load more
      if (initialImages.length < INITIAL_LOAD) {
        setCanLoadMore(false);
      }
      
    } catch (err) {
      console.error('Failed to load gallery images:', err);
      setError('Failed to load gallery images. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadMoreImages = async () => {
    if (loadingMore || !canLoadMore) return;
    
    try {
      setLoadingMore(true);
      
      const moreImages = await galleryService.getMoreGalleryImages(
        galleryItems.length,
        LOAD_MORE_COUNT
      );
      
      // Filter out duplicates
      const newImages = moreImages.filter(newImg => 
        !galleryItems.some(existingImg => existingImg.id === newImg.id)
      );
      
      if (newImages.length === 0) {
        setCanLoadMore(false);
      } else {
        setGalleryItems(prev => [...prev, ...newImages]);
        
        // Check if we got fewer images than requested
        if (newImages.length < LOAD_MORE_COUNT) {
          setCanLoadMore(false);
        }
      }
      
    } catch (err) {
      console.error('Failed to load more images:', err);
      setError('Failed to load more images. Please try again.');
    } finally {
      setLoadingMore(false);
    }
  };

  // Handle escape key for modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedItem(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Error state
  if (error && !loading && galleryItems.length === 0) {
    return (
      <div className="bg-obsidian py-20 px-6 sm:px-8 md:px-12 lg:px-20">
        <div className="container mx-auto text-center">
          <h2 className="font-heading text-4xl md:text-5xl font-bold text-white mb-6 tracking-wide uppercase">
            Artist Gallery
          </h2>
          <div className="text-red-400 mb-6">{error}</div>
          <button
            onClick={loadInitialImages}
            className="inline-flex items-center gap-2 bg-gold text-obsidian px-6 py-3 hover:bg-gold/90 transition-all duration-300 font-body uppercase tracking-wider text-sm"
          >
            <RefreshCw size={20} />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={galleryRef} className="bg-obsidian py-16 md:py-24 px-6 sm:px-8 md:px-12 lg:px-20">
      <div className="container mx-auto">
        {/* Gallery Header */}
        <motion.div 
          className="mb-8 md:mb-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-block relative mb-6">
            <div className="absolute -top-3 -left-3 h-4 w-4 border-t border-l border-gold/50"></div>
            <div className="absolute -top-3 -right-3 h-4 w-4 border-t border-r border-gold/50"></div>
            <div className="absolute -bottom-3 -left-3 h-4 w-4 border-b border-l border-gold/50"></div>
            <div className="absolute -bottom-3 -right-3 h-4 w-4 border-b border-r border-gold/50"></div>
            <h2 className={`font-heading ${isMobile ? 'text-3xl' : 'text-4xl md:text-5xl lg:text-6xl'} font-medium text-white px-6 md:px-8 tracking-wide uppercase`}>
              Artist Gallery
            </h2>
          </div>
          <div className="h-px w-32 md:w-40 mx-auto bg-gradient-to-r from-gold to-gold/0 mb-2"></div>
          <div className="h-px w-32 md:w-40 mx-auto bg-gradient-to-l from-gold to-gold/0 mb-6 md:mb-8"></div>
          <p className={`text-white/80 max-w-2xl mx-auto font-body ${isMobile ? 'text-base px-4' : 'text-lg'} mb-6 leading-relaxed`}>
            Discover our curated collection of tattoo artistry. Each piece represents our commitment 
            to quality, creativity, and personal expression.
          </p>
          
          {/* Simple image counter */}
          {!loading && galleryItems.length > 0 && (
            <div className="inline-flex items-center gap-2 text-gold/80">
              <Eye size={16} />
              <span className={`font-body ${isMobile ? 'text-xs' : 'text-sm'} tracking-wide`}>
                {galleryItems.length} {galleryItems.length === 1 ? 'image' : 'images'} loaded
              </span>
            </div>
          )}
        </motion.div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col justify-center items-center py-16 md:py-24">
            <Loader2 className="animate-spin text-gold mb-6" size={isMobile ? 36 : 48} />
            <p className={`text-white/60 font-body ${isMobile ? 'text-sm' : 'text-base'} tracking-wide`}>Loading gallery...</p>
          </div>
        )}

        {/* Simplified Gallery Grid */}
        {!loading && galleryItems.length > 0 && (
          <motion.div 
            className={isMobile 
              ? 'grid grid-cols-1 gap-4' 
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
                onClick={() => setSelectedItem(item)}
                style={{
                  height: isMobile 
                    ? '280px' 
                    : `${Math.max(200, Math.min(400, item.height * 0.3))}px`,
                }}
              >
                <div className="relative w-full h-full group cursor-pointer border border-gold/0 hover:border-gold/40 transition-all duration-300 overflow-hidden">
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

                  {/* Corner accents */}
                  <div className={`absolute -top-1 -left-1 ${isMobile ? 'h-4 w-4' : 'h-6 w-6'} border-t border-l border-gold opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
                  <div className={`absolute -top-1 -right-1 ${isMobile ? 'h-4 w-4' : 'h-6 w-6'} border-t border-r border-gold opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
                  <div className={`absolute -bottom-1 -left-1 ${isMobile ? 'h-4 w-4' : 'h-6 w-6'} border-b border-l border-gold opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
                  <div className={`absolute -bottom-1 -right-1 ${isMobile ? 'h-4 w-4' : 'h-6 w-6'} border-b border-r border-gold opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>

                  {/* Info overlay */}
                  <div className={`absolute bottom-0 left-0 right-0 p-3 md:p-4 transition-transform duration-300 ${
                    isMobile || hoveredItem === item.id ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
                  }`}>
                    <h3 className={`text-white font-medium mb-1 ${isMobile ? 'text-sm' : 'text-base'}`}>
                      {item.alt === item.publicId ? 'Tattoo Artwork' : item.alt}
                    </h3>
                    <p className={`text-white/80 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                      {item.artist}
                    </p>
                  </div>

                  {/* Zoom icon */}
                  <div className={`absolute ${isMobile ? 'top-3 right-3' : 'top-4 right-4'} bg-gold ${isMobile ? 'p-1.5' : 'p-2'} rounded-full transition-opacity duration-300 shadow-subtle ${
                    isMobile || hoveredItem === item.id ? "opacity-100" : "opacity-0"
                  }`}>
                    <ZoomIn size={isMobile ? 14 : 16} className="text-obsidian" />
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Simplified Load More Button */}
        {!loading && galleryItems.length > 0 && canLoadMore && (
          <div className="text-center mt-12 md:mt-16 px-4">
            <motion.button
              onClick={loadMoreImages}
              disabled={loadingMore}
              className={`group inline-flex items-center gap-3 bg-gold text-obsidian ${
                isMobile ? 'px-6 py-3 text-sm' : 'px-8 py-4'
              } hover:bg-gold/90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-body font-medium uppercase tracking-wider w-full sm:w-auto justify-center shadow-subtle hover:shadow-elegant`}
              whileHover={{ scale: isMobile ? 1 : 1.02 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              {loadingMore ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span className={isMobile ? 'text-sm' : 'text-base'}>Loading More...</span>
                </>
              ) : (
                <>
                  <Eye size={20} />
                  <span className={isMobile ? 'text-sm' : 'text-base'}>Load More Images</span>
                </>
              )}
            </motion.button>
          </div>
        )}

        {/* Error for loading more */}
        {error && galleryItems.length > 0 && (
          <div className="text-center mt-6 md:mt-8 px-4">
            <div className={`text-red-400 mb-4 ${isMobile ? 'text-sm' : 'text-base'}`}>{error}</div>
            <button
              onClick={loadMoreImages}
              className={`inline-flex items-center gap-2 bg-[#C9A449] text-[#080808] ${
                isMobile ? 'px-4 py-2 text-sm' : 'px-6 py-3'
              } rounded-lg hover:bg-[#C9A449]/80 transition-colors w-full sm:w-auto justify-center`}
            >
              <RefreshCw size={20} />
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && galleryItems.length === 0 && (
          <div className="text-center py-12 md:py-20">
            <p className={`text-white/60 ${isMobile ? 'text-lg' : 'text-xl'} mb-4`}>No images found</p>
          </div>
        )}
      </div>

      {/* Simplified Modal */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-4 bg-[#080808]/95 backdrop-blur-sm"
            onClick={() => setSelectedItem(null)}
          >
            <motion.div
              className={`relative ${
                isMobile 
                  ? 'w-full h-full max-h-[90vh]' 
                  : 'max-w-4xl max-h-[90vh] w-full'
              } overflow-hidden rounded-lg bg-[#080808] border border-[#C9A449]/20`}
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
            >
              <div className={`relative aspect-auto w-full h-full ${isMobile ? 'max-h-[85vh]' : 'max-h-[80vh]'}`}>
                <Image
                  src={selectedItem.largeUrl || selectedItem.url}
                  alt={selectedItem.alt}
                  fill
                  className="object-contain"
                  sizes={isMobile ? "100vw" : "(max-width: 768px) 100vw, 80vw"}
                  priority
                />
              </div>

              {/* Close button */}
              <button
                onClick={() => setSelectedItem(null)}
                className={`absolute ${isMobile ? 'top-2 right-2' : 'top-4 right-4'} bg-[#C9A449] ${
                  isMobile ? 'p-1.5' : 'p-2'
                } rounded-full hover:bg-[#C9A449]/80 transition-colors z-10`}
              >
                <X size={isMobile ? 18 : 20} className="text-[#080808]" />
              </button>

              {/* Info panel */}
              <div className={`absolute bottom-0 left-0 right-0 ${isMobile ? 'p-4' : 'p-6'} bg-gradient-to-t from-[#080808] to-transparent`}>
                <div className="h-[1px] w-full bg-gradient-to-r from-[#C9A449]/0 via-[#C9A449] to-[#C9A449]/0 mb-3 md:mb-4"></div>
                <h3 className={`text-white ${isMobile ? 'text-lg' : 'text-xl'} font-medium mb-1`}>
                  {selectedItem.alt === selectedItem.publicId ? 'Tattoo Artwork' : selectedItem.alt}
                </h3>
                <p className={`text-white/80 ${isMobile ? 'text-sm' : 'text-base'}`}>
                  Artist: {selectedItem.artist}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}