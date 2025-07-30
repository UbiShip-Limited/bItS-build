"use client"

import React, { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Spotlight } from "./spotlight-new"
import { typography, colors, effects, components } from '@/src/lib/styles/globalStyleConstants'
import { smoothScrollTo } from '@/src/lib/utils/smoothScroll'


export function TattooHero() {
  const [currentImage, setCurrentImage] = useState<"none" | "outline" | "cougar">("none")
  const [isLoaded, setIsLoaded] = useState(false)
  
  useEffect(() => {
    // Enhanced animation sequence
    const sequence = async () => {
      // Short delay before starting animations
      await new Promise(resolve => setTimeout(resolve, 500));
      setIsLoaded(true);
      await new Promise(resolve => setTimeout(resolve, 300));
      setCurrentImage("outline");
      
      // Transition from outline to cougar
      await new Promise(resolve => setTimeout(resolve, 2000));
      setCurrentImage("cougar");
    };
    
    sequence();
    
    return () => {
      // No need for multiple cleanup functions
    }
  }, [])

  // Refined animation variants with consistent timing
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        duration: 0.5,
        ease: [0.4, 0, 0.2, 1]
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1],
      },
    },
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-obsidian via-[#0a0a0a] to-obsidian text-white flex items-center justify-center w-full">
      {/* Subtle spotlight effect with gold tints */}
      <Spotlight 
        gradientFirst="radial-gradient(68.54% 68.72% at 55.02% 31.46%, hsla(210, 100%, 85%, .08) 0, hsla(210, 100%, 55%, .02) 50%, hsla(210, 100%, 45%, 0) 80%)"
        gradientSecond="radial-gradient(68.54% 68.72% at 55.02% 31.46%, hsla(210, 100%, 85%, .06) 0, hsla(210, 100%, 55%, .02) 50%, hsla(210, 100%, 45%, 0) 80%)"
        gradientThird="radial-gradient(68.54% 68.72% at 55.02% 31.46%, hsla(210, 100%, 85%, .04) 0, hsla(210, 100%, 45%, .02) 80%, transparent 100%)"
        translateY={-350}
        width={560}
        height={1380}
        smallWidth={240}
        duration={7}
        xOffset={100}
      />
      
      {/* Additional ambient glow effects */}
      <div className="absolute inset-0 z-0">
        <div className="hero-glow absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gold-500/5 rounded-full blur-[100px] animate-pulse" />
        <div className="hero-shadow absolute top-1/3 left-1/4 w-[300px] h-[300px] bg-gold-500/8 rounded-full blur-[60px]" />
        <div className="hero-shadow absolute bottom-1/3 right-1/4 w-[300px] h-[300px] bg-gold-500/8 rounded-full blur-[60px]" />
      </div>
      
      {/* Gradient mesh background */}
      <div className="absolute inset-0 z-0 opacity-30">
        <div className="absolute inset-0 bg-gradient-to-br from-gold-500/10 via-transparent to-gold-500/5" />
        <div className="absolute inset-0 bg-gradient-to-tl from-gold-500/5 via-transparent to-transparent" />
      </div>

      {/* Subtle central divider */}
      <div className="absolute top-0 left-1/2 h-full w-px -translate-x-1/2 z-10 hidden lg:block">
        <div className="h-full w-full bg-gradient-to-b from-transparent via-gold-500/10 to-transparent"></div>
      </div>

      {/* Main content container - highest z-index */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: isLoaded ? 1 : 0 }}
        transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1] }}
        className="relative z-20 flex flex-col items-center justify-center w-full h-screen max-h-screen overflow-hidden px-4 sm:px-6 md:px-8 py-8 sm:py-12"
      >
        {/* Main content */}
        <motion.div
          className="relative w-full max-w-4xl mx-auto text-center flex flex-col items-center justify-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Logo area - enhanced with glow effect */}
          <motion.div 
            className="relative aspect-square w-[120px] h-[120px] sm:w-[160px] sm:h-[160px] md:w-[200px] md:h-[200px] lg:w-[240px] lg:h-[240px]" 
            variants={itemVariants}
          >
            {/* Ambient glow behind logo */}
            <div className="absolute inset-0 bg-gold-500/20 rounded-full blur-[40px] sm:blur-[60px] scale-125 sm:scale-150 animate-pulse" />
            <div className="relative w-full h-full mx-auto">
              {/* Simplified image transition using AnimatePresence */}
              <AnimatePresence mode="sync">
                {currentImage === "outline" && (
                  <motion.div 
                    key="outline"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.15 }} // Direct opacity control
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.7 }}
                    className="absolute inset-0"
                  >
                    <Image
                      src="/images/bowen-logo.svg"
                      alt="Bowen Island Outline"
                      fill
                      className="object-contain brightness-0 invert"
                      priority
                    />
                  </motion.div>
                )}
                
                {currentImage === "cougar" && (
                  <motion.div 
                    key="cougar"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.7 }}
                    className="absolute inset-0" 
                  >
                    <Image
                      src="/images/cougar.svg"
                      alt="Bowen Island Tattoo Logo"
                      fill
                      className="object-contain brightness-0 invert"
                      style={{ transform: 'scale(1.05)' }}
                      priority
                    />
                    {/* Enhanced glow effect */}
                    <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-64 h-8 bg-gold-500/20 blur-2xl rounded-full" />
                    <div className="absolute inset-0 bg-gradient-radial from-gold-500/10 via-transparent to-transparent scale-150" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Title - enhanced typography with gradient */}
          <motion.h1
            className={`${typography.fontBrand} text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-semibold ${typography.leadingTight} mt-4 sm:mt-6 mb-2 sm:mb-3 px-4`}
            variants={itemVariants}
          >
            <span className="bg-gradient-to-r from-white via-white to-gold-500/80 bg-clip-text text-transparent">
              Bowen Island Tattoo
            </span>
          </motion.h1>

          {/* Tagline - enhanced with better hierarchy */}
          <motion.p
            className={`${typography.textLg} sm:${typography.textXl} md:${typography.text2xl} ${colors.textProminent} max-w-3xl mx-auto mb-2 sm:mb-3 ${typography.trackingWide} px-6`}
            variants={itemVariants}
          >
            Island ink, crafted with care
          </motion.p>

          <motion.p
            className={`${typography.textSm} sm:${typography.paragraph} md:${typography.paragraphLarge} ${colors.textSecondary} max-w-2xl mx-auto mb-4 sm:mb-6 px-6`}
            variants={itemVariants}
          >
           Custom tattoos in our peaceful island studio.<br className="hidden sm:block" />
           <span className={`${colors.textMuted} italic block mt-1 sm:mt-2`}>Book your spot. Let's create something beautiful.</span>
          </motion.p>

          {/* Enhanced ornamental divider */}
          <motion.div className="mb-4 sm:mb-6 flex items-center justify-center" variants={itemVariants}>
            <div className="w-24 sm:w-32 md:w-40 h-px bg-gradient-to-r from-transparent via-gold-500/40 to-gold-500/20" />
            <div className="mx-4 sm:mx-6 relative">
              <div className="w-3 h-3 bg-gold-500/40 rounded-full" />
              <div className="absolute inset-0 bg-gold-500/20 rounded-full blur-md scale-[3] animate-pulse" />
            </div>
            <div className="w-24 sm:w-32 md:w-40 h-px bg-gradient-to-l from-transparent via-gold-500/40 to-gold-500/20" />
          </motion.div>

          {/* CTA Buttons - refined with new button system */}
          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full sm:w-auto px-4 sm:px-0"
            variants={itemVariants}
          >
            <Link href="/tattooRequest" className="w-full sm:w-auto">
              <button
                className={`${components.button.base} ${components.button.sizes.medium} md:${components.button.sizes.large} bg-gold-500 text-obsidian hover:bg-gold-400 ${effects.transitionNormal} w-full sm:w-auto group shadow-lg hover:shadow-xl hover:shadow-gold-500/20`}
              >
                <span className="relative z-10 flex items-center justify-center">
                  Let's Get Started
                  <ChevronRight className="ml-2 h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
                </span>
              </button>
            </Link>

            <button
              onClick={() => smoothScrollTo('gallery')}
              className={`${components.button.base} ${components.button.sizes.medium} md:${components.button.sizes.large} ${components.button.variants.secondary} w-full sm:w-auto`}
            >
              See Our Work
            </button>
          </motion.div>
        </motion.div>

        {/* Enhanced corner ornaments - hidden on small screens */}
        <div className="hidden md:block">
          <CornerOrnament position="top-left" />
          <CornerOrnament position="top-right" />
          <CornerOrnament position="bottom-left" />
          <CornerOrnament position="bottom-right" />
        </div>
        
        {/* Floating particles effect */}
        {isLoaded && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1.5 h-1.5 bg-gold-500/20 rounded-full"
                initial={{ 
                  x: `${20 + i * 15}%`,
                  y: "110%",
                  opacity: 0 
                }}
                animate={{ 
                  y: "-10%",
                  opacity: [0, 0.6, 0],
                  x: `${20 + i * 15 + (i % 2 ? 10 : -10)}%`
                }}
                transition={{
                  duration: 15 + i * 3,
                  repeat: Infinity,
                  delay: i * 2.5,
                  ease: "linear"
                }}
              />
            ))}
          </div>
        )}
      </motion.div>
    </div>
  )
}

