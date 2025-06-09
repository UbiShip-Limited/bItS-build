"use client"

import React, { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "./button"
import { ChevronRight } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export function TattooHero() {
  const [currentImage, setCurrentImage] = useState<"none" | "outline" | "cougar">("none")
  
  useEffect(() => {
    // Simplified animation sequence with one timer
    const sequence = async () => {
      // Short delay before starting animations
      await new Promise(resolve => setTimeout(resolve, 300));
      setCurrentImage("outline");
      
      // Transition from outline to cougar
      await new Promise(resolve => setTimeout(resolve, 1500));
      setCurrentImage("cougar");
    };
    
    sequence();
    
    return () => {
      // No need for multiple cleanup functions
    }
  }, [])

  // Simplified animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1, // Reduced stagger time for more subtle effect
        duration: 0.5
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 10 }, // Reduced y offset for subtler animation
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4, // Shorter duration for crisper animations
        ease: "easeOut",
      },
    },
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#080808] text-white flex flex-col justify-center">
      {/* Background layer - lowest z-index */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-[#080808] via-[#080808] to-[#080808]/95"></div>
      </div>

      {/* Central ornamental divider - middle z-index */}
      <div className="absolute top-0 left-1/2 h-full w-px -translate-x-1/2 z-10">
        <div className="h-full w-full bg-gradient-to-b from-transparent via-[#C9A449]/50 to-transparent"></div>
      </div>

      {/* Main content container - highest z-index */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }} // Faster fade-in
        className="relative z-20 flex flex-col items-center justify-start w-full h-full my-auto pt-6 pb-16 sm:pt-8 md:pt-10"
        style={{ marginTop: "-2rem" }}
      >
        {/* Main content */}
        <motion.div
          className="relative w-full max-w-5xl mx-auto text-center bg-[#080808]/75 px-4 sm:px-6 md:px-8 py-8 sm:py-10 md:py-12 rounded-lg backdrop-blur-sm flex flex-col items-center justify-center border border-white/10"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Logo area - contains both images that fade in/out */}
          <motion.div 
            className="mt-5 sm:mt-5 md:mt-5 relative aspect-square" 
            variants={itemVariants}
            style={{ 
              width: "min(450px, 95%)", 
              height: "min(450px, 95%)",
              maxWidth: "600px",
              maxHeight: "600px"
            }}
          >
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
                    className="absolute inset-0 scale-115" 
                  >
                    <Image
                      src="/images/cougar.svg"
                      alt="Bowen Island Tattoo Logo"
                      fill
                      className="object-contain brightness-0 invert"
                      priority
                    />
                    <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-[280px] md:w-[320px] h-[20px] bg-white/5 blur-xl rounded-full"></div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Ornamental line above title */}
          <motion.div className="mt-5 sm:mt-5 md:mt-5 w-full" variants={itemVariants}>
            <div className="relative">
              <OrnamentalLine
                centerElement={
                  <div className="flex items-center justify-center w-6 md:w-6 h-6 md:h-6">
                    <div className="w-4 md:w-4 h-4 md:h-4 border border-[#C9A449]/80 rotate-45"></div>
                    <div className="absolute w-2 md:w-2 h-2 md:h-2 bg-[#C9A449]/30 rotate-45"></div>
                  </div>
                }
                lineWidth="w-32 md:w-36"
              />
              {/* Horizontal line passing through */}
              <div className="absolute top-1/2 left-0 w-full h-[0.5px] bg-gradient-to-r from-transparent via-[#C9A449]/40 to-transparent -translate-y-1/2"></div>
            </div>
          </motion.div>

          {/* Title */}
          <motion.h1
            className="font-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl tracking-wide text-white mb-3 sm:mb-4 md:mb-5 uppercase flex justify-center items-center flex-wrap gap-x-3 md:gap-x-3"
            variants={itemVariants}
          >
            <span className="inline-block font-medium tracking-wide">Bowen</span>
            <span className="inline-block text-2xl sm:text-3xl md:text-3xl lg:text-4xl tracking-[0.2em] md:tracking-[0.3em] font-light text-white/90">
              Island
            </span>
            <span className="inline-block font-medium tracking-wide">Tattoo</span>
          </motion.h1>

          {/* Tagline */}
          <motion.p
            className="font-body text-xl md:text-xl text-[#FFFFFF]/80 max-w-sm md:max-w-lg mx-auto mb-5 sm:mb-6 md:mb-7 italic leading-relaxed"
            variants={itemVariants}
          >
            Where artistry meets tranquility. A private studio experience unlike any other.
          </motion.p>

          <motion.p
            className="font-body text-xl md:text-xl text-[#FFFFFF]/80 max-w-sm md:max-w-lg mx-auto mb-5 sm:mb-6 md:mb-7 italic leading-relaxed"
            variants={itemVariants}
          >
           By appointment only.
          </motion.p>

          {/* Ornamental line below tagline */}
          <motion.div className="mb-6 sm:mb-7 md:mb-8 w-full" variants={itemVariants}>
            <div className="relative">
              <OrnamentalLine
                centerElement={
                  <div className="relative flex items-center justify-center">
                    <span className="text-[#C9A449] text-sm md:text-sm z-10">✦</span>
                    <span className="absolute -mt-0.5 transform scale-150 text-[#C9A449]/20 text-sm md:text-sm">✦</span>
                  </div>
                }
                lineWidth="w-36 md:w-40"
              />
              {/* Horizontal line passing through */}
              <div className="absolute top-1/2 left-0 w-full h-[0.5px] bg-gradient-to-r from-transparent via-[#C9A449]/40 to-transparent -translate-y-1/2"></div>
            </div>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 w-full sm:w-auto"
            variants={itemVariants}
          >
            <Link href="/tattooRequest">
              <Button
                className="group relative overflow-hidden bg-transparent border border-[#C9A449]/70 text-white hover:bg-[#C9A449]/10 hover:border-[#C9A449] transition-all duration-300 w-full sm:w-auto px-6 h-14"
                size="lg"
              >
                <span className="relative z-10 flex items-center font-body tracking-widest uppercase text-sm md:text-sm font-medium">
                  Book Your Session
                  <ChevronRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                </span>
              </Button>
            </Link>

            <Link href="/gallery">
              <Button
                variant="outline"
                className="border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white hover:border-white/40 transition-all duration-300 w-full sm:w-auto px-6 h-14"
                size="lg"
              >
                <span className="font-body tracking-widest uppercase text-sm md:text-sm font-medium">
                  Explore Gallery
                </span>
              </Button>
            </Link>
          </motion.div>
        </motion.div>

        {/* Corner ornaments - carefully positioned */}
        <CornerOrnament position="top-left" />
        <CornerOrnament position="top-right" />
        <CornerOrnament position="bottom-left" />
        <CornerOrnament position="bottom-right" />
      </motion.div>
    </div>
  )
}

