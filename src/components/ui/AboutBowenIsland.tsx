"use client"

import { useRef, useState, useEffect } from "react"
import { motion, useScroll, useTransform } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { typography, colors, effects, layout, components, spacing } from '@/src/lib/styles/globalStyleConstants'

export function AboutBowenIslandSection() {
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLDivElement>(null)
  
  // Parallax scroll effect
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
  })
  
  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "10%"])

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
    <div ref={sectionRef} className="bg-gradient-to-b from-obsidian via-obsidian/95 to-obsidian text-white relative min-h-screen">
      {/* Refined background elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/12 w-32 h-32 opacity-[0.02]">
          <Image 
            src="/images/bowen-logo.svg" 
            alt="" 
            fill
            sizes="128px"
            className="object-contain brightness-0 invert"
            loading="lazy"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-radial-soft from-gold-500/3 via-transparent to-transparent"></div>
      </div>

      {/* Section Header */}
      <div className={`relative z-10 text-center ${layout.sectionY.medium} ${layout.padding.mobile}`}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        >
          {/* Ornamental divider */}
          <div className="flex items-center justify-center mb-8">
            <div className={components.ornament.lineLong} />
            <div className={`mx-6 ${components.ornament.dot} relative`}>
              <div className="absolute inset-0 bg-gold-500/10 rounded-full blur-sm scale-[2]"></div>
            </div>
            <div className={components.ornament.lineLong} />
          </div>

          <h2 className={`${typography.h1} mb-4`}>
            About Bowen Island Tattoo
          </h2>
          <p className={`${typography.h3} ${colors.textAccentSecondary} ${typography.trackingWide}`}>
            Professional tattooing in a private island setting
          </p>
        </motion.div>
      </div>

      {/* Section 1 - The Studio */}
      <div className={`relative z-10 min-h-[80vh] flex flex-col md:flex-row items-center ${layout.sectionY.large} ${layout.padding.mobile} ${layout.padding.tablet} ${layout.padding.desktop} ${layout.containerXl} mx-auto`}>
        <div className="w-full md:w-1/2 mb-10 md:mb-0">
          {/* Fixed aspect ratio container to prevent layout shifts */}
          <div className="relative aspect-[4/3] w-full max-w-lg mx-auto md:mx-0 rounded-3xl border border-gold-500/5 group hover:border-gold-500/10 transition-all duration-800 shadow-refined hover:shadow-refined-lg overflow-hidden">
            {/* Refined corner elements */}
            <div className="absolute top-4 left-4 h-8 w-8 border-t border-l border-gold-500/10 rounded-tl-2xl"></div>
            <div className="absolute bottom-4 right-4 h-8 w-8 border-b border-r border-gold-500/10 rounded-br-2xl"></div>

            <Image 
              src="/images/shop-pic2.png" 
              alt="Bowen Island Tattoo Studio Interior" 
              fill 
              className="object-cover brightness-90 group-hover:brightness-95 group-hover:scale-[1.02] transition-all duration-1000 ease-smooth" 
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
            
            {/* Refined overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-gold-500/2 via-transparent to-gold-500/4 group-hover:from-gold-500/3 group-hover:to-gold-500/5 transition-all duration-800"></div>
          </div>
        </div>

        <div className="w-full md:w-1/2 md:pl-16">
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isVisible ? { opacity: 1, x: 0 } : { opacity: 0, x: 30 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
          >
            <div className={`inline-block bg-gold-500/5 border border-gold-500/20 px-5 py-2.5 ${typography.textBase} ${colors.textAccent} mb-6 ${typography.trackingWide} ${components.radius.small} backdrop-blur-sm`}>
              Private Studio
            </div>

            <h2 className={`${typography.h1} mb-6`}>
              The Studio
            </h2>
            
            <div className="flex items-center mb-8">
              <div className={components.ornament.lineShort}></div>
              <div className={`${components.ornament.dot} mx-5 relative opacity-70`}>
                <div className="absolute inset-0 bg-gold-500/10 rounded-full blur-xs scale-150"></div>
              </div>
            </div>

            <p className={`text-lg lg:text-xl ${colors.textSecondary} mb-6 ${typography.leadingRelaxed}`}>
              Located on the peaceful Bowen Island, our private studio offers a unique tattooing experience 
              away from the busy city environment. We operate by appointment only, ensuring each client 
              receives focused attention and personalized service in a calm, professional setting.
            </p>
            <p className={`text-base lg:text-lg ${colors.textMuted} italic ${typography.fontLight} ${typography.leadingRelaxed}`}>
              Every aspect of our studio has been designed with your comfort and privacy in mind. 
              Our appointment-only approach allows us to provide the time and attention your tattoo 
              deserves, creating an experience that's both professional and personal.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Section 2 - The Setting */}
      <div className="relative bg-gradient-to-b from-transparent via-obsidian/20 to-transparent">
        <div className={`relative z-10 min-h-[80vh] flex flex-col md:flex-row-reverse items-center ${layout.sectionY.large} ${layout.padding.mobile} ${layout.padding.tablet} ${layout.padding.desktop} ${layout.containerXl} mx-auto`}>
        <div className="w-full md:w-1/2 mb-10 md:mb-0">
          <div className="relative aspect-[4/3] w-full max-w-lg mx-auto md:mx-0 rounded-3xl border border-gold-500/5 group hover:border-gold-500/10 transition-all duration-800 shadow-refined hover:shadow-refined-lg overflow-hidden">
            <div className="absolute top-4 right-4 h-8 w-8 border-t border-r border-gold-500/10 rounded-tr-2xl"></div>
            <div className="absolute bottom-4 left-4 h-8 w-8 border-b border-l border-gold-500/10 rounded-bl-2xl"></div>

            <Image 
              src="/images/setting-pic.jpg" 
              alt="Master Tattoo Artist at Work" 
              fill 
              className="object-cover brightness-90 group-hover:brightness-95 group-hover:scale-[1.02] transition-all duration-1000 ease-smooth" 
              sizes="(max-width: 768px) 100vw, 50vw"
              loading="lazy"
            />
            
            <div className="absolute inset-0 bg-gradient-to-bl from-gold-500/2 via-transparent to-gold-500/4 group-hover:from-gold-500/3 group-hover:to-gold-500/5 transition-all duration-800 rounded-3xl"></div>
          </div>
        </div>

        <div className="w-full md:w-1/2 md:pr-16">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isVisible ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className={`inline-block bg-gold-500/5 border border-gold-500/20 px-5 py-2.5 ${typography.textBase} ${typography.fontMedium} ${colors.textAccentProminent} mb-6 ${typography.trackingWide} ${typography.fontUI} ${components.radius.medium} backdrop-blur-sm`}>
              Island Life
            </div>

            <h2 className={`${typography.h1} mb-6 ${colors.textPrimary}`}>
              The Setting
            </h2>
            
            <div className="flex items-center mb-8">
              <div className={components.ornament.lineShort}></div>
              <div className={`${components.ornament.dot} mx-5 relative opacity-70`}>
                <div className="absolute inset-0 bg-gold-500/10 rounded-full blur-xs scale-150"></div>
              </div>
            </div>

            <p className={`text-lg lg:text-xl ${colors.textSecondary} mb-6 ${typography.leadingRelaxed}`}>
              Just a short ferry ride from Vancouver, Bowen Island provides a refreshing escape from 
              urban life. The island's natural beauty and tranquil atmosphere create an ideal environment 
              for thoughtful, deliberate tattooing where both artist and client can focus completely.
            </p>
            <p className={`text-base lg:text-lg ${colors.textMuted} italic ${typography.fontLight} ${typography.leadingRelaxed}`}>
              The journey to our studio becomes part of the experience. By the time you arrive, 
              you'll find yourself in a mindset that's perfect for creating meaningful, lasting art. 
              It's this unique setting that sets us apart from traditional tattoo studios.
            </p>
          </motion.div>
        </div>
      </div>
      </div>

      {/* Section 3 - The Craft */}
      <div className={`relative z-10 min-h-[80vh] flex flex-col md:flex-row items-center ${layout.sectionY.large} ${layout.padding.mobile} ${layout.padding.tablet} ${layout.padding.desktop} ${layout.containerXl} mx-auto`}>
        <div className="w-full md:w-1/2 mb-10 md:mb-0">
          <div className="relative aspect-[4/3] w-full max-w-lg mx-auto md:mx-0 rounded-3xl border border-gold-500/5 group hover:border-gold-500/10 transition-all duration-800 shadow-refined hover:shadow-refined-lg overflow-hidden">
            <div className="absolute top-4 left-4 h-8 w-8 border-t border-l border-gold-500/10 rounded-tl-2xl"></div>
            <div className="absolute bottom-4 right-4 h-8 w-8 border-b border-r border-gold-500/10 rounded-br-2xl"></div>

            <Image 
              src="/images/product-pic.jpeg" 
              alt="Personalized Tattoo Experience" 
              fill 
              className="object-cover brightness-90 group-hover:brightness-95 group-hover:scale-[1.02] transition-all duration-1000 ease-smooth" 
              sizes="(max-width: 768px) 100vw, 50vw"
              loading="lazy"
            />
            
            <div className="absolute inset-0 bg-gradient-to-br from-gold-500/3 via-transparent to-gold-500/6 group-hover:from-gold-500/5 group-hover:to-gold-500/8 transition-all duration-600 rounded-3xl"></div>
          </div>
        </div>

        <div className="w-full md:w-1/2 md:pl-16">
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isVisible ? { opacity: 1, x: 0 } : { opacity: 0, x: 30 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <div className={`inline-block bg-gold-500/5 border border-gold-500/20 px-5 py-2.5 ${typography.textBase} ${typography.fontMedium} ${colors.textAccentProminent} mb-6 ${typography.trackingWide} ${typography.fontUI} ${components.radius.medium} backdrop-blur-sm`}>
              Excellence
            </div>

            <h2 className={`${typography.h1} mb-6 ${colors.textPrimary}`}>
              The Craft
            </h2>
            
            <div className="flex items-center mb-8">
              <div className={components.ornament.lineShort}></div>
              <div className={`${components.ornament.dot} mx-5 relative opacity-70`}>
                <div className="absolute inset-0 bg-gold-500/10 rounded-full blur-xs scale-150"></div>
              </div>
            </div>

            <p className={`text-lg lg:text-xl ${colors.textSecondary} mb-6 ${typography.leadingRelaxed}`}>
              At Bowen Island Tattoo, we combine years of professional experience with modern techniques 
              and the highest quality materials. Our commitment to excellence means taking the time to 
              ensure every piece meets both our standards and your vision.
            </p>
            <p className={`text-base lg:text-lg ${colors.textMuted} italic ${typography.fontLight} ${typography.leadingRelaxed}`}>
              We believe in quality over quantity. Each tattoo receives the attention it deserves, 
              from initial consultation through final healing. This approach has built our reputation 
              and keeps clients coming back for additional work.
            </p>

            <div className="mt-8">
              <Link 
                href="/tattooRequest" 
                className={`group ${components.button.base} ${components.button.variants.secondary} ${components.button.sizes.large} ${typography.trackingWide} inline-block`}
              >
                <span className="relative z-10">Schedule Consultation</span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gold-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-600"></div>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom ornamental element */}
      <div className="relative z-10 py-16">
        <div className="flex items-center justify-center">
          <div className={components.ornament.lineLong}></div>
          <div className={`mx-6 ${components.ornament.dot} relative`}>
            <div className="absolute inset-0 bg-gold-500/20 rounded-full blur-sm scale-150"></div>
          </div>
          <div className={components.ornament.lineLong}></div>
        </div>
      </div>
    </div>
  )
}