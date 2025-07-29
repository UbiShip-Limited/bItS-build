"use client"

import React from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import { SectionCardProps } from "./types";

export function DesktopCard({ section, index, isLoading, sectionsLength }: SectionCardProps) {
  const isReversed = index % 2 === 1;
  
  // Parallax effects
  const { scrollYProgress } = useScroll({
    offset: ["start end", "end start"]
  });
  
  const imageY = useTransform(scrollYProgress, [0, 1], ["-5%", "5%"]);
  const contentY = useTransform(scrollYProgress, [0, 1], ["10px", "-10px"]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.7, 1, 1, 0.7]);
  
  return (
    <motion.div 
      key={section.id} 
      className="relative"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, delay: index * 0.15 }}
      style={{ opacity }}
    >
      <div className={`flex ${isReversed ? 'flex-row-reverse' : 'flex-row'} bg-gradient-to-br from-obsidian/80 to-[#0f0f0f]/80 backdrop-blur-sm border border-gold-500/5 rounded-3xl overflow-hidden group hover:border-gold-500/10 transition-all duration-800 ease-smooth shadow-refined hover:shadow-refined-lg`}>
        {/* Image Section - Fixed aspect ratio */}
        <div className="w-1/2 relative aspect-[4/3] overflow-hidden">
          {isLoading ? (
            <div className="absolute inset-0 bg-[#080808] flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-[#C9A449]/30 border-t-[#C9A449] rounded-full animate-spin"></div>
            </div>
          ) : (
            <motion.div
              className="absolute inset-0"
              style={{ y: imageY }}
            >
              <Image
                src={section.image}
                alt={section.alt}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover brightness-90 group-hover:brightness-95 transition-all duration-1000 ease-smooth scale-102 group-hover:scale-100"
                priority={index === 0}
              />
            </motion.div>
          )}
          {/* Refined overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gold-500/3 to-gold-500/5 group-hover:via-gold-500/5 group-hover:to-gold-500/8 transition-all duration-800"></div>
          
          {/* Refined ornamental elements */}
          <div className={`absolute top-6 ${isReversed ? 'right-6' : 'left-6'}`}>
            <div className="w-12 h-12 border border-gold-500/10 rounded-2xl ${isReversed ? 'rounded-tr-3xl' : 'rounded-tl-3xl'} relative">
              <div className="absolute inset-3 bg-gold-500/5 rounded-full blur-md"></div>
            </div>
          </div>
          <div className={`absolute bottom-6 ${isReversed ? 'left-6' : 'right-6'}`}>
            <div className="w-2.5 h-2.5 bg-gold-500/20 rounded-full relative">
              <div className="absolute inset-0 bg-gold-500/10 rounded-full blur-md scale-[2]"></div>
            </div>
          </div>

          {/* Artist credit - better positioned */}
          {section.artist && section.artist !== "Bowen Island Tattoo" && (
            <div className={`absolute bottom-6 ${isReversed ? 'right-6' : 'left-6'} text-xs text-gold-500/50 font-body bg-obsidian/60 px-4 py-2 rounded-xl backdrop-blur-xl border border-gold-500/10`}>
              Artist: {section.artist}
            </div>
          )}
        </div>

        {/* Content Section - Improved layout */}
        <div className="w-1/2 relative flex flex-col justify-center px-8 lg:px-12 py-8 lg:py-12">
          {/* Refined background pattern */}
          <div className={`absolute top-0 ${isReversed ? 'left-0' : 'right-0'} w-32 h-32 opacity-[0.01]`}>
            <Image 
              src="/images/bowen-logo.svg" 
              alt="" 
              fill
              sizes="96px"
              className="object-contain brightness-0 invert"
            />
          </div>

          {/* Refined corner elements */}
          <div className={`absolute top-4 ${isReversed ? 'left-4' : 'right-4'}`}>
            <div className={`w-8 h-8 ${isReversed ? 'border-t border-l rounded-tl-2xl' : 'border-t border-r rounded-tr-2xl'} border-gold-500/10`}></div>
          </div>
          <div className={`absolute bottom-4 ${isReversed ? 'right-4' : 'left-4'}`}>
            <div className={`w-8 h-8 ${isReversed ? 'border-b border-r rounded-br-2xl' : 'border-b border-l rounded-bl-2xl'} border-gold-500/10`}></div>
          </div>

          {/* Content */}
          <motion.div 
            className="relative z-10"
            style={{ y: contentY }}
          >
            {/* Refined ornamental line */}
            <div className="flex items-center mb-8">
              <div className="w-20 h-px bg-gradient-to-r from-gold-500/30 to-transparent"></div>
              <div className="w-2.5 h-2.5 bg-gold-500/20 rounded-full mx-5 relative">
                <div className="absolute inset-0 bg-gold-500/10 rounded-full blur-xs scale-150"></div>
              </div>
            </div>

            {/* Accent label */}
            <div className="inline-block bg-gold-500/5 border border-gold-500/20 px-5 py-2.5 text-xs font-medium text-gold-500/80 mb-6 uppercase tracking-[0.02em] rounded-xl backdrop-blur-sm" style={{ fontFamily: 'Playfair Display, serif' }}>
              {section.accent}
            </div>

            {/* Main title */}
            <h2 className="font-body text-3xl lg:text-4xl xl:text-5xl mb-6 text-white leading-tight font-semibold">
              {section.title}
            </h2>

            {/* Subtitle */}
            <h3 className="font-body text-base lg:text-lg text-gold-500/70 mb-6 uppercase tracking-[0.02em] font-light">
              {section.subtitle}
            </h3>

            {/* Description */}
            <p className="font-body text-base lg:text-lg text-white/70 leading-relaxed max-w-sm lg:max-w-md italic font-light">
              {section.description}
            </p>
          </motion.div>
        </div>
      </div>
      
      {/* Refined card separator line */}
      {index < sectionsLength - 1 && (
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 flex items-center">
          <div className="w-24 h-px bg-gradient-to-r from-transparent via-gold-500/10 to-transparent"></div>
          <div className="mx-5 w-2 h-2 bg-gold-500/20 rounded-full relative">
            <div className="absolute inset-0 bg-gold-500/10 rounded-full blur-md scale-[2]"></div>
          </div>
          <div className="w-24 h-px bg-gradient-to-l from-transparent via-gold-500/10 to-transparent"></div>
        </div>
      )}
    </motion.div>
  );
} 