interface OrnamentalLineProps {
  centerElement: React.ReactNode;
  lineWidth?: string;
}

const OrnamentalLine: React.FC<OrnamentalLineProps> = ({
  centerElement,
  lineWidth = "w-16 md:w-20",
}) => {
  return (
    <div className="flex items-center justify-center">
      <div
        className={`${lineWidth} h-[0.5px] bg-gradient-to-r from-transparent via-[#C9A449]/80 to-[#C9A449]/50`}
      ></div>
      <div className="mx-4 md:mx-4">{centerElement}</div>
      <div
        className={`${lineWidth} h-[0.5px] bg-gradient-to-l from-transparent via-[#C9A449]/80 to-[#C9A449]/50`}
      ></div>
    </div>
  );
};

interface CornerOrnamentProps {
  position: "top-left" | "top-right" | "bottom-left" | "bottom-right";
}

const CornerOrnament: React.FC<CornerOrnamentProps> = ({ position }) => {
  const baseClasses = "absolute w-[10%] md:w-[8%] h-[10%] md:h-[8%] m-4 md:m-6";
  let positionClasses = "";
  let horizontalLineClasses = "";
  let verticalLineClasses = "";

  switch (position) {
    case "top-left":
      positionClasses = "top-0 left-0";
      horizontalLineClasses =
        "absolute top-0 left-0 w-full h-[0.5px] bg-gradient-to-r from-[#C9A449]/70 to-transparent";
      verticalLineClasses =
        "absolute top-0 left-0 h-full w-[0.5px] bg-gradient-to-b from-[#C9A449]/70 to-transparent";
      break;
    case "top-right":
      positionClasses = "top-0 right-0";
      horizontalLineClasses =
        "absolute top-0 right-0 w-full h-[0.5px] bg-gradient-to-l from-[#C9A449]/70 to-transparent";
      verticalLineClasses =
        "absolute top-0 right-0 h-full w-[0.5px] bg-gradient-to-b from-[#C9A449]/70 to-transparent";
      break;
    case "bottom-left":
      positionClasses = "bottom-0 left-0";
      horizontalLineClasses =
        "absolute bottom-0 left-0 w-full h-[0.5px] bg-gradient-to-r from-[#C9A449]/70 to-transparent";
      verticalLineClasses =
        "absolute bottom-0 left-0 h-full w-[0.5px] bg-gradient-to-t from-[#C9A449]/70 to-transparent";
      break;
    case "bottom-right":
      positionClasses = "bottom-0 right-0";
      horizontalLineClasses =
        "absolute bottom-0 right-0 w-full h-[0.5px] bg-gradient-to-l from-[#C9A449]/70 to-transparent";
      verticalLineClasses =
        "absolute bottom-0 right-0 h-full w-[0.5px] bg-gradient-to-t from-[#C9A449]/70 to-transparent";
      break;
  }

  return (
    <div className={`${baseClasses} ${positionClasses}`}>
      <div className={horizontalLineClasses}></div>
      <div className={verticalLineClasses}></div>
    </div>
  );
};