"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Instagram, Globe, AtSign, Twitter } from "lucide-react"

interface SocialLink {
  platform: string
  url: string
  icon: React.ReactNode
}

interface FeaturedWork {
  id: string
  src: string
  alt: string
}

interface Artist {
  id: string
  name: string
  title: string
  bio: string
  specialties: string[]
  imageSrc: string
  socials: SocialLink[]
  featuredWorks?: FeaturedWork[]
}

export function ArtistShowcase() {
  const [selectedArtist, setSelectedArtist] = useState<string | null>(null)
  
  const artists: Artist[] = [
    {
      id: "alex-mercer",
      name: "Alex Mercer",
      title: "Founder & Lead Artist",
      bio: "With over 15 years of experience, Alex specializes in geometric and surrealist designs that blend fine art techniques with traditional tattooing.",
      specialties: ["Geometric", "Surrealism", "Watercolor"],
      imageSrc: "/artists/artist1.jpg",
      socials: [
        {
          platform: "Instagram",
          url: "https://instagram.com/alexmercertattoo",
          icon: <Instagram className="w-6 h-6" />
        },
        {
          platform: "Portfolio",
          url: "https://alexmercerart.com",
          icon: <Globe className="w-6 h-6" />
        },
        {
          platform: "Email",
          url: "mailto:alex@bowenislandtattoo.com",
          icon: <AtSign className="w-6 h-6" />
        }
      ],
      featuredWorks: [
        {
          id: "1",
          src: "/images/cougar.svg",
          alt: "Geometric abstract design"
        },
        {
          id: "2",
          src: "/images/cougar.svg",
          alt: "Surrealist portrait"
        },
        {
          id: "3",
          src: "/images/cougar.svg",
          alt: "Watercolor nature piece"
        }
      ]
    },
    {
      id: "jamie-chen",
      name: "Jamie Chen",
      title: "Fine Line Specialist",
      bio: "Jamie brings delicate precision to every piece, creating minimalist designs with impeccable detail and clean execution.",
      specialties: ["Minimalist", "Blackwork", "Fine Line"],
      imageSrc: "/artists/artist2.jpg",
      socials: [
        {
          platform: "Instagram",
          url: "https://instagram.com/jamiechenink",
          icon: <Instagram strokeWidth={1.5} />
        },
        {
          platform: "Twitter",
          url: "https://twitter.com/jamiechenink",
          icon: <Twitter strokeWidth={1.5} />
        },
        {
          platform: "Portfolio",
          url: "https://jamiechen.art",
          icon: <Globe strokeWidth={1.5} />
        }
      ]
    },
    {
      id: "morgan-lee",
      name: "Morgan Lee",
      title: "Neo-Traditional Artist",
      bio: "Morgan blends classic tattoo motifs with contemporary techniques, creating bold, colorful pieces with a distinctive personal flair.",
      specialties: ["Neo-Traditional", "Floral", "Portrait"],
      imageSrc: "/artists/artist3.jpg",
      socials: [
        {
          platform: "Instagram",
          url: "https://instagram.com/morganleeart",
          icon: <Instagram strokeWidth={1.5} />
        },
        {
          platform: "Portfolio",
          url: "https://morganlee.tattoo",
          icon: <Globe strokeWidth={1.5} />
        },
        {
          platform: "Email",
          url: "mailto:morgan@bowenislandtattoo.com",
          icon: <AtSign strokeWidth={1.5} />
        }
      ]
    }
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  }

  const artistVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  }

  const detailsVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: {
        duration: 0.4
      }
    },
    exit: { 
      opacity: 0,
      transition: {
        duration: 0.3
      }
    }
  }

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        {/* Minimalist Header */}
        <div className="mb-12 text-center">
          <h2 className="font-heading text-5xl md:text-6xl text-black mb-4">
            OUR ARTISTS
          </h2>
          <div className="h-[1px] w-16 mx-auto bg-black mb-6"></div>
          <p className="text-black font-body text-lg max-w-2xl mx-auto">
            Meet the visionary artists behind our studio's reputation for excellence and creativity.
          </p>
        </div>

        {/* Artists Grid - Minimalist approach */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          {artists.map((artist) => (
            <motion.div
              key={artist.id}
              className="relative cursor-pointer"
              variants={artistVariants}
              onClick={() => setSelectedArtist(selectedArtist === artist.id ? null : artist.id)}
            >
              {/* Refined frame */}
              <div className="relative aspect-[3/4] overflow-hidden">
                {/* Subtle gold border */}
                <div className="absolute inset-0 border border-black/40 z-10 pointer-events-none"></div>
                
                {/* Artist Image */}
                <Image
                  src={artist.imageSrc}
                  alt={artist.name}
                  fill
                  className="object-cover transition-transform duration-700 hover:scale-105"
                />
                
                {/* Artist Name - Clean white background */}
                <div className="absolute bottom-0 left-0 right-0 p-4 z-[2] bg-white">
                  <h3 className="text-black font-heading text-2xl">{artist.name}</h3>
                  <p className="text-black/70 font-body text-base mt-0.5">{artist.title}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Artist Details - Refined and minimalist */}
        <AnimatePresence>
          {selectedArtist && (
            <motion.div
              variants={detailsVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="my-8 border-t border-b border-black/30 py-10"
            >
              {artists.filter(a => a.id === selectedArtist).map(artist => (
                <div key={`detail-${artist.id}`} className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div>
                    <h3 className="text-3xl font-heading text-black mb-2">{artist.name}</h3>
                    <p className="text-black/70 font-body text-xl mb-5">{artist.title}</p>
                    <p className="text-black font-body text-lg mb-6 leading-relaxed">{artist.bio}</p>
                    
                    {/* Specialties - Minimalist design */}
                    <div className="mb-6">
                      <h4 className="text-black font-heading text-xl mb-3">Areas of Expertise</h4>
                      <div className="flex flex-wrap gap-2">
                        {artist.specialties.map(specialty => (
                          <span 
                            key={specialty} 
                            className="border border-black/50 text-black px-3 py-1 text-base font-body"
                          >
                            {specialty}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    {/* Social Links - Clean, minimal design */}
                    <div>
                      <h4 className="text-black font-heading text-xl mb-3">Connect</h4>
                      <div className="flex gap-4">
                        {artist.socials.map(social => (
                          <Link 
                            key={social.platform}
                            href={social.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            aria-label={social.platform}
                            className="flex items-center justify-center w-12 h-12 border border-black hover:bg-black hover:text-white text-black transition-colors duration-300"
                          >
                            {social.icon}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Portfolio Preview - Tree layout */}
                  <div>
                    <h4 className="text-black font-heading text-xl mb-3">Selected Works</h4>
                    <div className="flex flex-col gap-4">
                      {/* Top image (larger) */}
                      <div 
                        key={`portfolio-${artist.id}-1`}
                        className="aspect-[16/9] relative overflow-hidden"
                      >
                        <Image
                          src={artist.featuredWorks ? artist.featuredWorks[0].src : `/portfolio/${artist.id}-1.jpg`}
                          alt={artist.featuredWorks ? artist.featuredWorks[0].alt : `${artist.name}'s work 1`}
                          fill
                          className="object-cover hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      
                      {/* Bottom two images side by side */}
                      <div className="grid grid-cols-2 gap-4">
                        {[1, 2].map((i) => (
                          <div 
                            key={`portfolio-${artist.id}-${i+1}`}
                            className="aspect-square relative overflow-hidden"
                          >
                            <Image
                              src={artist.featuredWorks ? artist.featuredWorks[i].src : `/portfolio/${artist.id}-${i+1}.jpg`}
                              alt={artist.featuredWorks ? artist.featuredWorks[i].alt : `${artist.name}'s work ${i+1}`}
                              fill
                              className="object-cover hover:scale-105 transition-transform duration-500"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Minimal button */}
                    <div className="mt-6">
                      <Link 
                        href={`/artists/${artist.id}`}
                        className="inline-block border border-black text-black hover:bg-black hover:text-white transition-colors duration-300 px-6 py-2 font-heading text-lg"
                      >
                        View Full Portfolio
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Minimalist Call to Action */}
        <div className="text-center mt-16">
          <div className="h-[1px] w-16 mx-auto bg-black mb-6"></div>
          <Link 
            href="/booking"
            className="inline-block bg-white text-black border border-black hover:bg-black hover:text-white transition-colors duration-300 px-8 py-3 font-heading text-xl"
          >
            Book a Consultation
          </Link>
        </div>
      </div>
    </section>
  )
}
