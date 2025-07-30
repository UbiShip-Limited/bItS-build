"use client"

import React from "react";
import { motion } from "framer-motion";

interface ScrollIndicatorsProps {
  sections: any[];
  isMobile: boolean;
  currentSection: number;
  onSectionClick: (index: number) => void;
}

export function ScrollIndicators({ 
  sections, 
  isMobile, 
  currentSection, 
  onSectionClick 
}: ScrollIndicatorsProps) {
  return (
    <div className={`fixed ${isMobile ? 'bottom-4' : 'bottom-8'} left-1/2 transform -translate-x-1/2 flex items-center space-x-3 md:space-x-4 z-20`}>
      {/* Refined ornamental line */}
      <div className={`${isMobile ? 'w-8' : 'w-12'} h-px bg-gradient-to-r from-transparent to-gold-500/20`}></div>
      
      {/* Refined indicators */}
      <div className={`flex ${isMobile ? 'space-x-2' : 'space-x-3'}`}>
        {sections.map((_, index) => (
          <motion.div
            key={index}
            className={`${isMobile ? 'w-1.5 h-1.5' : 'w-2 h-2'} bg-gold-500/20 rounded-full relative cursor-pointer border border-gold-500/30`}
            whileInView={{ scale: 1.2 }}
            viewport={{ margin: "-200px" }}
            onClick={() => isMobile && onSectionClick(index)}
          >
            <motion.div
              className="absolute inset-0 bg-gold-500/50 rounded-full"
              initial={{ opacity: 0, scale: 0.5 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ margin: "-200px" }}
              transition={{ duration: 0.3 }}
            />
            <div className="absolute inset-0 bg-gold-500/10 rounded-full blur-sm scale-150"></div>
          </motion.div>
        ))}
      </div>
      
      {/* Refined ornamental line */}
      <div className={`${isMobile ? 'w-8' : 'w-12'} h-px bg-gradient-to-l from-transparent to-gold-500/20`}></div>
    </div>
  );
} 