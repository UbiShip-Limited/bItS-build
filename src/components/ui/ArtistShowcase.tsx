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
  longBio?: string
  experience?: string
  education?: string
  awards?: string[]
  availability?: string
  consultationProcess?: string
  specialties: string[]
  imageSrc: string
  socials: SocialLink[]
  featuredWorks?: FeaturedWork[]
}

export function ArtistShowcase() {
  const [selectedArtist, setSelectedArtist] = useState<string | null>(null)
  
  const artists: Artist[] = [
    {
      id: "Kelly Miller",
      name: "Kelly Miller",
      title: "Founder & Lead Artist",
      bio: "With over 15 years of experience, Alex specializes in geometric and surrealist designs that blend fine art techniques with traditional tattooing.",
      longBio: "Kelly's journey in the tattooing world began with formal art training at the Vancouver Institute of Art, followed by an apprenticeship under master tattoo artist Michael Chen. Her distinctive style merges classical fine art principles with contemporary tattoo techniques, creating pieces that are both timeless and boldly modern.",
      experience: "15+ years professional tattooing experience",
      education: "Vancouver Institute of Art, Apprenticeship with Michael Chen (2008-2010)",
      awards: ["Best Geometric Design - Pacific Tattoo Festival 2019", "Featured Artist - Ink Magazine 2021"],
      availability: "Tuesday-Saturday, by appointment only",
      consultationProcess: "Kelly offers personalized consultations to deeply understand your vision. Please bring any reference material that inspires you to your appointment.",
      specialties: ["Geometric", "Surrealism", "Watercolor"],
      imageSrc: "/artists/artist-kelly.jpeg",
      socials: [
        {
          platform: "Instagram",
          url: "https://instagram.com/kellymillertattoo",
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
          src: "/gallery-images/image1.jpeg",
          alt: "Geometric abstract design"
        },
        {
          id: "2",
          src: "/gallery-images/image2.jpeg",
          alt: "Surrealist portrait"
        },
        {
          id: "3",
            src: "/gallery-images/image3.jpeg",
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
    <section className="py-14 bg-white">
      <div className="container mx-auto px-4">
        {/* Victorian Gothic Header - Tightened text */}
        <div className="mb-10 text-center">
          <h2 className="font-heading text-4xl md:text-5xl text-[#080808] mb-3">
            OUR ARTISTS
          </h2>
          <div className="h-[1px] w-20 mx-auto bg-[#C9A449] mb-4"></div>
          <p className="text-[#444444] font-body text-base max-w-2xl mx-auto">
            Meet the visionary artists behind our studio's reputation for excellence and creativity.
          </p>
        </div>

        {/* Artists Grid - More reliable tapping */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-14"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          {artists.map((artist) => (
            <div 
              key={artist.id}
              className="relative cursor-pointer touch-action-manipulation"
              onClick={() => setSelectedArtist(selectedArtist === artist.id ? null : artist.id)}
            >
              <motion.div
                variants={artistVariants}
                className="h-full"
              >
                {/* Victorian Gothic frame */}
                <div className="relative aspect-[3/4] overflow-hidden">
                  {/* Gold border */}
                  <div className="absolute inset-0 border border-[#C9A449] z-[5] pointer-events-none"></div>
                  
                  {/* Explicit tap target overlay */}
                  <div 
                    className="absolute inset-0 z-[15] opacity-0"
                    onClick={() => setSelectedArtist(selectedArtist === artist.id ? null : artist.id)}
                  ></div>
                  
                  {/* Artist Image */}
                  <Image
                    src={artist.imageSrc}
                    alt={artist.name}
                    fill
                    className="object-cover transition-transform duration-700 hover:scale-105 z-[1]"
                  />
                  
                  {/* Artist Name - Victorian Gothic styling with tighter text */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 z-[10] bg-white flex justify-between items-center">
                    <div>
                      <h3 className="text-[#080808] font-heading text-lg md:text-xl">{artist.name}</h3>
                      <p className="text-[#444444] font-body text-sm mt-0.5">{artist.title}</p>
                    </div>
                    <span className="text-[#C9A449] text-xs py-1 px-2 border border-[#C9A449]">View</span>
                  </div>
                </div>
              </motion.div>
            </div>
          ))}
        </motion.div>

        {/* Artist Details - Enhanced text styling */}
        <AnimatePresence>
          {selectedArtist && (
            <motion.div
              variants={detailsVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="my-10 border-t border-b border-[#C9A449]/70 py-10"
            >
              {artists.filter(a => a.id === selectedArtist).map(artist => (
                <div key={`detail-${artist.id}`} className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div>
                    <h3 className="text-3xl md:text-4xl font-heading text-[#080808] mb-2 leading-tight">{artist.name}</h3>
                    <p className="text-[#444444] font-body text-xl mb-4 italic">{artist.title}</p>
                    
                    {/* Longer artist bio and additional info - Enhanced */}
                    <div className="text-[#080808] font-body mb-6 leading-relaxed space-y-5">
                      <p className="text-lg">{artist.bio}</p>
                      
                      {artist.longBio && (
                        <p className="text-base md:text-lg">{artist.longBio}</p>
                      )}
                      
                      {/* Additional artist information - Enhanced */}
                      <div className="space-y-4 text-base border-l-2 border-[#C9A449] pl-4 mt-5 py-2">
                        {artist.experience && (
                          <div>
                            <h5 className="font-heading text-base text-[#080808] font-semibold">Experience</h5>
                            <p className="text-[#444444] mt-1">{artist.experience}</p>
                          </div>
                        )}
                        
                        {artist.education && (
                          <div>
                            <h5 className="font-heading text-base text-[#080808] font-semibold">Education & Training</h5>
                            <p className="text-[#444444] mt-1">{artist.education}</p>
                          </div>
                        )}
                        
                        {artist.awards && artist.awards.length > 0 && (
                          <div>
                            <h5 className="font-heading text-base text-[#080808] font-semibold">Recognition</h5>
                            <ul className="text-[#444444] list-disc list-inside mt-1">
                              {artist.awards.map((award, index) => (
                                <li key={index} className="mb-1">{award}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {artist.availability && (
                          <div>
                            <h5 className="font-heading text-base text-[#080808] font-semibold">Availability</h5>
                            <p className="text-[#444444] mt-1">{artist.availability}</p>
                          </div>
                        )}
                        
                        {artist.consultationProcess && (
                          <div>
                            <h5 className="font-heading text-base text-[#080808] font-semibold">Consultation Process</h5>
                            <p className="text-[#444444] mt-1">{artist.consultationProcess}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Specialties - Enhanced */}
                    <div className="mb-6">
                      <h4 className="text-[#080808] font-heading text-xl mb-3 after:content-[''] after:block after:w-12 after:h-[1px] after:bg-[#C9A449] after:mt-1">Areas of Expertise</h4>
                      <div className="flex flex-wrap gap-2">
                        {artist.specialties.map(specialty => (
                          <span 
                            key={specialty} 
                            className="bg-[#C9A449] text-[#080808] px-4 py-1.5 text-base font-body hover:bg-[#080808] hover:text-[#C9A449] transition-colors duration-300"
                          >
                            {specialty}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    {/* Social Links - Enhanced */}
                    <div>
                      <h4 className="text-[#080808] font-heading text-xl mb-3 after:content-[''] after:block after:w-12 after:h-[1px] after:bg-[#C9A449] after:mt-1">Connect</h4>
                      <div className="flex gap-4">
                        {artist.socials.map(social => (
                          <Link 
                            key={social.platform}
                            href={social.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            aria-label={social.platform}
                            className="flex items-center justify-center w-12 h-12 bg-[#C9A449] text-[#080808] hover:bg-[#080808] hover:text-[#C9A449] transition-colors duration-300"
                          >
                            {social.icon}
                          </Link>
                        ))}
                      </div>
                    </div>
                    
                    {/* Add close button for mobile */}
                    <button 
                      onClick={() => setSelectedArtist(null)}
                      className="mt-6 md:hidden inline-flex items-center justify-center bg-[#080808] text-[#C9A449] px-4 py-2 text-sm"
                    >
                      Close details
                    </button>
                  </div>
                  
                  {/* Featured Works - Enhanced */}
                  <div>
                    <h4 className="text-[#080808] font-heading text-xl mb-3 after:content-[''] after:block after:w-12 after:h-[1px] after:bg-[#C9A449] after:mt-1">Featured Works</h4>
                    <div className="flex flex-col gap-4">
                      {/* Top image (larger) */}
                      <div 
                        key={`portfolio-${artist.id}-1`}
                        className="aspect-[16/9] relative overflow-hidden border border-[#C9A449]"
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
                            className="aspect-square relative overflow-hidden border border-[#C9A449]"
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
                    
                    {/* Victorian Gothic button - Enhanced */}
                    <div className="mt-5">
                      <Link 
                        href={`/artists/${artist.id}`}
                        className="inline-block bg-[#C9A449] text-[#080808] hover:bg-[#080808] hover:text-[#C9A449] transition-colors duration-300 px-6 py-2 font-heading text-lg"
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
        
        {/* Victorian Gothic Call to Action - Solid gold with tightened text */}
        <div className="text-center mt-12">
          <div className="h-[1px] w-20 mx-auto bg-[#C9A449] mb-5"></div>
          <Link 
            href="/booking"
            className="inline-block bg-[#C9A449] text-[#080808] hover:bg-[#080808] hover:text-[#C9A449] transition-colors duration-300 px-6 py-2 font-heading text-lg"
          >
            Book a Consultation
          </Link>
        </div>
      </div>
    </section>
  )
}