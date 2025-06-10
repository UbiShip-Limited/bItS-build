"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

interface CtaSectionProps {
  title?: string;
  description?: string;
  primaryButtonText?: string;
  primaryButtonHref?: string;
  secondaryButtonText?: string;
  secondaryButtonHref?: string;
  tagline?: string;
  className?: string;
}

export function CtaSection({ 
  title = "YOUR STORY AWAITS",
  description = "Discover our complete portfolio and discuss your custom design during a private consultation. Your vision becomes timeless artistry through our master craftspeople.",
  primaryButtonText = "Book Consultation",
  primaryButtonHref = "/booking",
  secondaryButtonText = "Contact Studio", 
  secondaryButtonHref = "/contact",
  tagline = "Private sessions • Custom designs • Full portfolio review",
  className = ""
}: CtaSectionProps) {
  
  // Mobile state
  const [isMobile, setIsMobile] = useState(false);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  return (
    <div className={`bg-[#080808] py-12 md:py-20 px-4 sm:px-8 md:px-8 lg:px-16 ${className}`}>
      <div className="container mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          {/* Ornamental divider */}
          <div className="flex items-center justify-center mb-6 md:mb-8">
            <div className={`${isMobile ? 'w-16' : 'w-24'} h-[0.5px] bg-gradient-to-r from-transparent via-[#C9A449]/60 to-transparent`}></div>
            <div className={`mx-4 md:mx-6 ${isMobile ? 'w-2 h-2' : 'w-3 h-3'} border border-[#C9A449]/50 rotate-45 relative`}>
              <div className="absolute inset-1 bg-[#C9A449]/30 rotate-45"></div>
            </div>
            <div className={`${isMobile ? 'w-16' : 'w-24'} h-[0.5px] bg-gradient-to-l from-transparent via-[#C9A449]/60 to-transparent`}></div>
          </div>

          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className={`font-heading ${
              isMobile 
                ? 'text-2xl leading-tight' 
                : 'text-3xl md:text-4xl lg:text-5xl'
            } text-white mb-4 md:mb-6 tracking-wide px-2`}
          >
            {title}
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className={`text-white/80 max-w-2xl mx-auto font-body mb-6 md:mb-8 leading-relaxed ${
              isMobile 
                ? 'text-base px-4' 
                : 'text-lg'
            }`}
          >
            {description}
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className={`flex ${
              isMobile 
                ? 'flex-col gap-4' 
                : 'flex-col sm:flex-row gap-6'
            } justify-center items-center mb-6 md:mb-8 px-4`}
          >
            <Link 
              href={primaryButtonHref}
              className={`group relative overflow-hidden bg-transparent border border-[#C9A449]/70 text-white hover:bg-[#C9A449]/10 hover:border-[#C9A449] transition-all duration-300 ${
                isMobile 
                  ? 'w-full px-8 py-4 text-sm' 
                  : 'px-10 py-4 text-sm'
              } font-body tracking-widest uppercase font-medium shadow-[0_8px_30px_rgba(201,164,73,0.2)] hover:shadow-[0_12px_40px_rgba(201,164,73,0.4)] transform hover:scale-105 active:scale-95 flex items-center justify-center min-h-[48px]`}
            >
              <span className="relative z-10">{primaryButtonText}</span>
              <div className="absolute inset-0 bg-[#C9A449]/5 transform translate-x-full group-hover:translate-x-0 transition-transform duration-300"></div>
            </Link>
            
            <Link
              href={secondaryButtonHref}
              className={`border border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white hover:border-white/40 transition-all duration-300 ${
                isMobile 
                  ? 'w-full px-8 py-4 text-sm' 
                  : 'px-10 py-4 text-sm'
              } font-body tracking-widest uppercase font-medium shadow-[0_8px_30px_rgba(255,255,255,0.1)] hover:shadow-[0_12px_40px_rgba(255,255,255,0.2)] transform hover:scale-105 active:scale-95 flex items-center justify-center min-h-[48px]`}
            >
              {secondaryButtonText}
            </Link>
          </motion.div>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className={`text-[#C9A449]/60 font-body italic ${
              isMobile 
                ? 'text-xs px-2' 
                : 'text-sm'
            }`}
          >
            {tagline}
          </motion.p>

          {/* Additional ornamental elements for enhanced visual appeal */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className={`${isMobile ? 'mt-8 mb-8' : 'mt-12 mb-12'} flex justify-center`}
          >
            {/* Decorative elements can be added here if needed */}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}