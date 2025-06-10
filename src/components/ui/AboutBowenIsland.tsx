"use client"

import { useRef } from "react"
import { motion, useScroll, useTransform } from "framer-motion"
import Image from "next/image"
import Link from "next/link"

export function AboutBowenIslandSection() {
  // Refs for each section
  const section1Ref = useRef<HTMLDivElement>(null)
  const section2Ref = useRef<HTMLDivElement>(null)
  const section3Ref = useRef<HTMLDivElement>(null)

  // Scroll progress for each section - more controlled scroll triggers
  const { scrollYProgress: scrollYProgress1 } = useScroll({
    target: section1Ref,
    offset: ["start center", "end center"],
  })

  const { scrollYProgress: scrollYProgress2 } = useScroll({
    target: section2Ref,
    offset: ["start center", "end center"],
  })

  const { scrollYProgress: scrollYProgress3 } = useScroll({
    target: section3Ref,
    offset: ["start center", "end center"],
  })

  // Transform values for parallax effect - subtle, refined movement
  const y1 = useTransform(scrollYProgress1, [0, 1], [40, -40])
  const y2 = useTransform(scrollYProgress2, [0, 1], [30, -30])
  const y3 = useTransform(scrollYProgress3, [0, 1], [35, -35])

  return (
    <div className="bg-[#080808] text-white relative">
      {/* Ornamental background elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/12 w-32 h-32 opacity-[0.02]">
          <Image 
            src="/images/bowen-logo.svg" 
            alt="Background Logo" 
            fill
            sizes="128px"
            className="object-contain brightness-0 invert"
          />
        </div>
        <div className="absolute top-3/4 right-1/12 w-24 h-24 opacity-[0.02] rotate-45">
          <Image 
            src="/images/bowen-logo.svg" 
            alt="Background Logo" 
            fill
            sizes="96px"
            className="object-contain brightness-0 invert"
          />
        </div>
        <div className="absolute top-1/2 left-1/2 w-16 h-16 opacity-[0.01] -translate-x-1/2 -translate-y-1/2 rotate-12">
          <Image 
            src="/images/bowen-logo.svg" 
            alt="Background Logo" 
            fill
            sizes="64px"
            className="object-contain brightness-0 invert"
          />
        </div>
      </div>

      {/* Section Header */}
      <div className="relative z-10 text-center py-12 px-4 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          {/* Ornamental line above title */}
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-[0.5px] bg-gradient-to-r from-transparent to-[#C9A449]/60"></div>
            <div className="mx-4 flex items-center justify-center">
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

          {/* Ornamental divider */}
          <div className="flex items-center justify-center">
            <div className="w-12 h-[0.5px] bg-gradient-to-r from-[#C9A449]/80 to-[#C9A449]/20"></div>
            <div className="w-2 h-2 border border-[#C9A449]/50 rotate-45 mx-4"></div>
            <div className="w-12 h-[0.5px] bg-gradient-to-l from-[#C9A449]/80 to-[#C9A449]/20"></div>
          </div>
        </motion.div>
      </div>

      {/* Section 1 - The Studio */}
              <div
          ref={section1Ref}
          className="relative z-10 min-h-screen flex flex-col md:flex-row items-center py-16 px-4 sm:px-8 md:px-16 lg:px-24"
        >
        <div className="w-full md:w-1/2 mb-10 md:mb-0 overflow-hidden">
          <motion.div
            className="relative h-[400px] md:h-[600px] w-full rounded-2xl border border-[#C9A449]/10 group hover:border-[#C9A449]/20 transition-all duration-700 shadow-2xl shadow-black/20 hover:shadow-[#C9A449]/5"
            style={{ 
              y: y1,
              filter: 'drop-shadow(0 0 40px rgba(255, 255, 255, 0.03)) drop-shadow(0 0 80px rgba(255, 255, 255, 0.02))'
            }}
          >
            {/* Soft ornamental corner elements */}
            <div className="absolute top-2 left-2 h-4 w-4 border-t border-l border-[#C9A449]/30 rounded-tl-sm"></div>
            <div className="absolute bottom-2 right-2 h-4 w-4 border-b border-r border-[#C9A449]/30 rounded-br-sm"></div>
            <div className="absolute top-2 right-2 h-2 w-2 border border-[#C9A449]/20 rotate-45 rounded-sm"></div>
            <div className="absolute bottom-2 left-2 h-2 w-2 border border-[#C9A449]/20 rotate-45 rounded-sm"></div>

            <Image 
              src="/images/shop-pic2.png" 
              alt="Bowen Island Tattoo Studio Interior" 
              fill 
              className="object-cover brightness-60 group-hover:brightness-70 transition-all duration-700 rounded-2xl" 
            />
            
            {/* Soft gold overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#C9A449]/5 via-transparent to-[#C9A449]/10 group-hover:from-[#C9A449]/8 group-hover:to-[#C9A449]/15 transition-all duration-700 rounded-2xl"></div>
          </motion.div>
        </div>

        <div className="w-full md:w-1/2 md:pl-16">
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {/* Accent label */}
            <div className="inline-block bg-transparent border border-[#C9A449]/50 px-3 py-1 text-sm font-semibold text-[#C9A449] mb-4 uppercase tracking-widest font-body">
              Private
            </div>

            <h2 className="font-heading text-4xl md:text-5xl mb-4 text-white drop-shadow-[0_0_8px_rgba(201,164,73,0.3)] tracking-wide">
              THE STUDIO
            </h2>
            
            {/* Ornamental divider */}
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
      <div
        ref={section2Ref}
        className="relative z-10 min-h-screen flex flex-col md:flex-row-reverse items-center py-20 px-4 sm:px-8 md:px-16 lg:px-24 bg-black/20"
      >
        <div className="w-full md:w-1/2 mb-10 md:mb-0 overflow-hidden">
          <motion.div
            className="relative h-[400px] md:h-[600px] w-full rounded-2xl border border-[#C9A449]/10 group hover:border-[#C9A449]/20 transition-all duration-700 shadow-2xl shadow-black/20 hover:shadow-[#C9A449]/5"
            style={{ 
              y: y2,
              filter: 'drop-shadow(0 0 40px rgba(255, 255, 255, 0.03)) drop-shadow(0 0 80px rgba(255, 255, 255, 0.02))'
            }}
          >
            {/* Soft ornamental corner elements */}
            <div className="absolute top-2 right-2 h-4 w-4 border-t border-r border-[#C9A449]/30 rounded-tr-sm"></div>
            <div className="absolute bottom-2 left-2 h-4 w-4 border-b border-l border-[#C9A449]/30 rounded-bl-sm"></div>
            <div className="absolute top-2 left-2 h-2 w-2 border border-[#C9A449]/20 rotate-45 rounded-sm"></div>
            <div className="absolute bottom-2 right-2 h-2 w-2 border border-[#C9A449]/20 rotate-45 rounded-sm"></div>

            <Image 
              src="/gallery-images/image4.jpeg" 
              alt="Master Tattoo Artist at Work" 
              fill 
              className="object-cover brightness-60 group-hover:brightness-70 transition-all duration-700 rounded-2xl" 
            />
            
            {/* Soft gold overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-bl from-[#C9A449]/5 via-transparent to-[#C9A449]/10 group-hover:from-[#C9A449]/8 group-hover:to-[#C9A449]/15 transition-all duration-700 rounded-2xl"></div>
          </motion.div>
        </div>

        <div className="w-full md:w-1/2 md:pr-16">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {/* Accent label */}
            <div className="inline-block bg-transparent border border-[#C9A449]/50 px-3 py-1 text-xs font-semibold text-[#C9A449] mb-4 uppercase tracking-widest font-body">
              Island Life
            </div>

            <h2 className="font-heading text-4xl md:text-5xl mb-4 text-white drop-shadow-[0_0_8px_rgba(201,164,73,0.3)] tracking-wide">
              THE SETTING
            </h2>
            
            {/* Ornamental divider */}
            <div className="flex items-center mb-6">
              <div className="w-12 h-[0.5px] bg-gradient-to-r from-[#C9A449]/80 to-[#C9A449]/20"></div>
              <div className="w-2 h-2 border border-[#C9A449]/50 rotate-45 mx-3"></div>
            </div>

            <p className="font-body text-white/90 mb-6 text-lg leading-relaxed">
              Bowen Island offers more than just a location—it provides an escape. Just a short ferry ride 
              from Vancouver, our studio is situated in a place where time slows down and nature's beauty 
              becomes part of your tattoo journey. This isn't just about getting a tattoo; it's about the 
              experience of disconnecting from the urban rush.
            </p>
            <p className="font-body text-white/80 text-lg leading-relaxed italic">
              The island's serene atmosphere creates the perfect environment for thoughtful, intentional 
              tattooing. Here, surrounded by forest and ocean, you'll find the mental space to truly 
              connect with your artistic vision and the meaning behind your chosen piece.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Section 3 - The Product */}
      <div
        ref={section3Ref}
        className="relative z-10 min-h-screen flex flex-col md:flex-row items-center py-20 px-4 sm:px-8 md:px-16 lg:px-24"
      >
        <div className="w-full md:w-1/2 mb-10 md:mb-0 overflow-hidden">
          <motion.div
            className="relative h-[400px] md:h-[600px] w-full rounded-2xl border border-[#C9A449]/10 group hover:border-[#C9A449]/20 transition-all duration-700 shadow-2xl shadow-black/20 hover:shadow-[#C9A449]/5"
            style={{ 
              y: y3,
              filter: 'drop-shadow(0 0 40px rgba(255, 255, 255, 0.03)) drop-shadow(0 0 80px rgba(255, 255, 255, 0.02))'
            }}
          >
            {/* Soft ornamental corner elements */}
            <div className="absolute top-2 left-2 h-4 w-4 border-t border-l border-[#C9A449]/30 rounded-tl-sm"></div>
            <div className="absolute bottom-2 right-2 h-4 w-4 border-b border-r border-[#C9A449]/30 rounded-br-sm"></div>
            <div className="absolute top-2 right-2 h-2 w-2 border border-[#C9A449]/20 rotate-45 rounded-sm"></div>
            <div className="absolute bottom-2 left-2 h-2 w-2 border border-[#C9A449]/20 rotate-45 rounded-sm"></div>

            <Image 
              src="/gallery-images/image9.png" 
              alt="Personalized Tattoo Experience" 
              fill 
              className="object-cover brightness-60 group-hover:brightness-70 transition-all duration-700 rounded-2xl" 
            />
            
            {/* Soft gold overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#C9A449]/5 via-transparent to-[#C9A449]/10 group-hover:from-[#C9A449]/8 group-hover:to-[#C9A449]/15 transition-all duration-700 rounded-2xl"></div>
          </motion.div>
        </div>

        <div className="w-full md:w-1/2 md:pl-16">
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {/* Accent label */}
            <div className="inline-block bg-transparent border border-[#C9A449]/50 px-3 py-1 text-xs font-semibold text-[#C9A449] mb-4 uppercase tracking-widest font-body">
              Excellence
            </div>

            <h2 className="font-heading text-4xl md:text-5xl mb-4 text-white drop-shadow-[0_0_8px_rgba(201,164,73,0.3)] tracking-wide">
              THE PRODUCT
            </h2>
            
            {/* Ornamental divider */}
            <div className="flex items-center mb-6">
              <div className="w-12 h-[0.5px] bg-gradient-to-r from-[#C9A449]/80 to-[#C9A449]/20"></div>
              <div className="w-2 h-2 border border-[#C9A449]/50 rotate-45 mx-3"></div>
            </div>

            <p className="font-body text-white/90 mb-6 text-lg leading-relaxed">
              At Bowen Island Tattoo, we don't just create tattoos—we craft lifelong pieces of art. Our 
              approach combines technical precision with artistic innovation, using only the highest quality 
              materials and most advanced techniques. Every piece is meticulously planned, expertly executed, 
              and given the time it deserves to achieve perfection.
            </p>
            <p className="font-body text-white/80 text-lg leading-relaxed italic">
              We distinguish ourselves through our unwavering commitment to quality, cleanliness, and 
              attention to detail. From the initial consultation to the final healing process, we ensure 
              every aspect of your tattoo meets our exacting standards. This is why our clients trust us 
              with their most meaningful pieces and return time after time.
            </p>

            {/* CTA Button */}
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