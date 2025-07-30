"use client"

import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { SectionCardProps } from "./types";

export function MobileCard({ section, index, isLoading, sectionsLength }: SectionCardProps) {
  return (
    <motion.div 
      key={section.id} 
      className="relative mb-8 sm:mb-12"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
    >
              <div className="bg-gradient-to-br from-obsidian/90 to-obsidian/80 backdrop-blur-sm border border-gold-500/20 rounded-3xl overflow-hidden group hover:border-gold-500/30 transition-all duration-800 ease-smooth shadow-refined hover:shadow-refined-lg">
        {/* Mobile Image Section - Proper aspect ratio container */}
        <div className="relative aspect-[4/3] overflow-hidden">
          {isLoading ? (
            <div className="absolute inset-0 bg-obsidian flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-gold-500/30 border-t-gold-500 rounded-full animate-spin"></div>
            </div>
          ) : (
            <Image
              src={section.image}
              alt={section.alt}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover brightness-90 group-hover:brightness-95 transition-all duration-800 ease-smooth"
              priority={index === 0}
            />
          )}
          {/* Refined overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-obsidian/80 via-gold-500/3 to-transparent group-hover:via-gold-500/5 transition-all duration-800"></div>
          
          {/* Enhanced mobile ornamental elements */}
          <div className="absolute top-6 left-6">
            <div className="w-12 h-12 border border-gold-500/20 rounded-2xl rounded-tl-3xl relative">
              <div className="absolute inset-3 bg-gold-500/10 rounded-full blur-md"></div>
            </div>
          </div>
          <div className="absolute bottom-6 right-6">
            <div className="w-2.5 h-2.5 bg-gold-500/30 rounded-full relative">
              <div className="absolute inset-0 bg-gold-500/20 rounded-full blur-md scale-[2]"></div>
            </div>
          </div>

          {/* Artist credit overlay - mobile-optimized positioning */}
          {section.artist && section.artist !== "Bowen Island Tattoo" && (
            <div className="absolute bottom-4 left-4 text-xs text-gold-500/60 font-body bg-obsidian/75 px-3 py-1.5 rounded-lg backdrop-blur-xl border border-gold-500/12">
              Artist: {section.artist}
            </div>
          )}
        </div>

        {/* Mobile Content Section - optimized mobile spacing */}
        <div className="relative px-6 py-8 sm:px-8 sm:py-10 flex flex-col justify-center">
          {/* Subtle background pattern */}
          <div className="absolute top-0 right-0 w-12 h-12 opacity-[0.005]">
            <Image 
              src="/images/bowen-logo.svg" 
              alt="" 
              fill
              sizes="48px"
              className="object-contain brightness-0 invert"
            />
          </div>

          {/* Minimal corner elements for mobile */}
          <div className="absolute top-3 right-3">
            <div className="w-6 h-6 border-t border-r border-gold-500/15 rounded-tr-xl"></div>
          </div>
          <div className="absolute bottom-3 left-3">
            <div className="w-6 h-6 border-b border-l border-gold-500/15 rounded-bl-xl"></div>
          </div>

          {/* Content - mobile-optimized alignment */}
          <div className="relative z-10 text-center sm:text-left">
            {/* Simplified mobile ornamental line */}
            <div className="flex items-center justify-center sm:justify-start mb-6">
              <div className="w-12 h-px bg-gradient-to-r from-gold-500/40 to-transparent"></div>
              <div className="w-1.5 h-1.5 bg-gold-500/30 rounded-full mx-3 relative">
                <div className="absolute inset-0 bg-gold-500/15 rounded-full blur-xs scale-125"></div>
              </div>
              <div className="w-12 h-px bg-gradient-to-l from-gold-500/40 to-transparent"></div>
            </div>

            {/* Mobile-optimized accent label */}
            <div className="inline-block bg-gold-500/10 border border-gold-500/25 px-4 py-2 text-sm font-medium text-gold-500/90 mb-5 tracking-[0.02em] rounded-lg backdrop-blur-sm font-body">
              {section.accent}
            </div>

            {/* Mobile-optimized main title */}
            <h2 className="font-body text-2xl sm:text-3xl mb-4 text-white leading-tight font-semibold">
              {section.title}
            </h2>

            {/* Mobile-optimized subtitle */}
            <h3 className="font-body text-base sm:text-lg text-gold-500/75 mb-4 tracking-[0.02em] font-light">
              {section.subtitle}
            </h3>

            {/* Mobile-optimized description */}
            <p className="font-body text-lg text-white/70 leading-relaxed italic font-light mx-auto sm:mx-0 max-w-xs sm:max-w-sm">
              {section.description}
            </p>
            
          </div>
        </div>
      </div>
      
      {/* Mobile-optimized card separator line */}
      {index < sectionsLength - 1 && (
        <div className="absolute -bottom-4 sm:-bottom-6 left-1/2 transform -translate-x-1/2 flex items-center">
          <div className="w-16 sm:w-20 h-px bg-gradient-to-r from-transparent via-gold-500/20 to-transparent"></div>
          <div className="mx-3 sm:mx-4 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gold-500/30 rounded-full relative">
            <div className="absolute inset-0 bg-gold-500/15 rounded-full blur-sm scale-[1.5]"></div>
          </div>
          <div className="w-16 sm:w-20 h-px bg-gradient-to-l from-transparent via-gold-500/20 to-transparent"></div>
        </div>
      )}
    </motion.div>
  );
} 