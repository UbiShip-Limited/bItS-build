"use client"

import { motion } from "framer-motion"

interface SkeletonLoaderProps {
  className?: string
  variant?: "text" | "image" | "card" | "avatar"
  count?: number
}

export function SkeletonLoader({ 
  className = "", 
  variant = "text",
  count = 1 
}: SkeletonLoaderProps) {
  const baseClasses = "bg-gradient-to-r from-[#1a1a1a] via-[#2a2a2a] to-[#1a1a1a] bg-[length:200%_100%] rounded"
  
  const variantClasses = {
    text: "h-4 w-full",
    image: "aspect-square w-full",
    card: "h-64 w-full",
    avatar: "h-12 w-12 rounded-full"
  }
  
  const shimmerAnimation = {
    animate: {
      backgroundPosition: ["200% 0", "-200% 0"]
    },
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "linear"
    }
  }
  
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <motion.div
          key={index}
          className={`${baseClasses} ${variantClasses[variant]} ${className}`}
          animate={shimmerAnimation.animate}
          transition={shimmerAnimation.transition}
        />
      ))}
    </>
  )
}

export function ImageSkeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden bg-[#1a1a1a] ${className}`}>
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-[#2a2a2a] to-transparent"
        animate={{
          x: ["-100%", "100%"]
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "linear"
        }}
      />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="w-8 h-8 border-2 border-[#C9A449]/30 border-t-[#C9A449] rounded-full animate-spin" />
      </div>
    </div>
  )
}

export function GallerySkeleton() {
  const isMobile = typeof window !== "undefined" && window.innerWidth <= 768
  
  return (
    <div className={isMobile 
      ? 'grid grid-cols-1 gap-4' 
      : 'columns-1 sm:columns-2 lg:columns-3 gap-4 md:gap-6 space-y-4 md:space-y-6'
    }>
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className={`relative overflow-hidden rounded-lg ${isMobile ? 'mb-4' : 'mb-4 md:mb-6 break-inside-avoid'}`}
          style={{
            height: isMobile ? '280px' : `${300 + (index % 3) * 50}px`,
          }}
        >
          <ImageSkeleton className="w-full h-full rounded-lg" />
        </div>
      ))}
    </div>
  )
}