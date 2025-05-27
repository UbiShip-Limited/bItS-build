"use client"

import { useRef } from "react"
import { motion, useScroll, useTransform } from "framer-motion"
import Image from "next/image"

export function ParallaxSections() {
  // Refs for each section
  const section1Ref = useRef<HTMLDivElement>(null)
  const section2Ref = useRef<HTMLDivElement>(null)
  const section3Ref = useRef<HTMLDivElement>(null)

  // Scroll progress for each section
  const { scrollYProgress: scrollYProgress1 } = useScroll({
    target: section1Ref,
    offset: ["start end", "end start"],
  })

  const { scrollYProgress: scrollYProgress2 } = useScroll({
    target: section2Ref,
    offset: ["start end", "end start"],
  })

  const { scrollYProgress: scrollYProgress3 } = useScroll({
    target: section3Ref,
    offset: ["start end", "end start"],
  })

  // Transform values for parallax effect
  const y1 = useTransform(scrollYProgress1, [0, 1], [100, -100])
  const y2 = useTransform(scrollYProgress2, [0, 1], [100, -100])
  const y3 = useTransform(scrollYProgress3, [0, 1], [100, -100])

  return (
    <div className="bg-[#080808] text-[#080808]">
      {/* Section 1 - Image on left, text on right */}
      <div
        ref={section1Ref}
        className="min-h-screen flex flex-col md:flex-row items-center py-20 px-8 md:px-16 lg:px-24"
      >
        <div className="w-full md:w-1/2 mb-10 md:mb-0 overflow-hidden">
          <motion.div
            className="relative h-[400px] md:h-[600px] w-full rounded-lg border border-[#444444]"
            style={{ y: y1 }}
          >
            {/* Frame elements */}
            <div className="absolute -top-1 -left-1 h-6 w-6 border-t border-l border-[#C9A449]"></div>
            <div className="absolute -bottom-1 -right-1 h-6 w-6 border-b border-r border-[#C9A449]"></div>

            <Image src="/gallery-images/image5.jpeg" alt="Traditional tattoo art" fill className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-white/90 to-transparent"></div>
          </motion.div>
        </div>

        <div className="w-full md:w-1/2 md:pl-16">
          <h2 className="font-heading text-4xl md:text-5xl mb-6 text-[#C9A449] drop-shadow-[0_0_8px_rgba(201,164,73,0.3)]">
            NATURE & WILDLIFE MASTERY
          </h2>
          <div className="h-1 w-24 bg-[#C9A449] mb-6"></div>
          <p className="font-body text-white mb-6 text-xl">
            At Bowen Island Tattoo, we excel in capturing the raw beauty of nature and wildlife through detailed realism. 
            Our artists specialize in creating lifelike animal portraits and natural landscapes that honor the majesty of the wild.
          </p>
          <p className="font-body text-[#080808]/90 text-xl">
            From majestic wildlife to delicate botanical elements, each piece is meticulously crafted to capture the essence 
            of nature's beauty. We work closely with you to ensure every detail, from fur texture to leaf patterns, 
            is rendered with precision and artistic integrity.
          </p>
        </div>
      </div>

      {/* Section 2 - Text on left, image on right */}
      <div
        ref={section2Ref}
        className="min-h-screen flex flex-col md:flex-row-reverse items-center py-20 px-8 md:px-16 lg:px-24 bg-black"
      >
        <div className="w-full md:w-1/2 mb-10 md:mb-0 overflow-hidden">
          <motion.div
            className="relative h-[400px] md:h-[600px] w-full rounded-lg border border-[#444444]"
            style={{ y: y2 }}
          >
            {/* Frame elements */}
            <div className="absolute -top-1 -right-1 h-6 w-6 border-t border-r border-[#C9A449]"></div>
            <div className="absolute -bottom-1 -left-1 h-6 w-6 border-b border-l border-[#C9A449]"></div>

            <Image src="/gallery-images/image4.jpeg" alt="Modern tattoo designs" fill className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-white/90 to-transparent"></div>
          </motion.div>
        </div>

        <div className="w-full md:w-1/2 md:pr-16">
          <h2 className="font-heading text-4xl md:text-5xl mb-6 text-[#C9A449] drop-shadow-[0_0_8px_rgba(201,164,73,0.3)]">
            MODERN EXPRESSION
          </h2>
          <div className="h-1 w-24 bg-[#C9A449] mb-6"></div>
          <p className="font-body text-white mb-6 text-xl">
            Push the boundaries of conventional tattoo art with our innovative approach to modern designs. Our studio
            embraces contemporary techniques that create bold, distinctive pieces that stand the test of time.
          </p>
          <p className="font-body text-white text-xl">
            From minimalist line work to vibrant color realism, our artists are versed in a diverse range of styles that
            cater to your aesthetic preferences. We stay at the forefront of tattoo evolution while maintaining the
            highest standards of quality and execution.
          </p>
        </div>
      </div>

      {/* Section 3 - Image on left, text on right */}
      <div
        ref={section3Ref}
        className="min-h-screen flex flex-col md:flex-row items-center py-20 px-8 md:px-16 lg:px-24 bg-black"
      >
        <div className="w-full md:w-1/2 mb-10 md:mb-0 overflow-hidden">
          <motion.div
            className="relative h-[400px] md:h-[600px] w-full rounded-lg border border-[#444444]"
            style={{ y: y3 }}
          >
            {/* Frame elements */}
            <div className="absolute -top-1 -left-1 h-6 w-6 border-t border-l border-[#C9A449]"></div>
            <div className="absolute -bottom-1 -right-1 h-6 w-6 border-b border-r border-[#C9A449]"></div>

            <Image src="/gallery-images/image9.png" alt="Custom tattoo experience" fill className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-white/90 to-transparent"></div>
          </motion.div>
        </div>

        <div className="w-full md:w-1/2 md:pl-16">
          <h2 className="font-heading text-4xl md:text-5xl mb-6 text-[#C9A449] drop-shadow-[0_0_8px_rgba(201,164,73,0.3)]">
            PERSONALIZED EXPERIENCE
          </h2>
          <div className="h-1 w-24 bg-[#C9A449] mb-6"></div>
          <p className="font-body text-white mb-6 text-lg">
            Your tattoo journey is as important as the final piece. We provide a comfortable, intimate environment where
            your vision is our priority. Our consultation process ensures that every detail is considered before ink
            meets skin.
          </p>
          <p className="font-body text-white text-lg">
            From first-timers to tattoo enthusiasts, we guide you through each step with professional care and artistic
            insight. Our studio is a sanctuary where your comfort and satisfaction are paramount, creating an experience
            as memorable as the art you'll wear.
          </p>
        </div>
      </div>
    </div>
  )
}