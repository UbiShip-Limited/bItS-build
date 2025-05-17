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
      id: "1",
      src: "/black-and-white-tattoo.png",
      alt: "Black and white geometric tattoo",
      artist: "Alex Mercer",
      style: "Geometric",
      width: 2,
      height: 3,
    },
    {
      id: "2",
      src: "/minimalist-tattoo.png",
      alt: "Minimalist line art tattoo",
      artist: "Jamie Chen",
      style: "Minimalist",
      width: 1,
      height: 1,
    },
    {
      id: "3",
      src: "/floral-tattoo.png",
      alt: "Colorful floral sleeve tattoo",
      artist: "Morgan Lee",
      style: "Floral",
      width: 2,
      height: 2,
    },
    {
      id: "4",
      src: "/abstract-tattoo-art.png",
      alt: "Abstract watercolor style tattoo",
      artist: "Alex Mercer",
      style: "Watercolor",
      width: 1,
      height: 2,
    },
    {
      id: "5",
      src: "/japanese-tattoo.png",
      alt: "Traditional Japanese style tattoo",
      artist: "Kai Tanaka",
      style: "Traditional",
      width: 2,
      height: 2,
    },
    {
      id: "6",
      src: "/placeholder.svg?key=0eebh",
      alt: "Blackwork tattoo with fine details",
      artist: "Jamie Chen",
      style: "Blackwork",
      width: 1,
      height: 1,
    },
    {
      id: "7",
      src: "/placeholder.svg?key=1eebh",
      alt: "Neo-traditional portrait tattoo",
      artist: "Morgan Lee",
      style: "Neo-Traditional",
      width: 2,
      height: 3,
    },
    {
      id: "8",
      src: "/placeholder.svg?key=2eebh",
      alt: "Dotwork mandala tattoo",
      artist: "Kai Tanaka",
      style: "Dotwork",
      width: 1,
      height: 1,
    },
    {
      id: "9",
      src: "/placeholder.svg?key=3eebh",
      alt: "Surrealist tattoo design",
      artist: "Alex Mercer",
      style: "Surrealism",
      width: 1,
      height: 2,
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
    <div className="bg-white py-20 px-4 md:px-8 lg:px-16">
      <div className="container mx-auto">
        {/* Gallery Header */}
        <div className="mb-12 text-center">
          <h2 className="font-heading text-4xl md:text-5xl font-bold text-[#080808] mb-4">
            <span className="text-[#C9A449]">ARTIST</span> GALLERY
          </h2>
          <div className="h-1 w-32 mx-auto bg-gradient-to-r from-[#C9A449] to-[#444444] mb-6"></div>
          <p className="text-[#444444] max-w-2xl mx-auto font-body">
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
              {/* Image */}
              <div className="relative w-full h-full group cursor-pointer">
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

                {/* Frame elements */}
                <div className="absolute -top-1 -left-1 h-6 w-6 border-t border-l border-[#C9A449] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="absolute -bottom-1 -right-1 h-6 w-6 border-b border-r border-[#444444] opacity-0 group-hover:opacity-100 transition-opacity"></div>

                {/* Info overlay */}
                <div
                  className={`absolute bottom-0 left-0 right-0 p-4 transition-transform duration-300 ${
                    hoveredItem === item.id ? "translate-y-0" : "translate-y-10 opacity-0"
                  }`}
                >
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-white font-medium font-body">{item.alt}</p>
                      <p className="text-[#C9A449] text-sm font-body">{item.artist}</p>
                    </div>
                    <div className="bg-[#444444]/20 text-[#C9A449] text-xs px-2 py-1 rounded font-body">{item.style}</div>
                  </div>
                </div>

                {/* Zoom icon */}
                <div
                  className={`absolute top-4 right-4 bg-black/50 p-2 rounded-full transition-opacity duration-300 ${
                    hoveredItem === item.id ? "opacity-100" : "opacity-0"
                  }`}
                >
                  <ZoomIn size={16} className="text-white" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Modal for expanded view */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#080808]/90"
            onClick={() => setSelectedItem(null)}
          >
            <motion.div
              layoutId={`gallery-item-${selectedItem.id}`}
              className="relative max-w-4xl max-h-[90vh] w-full overflow-hidden rounded-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative aspect-auto w-full h-full max-h-[80vh]">
                <Image
                  src={selectedItem.src || "/placeholder.svg"}
                  alt={selectedItem.alt}
                  fill
                  className="object-contain"
                />
              </div>

              <div className="absolute top-4 right-4">
                <button
                  onClick={() => setSelectedItem(null)}
                  className="bg-black/50 p-2 rounded-full hover:bg-[#C9A449]/50 transition-colors"
                >
                  <X size={20} className="text-white" />
                </button>
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black to-transparent">
                <h3 className="text-white text-xl font-medium mb-1 font-heading">{selectedItem.alt}</h3>
                <div className="flex justify-between items-center">
                  <p className="text-[#C9A449] font-body">Artist: {selectedItem.artist}</p>
                  <div className="bg-[#444444]/20 text-[#C9A449] px-3 py-1 rounded font-body">{selectedItem.style}</div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