// Removed OrnamentalLine component - using standardized ornaments from globalStyleConstants

interface CornerOrnamentProps {
  position: "top-left" | "top-right" | "bottom-left" | "bottom-right";
}

const CornerOrnament: React.FC<CornerOrnamentProps> = ({ position }) => {
  // Enhanced corner ornaments with gradient effect
  const baseClasses = "absolute w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 m-4 sm:m-6 md:m-8 lg:m-12";
  let positionClasses = "";
  let cornerStyle = "";

  switch (position) {
    case "top-left":
      positionClasses = "top-0 left-0";
      cornerStyle = "border-t-2 border-l-2 border-gold-500/20 rounded-tl-3xl";
      break;
    case "top-right":
      positionClasses = "top-0 right-0";
      cornerStyle = "border-t-2 border-r-2 border-gold-500/20 rounded-tr-3xl";
      break;
    case "bottom-left":
      positionClasses = "bottom-0 left-0";
      cornerStyle = "border-b-2 border-l-2 border-gold-500/20 rounded-bl-3xl";
      break;
    case "bottom-right":
      positionClasses = "bottom-0 right-0";
      cornerStyle = "border-b-2 border-r-2 border-gold-500/20 rounded-br-3xl";
      break;
  }

  return (
    <motion.div 
      className={`${baseClasses} ${positionClasses}`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1, delay: 0.5 }}
    >
      <div className={`absolute inset-0 ${cornerStyle}`}></div>
      <div className={`absolute inset-0 ${cornerStyle} opacity-50 blur-sm`}></div>
    </motion.div>
  );
};