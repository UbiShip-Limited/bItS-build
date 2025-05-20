"use client";

import React, { useEffect, useState } from "react";
import { motion, useAnimation } from "framer-motion";
import { Button } from "./button";
import Link from "next/link";

export function CtaSection() {
  const controls = useAnimation();
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const docHeight = document.body.offsetHeight;
      
      // Trigger animation when scrolled 75% down the page
      if (scrollY > docHeight * 0.75 - windowHeight && !hasAnimated) {
        controls.start("visible");
        setHasAnimated(true);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [controls, hasAnimated]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.8,
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  return (
    <section className="relative py-20 overflow-hidden">
      {/* Victorian border details - top */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#C9A449]/40 to-transparent"></div>
      <div className="absolute top-1 left-0 w-full h-[0.5px] bg-gradient-to-r from-transparent via-[#C9A449]/20 to-transparent"></div>
      
      <motion.div 
        className="container mx-auto px-4 max-w-5xl"
        variants={containerVariants}
        initial="hidden"
        animate={controls}
      >
        <motion.div className="text-center" variants={itemVariants}>
          <h2 className="font-heading text-4xl md:text-5xl lg:text-6xl text-[#080808] mb-4">
            Transform Your Vision Into Art
          </h2>
          
          {/* Ornamental divider */}
          <div className="relative flex justify-center items-center my-6">
            <div className="absolute w-full h-[0.5px] bg-gradient-to-r from-transparent via-[#C9A449] to-transparent"></div>
            <div className="relative bg-white px-4 z-10">
              <span className="text-[#C9A449] text-2xl">✦</span>
            </div>
          </div>
          
          <motion.p className="font-body text-[#444444] text-lg md:text-xl max-w-2xl mx-auto mb-10" variants={itemVariants}>
            Your body is a canvas worthy of timeless artistry. Begin your journey with Bowen Island's premier tattoo artisans.
          </motion.p>
          
          <motion.div 
            className="flex flex-col md:flex-row items-center justify-center gap-6"
            variants={itemVariants}
          >
            <Link 
              href="/booking"
              className="group relative overflow-hidden bg-[#080808] border border-[#080808] text-white hover:text-[#C9A449] transition-all duration-500 px-10 py-4"
            >
              <span className="absolute inset-0 w-0 bg-white transition-all duration-500 ease-out group-hover:w-full"></span>
              <span className="relative font-heading tracking-wider text-xl z-10">
                Book Your Consultation
              </span>
            </Link>
            
            <Link
              href="/gallery"
              className="group relative overflow-hidden bg-transparent border border-[#C9A449] text-[#080808] hover:text-[#C9A449] transition-all duration-500 px-10 py-4"
            >
              <span className="absolute inset-0 w-0 bg-[#080808] transition-all duration-500 ease-out group-hover:w-full"></span>
              <span className="relative font-heading tracking-wider text-xl z-10">
                Explore Our Portfolio
              </span>
            </Link>
          </motion.div>
        </motion.div>
        
        {/* Victorian corner ornaments */}
        <div className="absolute top-4 left-4 w-16 h-16 border-t border-l border-[#C9A449]/40"></div>
        <div className="absolute top-4 right-4 w-16 h-16 border-t border-r border-[#C9A449]/40"></div>
        <div className="absolute bottom-4 left-4 w-16 h-16 border-b border-l border-[#C9A449]/40"></div>
        <div className="absolute bottom-4 right-4 w-16 h-16 border-b border-r border-[#C9A449]/40"></div>
      </motion.div>
      
      {/* Victorian border details - bottom */}
      <div className="absolute bottom-1 left-0 w-full h-[0.5px] bg-gradient-to-r from-transparent via-[#C9A449]/20 to-transparent"></div>
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#C9A449]/40 to-transparent"></div>
    </section>
  );
} 