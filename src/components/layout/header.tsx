"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, Instagram, AtSign } from "lucide-react";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHasMounted(true);
    
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMenuOpen) {
        setIsMenuOpen(false);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (isMenuOpen && menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    document.addEventListener("keydown", handleEscape);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  // Modern tighter spacing with refined background effects
  const headerClasses = hasMounted && scrolled 
    ? "py-1 bg-white/95 backdrop-blur-md border-b border-[#C9A449]/10 shadow-lg shadow-black/5" 
    : "py-2 bg-white/90 backdrop-blur-sm border-b border-transparent";

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${headerClasses}`}>
      {/* Subtle ornamental top line */}
      <div className="absolute top-0 left-0 w-full h-[0.5px] bg-gradient-to-r from-transparent via-[#C9A449]/30 to-transparent"></div>
      
      <div className="container mx-auto px-4 flex items-center justify-between">
        {/* Logo - Tighter and more modern */}
        <Link href="/" className="relative z-10 group">
          <div className="flex items-center">
            <div className="relative">
              <Image 
                src="/images/bowen-logo.svg" 
                alt="Bowen Island Tattoo" 
                width={48} 
                height={48}
                className="mr-3 transform group-hover:scale-105 transition-transform duration-300"
              />
              {/* Subtle glow effect on hover */}
              <div className="absolute inset-0 rounded-full bg-[#C9A449]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-md"></div>
            </div>
            <div className="font-heading text-lg text-[#080808]">
              <span className="block leading-tight">Bowen Island</span>
              <span className="block text-[#C9A449] -mt-0.5 text-sm tracking-wide">Tattoo</span>
            </div>
          </div>
        </Link>

        {/* Desktop Navigation - Tighter spacing */}
        <nav className="hidden md:flex items-center space-x-6">
          {[
            { name: "Home", path: "/" },
            { name: "Artists", path: "/artists" },
            { name: "Gallery", path: "/gallery" },
            { name: "Services", path: "/services" },
            { name: "About", path: "/about" },
            { name: "Contact", path: "/contact" },
          ].map((item) => (
            <Link 
              key={item.name} 
              href={item.path}
              className="relative font-body text-sm tracking-wide text-[#080808] hover:text-[#C9A449] transition-colors duration-300 group"
            >
              {item.name}
              {/* Subtle underline effect */}
              <div className="absolute -bottom-1 left-0 w-0 h-[1px] bg-gradient-to-r from-[#C9A449] to-transparent group-hover:w-full transition-all duration-300"></div>
            </Link>
          ))}
        </nav>

        {/* Booking Button - More refined */}
        <div className="hidden md:block">
          <Link 
            href="/booking"
            className="relative group font-body text-[#080808] text-xs tracking-widest uppercase px-4 py-2 border border-[#080808]/20 hover:border-[#C9A449] hover:bg-[#C9A449]/5 transition-all duration-300 overflow-hidden"
          >
            <span className="relative z-10">Book Now</span>
            {/* Subtle background effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#C9A449]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </Link>
        </div>

        {/* Mobile Menu Button - Smaller and more refined */}
        <button 
          className="md:hidden relative z-10 p-2 rounded-sm border border-transparent hover:border-[#C9A449]/20 hover:bg-[#C9A449]/5 transition-all duration-300"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
        >
          {isMenuOpen ? (
            <X className="h-5 w-5 text-[#080808]" />
          ) : (
            <Menu className="h-5 w-5 text-[#080808]" />
          )}
        </button>

        {/* Mobile Menu - More refined */}
        {isMenuOpen && (
          <div className="fixed inset-0 bg-white/95 backdrop-blur-md z-40 flex flex-col">
            {/* Ornamental top border */}
            <div className="absolute top-0 left-0 w-full h-[0.5px] bg-gradient-to-r from-transparent via-[#C9A449]/40 to-transparent"></div>
            
            <div ref={menuRef} className="container mx-auto px-4 pt-20 pb-8 flex flex-col h-full">
              <nav className="flex flex-col space-y-5 items-center text-center">
                {[
                  { name: "Home", path: "/" },
                  { name: "Artists", path: "/artists" },
                  { name: "Gallery", path: "/gallery" },
                  { name: "Services", path: "/services" },
                  { name: "About", path: "/about" },
                  { name: "Contact", path: "/contact" },
                ].map((item) => (
                  <Link 
                    key={item.name} 
                    href={item.path}
                    className="font-heading text-xl text-[#080808] hover:text-[#C9A449] transition-colors duration-300 relative group"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.name}
                    {/* Subtle decorative element */}
                    <div className="absolute -bottom-1 left-1/2 w-0 h-[1px] bg-[#C9A449] group-hover:w-full transition-all duration-300 -translate-x-1/2"></div>
                  </Link>
                ))}
                
                {/* Mobile booking button */}
                <Link 
                  href="/booking"
                  className="font-body text-[#080808] text-sm tracking-widest uppercase mt-4 px-6 py-3 border border-[#C9A449]/30 hover:bg-[#C9A449]/10 hover:border-[#C9A449] transition-all duration-300 relative overflow-hidden"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <span className="relative z-10">Book a Consultation</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-[#C9A449]/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                </Link>
              </nav>

              {/* Ornamental divider */}
              <div className="my-8 flex items-center justify-center">
                <div className="w-16 h-[0.5px] bg-gradient-to-r from-transparent to-[#C9A449]/40"></div>
                <div className="mx-4 w-2 h-2 border border-[#C9A449]/50 rotate-45"></div>
                <div className="w-16 h-[0.5px] bg-gradient-to-l from-transparent to-[#C9A449]/40"></div>
              </div>

              {/* Close Button */}
              <div className="mb-8 flex justify-center">
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center justify-center space-x-2 px-5 py-2 border border-[#080808]/20 bg-[#080808] text-white hover:bg-white hover:text-[#080808] hover:border-[#C9A449] transition-all duration-300 font-body text-xs tracking-widest uppercase"
                >
                  <X size={14} />
                  <span>Close</span>
                </button>
              </div>

              <div className="mt-auto">
                <div className="flex justify-center space-x-4 mb-6">
                  <Link 
                    href="https://instagram.com/bowenislandtattoo" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-9 h-9 flex items-center justify-center border border-[#080808]/20 text-[#080808] hover:bg-[#C9A449]/10 hover:text-[#C9A449] hover:border-[#C9A449] transition-all duration-300"
                  >
                    <Instagram size={16} />
                  </Link>
                  <Link 
                    href="mailto:info@bowenislandtattoo.com"
                    className="w-9 h-9 flex items-center justify-center border border-[#080808]/20 text-[#080808] hover:bg-[#C9A449]/10 hover:text-[#C9A449] hover:border-[#C9A449] transition-all duration-300"
                  >
                    <AtSign size={16} />
                  </Link>
                </div>
                <div className="text-center text-[#444444] text-xs font-body">
                  <p>Bowen Island, BC, Canada</p>
                  <p className="mt-1 text-[#C9A449]/70">By Appointment Only</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}