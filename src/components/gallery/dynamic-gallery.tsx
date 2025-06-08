"use client"

// 🎯 COST-OPTIMIZED GALLERY: Only fetches 15 images to reduce API costs
// Uses elegant skeleton placeholders with CTAs to encourage bookings

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { X, ZoomIn, Loader2, RefreshCw } from "lucide-react"
import { GalleryService, GalleryImage } from "@/src/lib/api/services/galleryService"
import { apiClient } from "@/src/lib/api/apiClient"

const galleryService = new GalleryService(apiClient);

export function DynamicGallery() {
  // State management
  const [galleryItems, setGalleryItems] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<GalleryImage | null>(null);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  // Ref for the gallery container
  const galleryRef = useRef<HTMLDivElement>(null);

  // Load gallery data on component mount
  useEffect(() => {
    loadGalleryData();
  }, []);

  const loadGalleryData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🖼️ Frontend: Loading gallery data...');
      
      // Load LIMITED gallery images (15) to reduce costs
      const images = await galleryService.getGalleryImages({ limit: 15 }); // 🎯 Cost optimization: Only fetch 15 images
      
      console.log(`🖼️ Frontend: Loaded ${images.length} images (limited for cost optimization)`);
      console.log('📸 Sample image:', images[0]);
      
      setGalleryItems(images);
    } catch (err) {
      console.error('❌ Frontend: Failed to load gallery:', err);
      setError('Failed to load gallery images. Please try again.');
    } finally {
      setLoading(false);
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
  if (error && !loading) {
    return (
      <div className="bg-[#080808] py-20 px-4 md:px-8 lg:px-16">
        <div className="container mx-auto text-center">
          <div className="mb-8">
            <h2 className="font-heading text-4xl md:text-5xl font-bold text-white mb-4">
              ARTIST GALLERY
            </h2>
            <div className="text-red-400 mb-4">{error}</div>
            <button
              onClick={loadGalleryData}
              className="inline-flex items-center gap-2 bg-[#C9A449] text-[#080808] px-6 py-3 rounded-lg hover:bg-[#C9A449]/80 transition-colors"
            >
              <RefreshCw size={20} />
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#080808] py-20 px-4 md:px-8 lg:px-16">
      <div className="container mx-auto">
        {/* Gallery Header with gold decorative accents */}
        <div className="mb-12 text-center">
          <div className="inline-block relative mb-3">
            <div className="absolute -top-3 -left-3 h-4 w-4 border-t border-l border-[#C9A449]"></div>
            <div className="absolute -top-3 -right-3 h-4 w-4 border-t border-r border-[#C9A449]"></div>
            <div className="absolute -bottom-3 -left-3 h-4 w-4 border-b border-l border-[#C9A449]"></div>
            <div className="absolute -bottom-3 -right-3 h-4 w-4 border-b border-r border-[#C9A449]"></div>
            <h2 className="font-heading text-4xl md:text-5xl font-bold text-white px-6">
              FEATURED GALLERY
            </h2>
          </div>
          <div className="h-[2px] w-40 mx-auto bg-gradient-to-r from-[#C9A449] to-[#C9A449]/0 mb-2"></div>
          <div className="h-[2px] w-40 mx-auto bg-gradient-to-l from-[#C9A449] to-[#C9A449]/0 mb-6"></div>
          <p className="text-white/80 max-w-2xl mx-auto font-body mb-4 text-xl">
            A curated selection from our extensive portfolio. Each piece represents our commitment to quality,
            creativity, and personal expression.
          </p>
          <p className="text-[#C9A449]/80 text-xl font-body mt-2">
            View our complete collection during your private consultation
          </p>
        </div>



        {/* Loading State */}
        {loading && (
          <div className="flex flex-col justify-center items-center py-20">
            <Loader2 className="animate-spin text-[#C9A449] mb-4" size={48} />
            <p className="text-white/60 font-body">Loading featured gallery...</p>
          </div>
        )}

        {/* Gallery Grid */}
        {!loading && galleryItems.length > 0 && (
          <div ref={galleryRef} className="columns-1 sm:columns-2 lg:columns-3 gap-4 md:gap-6 space-y-4 md:space-y-6">
            {galleryItems.map((item) => (
              <motion.div
                key={item.id}
                layoutId={`gallery-item-${item.id}`}
                className="relative overflow-hidden rounded-lg mb-4 md:mb-6 break-inside-avoid"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.3 }}
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
                onClick={() => setSelectedItem(item)}
                style={{
                  height: `${Math.max(200, Math.min(400, item.height * 0.3))}px`,
                }}
              >
                {/* Image with gold-accented border */}
                <div className="relative w-full h-full group cursor-pointer border border-[#C9A449]/0 group-hover:border-[#C9A449]/40 transition-colors duration-300">
                  <Image
                    src={item.thumbnailUrl || item.url}
                    alt={item.alt}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    loading="lazy"
                  />

                  {/* Overlay gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#080808] to-transparent opacity-60"></div>

                  {/* Hover overlay */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-t from-[#080808] via-[#080808]/70 to-transparent transition-opacity duration-300 ${
                      hoveredItem === item.id ? "opacity-80" : "opacity-0"
                    }`}
                  ></div>

                  {/* Victorian Gothic frame elements - gold border corners */}
                  <div className="absolute -top-1 -left-1 h-6 w-6 border-t border-l border-[#C9A449] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="absolute -top-1 -right-1 h-6 w-6 border-t border-r border-[#C9A449] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="absolute -bottom-1 -left-1 h-6 w-6 border-b border-l border-[#C9A449] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="absolute -bottom-1 -right-1 h-6 w-6 border-b border-r border-[#C9A449] opacity-0 group-hover:opacity-100 transition-opacity"></div>

                  {/* Gold accent line */}
                  <div className={`absolute bottom-14 left-4 right-4 h-[1px] bg-gradient-to-r from-[#C9A449]/0 via-[#C9A449] to-[#C9A449]/0 transition-opacity duration-300 ${
                    hoveredItem === item.id ? "opacity-70" : "opacity-0"
                  }`}></div>

                  {/* Info overlay */}
                  <div
                    className={`absolute bottom-0 left-0 right-0 p-4 transition-transform duration-300 ${
                      hoveredItem === item.id ? "translate-y-0" : "translate-y-10 opacity-0"
                    }`}
                  >
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-white font-medium font-body">
                          {item.alt === item.publicId ? 'Tattoo Artwork' : item.alt}
                        </p>
                        <p className="text-white/70 text-lg font-body">
                          by {item.artist === 'Unknown Artist' ? 'Our Artists' : item.artist}
                        </p>
                      </div>
                      <div className="bg-[#444444]/40 border border-[#C9A449]/30 text-white text-sm px-2 py-1 rounded-sm font-body">
                        {item.style === 'Mixed' ? 'Gallery' : item.style}
                      </div>
                    </div>
                  </div>

                  {/* Zoom icon with gold background */}
                  <div
                    className={`absolute top-4 right-4 bg-[#C9A449]/80 p-2 rounded-full transition-opacity duration-300 ${
                      hoveredItem === item.id ? "opacity-100" : "opacity-0"
                    }`}
                  >
                    <ZoomIn size={16} className="text-[#080808]" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Horizontal Skeleton Row - "More Portfolio" Teaser */}
        {!loading && galleryItems.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="mt-16"
          >
            {/* Section divider */}
            <div className="flex items-center justify-center mb-8">
              <div className="w-24 h-[0.5px] bg-gradient-to-r from-transparent via-[#C9A449]/40 to-transparent"></div>
              <div className="mx-6 text-[#C9A449]/60 text-xl font-body tracking-wider">
                CREATE YOUR OWN COLLECTION
              </div>
              <div className="w-24 h-[0.5px] bg-gradient-to-l from-transparent via-[#C9A449]/40 to-transparent"></div>
            </div>

            {/* Horizontal skeleton grid - matches main gallery styling */}
            <div className="relative">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, index) => (
                  <motion.div
                    key={`skeleton-${index}`}
                    className="relative aspect-[3/4] overflow-hidden rounded-lg"
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.1 * index }}
                  >
                    {/* Skeleton container - matches main gallery styling exactly */}
                    <div className="relative w-full h-full group cursor-pointer border border-[#C9A449]/0 hover:border-[#C9A449]/20 transition-colors duration-300">
                      {/* Base skeleton image placeholder */}
                      <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-lg">
                        {/* Shimmer effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#C9A449]/8 to-transparent animate-pulse rounded-lg"></div>
                      </div>

                      {/* Overlay gradient - matches main gallery */}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#080808] to-transparent opacity-60"></div>

                      {/* Victorian Gothic frame elements - matches main gallery */}
                      <div className="absolute -top-1 -left-1 h-6 w-6 border-t border-l border-[#C9A449]/30 opacity-0 group-hover:opacity-60 transition-opacity"></div>
                      <div className="absolute -top-1 -right-1 h-6 w-6 border-t border-r border-[#C9A449]/30 opacity-0 group-hover:opacity-60 transition-opacity"></div>
                      <div className="absolute -bottom-1 -left-1 h-6 w-6 border-b border-l border-[#C9A449]/30 opacity-0 group-hover:opacity-60 transition-opacity"></div>
                      <div className="absolute -bottom-1 -right-1 h-6 w-6 border-b border-r border-[#C9A449]/30 opacity-0 group-hover:opacity-60 transition-opacity"></div>

                      {/* Gold accent line - matches main gallery */}
                      <div className="absolute bottom-14 left-4 right-4 h-[1px] bg-gradient-to-r from-[#C9A449]/0 via-[#C9A449]/40 to-[#C9A449]/0 opacity-0 group-hover:opacity-70 transition-opacity duration-300"></div>

                      {/* Info overlay - skeleton version */}
                      <div className="absolute bottom-0 left-0 right-0 p-4 transition-transform duration-300 group-hover:translate-y-0 translate-y-10 opacity-0 group-hover:opacity-100">
                        <div className="flex justify-between items-end">
                          <div className="w-full">
                            <div className="h-3 bg-[#C9A449]/20 rounded mb-2 animate-pulse"></div>
                            <div className="h-2 bg-[#C9A449]/15 rounded w-2/3 animate-pulse"></div>
                          </div>
                        </div>
                      </div>

                      {/* Lock/Preview icon instead of zoom */}
                      <div className="absolute top-4 right-4 bg-[#C9A449]/60 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="w-4 h-4 border border-[#080808] rounded-sm"></div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Fade effect overlay - gradual fade from right */}
              <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#080808] via-[#080808]/80 to-transparent pointer-events-none"></div>
              
              {/* Additional fade overlay for smoother transition */}
              <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-[#080808] to-transparent pointer-events-none"></div>
            </div>
          </motion.div>
        )}

        {/* Empty State */}
        {!loading && galleryItems.length === 0 && (
          <div className="text-center py-20">
            <p className="text-white/60 text-xl mb-4">No images found</p>
          </div>
        )}
      </div>

      {/* Modal for expanded view with gold accents */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#080808]/95"
            onClick={() => setSelectedItem(null)}
          >
            <motion.div
              layoutId={`gallery-item-${selectedItem.id}`}
              className="relative max-w-4xl max-h-[90vh] w-full overflow-hidden rounded-lg bg-[#080808]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Victorian Gothic gold frame border */}
              <div className="absolute inset-0 p-[2px] rounded-lg bg-[#C9A449] opacity-70"></div>
              
              <div className="relative aspect-auto w-full h-full max-h-[80vh]">
                <Image
                  src={selectedItem.largeUrl || selectedItem.url}
                  alt={selectedItem.alt}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 80vw"
                  priority
                />
              </div>

              {/* Gold-accented close button */}
              <div className="absolute top-4 right-4">
                <button
                  onClick={() => setSelectedItem(null)}
                  className="bg-[#C9A449] p-2 rounded-full hover:bg-[#C9A449]/80 transition-colors"
                >
                  <X size={20} className="text-[#080808]" />
                </button>
              </div>

              {/* Gold-accented decorative corner elements */}
              <div className="absolute top-4 left-4 h-8 w-8 border-t border-l border-[#C9A449]"></div>
              <div className="absolute bottom-20 right-4 h-8 w-8 border-b border-r border-[#C9A449]"></div>

              {/* Info panel with gold accent line */}
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#080808] to-transparent">
                <div className="h-[1px] w-full bg-gradient-to-r from-[#C9A449]/0 via-[#C9A449] to-[#C9A449]/0 mb-4"></div>
                <h3 className="text-white text-xl font-medium mb-1 font-heading">
                  {selectedItem.alt === selectedItem.publicId ? 'Tattoo Artwork' : selectedItem.alt}
                </h3>
                <div className="flex justify-between items-center">
                  <p className="text-white/80 font-body">
                    Artist: {selectedItem.artist === 'Unknown Artist' ? 'Our Artists' : selectedItem.artist}
                  </p>
                  <div className="bg-[#444444]/40 border border-[#C9A449]/30 text-white px-3 py-1 rounded-sm font-body">
                    {selectedItem.style === 'Mixed' ? 'Gallery' : selectedItem.style}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}