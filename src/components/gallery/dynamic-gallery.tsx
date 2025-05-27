"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { X, ZoomIn } from "lucide-react"

// Define the types for our gallery items
interface GalleryItem {
  id: string
  src: string
  alt: string
  artist: string
  style: string
  width: number
  height: number
}

export function DynamicGallery() {
  // Gallery items data
  const galleryItems: GalleryItem[] = [
    {
      id: "2",
      src: "/gallery-images/image1.jpeg",
      alt: "Minimalist line art tattoo",
      artist: "Jamie Chen",
      style: "Minimalist",
      width: 1,
      height: 1,
    },
    {
      id: "3",
      src: "/gallery-images/image2.jpeg",
      alt: "Colorful floral sleeve tattoo",
      artist: "Morgan Lee",
      style: "Floral",
      width: 2,
      height: 2,
    },
    {
      id: "4",
      src: "/gallery-images/image3.jpeg",
      alt: "Abstract watercolor style tattoo",
      artist: "Alex Mercer",
      style: "Watercolor",
      width: 1,
      height: 2,
    },
    {
      id: "5",
      src: "/gallery-images/image4.jpeg",
      alt: "Traditional Japanese style tattoo",
      artist: "Kai Tanaka",
      style: "Traditional",
      width: 2,
      height: 2,
    },
    {
      id: "6",
      src: "/gallery-images/image5.jpeg",
      alt: "Blackwork tattoo with fine details",
      artist: "Jamie Chen",
      style: "Blackwork",
      width: 1,
      height: 1,
    },
    {
      id: "7",
      src: "/gallery-images/image6.jpeg",
      alt: "Neo-traditional portrait tattoo",
      artist: "Morgan Lee",
      style: "Neo-Traditional",
      width: 2,
      height: 3,
    },
 
  ]

  // State for modal and hover
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null)
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)

  // Ref for the gallery container
  const galleryRef = useRef<HTMLDivElement>(null)

  // Handle escape key for modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedItem(null)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

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
              ARTIST GALLERY
            </h2>
          </div>
          <div className="h-[2px] w-40 mx-auto bg-gradient-to-r from-[#C9A449] to-[#C9A449]/0 mb-2"></div>
          <div className="h-[2px] w-40 mx-auto bg-gradient-to-l from-[#C9A449] to-[#C9A449]/0 mb-6"></div>
          <p className="text-white/80 max-w-2xl mx-auto font-body">
            Explore our diverse collection of tattoo artistry. Each piece represents our commitment to quality,
            creativity, and personal expression.
          </p>
        </div>

        {/* Staggered Gallery */}
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
                height: `${item.height * 150}px`,
              }}
            >
              {/* Image with gold-accented border */}
              <div className="relative w-full h-full group cursor-pointer border border-[#C9A449]/0 group-hover:border-[#C9A449]/40 transition-colors duration-300">
                <Image
                  src={item.src || "/placeholder.svg"}
                  alt={item.alt}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
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
                      <p className="text-white font-medium font-body">{item.alt}</p>
                      <p className="text-white/70 text-sm font-body">by {item.artist}</p>
                    </div>
                    <div className="bg-[#444444]/40 border border-[#C9A449]/30 text-white text-xs px-2 py-1 rounded-sm font-body">{item.style}</div>
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
                  src={selectedItem.src || "/placeholder.svg"}
                  alt={selectedItem.alt}
                  fill
                  className="object-contain"
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
                <h3 className="text-white text-xl font-medium mb-1 font-heading">{selectedItem.alt}</h3>
                <div className="flex justify-between items-center">
                  <p className="text-white/80 font-body">Artist: {selectedItem.artist}</p>
                  <div className="bg-[#444444]/40 border border-[#C9A449]/30 text-white px-3 py-1 rounded-sm font-body">{selectedItem.style}</div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}