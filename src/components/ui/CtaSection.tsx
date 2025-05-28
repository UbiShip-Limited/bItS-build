"use client";

import React, { useEffect, useState } from "react";
import { motion, useAnimation } from "framer-motion";
import Link from "next/link";
import Image from "next/image";

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
        duration: 1.2,
        staggerChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: "easeOut" }
    }
  };

  const backgroundVariants = {
    hidden: { scale: 1.1, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: { duration: 2, ease: "easeOut" }
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Dramatic Background Image */}
      <motion.div 
        className="absolute inset-0 z-0"
        variants={backgroundVariants}
        initial="hidden"
        animate={controls}
      >
        <Image 
          src="/images/shop-pic2.png" 
          alt="Bowen Island Tattoo Studio" 
          fill 
          className="object-cover"
          priority
        />
        {/* Multiple overlay layers for dramatic effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#080808]/70 via-[#080808]/50 to-[#080808]/80"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#080808]/60 via-transparent to-[#080808]/60"></div>
        
        {/* Subtle texture overlay */}
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_50%,rgba(201,164,73,0.1)_0%,transparent_50%)]"></div>
      </motion.div>

      {/* Faded Logo Watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
        <motion.div 
          className="relative w-full max-w-4xl aspect-square opacity-5"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.05 }}
          transition={{ duration: 3, delay: 0.5 }}
        >
          <Image 
            src="/images/bowen-logo.svg" 
            alt="Bowen Island Tattoo Logo" 
            fill
            className="object-contain"
            style={{ 
              filter: "invert(70%) sepia(38%) saturate(789%) hue-rotate(12deg) brightness(92%) contrast(88%)" 
            }}
          />
        </motion.div>
      </div>

      {/* Victorian ornamental borders */}
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-[#C9A449]/60 to-transparent z-20"></div>
      <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-[#C9A449]/60 to-transparent z-20"></div>
      
      <motion.div 
        className="container mx-auto px-4 max-w-6xl relative z-30"
        variants={containerVariants}
        initial="hidden"
        animate={controls}
      >
        <motion.div className="text-center" variants={itemVariants}>
          <motion.h2 
            className="font-heading text-5xl md:text-6xl lg:text-7xl text-white mb-6 drop-shadow-[0_4px_20px_rgba(0,0,0,0.8)]"
            variants={itemVariants}
          >
            Transform Your Vision Into Art
          </motion.h2>
          
          {/* Enhanced ornamental divider */}
          <motion.div 
            className="relative flex justify-center items-center my-8"
            variants={itemVariants}
          >
            <div className="absolute w-full h-[1px] bg-gradient-to-r from-transparent via-[#C9A449] to-transparent"></div>
            <div className="absolute w-full h-[1px] bg-gradient-to-r from-transparent via-[#C9A449]/50 to-transparent transform translate-y-1"></div>
            <div className="relative bg-[#080808]/80 backdrop-blur-sm px-6 py-2 z-10 border border-[#C9A449]/30">
              <span className="text-[#C9A449] text-3xl drop-shadow-[0_0_10px_rgba(201,164,73,0.5)]">✦</span>
            </div>
          </motion.div>
          
          <motion.p 
            className="font-body text-white/90 text-xl md:text-2xl max-w-3xl mx-auto mb-12 drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] leading-relaxed" 
            variants={itemVariants}
          >
            Your body is a canvas worthy of timeless artistry. Begin your journey with Bowen Island's premier tattoo artisans.
          </motion.p>
          
          <motion.div 
            className="flex flex-col md:flex-row items-center justify-center gap-8"
            variants={itemVariants}
          >
            <Link 
              href="/booking"
              className="group relative overflow-hidden bg-[#C9A449] border-2 border-[#C9A449] text-[#080808] hover:text-white transition-all duration-700 px-12 py-5 shadow-[0_8px_30px_rgba(201,164,73,0.3)] hover:shadow-[0_12px_40px_rgba(201,164,73,0.5)] transform hover:scale-105"
            >
              <span className="absolute inset-0 w-0 bg-[#080808] transition-all duration-700 ease-out group-hover:w-full"></span>
              <span className="relative font-heading tracking-wider text-xl font-semibold z-10">
                Book Your Consultation
              </span>
            </Link>
            
            <Link
              href="/gallery"
              className="group relative overflow-hidden bg-transparent border-2 border-white/60 text-white hover:text-[#080808] transition-all duration-700 px-12 py-5 backdrop-blur-sm hover:backdrop-blur-none shadow-[0_8px_30px_rgba(255,255,255,0.1)] hover:shadow-[0_12px_40px_rgba(255,255,255,0.3)] transform hover:scale-105"
            >
              <span className="absolute inset-0 w-0 bg-white transition-all duration-700 ease-out group-hover:w-full"></span>
              <span className="relative font-heading tracking-wider text-xl font-semibold z-10">
                Explore Our Portfolio
              </span>
            </Link>
          </motion.div>
        </motion.div>
        
        {/* Enhanced Victorian corner ornaments */}
        <motion.div 
          className="absolute top-8 left-8 w-24 h-24 border-t-2 border-l-2 border-[#C9A449]/60"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 1 }}
        ></motion.div>
        <motion.div 
          className="absolute top-8 right-8 w-24 h-24 border-t-2 border-r-2 border-[#C9A449]/60"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 1.2 }}
        ></motion.div>
        <motion.div 
          className="absolute bottom-8 left-8 w-24 h-24 border-b-2 border-l-2 border-[#C9A449]/60"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 1.4 }}
        ></motion.div>
        <motion.div 
          className="absolute bottom-8 right-8 w-24 h-24 border-b-2 border-r-2 border-[#C9A449]/60"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 1.6 }}
        ></motion.div>

        {/* Additional decorative elements */}
        <motion.div 
          className="absolute top-1/2 left-4 transform -translate-y-1/2 w-1 h-32 bg-gradient-to-b from-transparent via-[#C9A449]/40 to-transparent"
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: 1.5, delay: 2 }}
        ></motion.div>
        <motion.div 
          className="absolute top-1/2 right-4 transform -translate-y-1/2 w-1 h-32 bg-gradient-to-b from-transparent via-[#C9A449]/40 to-transparent"
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: 1.5, delay: 2.2 }}
        ></motion.div>
      </motion.div>
    </section>
  );
} 