"use client"

import React from "react"
import Image from "next/image"
import { Button } from "./button"
import { ChevronRight } from "lucide-react"
import { motion } from "framer-motion"

export function TattooHero() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-white text-[#080808] flex flex-col justify-center">
      {/* Background layer - lowest z-index */}
      <div className="absolute inset-0 z-0">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-white via-white to-white/95"></div>
        
        {/* Texture pattern */}
        <div className="absolute inset-0 bg-[url('/images/victorian-pattern.png')] opacity-[0.03]"></div>
        
        {/* Island outline SVG in top left, coming down */}
        <motion.div 
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 2, ease: "easeOut", delay: 0.6 }}
          className="absolute left-[2%] top-[4%] w-[25%] pointer-events-none overflow-visible"
        >
          <div className="relative w-full aspect-square">
            <Image
              src="/images/bowen-outline.svg"
              alt="Bowen Island Outline"
              fill
              className="object-contain object-left-top opacity-[0.16]"
              priority
              style={{ transform: "rotate(0deg) scale(0.85)" }}
            />
          </div>
        </motion.div>
      </div>

      {/* Central ornamental divider - middle z-index */}
      <div className="absolute top-0 left-1/2 h-full w-px -translate-x-1/2 z-10">
        <div className="h-full w-full bg-gradient-to-b from-transparent via-[#8B6F3A]/50 to-transparent"></div>
      </div>

      {/* Main content container - highest z-index */}
      <div className="relative z-20 mx-auto flex flex-col items-center justify-center px-8 md:px-12 py-6 md:py-10 w-full h-full">
        {/* Top ornamental element */}
        <div className="absolute top-6 md:top-8 left-1/2 -translate-x-1/2 w-full max-w-xs md:max-w-sm">
          <div className="relative mx-auto w-32 md:w-40 h-10">
            <div className="absolute top-1/2 left-0 w-full h-[0.5px] bg-gradient-to-r from-transparent via-[#8B6F3A]/80 to-transparent"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 md:w-5 h-4 md:h-5 border border-[#8B6F3A]/70 rotate-45"></div>
          </div>
        </div>

        {/* Main content */}
        <motion.div
          className="relative w-full max-w-5xl mx-auto text-center bg-white/75 px-4 py-6 rounded-lg backdrop-blur-sm"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Logo */}
          <motion.div className="mb-3 md:mb-4 relative" variants={itemVariants}>
            <div className="relative w-[280px] h-[280px] sm:w-[380px] sm:h-[380px] md:w-[450px] md:h-[450px] lg:w-[520px] lg:h-[520px] mx-auto">
              <Image
                src="/images/cougar-color.png"
                alt="Bowen Island Tattoo Logo"
                fill
                className="object-contain"
                priority
              />
              {/* Bottom shadow */}
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-[180px] md:w-[220px] h-[12px] bg-[#080808]/5 blur-xl rounded-full"></div>
            </div>
          </motion.div>

          {/* Ornamental line */}
          <motion.div className="mb-2 md:mb-4" variants={itemVariants}>
            <OrnamentalLine
              centerElement={
                <div className="text-[#8B6F3A] text-xs md:text-sm">✦</div>
              }
              lineWidth="w-14 md:w-20"
            />
          </motion.div>

          {/* Title */}
          <motion.h1
            className="font-heading text-2xl sm:text-3xl md:text-5xl lg:text-6xl tracking-wide text-[#080808] mb-2 md:mb-3 uppercase flex justify-center items-center flex-wrap gap-x-2 md:gap-x-3"
            variants={itemVariants}
          >
            <span className="inline-block font-medium tracking-wide">Bowen</span>
            <span className="inline-block text-xl sm:text-2xl md:text-3xl lg:text-4xl tracking-[0.2em] md:tracking-[0.3em] font-light text-[#080808]/90">
              Island
            </span>
            <span className="inline-block font-medium tracking-wide">Tattoo</span>
          </motion.h1>

          {/* Ornamental line */}
          <motion.div className="my-2 md:my-4" variants={itemVariants}>
            <OrnamentalLine
              centerElement={
                <div className="w-1.5 md:w-2 h-1.5 md:h-2 bg-[#8B6F3A]/70 rotate-45"></div>
              }
              lineWidth="w-16 md:w-24"
            />
          </motion.div>

          {/* Tagline */}
          <motion.p
            className="font-body text-lg md:text-xl text-[#444444] max-w-sm md:max-w-lg mx-auto mb-3 md:mb-4 italic leading-relaxed"
            variants={itemVariants}
          >
            Where artistry meets tranquility. A private studio experience unlike any other.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-6 mt-2 md:mt-4"
            variants={itemVariants}
          >
            <Button
              className="group relative overflow-hidden bg-transparent border border-[#8B6F3A]/70 text-[#080808] hover:bg-[#8B6F3A]/10 hover:border-[#8B6F3A] transition-colors duration-300 w-full sm:w-auto"
              size="lg"
            >
              <span className="relative z-10 flex items-center font-body tracking-widest uppercase text-xs md:text-sm font-medium">
                Book Your Session
                <ChevronRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </span>
            </Button>

            <Button
              variant="outline"
              className="border-[#444444]/20 bg-transparent text-[#080808] hover:bg-[#444444]/10 hover:text-[#080808] hover:border-[#444444]/40 transition-colors duration-300 w-full sm:w-auto"
              size="lg"
            >
              <span className="font-body tracking-widest uppercase text-xs md:text-sm font-medium">
                Explore Gallery
              </span>
            </Button>
          </motion.div>
        </motion.div>

        {/* Bottom ornamental element */}
        <div className="absolute bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 w-full max-w-xs md:max-w-sm">
          <div className="relative mx-auto w-32 md:w-40 h-10">
            <div className="absolute top-1/2 left-0 w-full h-[0.5px] bg-gradient-to-r from-transparent via-[#8B6F3A]/80 to-transparent"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 md:w-5 h-4 md:h-5 border border-[#8B6F3A]/70 rotate-45"></div>
          </div>
        </div>

        {/* Corner ornaments */}
        <CornerOrnament position="top-left" />
        <CornerOrnament position="top-right" />
        <CornerOrnament position="bottom-left" />
        <CornerOrnament position="bottom-right" />
      </div>
    </div>
  )
}

