"use client"

import { useRef, useState, useEffect } from "react"
import { motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"

export function AboutBowenIslandSection() {
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLDivElement>(null)

  // Simple intersection observer instead of complex scroll hooks
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
    <div ref={sectionRef} className="bg-[#080808] text-white relative min-h-screen">
      {/* Simplified background elements */}
      <div className="absolute inset-0 z-0 opacity-[0.02]">
        <div className="absolute top-1/4 left-1/12 w-32 h-32">
          <Image 
            src="/images/bowen-logo.svg" 
            alt="" 
            fill
            sizes="128px"
            className="object-contain brightness-0 invert"
            loading="lazy"
          />
        </div>
      </div>

      {/* Section Header */}
      <div className="relative z-10 text-center py-12 px-4 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
        >
          {/* Simplified ornamental line */}
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-[0.5px] bg-gradient-to-r from-transparent to-[#C9A449]/60"></div>
            <div className="mx-4">
              <span className="text-[#C9A449] text-sm">✦</span>
            </div>
            <div className="w-16 h-[0.5px] bg-gradient-to-l from-transparent to-[#C9A449]/60"></div>
          </div>

          <h2 className="font-heading text-4xl md:text-5xl lg:text-6xl text-white mb-4 tracking-wide uppercase">
            About
          </h2>
          <p className="font-body text-2xl text-[#C9A449]/80 mb-4 uppercase tracking-widest font-light">
            Bowen Island Tattoo
          </p>

          {/* Simplified divider */}
          <div className="flex items-center justify-center">
            <div className="w-12 h-[0.5px] bg-gradient-to-r from-[#C9A449]/80 to-[#C9A449]/20"></div>
            <div className="w-2 h-2 border border-[#C9A449]/50 rotate-45 mx-4"></div>
            <div className="w-12 h-[0.5px] bg-gradient-to-l from-[#C9A449]/80 to-[#C9A449]/20"></div>
          </div>
        </motion.div>
      </div>

      {/* Section 1 - The Studio */}
      <div className="relative z-10 min-h-[80vh] flex flex-col md:flex-row items-center py-16 px-4 sm:px-8 md:px-16 lg:px-24">
        <div className="w-full md:w-1/2 mb-10 md:mb-0 overflow-hidden">
          {/* Fixed height container to prevent layout shifts */}
          <div className="relative h-[400px] md:h-[600px] w-full rounded-2xl border border-[#C9A449]/10 group hover:border-[#C9A449]/20 transition-all duration-300 shadow-2xl shadow-black/20">
            {/* Simplified corner elements */}
            <div className="absolute top-2 left-2 h-4 w-4 border-t border-l border-[#C9A449]/30 rounded-tl-sm"></div>
            <div className="absolute bottom-2 right-2 h-4 w-4 border-b border-r border-[#C9A449]/30 rounded-br-sm"></div>

            <Image 
              src="/images/shop-pic2.png" 
              alt="Bowen Island Tattoo Studio Interior" 
              fill 
              className="object-cover brightness-60 group-hover:brightness-70 transition-all duration-300 rounded-2xl" 
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
            
            {/* Simplified overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#C9A449]/5 via-transparent to-[#C9A449]/10 group-hover:from-[#C9A449]/8 group-hover:to-[#C9A449]/15 transition-all duration-300 rounded-2xl"></div>
          </div>
        </div>

        <div className="w-full md:w-1/2 md:pl-16">
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isVisible ? { opacity: 1, x: 0 } : { opacity: 0, x: 30 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="inline-block bg-transparent border border-[#C9A449]/50 px-3 py-1 text-sm font-semibold text-[#C9A449] mb-4 uppercase tracking-widest font-body">
              Private
            </div>

            <h2 className="font-heading text-4xl md:text-5xl mb-4 text-white tracking-wide">
              THE STUDIO
            </h2>
            
            <div className="flex items-center mb-6">
              <div className="w-12 h-[0.5px] bg-gradient-to-r from-[#C9A449]/80 to-[#C9A449]/20"></div>
              <div className="w-2 h-2 border border-[#C9A449]/50 rotate-45 mx-3"></div>
            </div>

            <p className="font-body text-white/90 mb-6 text-xl leading-relaxed">
              Nestled on the serene Bowen Island, our private studio offers an intimate and tranquil environment 
              unlike any traditional tattoo parlor. Away from the hustle and bustle of the city, we provide 
              a peaceful sanctuary where artistry and personal expression flourish.
            </p>
            <p className="font-body text-white/80 text-xl leading-relaxed italic">
              Every detail of our studio has been carefully curated to ensure your comfort and privacy. 
              From the moment you step through our doors, you'll experience the difference that a truly 
              personalized, boutique approach makes to your tattoo journey.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Section 2 - The Setting */}
      <div className="relative z-10 min-h-[80vh] flex flex-col md:flex-row-reverse items-center py-20 px-4 sm:px-8 md:px-16 lg:px-24 bg-black/20">
        <div className="w-full md:w-1/2 mb-10 md:mb-0 overflow-hidden">
          <div className="relative h-[400px] md:h-[600px] w-full rounded-2xl border border-[#C9A449]/10 group hover:border-[#C9A449]/20 transition-all duration-300 shadow-2xl shadow-black/20">
            <div className="absolute top-2 right-2 h-4 w-4 border-t border-r border-[#C9A449]/30 rounded-tr-sm"></div>
            <div className="absolute bottom-2 left-2 h-4 w-4 border-b border-l border-[#C9A449]/30 rounded-bl-sm"></div>

            <Image 
              src="/images/setting-pic.jpg" 
              alt="Master Tattoo Artist at Work" 
              fill 
              className="object-cover brightness-60 group-hover:brightness-70 transition-all duration-300 rounded-2xl" 
              sizes="(max-width: 768px) 100vw, 50vw"
              loading="lazy"
            />
            
            <div className="absolute inset-0 bg-gradient-to-bl from-[#C9A449]/5 via-transparent to-[#C9A449]/10 group-hover:from-[#C9A449]/8 group-hover:to-[#C9A449]/15 transition-all duration-300 rounded-2xl"></div>
          </div>
        </div>

        <div className="w-full md:w-1/2 md:pr-16">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isVisible ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="inline-block bg-transparent border border-[#C9A449]/50 px-3 py-1 text-xs font-semibold text-[#C9A449] mb-4 uppercase tracking-widest font-body">
              Island Life
            </div>

            <h2 className="font-heading text-4xl md:text-5xl mb-4 text-white tracking-wide">
              THE SETTING
            </h2>
            
            <div className="flex items-center mb-6">
              <div className="w-12 h-[0.5px] bg-gradient-to-r from-[#C9A449]/80 to-[#C9A449]/20"></div>
              <div className="w-2 h-2 border border-[#C9A449]/50 rotate-45 mx-3"></div>
            </div>

            <p className="font-body text-white/90 mb-6 text-lg leading-relaxed">
              Bowen Island offers more than just a location—it provides an escape. Just a short ferry ride 
              from Vancouver, our studio is situated in a place where time slows down and nature's beauty 
              becomes part of your tattoo journey.
            </p>
            <p className="font-body text-white/80 text-lg leading-relaxed italic">
              The island's serene atmosphere creates the perfect environment for thoughtful, intentional 
              tattooing. Here, surrounded by forest and ocean, you'll find the mental space to truly 
              connect with your artistic vision.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Section 3 - The Product */}
      <div className="relative z-10 min-h-[80vh] flex flex-col md:flex-row items-center py-20 px-4 sm:px-8 md:px-16 lg:px-24">
        <div className="w-full md:w-1/2 mb-10 md:mb-0 overflow-hidden">
          <div className="relative h-[400px] md:h-[600px] w-full rounded-2xl border border-[#C9A449]/10 group hover:border-[#C9A449]/20 transition-all duration-300 shadow-2xl shadow-black/20">
            <div className="absolute top-2 left-2 h-4 w-4 border-t border-l border-[#C9A449]/30 rounded-tl-sm"></div>
            <div className="absolute bottom-2 right-2 h-4 w-4 border-b border-r border-[#C9A449]/30 rounded-br-sm"></div>

            <Image 
              src="/images/prodcut-pic.jpg" 
              alt="Personalized Tattoo Experience" 
              fill 
              className="object-cover brightness-60 group-hover:brightness-70 transition-all duration-300 rounded-2xl" 
              sizes="(max-width: 768px) 100vw, 50vw"
              loading="lazy"
            />
            
            <div className="absolute inset-0 bg-gradient-to-br from-[#C9A449]/5 via-transparent to-[#C9A449]/10 group-hover:from-[#C9A449]/8 group-hover:to-[#C9A449]/15 transition-all duration-300 rounded-2xl"></div>
          </div>
        </div>

        <div className="w-full md:w-1/2 md:pl-16">
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isVisible ? { opacity: 1, x: 0 } : { opacity: 0, x: 30 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <div className="inline-block bg-transparent border border-[#C9A449]/50 px-3 py-1 text-xs font-semibold text-[#C9A449] mb-4 uppercase tracking-widest font-body">
              Excellence
            </div>

            <h2 className="font-heading text-4xl md:text-5xl mb-4 text-white tracking-wide">
              THE PRODUCT
            </h2>
            
            <div className="flex items-center mb-6">
              <div className="w-12 h-[0.5px] bg-gradient-to-r from-[#C9A449]/80 to-[#C9A449]/20"></div>
              <div className="w-2 h-2 border border-[#C9A449]/50 rotate-45 mx-3"></div>
            </div>

            <p className="font-body text-white/90 mb-6 text-lg leading-relaxed">
              At Bowen Island Tattoo, we don't just create tattoos—we craft lifelong pieces of art. Our 
              approach combines technical precision with artistic innovation, using only the highest quality 
              materials and most advanced techniques.
            </p>
            <p className="font-body text-white/80 text-lg leading-relaxed italic">
              We distinguish ourselves through our unwavering commitment to quality, cleanliness, and 
              attention to detail. From the initial consultation to the final healing process, we ensure 
              every aspect of your tattoo meets our exacting standards.
            </p>

            <div className="mt-8">
              <Link 
                href="/tattooRequest" 
                className="group relative overflow-hidden bg-transparent border border-[#C9A449]/70 text-white hover:bg-[#C9A449]/10 hover:border-[#C9A449] transition-all duration-300 px-8 py-4 font-body tracking-widest uppercase text-sm font-medium"
              >
                <span className="relative z-10">Begin Your Journey</span>
                <div className="absolute inset-0 bg-[#C9A449]/5 transform translate-x-full group-hover:translate-x-0 transition-transform duration-300"></div>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom ornamental element */}
      <div className="relative z-10 py-16">
        <div className="flex items-center justify-center">
          <div className="w-24 h-[0.5px] bg-gradient-to-r from-transparent via-[#C9A449]/60 to-transparent"></div>
          <div className="mx-6 w-3 h-3 border border-[#C9A449]/50 rotate-45 relative">
            <div className="absolute inset-1 bg-[#C9A449]/30 rotate-45"></div>
          </div>
          <div className="w-24 h-[0.5px] bg-gradient-to-l from-transparent via-[#C9A449]/60 to-transparent"></div>
        </div>
      </div>
    </div>
  )
}