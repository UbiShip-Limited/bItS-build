"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { X, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { typography, colors, effects, components } from '@/src/lib/styles/globalStyleConstants'
import { GalleryImage } from "@/src/lib/api/services/galleryService"

interface LightboxProps {
  images: GalleryImage[]
  currentIndex: number
  isOpen: boolean
  onClose: () => void
  onNavigate: (index: number) => void
}

export function Lightbox({ 
  images, 
  currentIndex, 
  isOpen, 
  onClose, 
  onNavigate 
}: LightboxProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  
  const currentImage = images[currentIndex]
  const hasPrev = currentIndex > 0
  const hasNext = currentIndex < images.length - 1

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return
      
      switch (e.key) {
        case 'Escape':
          onClose()
          break
        case 'ArrowLeft':
          if (hasPrev) onNavigate(currentIndex - 1)
          break
        case 'ArrowRight':
          if (hasNext) onNavigate(currentIndex + 1)
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, currentIndex, hasPrev, hasNext, onClose, onNavigate])

  // Prevent body scroll when lightbox is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // Preload adjacent images
  useEffect(() => {
    if (!isOpen || !currentImage) return

    setIsLoading(true)

    // Preload next and previous images
    if (hasPrev) {
      const prevImg = new window.Image()
      prevImg.src = images[currentIndex - 1].largeUrl || images[currentIndex - 1].url
    }
    
    if (hasNext) {
      const nextImg = new window.Image()
      nextImg.src = images[currentIndex + 1].largeUrl || images[currentIndex + 1].url
    }
  }, [currentIndex, images, hasPrev, hasNext, isOpen, currentImage])

  const handlePrevious = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (hasPrev) onNavigate(currentIndex - 1)
  }, [hasPrev, currentIndex, onNavigate])

  const handleNext = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (hasNext) onNavigate(currentIndex + 1)
  }, [hasNext, currentIndex, onNavigate])

  // Touch handlers for swipe navigation
  const minSwipeDistance = 50

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe && hasNext) {
      onNavigate(currentIndex + 1)
    }
    if (isRightSwipe && hasPrev) {
      onNavigate(currentIndex - 1)
    }
  }

  if (!isOpen || !currentImage) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[100] bg-obsidian/98 backdrop-blur-md flex items-center justify-center"
        onClick={onClose}
      >
        {/* Main centered container */}
        <div 
          className="flex flex-col items-center justify-center w-full h-full p-4 md:p-6 lg:p-8"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Image container with navigation */}
          <div 
            className="relative w-full max-w-5xl h-[60vh] md:h-[70vh] lg:h-[75vh]"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            {/* Loading spinner */}
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="animate-spin text-gold-500" size={48} />
              </div>
            )}

            {/* Image with proper aspect ratio */}
            <motion.div
              key={currentImage.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="relative w-full h-full flex items-center justify-center"
            >
              <Image
                src={currentImage.largeUrl || currentImage.url}
                alt={currentImage.alt}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 90vw, 80vw"
                priority
                quality={95}
                onLoadingComplete={() => setIsLoading(false)}
              />
            </motion.div>

            {/* Navigation buttons */}
            {hasPrev && (
              <button
                onClick={handlePrevious}
                className={`absolute left-2 md:left-4 top-1/2 -translate-y-1/2 ${components.button.base} rounded-full bg-gold-500/90 hover:bg-gold-500 text-obsidian p-2 md:p-3 shadow-xl hover:scale-110 ${effects.transitionNormal}`}
                aria-label="Previous image"
              >
                <ChevronLeft size={24} />
              </button>
            )}

            {hasNext && (
              <button
                onClick={handleNext}
                className={`absolute right-2 md:right-4 top-1/2 -translate-y-1/2 ${components.button.base} rounded-full bg-gold-500/90 hover:bg-gold-500 text-obsidian p-2 md:p-3 shadow-xl hover:scale-110 ${effects.transitionNormal}`}
                aria-label="Next image"
              >
                <ChevronRight size={24} />
              </button>
            )}
          </div>

          {/* Close button - always below image */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onClick={onClose}
            className={`mt-4 md:mt-6 ${components.button.base} ${components.button.variants.primary} px-6 py-2 md:px-8 md:py-3 text-sm md:text-base rounded-full shadow-xl hover:scale-110 ${effects.transitionNormal}`}
            aria-label="Close lightbox"
          >
            <X size={20} className="mr-2" />
            Close
          </motion.button>

          {/* Simple info below close button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-3 md:mt-4 text-center"
          >
            <h3 className={`text-base md:text-lg ${colors.textPrimary} mb-1`}>
              {currentImage.alt === currentImage.publicId ? 'Tattoo Artwork' : currentImage.alt}
            </h3>
            <p className={`text-sm ${colors.textAccent} mb-1`}>
              Artist: {currentImage.artist}
            </p>
            <div className={`text-xs md:text-sm ${colors.textMuted}`}>
              {currentIndex + 1} of {images.length}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}