"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { MobileHeader } from "./mobile-header";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

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
      </div>

      {/* Mobile Menu Component */}
      <MobileHeader isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
    </header>
  );
}