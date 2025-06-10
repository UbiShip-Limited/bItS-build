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
      {/* Ornamental line */}
      <div className={`${isMobile ? 'w-6' : 'w-8'} h-[0.5px] bg-gradient-to-r from-transparent to-[#C9A449]/40`}></div>
      
      {/* Indicators */}
      <div className={`flex ${isMobile ? 'space-x-2' : 'space-x-3'}`}>
        {sections.map((_, index) => (
          <motion.div
            key={index}
            className={`${isMobile ? 'w-1.5 h-1.5' : 'w-2 h-2'} border border-[#C9A449]/40 rotate-45 relative cursor-pointer`}
            whileInView={{ scale: 1.2 }}
            viewport={{ margin: "-200px" }}
            onClick={() => isMobile && onSectionClick(index)}
          >
            <motion.div
              className="absolute inset-0.5 bg-[#C9A449] rotate-45"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ margin: "-200px" }}
              transition={{ duration: 0.3 }}
            />
          </motion.div>
        ))}
      </div>
      
      {/* Ornamental line */}
      <div className={`${isMobile ? 'w-6' : 'w-8'} h-[0.5px] bg-gradient-to-l from-transparent to-[#C9A449]/40`}></div>
    </div>
  );
} 