"use client"

// 🎯 SMART COST-EFFECTIVE GALLERY: Progressive loading strategy
// - Phase 1: 6 featured images (immediate load)
// - Phase 2: 8 more images (on user engagement)
// - Phase 3: Extended collection (on explicit request)

import { useState, useRef, useEffect, useCallback } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { X, ZoomIn, Loader2, RefreshCw, Eye, ChevronDown, Sparkles } from "lucide-react"
import { GalleryService, GalleryImage } from "@/src/lib/api/services/galleryService"
import { apiClient } from "@/src/lib/api/apiClient"

const galleryService = new GalleryService(apiClient);

// 🎯 Smart loading strategy - Ensure all 26 images can load
const PHASE_1_COUNT = 6;   // Featured images - load immediately
const PHASE_2_COUNT = 8;   // Secondary images - load on engagement  
const PHASE_3_COUNT = 12;  // Extended collection - load on explicit request
const PHASE_4_COUNT = 15;  // Final batch - if more images available
const MAX_TOTAL_IMAGES = 26; // Maximum we want to load for cost optimization

type LoadingPhase = 'initial' | 'phase1' | 'phase2' | 'phase3' | 'phase4' | 'complete';

export function DynamicGallery() {
  // Core state
  const [galleryItems, setGalleryItems] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<GalleryImage | null>(null);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  
  // Smart loading state
  const [currentPhase, setCurrentPhase] = useState<LoadingPhase>('initial');
  const [loadingPhase, setLoadingPhase] = useState<LoadingPhase | null>(null);
  const [userEngaged, setUserEngaged] = useState(false);
  
  // Mobile state
  const [isMobile, setIsMobile] = useState(false);
  
  const galleryRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Phase 1: Load featured images immediately
  useEffect(() => {
    loadFeaturedImages();
  }, []);

  // Phase 2: Load more images when user shows engagement
  useEffect(() => {
    if (userEngaged && currentPhase === 'phase1') {
      loadSecondaryImages();
    }
  }, [userEngaged, currentPhase]);

  const loadFeaturedImages = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🌟 Loading featured gallery images...');
      
      // Use the optimized initial load method
      const featuredImages = await galleryService.getInitialGalleryImages(PHASE_1_COUNT);
      
      console.log(`✨ Loaded ${featuredImages.length} featured images`);
      
      setGalleryItems(featuredImages);
      setCurrentPhase('phase1');
      
      // Set up engagement tracking
      setupEngagementTracking();
      
    } catch (err) {
      console.error('❌ Failed to load featured images:', err);
      setError('Failed to load gallery images. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadSecondaryImages = async () => {
    try {
      setLoadingPhase('phase2');
      
      console.log('📈 Loading secondary images...');
      
      // Load more images using pagination
      const secondaryImages = await galleryService.getMoreGalleryImages(
        galleryItems.length,
        PHASE_2_COUNT
      );
      
      // Filter out duplicates by ID to prevent React key conflicts
      const newSecondaryImages = secondaryImages.filter(newImg => 
        !galleryItems.some(existingImg => existingImg.id === newImg.id)
      );
      
      console.log(`📸 Loaded ${secondaryImages.length} secondary images, ${newSecondaryImages.length} new unique images`);
      
      setGalleryItems(prev => [...prev, ...newSecondaryImages]);
      setCurrentPhase('phase2');
      
    } catch (err) {
      console.error('❌ Failed to load secondary images:', err);
    } finally {
      setLoadingPhase(null);
    }
  };

  const loadExtendedCollection = async () => {
    try {
      setLoadingPhase('phase3');
      
      console.log('🎨 Loading extended collection...');
      
      // Load extended collection
      const extendedImages = await galleryService.getMoreGalleryImages(
        galleryItems.length,
        PHASE_3_COUNT
      );
      
      // Filter out duplicates by ID to prevent React key conflicts
      const newExtendedImages = extendedImages.filter(newImg => 
        !galleryItems.some(existingImg => existingImg.id === newImg.id)
      );
      
      console.log(`🖼️ Loaded ${extendedImages.length} extended images, ${newExtendedImages.length} new unique images`);
      
      const newTotal = galleryItems.length + newExtendedImages.length;
      setGalleryItems(prev => [...prev, ...newExtendedImages]);
      
      // Smart phase completion logic
      if (newTotal >= MAX_TOTAL_IMAGES || newExtendedImages.length === 0) {
        setCurrentPhase('complete');
      } else if (newExtendedImages.length < PHASE_3_COUNT) {
        // If we got fewer images than requested, check if we need Phase 4
        setCurrentPhase('phase4');
      } else {
        setCurrentPhase('phase3');
      }
      
    } catch (err) {
      console.error('❌ Failed to load extended collection:', err);
      setError('Failed to load extended collection. Please try again.');
    } finally {
      setLoadingPhase(null);
    }
  };

  const loadFinalBatch = async () => {
    try {
      setLoadingPhase('phase4');
      
      console.log('🏁 Loading final batch to reach 26 images...');
      
      // Calculate how many more images we need to reach 26
      const remainingSlots = MAX_TOTAL_IMAGES - galleryItems.length;
      const loadCount = Math.min(remainingSlots, PHASE_4_COUNT);
      
      if (loadCount <= 0) {
        setCurrentPhase('complete');
        return;
      }
      
      // Load final batch
      const finalImages = await galleryService.getMoreGalleryImages(
        galleryItems.length,
        loadCount
      );
      
      // Filter out duplicates by ID to prevent React key conflicts
      const newFinalImages = finalImages.filter(newImg => 
        !galleryItems.some(existingImg => existingImg.id === newImg.id)
      );
      
      console.log(`🏆 Loaded ${finalImages.length} final images, ${newFinalImages.length} new unique images`);
      
      setGalleryItems(prev => [...prev, ...newFinalImages]);
      setCurrentPhase('complete');
      
    } catch (err) {
      console.error('❌ Failed to load final batch:', err);
      setError('Failed to load final batch. Please try again.');
    } finally {
      setLoadingPhase(null);
    }
  };

  const setupEngagementTracking = useCallback(() => {
    // Track mouse movement as engagement (desktop)
    const handleMouseMove = () => {
      if (!userEngaged && !isMobile) {
        setUserEngaged(true);
        document.removeEventListener('mousemove', handleMouseMove);
      }
    };

    // Track scroll as engagement
    const handleScroll = () => {
      if (!userEngaged) {
        setUserEngaged(true);
        window.removeEventListener('scroll', handleScroll);
      }
    };

    // Track touch as engagement (mobile)
    const handleTouch = () => {
      if (!userEngaged) {
        setUserEngaged(true);
        document.removeEventListener('touchstart', handleTouch);
      }
    };

    // Track gallery hover/touch as engagement
    const handleGalleryInteraction = () => {
      if (!userEngaged) {
        setUserEngaged(true);
      }
    };

    if (!isMobile) {
      document.addEventListener('mousemove', handleMouseMove);
    }
    document.addEventListener('touchstart', handleTouch);
    window.addEventListener('scroll', handleScroll);
    
    if (galleryRef.current) {
      galleryRef.current.addEventListener('mouseenter', handleGalleryInteraction);
      galleryRef.current.addEventListener('touchstart', handleGalleryInteraction);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('touchstart', handleTouch);
      window.removeEventListener('scroll', handleScroll);
      if (galleryRef.current) {
        galleryRef.current.removeEventListener('mouseenter', handleGalleryInteraction);
        galleryRef.current.removeEventListener('touchstart', handleGalleryInteraction);
      }
    };
  }, [userEngaged, isMobile]);

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

  // Smart placeholder component
  const SmartPlaceholder = ({ count, phase }: { count: number; phase: string }) => (
    <div className={`grid ${isMobile ? 'grid-cols-1 gap-3' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6'}`}>
      {Array.from({ length: count }, (_, index) => (
        <motion.div
          key={`placeholder-${phase}-${index}`}
          className="relative overflow-hidden rounded-lg bg-gradient-to-br from-[#1a1a1a] to-[#2a2a2a] animate-pulse"
          style={{ height: `${isMobile ? '200px' : Math.floor(Math.random() * 100) + 200 + 'px'}` }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <Sparkles className="w-6 h-6 text-[#C9A449]/40 mx-auto mb-2" />
              <p className="text-[#C9A449]/60 text-sm">Loading...</p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );

  // Error state
  if (error && !loading && galleryItems.length === 0) {
    return (
      <div className="bg-[#080808] py-20 px-4 sm:px-8 md:px-8 lg:px-16">
        <div className="container mx-auto text-center">
          <h2 className="font-heading text-4xl md:text-5xl font-bold text-white mb-4">
            ARTIST GALLERY
          </h2>
          <div className="text-red-400 mb-4">{error}</div>
          <button
            onClick={loadFeaturedImages}
            className="inline-flex items-center gap-2 bg-[#C9A449] text-[#080808] px-6 py-3 rounded-lg hover:bg-[#C9A449]/80 transition-colors"
          >
            <RefreshCw size={20} />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const getTotalImages = () => galleryItems.length;
  const getPhaseDescription = () => {
    switch (currentPhase) {
      case 'phase1':
        return `Featured Collection (${getTotalImages()} of 26 images)`;
      case 'phase2':
        return `Expanded Gallery (${getTotalImages()} of 26 images)`;
      case 'phase3':
        return `Extended Collection (${getTotalImages()} of 26 images)`;
      case 'phase4':
        return `Nearly Complete (${getTotalImages()} of 26 images)`;
      case 'complete':
        return `Complete Collection (${getTotalImages()} images)`;
      default:
        return 'Loading...';
    }
  };

  return (
    <div className="bg-[#080808] py-12 md:py-20 px-4 sm:px-6 md:px-8 lg:px-16">
      <div className="container mx-auto">
        {/* Smart Gallery Header */}
        <div className="mb-8 md:mb-12 text-center">
          <div className="inline-block relative mb-3">
            <div className="absolute -top-3 -left-3 h-4 w-4 border-t border-l border-[#C9A449]"></div>
            <div className="absolute -top-3 -right-3 h-4 w-4 border-t border-r border-[#C9A449]"></div>
            <div className="absolute -bottom-3 -left-3 h-4 w-4 border-b border-l border-[#C9A449]"></div>
            <div className="absolute -bottom-3 -right-3 h-4 w-4 border-b border-r border-[#C9A449]"></div>
            <h2 className={`font-heading ${isMobile ? 'text-3xl' : 'text-4xl md:text-5xl'} font-bold text-white px-4 md:px-6`}>
              ARTIST GALLERY
            </h2>
          </div>
          <div className="h-[2px] w-32 md:w-40 mx-auto bg-gradient-to-r from-[#C9A449] to-[#C9A449]/0 mb-2"></div>
          <div className="h-[2px] w-32 md:w-40 mx-auto bg-gradient-to-l from-[#C9A449] to-[#C9A449]/0 mb-4 md:mb-6"></div>
          <p className={`text-white/80 max-w-2xl mx-auto font-body ${isMobile ? 'text-base px-2' : 'text-lg'} mb-4`}>
            Discover our curated collection of tattoo artistry. Each piece represents our commitment 
            to quality, creativity, and personal expression.
          </p>
          
          {/* Phase indicator */}
          {!loading && (
            <div className="inline-flex items-center gap-2 text-[#C9A449]/80 text-sm">
              <Eye size={16} />
              <span className={isMobile ? 'text-xs' : 'text-sm'}>{getPhaseDescription()}</span>
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col justify-center items-center py-12 md:py-20">
            <Loader2 className="animate-spin text-[#C9A449] mb-4" size={isMobile ? 36 : 48} />
            <p className={`text-white/60 font-body ${isMobile ? 'text-sm' : 'text-base'}`}>Loading featured artwork...</p>
          </div>
        )}

        {/* Gallery Grid - Enhanced for mobile */}
        {!loading && galleryItems.length > 0 && (
          <div 
            ref={galleryRef} 
            className={`${
              isMobile 
                ? 'grid grid-cols-1 gap-4' 
                : 'columns-1 sm:columns-2 lg:columns-3 gap-4 md:gap-6 space-y-4 md:space-y-6'
            }`}
          >
            {galleryItems.map((item, index) => (
              <motion.div
                key={item.id}
                layoutId={`gallery-item-${item.id}`}
                className={`relative overflow-hidden rounded-lg ${isMobile ? 'mb-4' : 'mb-4 md:mb-6 break-inside-avoid'}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                onMouseEnter={() => !isMobile && setHoveredItem(item.id)}
                onMouseLeave={() => !isMobile && setHoveredItem(null)}
                onClick={() => setSelectedItem(item)}
                style={{
                  height: isMobile 
                    ? '280px' 
                    : `${Math.max(200, Math.min(400, item.height * 0.3))}px`,
                }}
              >
                <div className="relative w-full h-full group cursor-pointer border border-[#C9A449]/0 hover:border-[#C9A449]/40 transition-all duration-300">
                  <Image
                    src={item.thumbnailUrl || item.url}
                    alt={item.alt}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105 group-active:scale-95"
                    sizes={isMobile ? "100vw" : "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"}
                    loading={index < 6 ? "eager" : "lazy"}
                  />

                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#080808]/80 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300"></div>

                  {/* Corner accents - adjusted for mobile */}
                  <div className={`absolute -top-1 -left-1 ${isMobile ? 'h-4 w-4' : 'h-6 w-6'} border-t border-l border-[#C9A449] opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
                  <div className={`absolute -top-1 -right-1 ${isMobile ? 'h-4 w-4' : 'h-6 w-6'} border-t border-r border-[#C9A449] opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
                  <div className={`absolute -bottom-1 -left-1 ${isMobile ? 'h-4 w-4' : 'h-6 w-6'} border-b border-l border-[#C9A449] opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
                  <div className={`absolute -bottom-1 -right-1 ${isMobile ? 'h-4 w-4' : 'h-6 w-6'} border-b border-r border-[#C9A449] opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>

                  {/* Info overlay - Always visible on mobile */}
                  <div className={`absolute bottom-0 left-0 right-0 p-3 md:p-4 transition-transform duration-300 ${
                    isMobile || hoveredItem === item.id ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
                  }`}>
                    <h3 className={`text-white font-medium mb-1 ${isMobile ? 'text-sm' : 'text-base'}`}>
                      {item.alt === item.publicId ? 'Tattoo Artwork' : item.alt}
                    </h3>
                    <p className={`text-white/80 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                      {item.artist === 'Unknown Artist' ? 'Our Artists' : item.artist}
                    </p>
                  </div>

                  {/* Zoom icon - adjusted for mobile */}
                  <div className={`absolute ${isMobile ? 'top-3 right-3' : 'top-4 right-4'} bg-[#C9A449] ${isMobile ? 'p-1.5' : 'p-2'} rounded-full transition-opacity duration-300 ${
                    isMobile || hoveredItem === item.id ? "opacity-100" : "opacity-0"
                  }`}>
                    <ZoomIn size={isMobile ? 14 : 16} className="text-[#080808]" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Loading placeholders for secondary images */}
        {loadingPhase === 'phase2' && (
          <div className="mt-6 md:mt-8">
            <SmartPlaceholder count={isMobile ? 2 : 4} phase="secondary" />
          </div>
        )}

        {/* Loading placeholders for extended collection */}
        {loadingPhase === 'phase3' && (
          <div className="mt-6 md:mt-8">
            <SmartPlaceholder count={isMobile ? 3 : 6} phase="extended" />
          </div>
        )}

        {/* Loading placeholders for final batch */}
        {loadingPhase === 'phase4' && (
          <div className="mt-6 md:mt-8">
            <SmartPlaceholder count={isMobile ? 2 : 3} phase="final" />
          </div>
        )}

        {/* Smart Load More Button - Phase 3 - Enhanced for mobile */}
        {!loading && currentPhase === 'phase2' && (
          <div className="text-center mt-8 md:mt-12 px-4">
            <motion.button
              onClick={loadExtendedCollection}
              disabled={loadingPhase === 'phase3'}
              className={`group inline-flex items-center gap-3 bg-[#C9A449] text-[#080808] ${
                isMobile ? 'px-6 py-3 text-sm' : 'px-8 py-4'
              } rounded-lg hover:bg-[#C9A449]/90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium w-full sm:w-auto justify-center`}
              whileHover={{ scale: isMobile ? 1 : 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {loadingPhase === 'phase3' ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span className={isMobile ? 'text-sm' : 'text-base'}>Loading Extended Collection...</span>
                </>
              ) : (
                <>
                  <ChevronDown size={20} className="group-hover:translate-y-0.5 transition-transform" />
                  <span className={isMobile ? 'text-sm' : 'text-base'}>View Extended Collection</span>
                </>
              )}
            </motion.button>
            <p className={`text-white/60 ${isMobile ? 'text-xs' : 'text-sm'} mt-3`}>
              Discover more from our complete portfolio ({getTotalImages()}/26 images)
            </p>
          </div>
        )}

        {/* Smart Load More Button - Phase 4 - Enhanced for mobile */}
        {!loading && (currentPhase === 'phase3' || currentPhase === 'phase4') && (
          <div className="text-center mt-8 md:mt-12 px-4">
            <motion.button
              onClick={loadFinalBatch}
              disabled={loadingPhase === 'phase4'}
              className={`group inline-flex items-center gap-3 bg-[#C9A449] text-[#080808] ${
                isMobile ? 'px-6 py-3 text-sm' : 'px-8 py-4'
              } rounded-lg hover:bg-[#C9A449]/90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium w-full sm:w-auto justify-center`}
              whileHover={{ scale: isMobile ? 1 : 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {loadingPhase === 'phase4' ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span className={isMobile ? 'text-sm' : 'text-base'}>Loading Final Images...</span>
                </>
              ) : (
                <>
                  <Sparkles size={20} className="group-hover:scale-110 transition-transform" />
                  <span className={isMobile ? 'text-sm' : 'text-base'}>Complete Collection ({MAX_TOTAL_IMAGES - getTotalImages()} more)</span>
                </>
              )}
            </motion.button>
            <p className={`text-white/60 ${isMobile ? 'text-xs' : 'text-sm'} mt-3 px-2`}>
              Load the remaining images to reach our full 26-image collection
            </p>
          </div>
        )}

        {/* Collection Complete Indicator */}
        {currentPhase === 'complete' && (
          <div className="text-center mt-8 md:mt-12">
            <div className="inline-flex items-center gap-2 text-[#C9A449] font-medium">
              <Sparkles size={20} />
              <span className={isMobile ? 'text-sm' : 'text-base'}>Complete Collection Loaded</span>
            </div>
            <p className={`text-white/60 ${isMobile ? 'text-xs' : 'text-sm'} mt-2`}>
              Book a consultation to discuss your custom piece
            </p>
          </div>
        )}

        {/* Error for phase loading */}
        {error && galleryItems.length > 0 && (
          <div className="text-center mt-6 md:mt-8 px-4">
            <div className={`text-red-400 mb-4 ${isMobile ? 'text-sm' : 'text-base'}`}>{error}</div>
            <button
              onClick={() => {
                if (currentPhase === 'phase1') {
                  loadSecondaryImages();
                } else if (currentPhase === 'phase2') {
                  loadExtendedCollection();
                } else {
                  loadFinalBatch();
                }
              }}
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

      {/* Enhanced Modal - Better mobile experience */}
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
              layoutId={`gallery-item-${selectedItem.id}`}
              className={`relative ${
                isMobile 
                  ? 'w-full h-full max-h-[90vh]' 
                  : 'max-w-4xl max-h-[90vh] w-full'
              } overflow-hidden rounded-lg bg-[#080808] border border-[#C9A449]/20`}
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
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

              {/* Close button - Enhanced for mobile */}
              <button
                onClick={() => setSelectedItem(null)}
                className={`absolute ${isMobile ? 'top-2 right-2' : 'top-4 right-4'} bg-[#C9A449] ${
                  isMobile ? 'p-1.5' : 'p-2'
                } rounded-full hover:bg-[#C9A449]/80 transition-colors z-10`}
              >
                <X size={isMobile ? 18 : 20} className="text-[#080808]" />
              </button>

              {/* Info panel - Enhanced for mobile */}
              <div className={`absolute bottom-0 left-0 right-0 ${isMobile ? 'p-4' : 'p-6'} bg-gradient-to-t from-[#080808] to-transparent`}>
                <div className="h-[1px] w-full bg-gradient-to-r from-[#C9A449]/0 via-[#C9A449] to-[#C9A449]/0 mb-3 md:mb-4"></div>
                <h3 className={`text-white ${isMobile ? 'text-lg' : 'text-xl'} font-medium mb-1`}>
                  {selectedItem.alt === selectedItem.publicId ? 'Tattoo Artwork' : selectedItem.alt}
                </h3>
                <p className={`text-white/80 ${isMobile ? 'text-sm' : 'text-base'}`}>
                  Artist: {selectedItem.artist === 'Unknown Artist' ? 'Our Artists' : selectedItem.artist}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}