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
    <div className="relative min-h-screen overflow-hidden bg-white text-[#080808]">
      {/* Refined texture overlay with subtle gradient */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-white to-white/95"></div>
        <div className="absolute inset-0 bg-[url('/images/victorian-pattern.png')] opacity-[0.03]"></div>
      </div>

      {/* Central ornamental divider - moved and adjusted for screen height */}
      <div className="absolute top-0 left-1/2 h-full w-px -translate-x-1/2 z-10">
        <div className="h-full w-full bg-gradient-to-b from-transparent via-[#8B6F3A]/50 to-transparent"></div>
      </div>

      <div className="relative z-20 mx-auto flex flex-col items-center justify-center px-8 md:px-12 py-6 md:py-10">
        {/* Top ornamental element - refined */}
        <div className="absolute top-6 md:top-8 left-1/2 -translate-x-1/2 w-full max-w-xs md:max-w-sm">
          <div className="relative mx-auto w-32 md:w-40 h-10">
            <div className="absolute top-1/2 left-0 w-full h-[0.5px] bg-gradient-to-r from-transparent via-[#8B6F3A]/80 to-transparent"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 md:w-5 h-4 md:h-5 border border-[#8B6F3A]/70 rotate-45"></div>
          </div>
        </div>

        {/* Main content */}
        <motion.div
          className="relative z-10 w-full max-w-5xl mx-auto text-center bg-white"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Logo - enlarged with SVG for better quality */}
          <motion.div className="mb-3 md:mb-4 relative" variants={itemVariants}>
            <div className="relative w-[280px] h-[280px] sm:w-[340px] sm:h-[340px] md:w-[400px] md:h-[400px] mx-auto">
              <Image
                src="/images/cougar.svg"
                alt="Bowen Island Tattoo Logo"
                fill
                className="object-contain"
                priority
              />
              {/* Refined bottom shadow */}
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-[180px] md:w-[220px] h-[12px] bg-[#080808]/5 blur-xl rounded-full"></div>
            </div>
          </motion.div>

          {/* Refined ornamental line */}
          <motion.div className="mb-4 md:mb-6" variants={itemVariants}>
            <OrnamentalLine
              centerElement={
                <div className="text-[#8B6F3A] text-xs md:text-sm">✦</div>
              }
              lineWidth="w-14 md:w-20"
            />
          </motion.div>

          {/* Title - refined typography */}
          <motion.h1
            className="font-heading text-3xl sm:text-4xl md:text-6xl lg:text-7xl tracking-wide text-[#080808] mb-2 md:mb-3 uppercase"
            variants={itemVariants}
          >
            <span className="block mb-1 font-medium tracking-wide">Bowen</span>
            <span className="block text-2xl sm:text-3xl md:text-4xl lg:text-5xl tracking-[0.3em] md:tracking-[0.4em] font-light text-[#080808]/90">
              Island
            </span>
            <span className="block mt-1 font-medium tracking-wide">Tattoo</span>
          </motion.h1>

          {/* Refined ornamental line */}
          <motion.div className="my-4 md:my-6" variants={itemVariants}>
            <OrnamentalLine
              centerElement={
                <div className="w-1.5 md:w-2 h-1.5 md:h-2 bg-[#8B6F3A]/70 rotate-45"></div>
              }
              lineWidth="w-20 md:w-28"
            />
          </motion.div>

          {/* Tagline - refined typography */}
          <motion.p
            className="font-body text-sm md:text-base lg:text-lg text-[#444444] max-w-md md:max-w-xl mx-auto mb-3 md:mb-5 italic leading-relaxed"
            variants={itemVariants}
          >
            Where artistry meets tranquility. A private studio experience unlike any other.
          </motion.p>

          {/* CTA Buttons - refined styling */}
          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-6 mt-3 md:mt-5"
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

        {/* Bottom ornamental element - refined */}
        <div className="absolute bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 w-full max-w-xs md:max-w-sm">
          <div className="relative mx-auto w-32 md:w-40 h-10">
            <div className="absolute top-1/2 left-0 w-full h-[0.5px] bg-gradient-to-r from-transparent via-[#8B6F3A]/80 to-transparent"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 md:w-5 h-4 md:h-5 border border-[#8B6F3A]/70 rotate-45"></div>
          </div>
        </div>

        {/* Refined decorative corner elements - properly positioned */}
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
  lineWidth?: string; // e.g., "w-14 md:w-20"
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
        "absolute bottom-0 left-0 h-full w-[0.5px] bg-gradient-to-t from-[#8B6F3A]/70 to-transparent"; // Note: to-t for bottom-left vertical
      break;
    case "bottom-right":
      positionClasses = "bottom-0 right-0";
      horizontalLineClasses =
        "absolute bottom-0 right-0 w-full h-[0.5px] bg-gradient-to-l from-[#8B6F3A]/70 to-transparent";
      verticalLineClasses =
        "absolute bottom-0 right-0 h-full w-[0.5px] bg-gradient-to-t from-[#8B6F3A]/70 to-transparent"; // Note: to-t for bottom-right vertical
      break;
  }

  return (
    <div className={`${baseClasses} ${positionClasses}`}>
      <div className={horizontalLineClasses}></div>
      <div className={verticalLineClasses}></div>
    </div>
  );
};
