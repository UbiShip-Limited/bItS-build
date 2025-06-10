"use client"

import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { SectionCardProps } from "./types";

export function DesktopCard({ section, index, isLoading, sectionsLength }: SectionCardProps) {
  const isReversed = index % 2 === 1;
  
  return (
    <motion.div 
      key={section.id} 
      className="relative"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, delay: index * 0.15 }}
    >
      <div className={`flex ${isReversed ? 'flex-row-reverse' : 'flex-row'} bg-[#080808] border border-[#C9A449]/20 rounded-lg overflow-hidden group hover:border-[#C9A449]/40 transition-all duration-300 shadow-xl`}>
        {/* Image Section - Fixed aspect ratio */}
        <div className="w-1/2 relative aspect-[4/3] overflow-hidden">
          {isLoading ? (
            <div className="absolute inset-0 bg-[#080808] flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-[#C9A449]/30 border-t-[#C9A449] rounded-full animate-spin"></div>
            </div>
          ) : (
            <Image
              src={section.image}
              alt={section.alt}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover brightness-50 group-hover:brightness-60 transition-all duration-300"
              priority={index === 0}
            />
          )}
          {/* Simplified overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#C9A449]/8 to-[#C9A449]/15 group-hover:via-[#C9A449]/12 group-hover:to-[#C9A449]/20 transition-all duration-300"></div>
          
          {/* Optimized ornamental elements */}
          <div className={`absolute top-4 ${isReversed ? 'right-4' : 'left-4'}`}>
            <div className="w-8 h-8 border border-[#C9A449]/50 rotate-45 relative">
              <div className="absolute inset-1.5 border border-[#C9A449]/30 rotate-45"></div>
            </div>
          </div>
          <div className={`absolute bottom-4 ${isReversed ? 'left-4' : 'right-4'}`}>
            <div className="w-6 h-6 border border-[#C9A449]/40 rotate-12 relative">
              <div className="absolute top-1/2 left-1/2 w-1.5 h-1.5 bg-[#C9A449]/60 rotate-45 -translate-x-1/2 -translate-y-1/2"></div>
            </div>
          </div>

          {/* Artist credit - better positioned */}
          {section.artist && section.artist !== "Bowen Island Tattoo" && (
            <div className={`absolute bottom-3 ${isReversed ? 'right-3' : 'left-3'} text-xs text-[#C9A449]/70 font-body tracking-wide bg-[#080808]/60 px-2 py-1 rounded backdrop-blur-sm`}>
              Artist: {section.artist}
            </div>
          )}
        </div>

        {/* Content Section - Improved layout */}
        <div className="w-1/2 relative flex flex-col justify-center px-6 lg:px-8 py-6 lg:py-8">
          {/* Simplified background pattern */}
          <div className={`absolute top-0 ${isReversed ? 'left-0' : 'right-0'} w-20 h-20 opacity-[0.02]`}>
            <Image 
              src="/images/bowen-logo.svg" 
              alt="" 
              fill
              sizes="80px"
              className="object-contain brightness-0 invert"
            />
          </div>

          {/* Simplified corner elements */}
          <div className={`absolute top-3 ${isReversed ? 'left-3' : 'right-3'}`}>
            <div className={`w-4 h-4 ${isReversed ? 'border-t border-l' : 'border-t border-r'} border-[#C9A449]/30`}></div>
          </div>
          <div className={`absolute bottom-3 ${isReversed ? 'right-3' : 'left-3'}`}>
            <div className={`w-4 h-4 ${isReversed ? 'border-b border-r' : 'border-b border-l'} border-[#C9A449]/30`}></div>
          </div>

          {/* Content */}
          <div className="relative z-10">
            {/* Simplified ornamental line */}
            <div className="flex items-center mb-4">
              <div className="w-10 h-[0.5px] bg-gradient-to-r from-transparent to-[#C9A449]/60"></div>
              <div className="mx-3">
                <span className="text-[#C9A449] text-sm">✦</span>
              </div>
              <div className="w-10 h-[0.5px] bg-gradient-to-l from-transparent to-[#C9A449]/60"></div>
            </div>

            {/* Accent label */}
            <div className="inline-block bg-transparent border border-[#C9A449]/50 px-3 py-1 text-xs font-semibold text-[#C9A449] mb-4 uppercase tracking-widest font-body rounded-sm">
              {section.accent}
            </div>

            {/* Main title - better responsive sizing */}
            <h2 className="font-heading text-2xl lg:text-3xl xl:text-4xl mb-3 text-white leading-tight tracking-wide">
              {section.title}
            </h2>

            {/* Subtitle */}
            <h3 className="font-body text-sm lg:text-base text-[#C9A449]/80 mb-4 uppercase tracking-wide font-light">
              {section.subtitle}
            </h3>

            {/* Simplified divider */}
            <div className="flex items-center mb-5">
              <div className="w-8 h-[0.5px] bg-gradient-to-r from-[#C9A449]/80 to-[#C9A449]/20"></div>
              <div className="w-1.5 h-1.5 border border-[#C9A449]/50 rotate-45 mx-3"></div>
            </div>

            {/* Description - better max width */}
            <p className="font-body text-sm lg:text-base text-white/80 leading-relaxed max-w-sm lg:max-w-md mb-6 italic">
              {section.description}
            </p>

            {/* CTA Button - improved hover state */}
            <Link 
              href="/tattooRequest" 
              className="group relative overflow-hidden bg-transparent border border-[#C9A449]/70 text-white hover:bg-[#C9A449]/10 hover:border-[#C9A449] transition-all duration-300 px-6 py-3 font-body tracking-widest uppercase text-xs font-medium inline-flex items-center rounded-sm hover:scale-105 active:scale-95"
            >
              <span className="relative z-10">Learn More</span>
              <div className="absolute inset-0 bg-[#C9A449]/5 transform translate-x-full group-hover:translate-x-0 transition-transform duration-300"></div>
            </Link>
          </div>
        </div>
      </div>
      
      {/* Simplified card separator line */}
      {index < sectionsLength - 1 && (
        <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 flex items-center">
          <div className="w-12 h-[0.5px] bg-gradient-to-r from-transparent via-[#C9A449]/30 to-transparent"></div>
          <div className="mx-3 w-1.5 h-1.5 border border-[#C9A449]/40 rotate-45"></div>
          <div className="w-12 h-[0.5px] bg-gradient-to-l from-transparent via-[#C9A449]/30 to-transparent"></div>
        </div>
      )}
    </motion.div>
  );
} 