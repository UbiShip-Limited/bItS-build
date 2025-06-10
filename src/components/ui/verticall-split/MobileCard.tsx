"use client"

import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { SectionCardProps } from "./types";

export function MobileCard({ section, index, isLoading, sectionsLength }: SectionCardProps) {
  return (
    <motion.div 
      key={section.id} 
      className="relative mb-8"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
    >
      <div className="bg-[#080808] border border-[#C9A449]/20 rounded-lg overflow-hidden group hover:border-[#C9A449]/40 transition-all duration-500">
        {/* Mobile Image Section - Full width, larger height */}
        <div className="relative h-64 overflow-hidden">
          {isLoading ? (
            <div className="w-full h-full bg-[#080808] flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-[#C9A449]/30 border-t-[#C9A449] rounded-full animate-spin"></div>
            </div>
          ) : (
            <Image
              src={section.image}
              alt={section.alt}
              fill
              sizes="100vw"
              className="object-cover brightness-40 group-hover:brightness-50 transition-all duration-500"
              priority={index === 0}
            />
          )}
          {/* Gold overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#080808]/90 via-[#C9A449]/5 to-transparent group-hover:via-[#C9A449]/10 transition-all duration-500"></div>
          
          {/* Mobile Ornamental elements */}
          <div className="absolute top-4 left-4">
            <div className="w-8 h-8 border border-[#C9A449]/50 rotate-45 relative">
              <div className="absolute inset-1.5 border border-[#C9A449]/30 rotate-45"></div>
            </div>
          </div>
          <div className="absolute top-4 right-4">
            <div className="relative">
              <div className="w-8 h-8 border border-[#C9A449]/40 rotate-12"></div>
              <div className="absolute top-1/2 left-1/2 w-1.5 h-1.5 bg-[#C9A449]/60 rotate-45 -translate-x-1/2 -translate-y-1/2"></div>
            </div>
          </div>

          {/* Artist credit overlay for mobile */}
          {section.artist && section.artist !== "Bowen Island Tattoo" && (
            <div className="absolute bottom-3 left-4 text-xs text-[#C9A449]/60 font-body tracking-wide">
              Artist: {section.artist}
            </div>
          )}

          {/* Accent label overlay */}
          <div className="absolute bottom-3 right-4">
            <div className="inline-block bg-[#C9A449]/10 border border-[#C9A449]/50 px-2 py-1 text-xs font-semibold text-[#C9A449] uppercase tracking-wider font-body backdrop-blur-sm">
              {section.accent}
            </div>
          </div>
        </div>

        {/* Mobile Content Section */}
        <div className="relative p-6">
          {/* Background pattern */}
          <div className="absolute top-0 right-0 w-16 h-16 opacity-[0.02]">
            <Image 
              src="/images/bowen-logo.svg" 
              alt="Background Logo" 
              fill
              sizes="64px"
              className="object-contain brightness-0 invert"
            />
          </div>

          {/* Ornamental corner elements for mobile */}
          <div className="absolute top-4 right-4">
            <div className="w-4 h-4 border-t border-r border-[#C9A449]/30 relative">
              <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 border border-[#C9A449]/50 rotate-45"></div>
            </div>
          </div>
          <div className="absolute bottom-4 left-4">
            <div className="w-4 h-4 border-b border-l border-[#C9A449]/30 relative">
              <div className="absolute -bottom-0.5 -left-0.5 w-1.5 h-1.5 border border-[#C9A449]/50 rotate-45"></div>
            </div>
          </div>

          {/* Content */}
          <div className="relative z-10">
            {/* Ornamental line above content */}
            <div className="flex items-center mb-4">
              <div className="w-6 h-[0.5px] bg-gradient-to-r from-transparent to-[#C9A449]/60"></div>
              <div className="mx-2 flex items-center justify-center">
                <span className="text-[#C9A449] text-xs">✦</span>
              </div>
              <div className="w-6 h-[0.5px] bg-gradient-to-l from-transparent to-[#C9A449]/60"></div>
            </div>

            {/* Main title */}
            <h2 className="font-heading text-2xl mb-2 text-white leading-tight tracking-wide">
              {section.title}
            </h2>

            {/* Subtitle */}
            <h3 className="font-body text-sm text-[#C9A449]/80 mb-4 uppercase tracking-wide font-light">
              {section.subtitle}
            </h3>

            {/* Ornamental divider */}
            <div className="flex items-center mb-4">
              <div className="w-8 h-[0.5px] bg-gradient-to-r from-[#C9A449]/80 to-[#C9A449]/20"></div>
              <div className="w-1.5 h-1.5 border border-[#C9A449]/50 rotate-45 mx-2"></div>
            </div>

            {/* Description */}
            <p className="font-body text-sm text-white/80 leading-relaxed mb-6 italic">
              {section.description}
            </p>

            {/* CTA Button - Mobile optimized */}
            <Link 
              href="/tattooRequest" 
              className="group relative overflow-hidden bg-transparent border border-[#C9A449]/70 text-white hover:bg-[#C9A449]/10 hover:border-[#C9A449] transition-all duration-300 px-6 py-3 font-body tracking-widest uppercase text-xs font-medium w-full flex items-center justify-center min-h-[44px] active:scale-95"
            >
              <span className="relative z-10">Learn More</span>
              <div className="absolute inset-0 bg-[#C9A449]/5 transform translate-x-full group-hover:translate-x-0 transition-transform duration-300"></div>
            </Link>
          </div>
        </div>
      </div>
      
      {/* Mobile card separator line */}
      {index < sectionsLength - 1 && (
        <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 flex items-center">
          <div className="w-12 h-[0.5px] bg-gradient-to-r from-transparent via-[#C9A449]/30 to-transparent"></div>
          <div className="mx-3 w-1.5 h-1.5 border border-[#C9A449]/40 rotate-45"></div>
          <div className="w-12 h-[0.5px] bg-gradient-to-l from-transparent via-[#C9A449]/30 to-transparent"></div>
        </div>
      )}
    </motion.div>
  );
} 