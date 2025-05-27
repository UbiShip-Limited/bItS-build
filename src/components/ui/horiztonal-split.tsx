"use client"

import { useRef } from "react"
import { motion, useScroll, useTransform } from "framer-motion"
import Image from "next/image"
import Link from "next/link"

export function HorizontalSplitParallax() {
  // Ref for the split section
  const splitSectionRef = useRef<HTMLDivElement>(null)

  // Scroll progress for the section
  const { scrollYProgress } = useScroll({
    target: splitSectionRef,
    offset: ["start end", "end start"],
  })

  // Transform values for parallax effect
  const yImage = useTransform(scrollYProgress, [0, 1], [0, -50])
  
  // Opacity for text fade-in
  const textOpacity = useTransform(scrollYProgress, [0.1, 0.3], [0, 1])
  const textY = useTransform(scrollYProgress, [0.1, 0.3], [20, 0])

  return (
    <div ref={splitSectionRef} className="min-h-screen">
      {/* Full screen image with overlay text */}
      <div className="relative h-screen w-full overflow-hidden">
        <motion.div 
          className="relative h-full w-full"
          style={{ y: yImage }}
        >
          <Image 
            src="/images/shop-pic2.png" 
            alt="Bowen Island Tattoo Studio" 
            fill 
            className="object-cover brightness-75"
            priority
          />
          
          {/* Dark overlay for text readability */}
          <div className="absolute inset-0 bg-[#080808]/40"></div>
            {/* Faded Bowen logo in background */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative w-full max-w-xl aspect-square opacity-10">
              <Image 
                src="/images/bowen-logo.svg" 
                alt="Bowen Island Tattoo Logo" 
                fill
                className="object-contain"
                style={{ 
                  filter: "invert(70%) sepia(38%) saturate(789%) hue-rotate(12deg) brightness(92%) contrast(88%)" 
                }}
              />
            </div>
          </div>
          
          {/* Text content that fades in */}
          <motion.div 
            className="absolute inset-0 flex flex-col items-center justify-center px-8 md:px-16 lg:px-24 text-center"
            style={{ opacity: textOpacity, y: textY }}
          >
            <div className="bg-[#080808]/60 p-8 md:p-12 backdrop-blur-sm border border-[#C9A449]/20 max-w-3xl">
              <h2 className="font-heading text-4xl md:text-5xl mb-5 text-[#C9A449] drop-shadow-[0_0_6px_rgba(201,164,73,0.3)]">
                EXCLUSIVE PRIVATE STUDIO EXPERIENCE
              </h2>
              <div className="h-0.5 w-32 bg-[#C9A449] mb-8 mx-auto"></div>
              <p className="font-body text-xl text-white/90">
                Discover Vancouver's most exclusive tattoo destination, hidden on the tranquil shores of Bowen Island. 
                Our invitation-only private studio offers an unparalleled tattooing experience for discerning clients. 
                No walk-ins, no distractions—just you and our master artists creating something extraordinary in absolute comfort and luxury.
              </p>
            
              {/* Victorian Gothic frame elements - tucked in */}
              <div className="absolute top-4 left-4 h-6 w-6 border-t border-l border-[#C9A449]"></div>
              <div className="absolute top-4 right-4 h-6 w-6 border-t border-r border-[#C9A449]"></div>
              <div className="absolute bottom-4 left-4 h-6 w-6 border-b border-l border-[#C9A449]"></div>
              <div className="absolute bottom-4 right-4 h-6 w-6 border-b border-r border-[#C9A449]"></div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}