interface OrnamentalLineProps {
  centerElement: React.ReactNode;
  lineWidth?: string;
}

const OrnamentalLine: React.FC<OrnamentalLineProps> = ({
  centerElement,
  lineWidth = "w-14 md:w-20",
}) => {
  return (
    <div className="flex items-center justify-center">
      <div
        className={`${lineWidth} h-[0.5px] bg-gradient-to-r from-transparent via-[#8B6F3A]/80 to-[#8B6F3A]/50`}
      ></div>
      <div className="mx-3 md:mx-4">{centerElement}</div>
      <div
        className={`${lineWidth} h-[0.5px] bg-gradient-to-l from-transparent via-[#8B6F3A]/80 to-[#8B6F3A]/50`}
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
        "absolute top-0 left-0 w-full h-[0.5px] bg-gradient-to-r from-[#8B6F3A]/70 to-transparent";
      verticalLineClasses =
        "absolute top-0 left-0 h-full w-[0.5px] bg-gradient-to-b from-[#8B6F3A]/70 to-transparent";
      break;
    case "top-right":
      positionClasses = "top-0 right-0";
      horizontalLineClasses =
        "absolute top-0 right-0 w-full h-[0.5px] bg-gradient-to-l from-[#8B6F3A]/70 to-transparent";
      verticalLineClasses =
        "absolute top-0 right-0 h-full w-[0.5px] bg-gradient-to-b from-[#8B6F3A]/70 to-transparent";
      break;
    case "bottom-left":
      positionClasses = "bottom-0 left-0";
      horizontalLineClasses =
        "absolute bottom-0 left-0 w-full h-[0.5px] bg-gradient-to-r from-[#8B6F3A]/70 to-transparent";
      verticalLineClasses =
        "absolute bottom-0 left-0 h-full w-[0.5px] bg-gradient-to-t from-[#8B6F3A]/70 to-transparent";
      break;
    case "bottom-right":
      positionClasses = "bottom-0 right-0";
      horizontalLineClasses =
        "absolute bottom-0 right-0 w-full h-[0.5px] bg-gradient-to-l from-[#8B6F3A]/70 to-transparent";
      verticalLineClasses =
        "absolute bottom-0 right-0 h-full w-[0.5px] bg-gradient-to-t from-[#8B6F3A]/70 to-transparent";
      break;
  }

  return (
    <div className={`${baseClasses} ${positionClasses}`}>
      <div className={horizontalLineClasses}></div>
      <div className={verticalLineClasses}></div>
    </div>
  );
};
