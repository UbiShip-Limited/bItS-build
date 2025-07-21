"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import { Instagram, Globe, AtSign, ChevronRight } from "lucide-react"

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
    <section ref={sectionRef} className="min-h-screen bg-obsidian text-white relative overflow-hidden">
      {/* Simplified background elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-obsidian via-[#0a0a0a] to-[#060606]"></div>
        <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-gold/5 to-transparent"></div>
      </div>

      {/* Main content container */}
      <div className="relative z-10 min-h-screen flex flex-col justify-center py-20 px-6 sm:px-8 md:px-12 lg:px-20">
        
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          {/* Simplified ornamental line */}
          <div className="flex items-center justify-center mb-8">
            <div className="w-16 h-px bg-gradient-to-r from-transparent to-gold/60"></div>
            <div className="mx-4">
              <span className="text-gold text-sm">✦</span>
            </div>
            <div className="w-16 h-px bg-gradient-to-l from-transparent to-gold/60"></div>
          </div>

          <h2 className="font-heading text-4xl md:text-5xl lg:text-6xl text-white mb-6 tracking-wide uppercase">
            The Artist
          </h2>
          <p className="font-body text-xl text-gold/80 mb-8 uppercase tracking-[0.2em] font-light">
            Master of the Craft
          </p>

          {/* Simplified divider */}
          <div className="flex items-center justify-center">
            <div className="w-12 h-px bg-gradient-to-r from-gold/80 to-gold/20"></div>
            <div className="w-2 h-2 border border-gold/50 rotate-45 mx-4"></div>
            <div className="w-12 h-px bg-gradient-to-l from-gold/80 to-gold/20"></div>
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
              <div className="relative aspect-[3/4] w-full max-w-md mx-auto rounded-2xl border border-gold/10 group hover:border-gold/20 transition-all duration-300 shadow-elegant overflow-hidden">
                {/* Simplified corner elements */}
                <div className="absolute top-3 left-3 h-5 w-5 border-t border-l border-gold/40 rounded-tl-sm z-10"></div>
                <div className="absolute bottom-3 right-3 h-5 w-5 border-b border-r border-gold/40 rounded-br-sm z-10"></div>

                {/* Main portrait image */}
                <Image
                  src="/artists/artist-kelly.jpg"
                  alt="Kelly Miller - Master Tattoo Artist"
                  fill
                  className="object-cover brightness-50 group-hover:brightness-60 transition-all duration-300 rounded-2xl"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
                
                {/* Simplified overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-obsidian/60 via-transparent to-transparent"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-gold/5 via-transparent to-gold/8 group-hover:from-gold/8 group-hover:to-gold/12 transition-all duration-300"></div>
              </div>

              {/* Floating quote element */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                transition={{ duration: 0.6, delay: 0.8 }}
                className="absolute -bottom-8 -right-4 bg-obsidian/90 border border-gold/30 rounded-lg p-6 backdrop-blur-sm shadow-elegant"
              >
                <p className="text-gold/80 font-body text-sm italic tracking-wide">
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
                <div className="inline-block bg-transparent border border-gold/50 px-4 py-2 text-xs font-semibold text-gold mb-6 uppercase tracking-[0.2em] font-body">
                  Founder
                </div>

                <h3 className="font-heading text-4xl md:text-5xl mb-3 text-white tracking-wide">
                  KELLY MILLER
                </h3>
                
                <p className="font-body text-xl text-gold/80 mb-8 uppercase tracking-[0.2em] font-light">
                  Master Artist & Studio Owner
                </p>

                {/* Simplified divider */}
                <div className="flex items-center mb-8">
                  <div className="w-12 h-px bg-gradient-to-r from-gold/80 to-gold/20"></div>
                  <div className="w-2 h-2 border border-gold/50 rotate-45 mx-3"></div>
                </div>
              </div>

              {/* Bio content */}
              <div className="space-y-6">
                <p className="font-body text-white/90 text-lg leading-relaxed">
                  With over 15 years of dedicated practice, Kelly Miller has established herself as one of the 
                  Pacific Northwest&apos;s most sought-after tattoo artists. Her journey began in the underground 
                  scenes of Vancouver, where she honed her craft under the tutelage of legendary masters.
                </p>
                
                <p className="font-body text-white/80 text-lg leading-relaxed italic">
                  Kelly&apos;s distinctive approach merges classical fine art principles with contemporary tattoo 
                  techniques, creating pieces that transcend traditional boundaries. Each design is a collaboration 
                  between artist and canvas, resulting in deeply personal works of lasting beauty.
                </p>

                {/* Specialties */}
                <div className="border-l-2 border-[#C9A449]/40 pl-6 py-4">
                  <h4 className="font-heading text-xl text-white mb-3 tracking-wide">Specializations</h4>
                  <div className="flex flex-wrap gap-3">
                    {["Geometric Realism", "Surrealist Portraits", "Watercolor Techniques", "Custom Design"].map(specialty => (
                      <span 
                        key={specialty} 
                        className="bg-transparent border border-[#C9A449]/50 text-[#C9A449] px-4 py-2 text-sm font-body hover:bg-[#C9A449]/10 transition-all duration-300 tracking-wide"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Experience details */}
                <div className="space-y-4 text-white/70">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-[#C9A449]/60 rotate-45 mt-2 flex-shrink-0"></div>
                    <div>
                      <span className="font-heading text-white text-sm uppercase tracking-wider">Experience:</span>
                      <p className="font-body">15+ years professional tattooing, Featured in Ink Magazine</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-[#C9A449]/60 rotate-45 mt-2 flex-shrink-0"></div>
                    <div>
                      <span className="font-heading text-white text-sm uppercase tracking-wider">Training:</span>
                      <p className="font-body">Vancouver Institute of Art, Master apprenticeship program</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-[#C9A449]/60 rotate-45 mt-2 flex-shrink-0"></div>
                    <div>
                      <span className="font-heading text-white text-sm uppercase tracking-wider">Philosophy:</span>
                      <p className="font-body">Every piece should honor both the art form and the individual story</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Social links and CTA */}
              <div className="space-y-6 pt-6">
                {/* Social links */}
                <div>
                  <h4 className="font-heading text-lg text-white mb-3 tracking-wide">Connect</h4>
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
                        className="flex items-center justify-center w-12 h-12 border border-[#C9A449]/50 text-[#C9A449] hover:bg-[#C9A449]/10 hover:border-[#C9A449] transition-all duration-300"
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
                    className="group relative overflow-hidden bg-transparent border border-[#C9A449]/70 text-white hover:bg-[#C9A449]/10 hover:border-[#C9A449] transition-all duration-300 px-8 py-4 font-body tracking-widest uppercase text-sm font-medium"
                  >
                    <span className="relative z-10 flex items-center">
                      Book Consultation
                      <ChevronRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </span>
                    <div className="absolute inset-0 bg-[#C9A449]/5 transform translate-x-full group-hover:translate-x-0 transition-transform duration-300"></div>
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