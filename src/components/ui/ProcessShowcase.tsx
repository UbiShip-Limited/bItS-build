"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Users, PenTool, Award, ChevronRight } from "lucide-react"

interface ProcessStep {
  id: string
  title: string
  subtitle: string
  description: string
  icon: React.ReactNode
  step: number
}

const processSteps: ProcessStep[] = [
  {
    id: "consultation",
    title: "Consultation",
    subtitle: "Your Vision Begins",
    description: "We discuss your ideas, explore possibilities, and plan your perfect piece in our private island studio.",
    icon: <Users className="w-8 h-8" />,
    step: 1
  },
  {
    id: "design",
    title: "Custom Design",
    subtitle: "Artistry Unleashed",
    description: "Our master artist creates a unique design tailored specifically to your story and aesthetic preferences.",
    icon: <PenTool className="w-8 h-8" />,
    step: 2
  },
  {
    id: "execution",
    title: "Master Execution",
    subtitle: "Perfection Realized",
    description: "Using premium materials and advanced techniques, we bring your vision to life with uncompromising quality.",
    icon: <Award className="w-8 h-8" />,
    step: 3
  }
]

export function ProcessShowcase() {
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
    <div ref={sectionRef} className="bg-[#080808] py-16">
      {/* Section divider */}
      <motion.div 
        className="flex items-center justify-center mb-12"
        initial={{ opacity: 0, y: 20 }}
        animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.6 }}
      >
        <div className="w-24 h-[0.5px] bg-gradient-to-r from-transparent via-[#C9A449]/40 to-transparent"></div>
        <div className="mx-6 text-[#C9A449]/80 text-xl font-body tracking-wider text-center">
          HOW WE CREATE YOUR PIECE
        </div>
        <div className="w-24 h-[0.5px] bg-gradient-to-l from-transparent via-[#C9A449]/40 to-transparent"></div>
      </motion.div>

      {/* Simplified Process grid */}
      <div className="relative px-4 sm:px-8 md:px-8 lg:px-16">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {processSteps.map((step, index) => (
              <motion.div
                key={step.id}
                className="relative overflow-hidden rounded-lg"
                initial={{ opacity: 0, y: 30 }}
                animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                style={{ height: '420px' }} // Fixed height to prevent layout shifts
              >
                {/* Simplified container */}
                <div className="relative w-full h-full group cursor-pointer border border-[#C9A449]/0 hover:border-[#C9A449]/40 transition-colors duration-300">
                  {/* Background with gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-lg">
                    {/* Step number watermark */}
                    <div className="absolute top-4 left-4 text-6xl font-heading text-[#C9A449]/10 font-bold">
                      {step.step}
                    </div>
                  </div>

                  {/* Simplified corner elements */}
                  <div className="absolute -top-1 -left-1 h-6 w-6 border-t border-l border-[#C9A449]/30 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="absolute -top-1 -right-1 h-6 w-6 border-t border-r border-[#C9A449]/30 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="absolute -bottom-1 -left-1 h-6 w-6 border-b border-l border-[#C9A449]/30 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="absolute -bottom-1 -right-1 h-6 w-6 border-b border-r border-[#C9A449]/30 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                  {/* Gold accent line */}
                  <div className="absolute bottom-20 left-4 right-4 h-[1px] bg-gradient-to-r from-[#C9A449]/0 via-[#C9A449]/70 to-[#C9A449]/0 transition-opacity duration-300 opacity-0 group-hover:opacity-100"></div>

                  {/* Content overlay */}
                  <div className="absolute inset-0 flex flex-col justify-center items-center p-6 text-center">
                    {/* Icon with gold background */}
                    <div className="bg-[#C9A449]/20 border border-[#C9A449]/40 p-4 rounded-full mb-4 text-[#C9A449] group-hover:bg-[#C9A449]/30 group-hover:border-[#C9A449]/60 transition-all duration-300">
                      {step.icon}
                    </div>
                    
                    {/* Step title */}
                    <h3 className="text-white font-heading text-xl mb-2 tracking-wide">
                      {step.title}
                    </h3>
                    
                    {/* Subtitle */}
                    <p className="text-[#C9A449]/80 font-body text-sm mb-3 uppercase tracking-widest">
                      {step.subtitle}
                    </p>
                    
                    {/* Description */}
                    <p className="text-white/80 font-body text-sm leading-relaxed">
                      {step.description}
                    </p>
                  </div>

                  {/* Simplified info overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 transition-transform duration-300 group-hover:translate-y-0 translate-y-10 opacity-0 group-hover:opacity-100">
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-white font-medium font-body">
                          Step {step.step}
                        </p>
                        <p className="text-white/70 text-sm font-body">
                          {step.title}
                        </p>
                      </div>
                      <div className="bg-[#444444]/40 border border-[#C9A449]/30 text-white text-sm px-2 py-1 rounded-sm font-body">
                        Process
                      </div>
                    </div>
                  </div>

                  {/* Arrow icon */}
                  <div className="absolute top-4 right-4 bg-[#C9A449]/80 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <ChevronRight size={16} className="text-[#080808]" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
} 