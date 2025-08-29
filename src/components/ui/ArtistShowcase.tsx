"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import { Instagram, Globe, AtSign, ChevronRight } from "lucide-react"
import { typography, colors, effects, layout, components } from '@/src/lib/styles/globalStyleConstants'

export function ArtistShowcase() {
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLDivElement>(null)

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
    <section id="artists" ref={sectionRef} className="min-h-screen bg-gradient-to-b from-obsidian via-[#0f0f0f] to-obsidian text-white relative overflow-hidden">
      {/* Refined background elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-radial-soft from-gold-500/3 via-transparent to-transparent"></div>
        <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-gold-500/5 to-transparent"></div>
      </div>

      {/* Main content container */}
      <div className={`relative z-10 min-h-screen flex flex-col justify-center ${layout.sectionY.large} ${layout.padding.mobile} ${layout.padding.tablet} ${layout.padding.desktop}`}>
        
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          {/* Refined ornamental line */}
          <div className="flex items-center justify-center mb-8">
            <div className={components.ornament.lineLong}></div>
            <div className="mx-6">
              <div className={`${components.ornament.dot} relative`}>
                <div className="absolute inset-0 bg-gold-500/10 rounded-full blur-md scale-[2]"></div>
              </div>
            </div>
            <div className={components.ornament.lineLong}></div>
          </div>

          <h2 className={`${typography.h1} ${colors.textPrimary} mb-6`}>
            The Artist
          </h2>
          <p className={`${typography.textXl} ${colors.textAccentSecondary} mb-8 ${typography.trackingWide} ${typography.fontLight}`}>
             Meet Kelly 
          </p>

          {/* Refined divider */}
          <div className="flex items-center justify-center">
            <div className={components.ornament.lineShort}></div>
            <div className={`${components.ornament.dot} mx-5 relative opacity-70`}>
              <div className="absolute inset-0 bg-gold-500/10 rounded-full blur-xs scale-150"></div>
            </div>
            <div className={`${components.ornament.lineShort} rotate-180`}></div>
          </div>
        </motion.div>

        {/* Artist showcase layout */}
        <div className="max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            
            {/* Large portrait section */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={isVisible ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              {/* Fixed height container to prevent layout shifts */}
              <div className="relative aspect-[3/4] w-full max-w-md mx-auto rounded-3xl border border-gold-500/5 group hover:border-gold-500/10 transition-all duration-800 shadow-refined hover:shadow-refined-lg overflow-hidden">
                {/* Refined corner elements */}
                <div className="absolute top-5 left-5 h-10 w-10 border-t border-l border-gold-500/10 rounded-tl-2xl z-10"></div>
                <div className="absolute bottom-5 right-5 h-10 w-10 border-b border-r border-gold-500/10 rounded-br-2xl z-10"></div>

                {/* Main portrait image */}
                <Image
                  src="/artists/artist-kelly.jpg"
                  alt="Kelly Miller - Master Tattoo Artist"
                  fill
                  className="object-cover brightness-90 group-hover:brightness-95 transition-all duration-1000 ease-smooth rounded-3xl"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
                
                {/* Refined overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-obsidian/30 via-transparent to-transparent"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-gold-500/2 via-transparent to-gold-500/4 group-hover:from-gold-500/3 group-hover:to-gold-500/5 transition-all duration-800"></div>
              </div>

              {/* Floating quote element */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                transition={{ duration: 0.6, delay: 0.8 }}
                className="absolute -bottom-8 -right-4 bg-obsidian/60 border border-gold-500/10 rounded-2xl p-6 backdrop-blur-xl shadow-refined"
              >
                <p className="text-gold-500/60 font-body text-sm italic font-light">
                  &ldquo;Every tattoo tells a story&rdquo;
                </p>
              </motion.div>
            </motion.div>

            {/* Bio content section */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={isVisible ? { opacity: 1, x: 0 } : { opacity: 0, x: 30 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="space-y-8"
            >
              {/* Name and title */}
              <div>
                <div className="inline-block bg-gold-500/5 border border-gold-500/30 px-5 py-2.5 text-sm font-medium text-gold-500 mb-6 tracking-wide font-body rounded-lg">
                  Founder
                </div>

                <h3 className={`${typography.h2} mb-4 ${colors.textPrimary}`}>
                  Kelly Miller
                </h3>
                
                <p className={`${typography.textXl} ${colors.textAccentSecondary} mb-8 ${typography.trackingWide} ${typography.fontLight}`}>
                  Artist & Studio Owner
                </p>

                {/* Refined divider */}
                <div className="flex items-center mb-8">
                  <div className={components.ornament.lineShort}></div>
                  <div className={`${components.ornament.dot} mx-4 w-1.5 h-1.5`}></div>
                </div>
              </div>

              {/* Bio content */}
              <div className="space-y-6">
                <p className={`${typography.paragraphLarge} ${colors.textSecondary}`}>
                  With over 12 years of professional experience, Kelly's Journey began in 2012 when her mentor and friend , Betty B, connnected through art and tattoos. Betty B guided Kelly through her passsion for tattoing. Kelly started her own studio in 2014 and has continued to grow and learn with every tattoo and story. 
                </p>
                
                <p className={`${typography.textLg} ${colors.textMuted} ${typography.leadingRelaxed} italic ${typography.fontLight}`}>
                  Kelly brings a relaxed, friendly vibe to every session—always with a smile and a genuine interest in your story. She blends technical skill with a creative touch, making sure each tattoo is as unique as the person wearing it. While her work has popped up in industry publications, what really lights her up is building lasting connections with clients who come back again and again.
                </p>
              </div>
    
              {/* Social links and CTA */}
              <div className="space-y-6 pt-6">
                {/* Social links */}
                <div>
                  <h4 className={`${typography.h4} ${colors.textPrimary} mb-4`}>Connect</h4>
                  <div className="flex gap-4">
                    {[
                      { icon: Instagram, url: "https://instagram.com/kellymillertattoo", label: "Instagram" },
                      { icon: Globe, url: "https://kellymillerart.com", label: "Portfolio" },
                      { icon: AtSign, url: "mailto:kelly@bowenislandtattoo.com", label: "Email" }
                    ].map(social => (
                      <Link 
                        key={social.label}
                        href={social.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        aria-label={social.label}
                        className="flex items-center justify-center w-12 h-12 bg-gold-500/5 border border-gold-500/30 text-gold-500 hover:bg-gold-500/10 hover:border-gold-500/40 transition-all duration-400 rounded-xl shadow-subtle hover:shadow-soft"
                      >
                        <social.icon className="w-5 h-5" />
                      </Link>
                    ))}
                  </div>
                </div>

                {/* CTA Button */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link 
                    href="/tattooRequest" 
                    className={`group ${components.button.base} ${components.button.variants.secondary} ${components.button.sizes.large} ${typography.trackingWide}`}
                  >
                    <span className="relative z-10 flex items-center">
                      Book Consultation
                      <ChevronRight className="ml-2 h-4 w-4 transition-transform duration-400 group-hover:translate-x-1" />
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gold-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-600"></div>
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}