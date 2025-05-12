"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { ChevronRight } from "lucide-react"

export function TattooHero() {
  const [isVisible, setIsVisible] = useState(false)
  const heroRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setIsVisible(true)

    const handleMouseMove = (e: MouseEvent) => {
      if (!heroRef.current) return

      const { clientX, clientY } = e
      const { left, top, width, height } = heroRef.current.getBoundingClientRect()

      const x = (clientX - left) / width
      const y = (clientY - top) / height

      const glowElements = document.querySelectorAll(".glow-effect")
      glowElements.forEach((el) => {
        const element = el as HTMLElement
        element.style.setProperty("--mouse-x", `${x}`)
        element.style.setProperty("--mouse-y", `${y}`)
      })
    }

    document.addEventListener("mousemove", handleMouseMove)
    return () => document.removeEventListener("mousemove", handleMouseMove)
  }, [])

  return (
    <div ref={heroRef} className="relative min-h-screen overflow-hidden bg-[#0F0F0F] text-white">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-[#FF00FF] opacity-20 blur-[100px]"></div>
        <div className="absolute bottom-40 -left-20 h-80 w-80 rounded-full bg-[#00FFFF] opacity-10 blur-[100px]"></div>
      </div>

      {/* Grid pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="h-full w-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0wIDBoNjB2NjBIMHoiLz48cGF0aCBkPSJNMzAgMzBoMzB2MzBIMzB6IiBzdHJva2U9IiNmZmYiIHN0cm9rZS1vcGFjaXR5PSIuMDUiLz48cGF0aCBkPSJNMCAzMGgzMHYzMEgweiIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utb3BhY2l0eT0iLjA1Ii8+PHBhdGggZD0iTTMwIDBIMHYzMGgzMHoiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLW9wYWNpdHk9Ii4wNSIvPjxwYXRoIGQ9Ik0zMCAwaDMwdjMwSDMweiIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utb3BhY2l0eT0iLjA1Ii8+PC9nPjwvc3ZnPg==')]"></div>
      </div>

      <div className="container relative mx-auto px-4 py-16 md:py-24 lg:py-32">
        <div className="grid items-center gap-8 md:grid-cols-12 md:gap-12">
          {/* Text content - 7 columns on md+ screens */}
          <div
            className={`flex flex-col justify-center space-y-6 md:col-span-7 transition-all duration-1000 ease-out ${
              isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
            }`}
          >
    

            <h1 className="font-gotham text-5xl font-black tracking-tight md:text-6xl lg:text-7xl">
              <span className="block">BOWEN</span>
              <span className="mt-1 block">
                <span className="text-[#00FFFF]">ISLAND</span>
                <span className="relative ml-2 inline-block">
                  <span className="relative z-10">TATTOO</span>
               
                </span>
              </span>
            </h1>

            <p className="max-w-md font-montserrat text-lg text-white/70 md:text-xl">
              Where artistry meets tranquility. A private studio experience unlike any other.
            </p>

            <div className="flex flex-col space-y-4 pt-4 sm:flex-row sm:space-x-4 sm:space-y-0">
              <button
                className="group relative flex items-center gap-2 px-6 py-3 font-medium text-white transition-all duration-300 bg-[#FF00FF] rounded-md overflow-hidden hover:shadow-[0_0_15px_rgba(255,0,255,0.5)] glow-effect"
              >
                <span className="relative z-10 flex items-center">
                  Book Your Session
                  <ChevronRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </span>
                <span className="absolute inset-0 z-0 bg-gradient-to-r from-[#FF00FF]/0 via-white/20 to-[#FF00FF]/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-hover:animate-shimmer"></span>
              </button>

              <button
                className="group relative flex items-center gap-2 px-6 py-3 font-medium border-2 rounded-md border-[#00FFFF] text-[#00FFFF] transition-all duration-300 hover:bg-[#00FFFF]/10 hover:shadow-[0_0_15px_rgba(0,255,255,0.3)]"
              >
                Explore Gallery
              </button>
            </div>
          </div>

          {/* Image section - 5 columns on md+ screens */}
          <div
            className={`relative md:col-span-5 transition-all duration-1000 delay-300 ease-out ${
              isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
            }`}
          >
            <div className="relative mx-auto aspect-[3/4] max-w-md">
              {/* Decorative elements */}
              <div className="absolute -left-4 -top-4 h-24 w-24 rounded-full border border-[#FF00FF]/30"></div>
              <div className="absolute -bottom-6 -right-6 h-32 w-32 rounded-full border border-[#00FFFF]/30"></div>
              <div className="absolute -bottom-3 -left-3 h-16 w-16 rounded-full bg-[#FF00FF]/10"></div>

              {/* Main image with frame */}
              <div className="group relative h-full w-full overflow-hidden rounded-lg border border-white/10 glow-effect">
                {/* Animated overlay */}
                <div className="absolute inset-0 z-20 bg-gradient-to-b from-transparent via-transparent to-[#0F0F0F]/90"></div>
                <div className="absolute inset-0 z-10 bg-gradient-to-r from-[#FF00FF]/20 to-[#00FFFF]/20 opacity-30 mix-blend-overlay"></div>

                {/* Scanlines effect */}
                <div className="absolute inset-0 z-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgogIDxkZWZzPgogICAgPHBhdHRlcm4gaWQ9InNjYW5saW5lcyIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjEwMCUiIGhlaWdodD0iNCIgcGF0dGVyblRyYW5zZm9ybT0icm90YXRlKDkwKSI+CiAgICAgIDxsaW5lIHgxPSIwIiB5PSIwIiB4Mj0iMCIgeTI9IjQiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLW9wYWNpdHk9IjAuMDUiIHN0cm9rZS13aWR0aD0iMiIgLz4KICAgIDwvcGF0dGVybj4KICA8L2RlZnM+CiAgPHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNzY2FubGluZXMpIiAvPgo8L3N2Zz4=')]"></div>

                <Image
                  src="/tattoo-artist-neon.png"
                  alt="Bowen Island Tattoo Artist"
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  priority
                />

                {/* Highlight bar */}
                <div className="absolute bottom-0 left-0 right-0 z-30 p-6">
                  <div className="flex items-center space-x-3">
                    <div className="h-1 w-12 bg-gradient-to-r from-[#FF00FF] to-[#00FFFF]"></div>
                    <p className="font-playfair text-lg italic text-white/90">Art & Precision</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Floating elements */}
        <div className="absolute -bottom-16 -left-16 h-32 w-32 rounded-full border border-[#00FFFF]/20 opacity-40"></div>
        <div className="absolute -top-16 -right-16 h-32 w-32 rounded-full border border-[#FF00FF]/20 opacity-40"></div>
      </div>

      {/* Decorative bottom bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1">
        <div className="mx-auto h-full w-full max-w-7xl">
          <div className="flex h-full">
            <div className="h-full w-1/3 bg-[#FF00FF]"></div>
            <div className="h-full w-1/3 bg-[#00FFFF]"></div>
            <div className="h-full w-1/3 bg-white"></div>
          </div>
        </div>
      </div>

      {/* CSS for glow effect */}
      <style jsx global>{`
        .glow-effect {
          --mouse-x: 0.5;
          --mouse-y: 0.5;
          position: relative;
          z-index: 1;
        }
        
        .glow-effect::before {
          content: "";
          position: absolute;
          top: -100px;
          left: -100px;
          right: -100px;
          bottom: -100px;
          background: radial-gradient(
            circle at 
            calc(var(--mouse-x) * 100%) 
            calc(var(--mouse-y) * 100%), 
            rgba(0, 255, 255, 0.4), 
            transparent 40%
          );
          z-index: -1;
          opacity: 0;
          transition: opacity 0.3s;
          pointer-events: none;
        }
        
        .glow-effect:hover::before {
          opacity: 1;
        }
        
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        .animate-shimmer {
          animation: shimmer 1.5s infinite;
        }
      `}</style>
    </div>
  )
}
