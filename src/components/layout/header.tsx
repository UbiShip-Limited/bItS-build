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

  // Consistent spacing with refined background effects
  const headerClasses = hasMounted && scrolled 
    ? "py-3 bg-white/95 backdrop-blur-md border-b border-gold/10 shadow-elegant" 
    : "py-4 bg-white/90 backdrop-blur-sm border-b border-transparent";

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${headerClasses}`}>
      {/* Subtle ornamental top line */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent"></div>
      
      <div className="container mx-auto px-6 flex items-center justify-between">
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
              <div className="absolute inset-0 rounded-full bg-gold/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-md"></div>
            </div>
            <div className="font-heading text-lg text-obsidian">
              <span className="block leading-tight font-medium">Bowen Island</span>
              <span className="block text-gold -mt-0.5 text-sm tracking-wider font-normal">Tattoo</span>
            </div>
          </div>
        </Link>

        {/* Desktop Navigation - Consistent spacing */}
        <nav className="hidden md:flex items-center space-x-8">
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
              className="relative font-body text-sm tracking-wide text-obsidian hover:text-gold transition-colors duration-300 group"
            >
              {item.name}
              {/* Subtle underline effect */}
              <div className="absolute -bottom-1 left-0 w-0 h-px bg-gradient-to-r from-gold to-transparent group-hover:w-full transition-all duration-300"></div>
            </Link>
          ))}
        </nav>

        {/* Booking Button - More refined */}
        <div className="hidden md:block">
          <Link 
            href="/tattooRequest"
            className="relative group font-body text-obsidian text-xs tracking-[0.15em] uppercase px-5 py-2.5 border border-obsidian/20 hover:border-gold hover:bg-gold/5 transition-all duration-300 overflow-hidden"
          >
            <span className="relative z-10">Book Now</span>
            {/* Subtle background effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-gold/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </Link>
        </div>

        {/* Mobile Menu Button - Smaller and more refined */}
        <button 
          className="md:hidden relative z-10 p-2 rounded-sm border border-transparent hover:border-gold/20 hover:bg-gold/5 transition-all duration-300"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
        >
          {isMenuOpen ? (
            <X className="h-5 w-5 text-obsidian" />
          ) : (
            <Menu className="h-5 w-5 text-obsidian" />
          )}
        </button>
      </div>

      {/* Mobile Menu Component */}
      <MobileHeader isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
    </header>
  );
}