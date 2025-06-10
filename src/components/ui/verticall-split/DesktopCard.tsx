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
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, delay: index * 0.2 }}
    >
      <div className={`flex ${isReversed ? 'flex-row-reverse' : 'flex-row'} bg-[#080808] border border-[#C9A449]/20 rounded-lg overflow-hidden min-h-[400px] group hover:border-[#C9A449]/40 transition-all duration-500`}>
        {/* Image Section */}
        <div className="w-1/2 relative overflow-hidden">
          {isLoading ? (
            <div className="w-full h-full bg-[#080808] flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-[#C9A449]/30 border-t-[#C9A449] rounded-full animate-spin"></div>
            </div>
          ) : (
            <Image
              src={section.image}
              alt={section.alt}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover brightness-40 group-hover:brightness-50 transition-all duration-500"
              priority={index === 0}
            />
          )}
          {/* Gold overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#C9A449]/10 to-[#C9A449]/20 group-hover:via-[#C9A449]/15 group-hover:to-[#C9A449]/25 transition-all duration-500"></div>
          
          {/* Ornamental elements */}
          <div className={`absolute top-6 ${isReversed ? 'right-6' : 'left-6'}`}>
            <div className="w-10 h-10 border border-[#C9A449]/50 rotate-45 relative">
              <div className="absolute inset-2 border border-[#C9A449]/30 rotate-45"></div>
            </div>
          </div>
          <div className={`absolute bottom-6 ${isReversed ? 'left-6' : 'right-6'}`}>
            <div className="relative">
              <div className="w-12 h-12 border border-[#C9A449]/40 rotate-12"></div>
              <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-[#C9A449]/60 rotate-45 -translate-x-1/2 -translate-y-1/2"></div>
            </div>
          </div>

          {/* Artist credit (if available) */}
          {section.artist && section.artist !== "Bowen Island Tattoo" && (
            <div className={`absolute bottom-4 ${isReversed ? 'right-4' : 'left-4'} text-xs text-[#C9A449]/60 font-body tracking-wide`}>
              Artist: {section.artist}
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="w-1/2 relative flex flex-col justify-center px-8 py-8">
          {/* Background pattern */}
          <div className={`absolute top-0 ${isReversed ? 'left-0' : 'right-0'} w-24 h-24 opacity-[0.03]`}>
            <Image 
              src="/images/bowen-logo.svg" 
              alt="Background Logo" 
              fill
              sizes="96px"
              className="object-contain brightness-0 invert"
            />
          </div>

          {/* Ornamental corner elements */}
          <div className={`absolute top-4 ${isReversed ? 'left-4' : 'right-4'}`}>
            <div className={`w-6 h-6 ${isReversed ? 'border-t border-l' : 'border-t border-r'} border-[#C9A449]/30 relative`}>
              <div className={`absolute ${isReversed ? '-top-1 -left-1' : '-top-1 -right-1'} w-2 h-2 border border-[#C9A449]/50 rotate-45`}></div>
            </div>
          </div>
          <div className={`absolute bottom-4 ${isReversed ? 'right-4' : 'left-4'}`}>
            <div className={`w-6 h-6 ${isReversed ? 'border-b border-r' : 'border-b border-l'} border-[#C9A449]/30 relative`}>
              <div className={`absolute ${isReversed ? '-bottom-1 -right-1' : '-bottom-1 -left-1'} w-2 h-2 border border-[#C9A449]/50 rotate-45`}></div>
            </div>
          </div>

          {/* Content */}
          <div className="relative z-10">
            {/* Ornamental line above content */}
            <div className="flex items-center mb-4">
              <div className="w-8 h-[0.5px] bg-gradient-to-r from-transparent to-[#C9A449]/60"></div>
              <div className="mx-3 flex items-center justify-center">
                <span className="text-[#C9A449] text-xs">✦</span>
              </div>
              <div className="w-8 h-[0.5px] bg-gradient-to-l from-transparent to-[#C9A449]/60"></div>
            </div>

            {/* Accent label */}
            <div className="inline-block bg-transparent border border-[#C9A449]/50 px-3 py-1 text-xs font-semibold text-[#C9A449] mb-4 uppercase tracking-widest font-body">
              {section.accent}
            </div>

            {/* Main title */}
            <h2 className="font-heading text-3xl md:text-4xl mb-3 text-white leading-tight tracking-wide">
              {section.title}
            </h2>

            {/* Subtitle */}
            <h3 className="font-body text-base text-[#C9A449]/80 mb-4 uppercase tracking-wide font-light">
              {section.subtitle}
            </h3>

            {/* Ornamental divider */}
            <div className="flex items-center mb-6">
              <div className="w-12 h-[0.5px] bg-gradient-to-r from-[#C9A449]/80 to-[#C9A449]/20"></div>
              <div className="w-2 h-2 border border-[#C9A449]/50 rotate-45 mx-3"></div>
            </div>

            {/* Description */}
            <p className="font-body text-sm text-white/80 leading-relaxed max-w-md mb-6 italic">
              {section.description}
            </p>

            {/* CTA Button */}
            <Link 
              href="/tattooRequest" 
              className="group relative overflow-hidden bg-transparent border border-[#C9A449]/70 text-white hover:bg-[#C9A449]/10 hover:border-[#C9A449] transition-all duration-300 px-6 py-3 font-body tracking-widest uppercase text-xs font-medium"
            >
              <span className="relative z-10">Learn More</span>
              <div className="absolute inset-0 bg-[#C9A449]/5 transform translate-x-full group-hover:translate-x-0 transition-transform duration-300"></div>
            </Link>
          </div>
        </div>
      </div>
      
      {/* Card separator line */}
      {index < sectionsLength - 1 && (
        <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 flex items-center">
          <div className="w-16 h-[0.5px] bg-gradient-to-r from-transparent via-[#C9A449]/30 to-transparent"></div>
          <div className="mx-4 w-2 h-2 border border-[#C9A449]/40 rotate-45"></div>
          <div className="w-16 h-[0.5px] bg-gradient-to-l from-transparent via-[#C9A449]/30 to-transparent"></div>
        </div>
      )}
    </motion.div>
  );
} 