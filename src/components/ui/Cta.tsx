"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/src/components/ui/button";
import { typography, colors, effects, layout, components } from '@/src/lib/styles/globalStyleConstants';
import { GAEvents } from '@/src/lib/analytics/ga-events';

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
  title = "Ready to get inked?",
  description = "Come visit us on Bowen Island. We're all about creating tattoos you'll love forever – no rush, no stress, just good vibes and great ink.",
  primaryButtonText = "Let's Talk",
  primaryButtonHref = "/tattooRequest",
  secondaryButtonText = "Get in Touch", 
  secondaryButtonHref = "/contact",
  tagline = "Island artists • Chill studio • Quality ink",
  className = ""
}: CtaSectionProps) {
  
  // Mobile state
  const [isMobile, setIsMobile] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Simple intersection observer for performance
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1, rootMargin: '50px' }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])
  
  return (
    <div ref={sectionRef} className={`bg-gradient-to-b from-obsidian via-[#0f0f0f] to-obsidian ${layout.sectionY.large} ${layout.padding.mobile} ${layout.padding.tablet} ${layout.padding.desktop} ${className}`}>
      <div className="container mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          {/* Refined ornamental divider */}
          <div className="flex items-center justify-center mb-8 md:mb-10">
            <div className={isMobile ? components.ornament.lineLong : `${components.ornament.lineLong} w-36`}></div>
            <div className={`mx-6 md:mx-8 ${components.ornament.dot} relative ${isMobile ? '' : 'w-3 h-3'}`}>
              <div className="absolute inset-0 bg-gold-500/10 rounded-full blur-md scale-[2]"></div>
            </div>
            <div className={isMobile ? components.ornament.lineLong : `${components.ornament.lineLong} w-36`}></div>
          </div>

          <motion.h2 
            initial={{ opacity: 0, y: 15 }}
            animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className={`${
              isMobile 
                ? `${typography.text3xl} ${typography.leadingTight}` 
                : typography.h1
            } ${colors.textPrimary} mb-6 md:mb-8 px-2`}
          >
            {title}
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className={`${colors.textSecondary} max-w-2xl mx-auto mb-8 md:mb-10 ${
              isMobile 
                ? `${typography.textLg} px-4 ${typography.leadingRelaxed}` 
                : typography.paragraphLarge
            }`}
          >
            {description}
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className={`flex ${
              isMobile 
                ? 'flex-col gap-4' 
                : 'flex-col sm:flex-row gap-6'
            } justify-center items-center mb-6 md:mb-8 px-4`}
          >
            <Button 
              href={primaryButtonHref}
              variant="outline"
              size={isMobile ? "lg" : "lg"}
              className={isMobile ? "w-full" : ""}
              onClick={() => GAEvents.ctaButtonClicked(primaryButtonText)}
            >
              {primaryButtonText}
            </Button>
            
            <Button
              href={secondaryButtonHref}
              variant="secondary"
              size={isMobile ? "lg" : "lg"}
              className={isMobile ? "w-full" : ""}
              onClick={() => GAEvents.ctaButtonClicked(secondaryButtonText)}
            >
              {secondaryButtonText}
            </Button>
          </motion.div>

          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className={`${colors.textAccentMuted} italic ${typography.fontLight} ${
              isMobile 
                ? `${typography.textSm} px-2` 
                : typography.textSm
            }`}
          >
            {tagline}
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}