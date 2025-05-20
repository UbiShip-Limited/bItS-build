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

  // During server rendering and first client render before hydration, use a consistent UI state
  const headerClasses = hasMounted && scrolled ? "shadow-sm py-2" : "py-4";

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 bg-white transition-all duration-300 ${headerClasses}`}>
      <div className="container mx-auto px-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="relative z-10">
          <div className="flex items-center">
            <Image 
              src="/images/bowen-logo.svg" 
              alt="Bowen Island Tattoo" 
              width={64} 
              height={64}
              className="mr-4 transform hover:scale-105 transition-transform duration-300"
            />
            <div className="font-heading text-xl text-[#080808]">
              <span className="block">Bowen Island</span>
              <span className="block text-[#C9A449] -mt-1">Tattoo</span>
            </div>
          </div>
        </Link>

        {/* Desktop Navigation */}
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
              className="font-body text-base tracking-wider text-[#080808] hover:text-[#C9A449] transition-colors"
            >
              {item.name}
            </Link>
          ))}
        </nav>

        {/* Booking Button */}
        <div className="hidden md:block">
          <Link 
            href="/booking"
            className="font-body text-black text-sm tracking-widest uppercase px-5 py-2 border border-[#080808] hover:bg-[#080808] hover:text-white transition-colors duration-300"
          >
            Book Now
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button 
          className="md:hidden relative z-10"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
        >
          {isMenuOpen ? (
            <X className="h-6 w-6 text-[#080808]" />
          ) : (
            <Menu className="h-6 w-6 text-[#080808]" />
          )}
        </button>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="fixed inset-0 bg-white z-40 flex flex-col">
            <div ref={menuRef} className="container mx-auto px-4 pt-24 pb-8 flex flex-col h-full">
              <nav className="flex flex-col space-y-6 items-center text-center">
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
                    className="font-heading text-2xl text-[#080808] hover:text-[#C9A449] transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
                <Link 
                  href="/booking"
                  className="font-body text-[#080808] text-base tracking-widest uppercase mt-4 px-6 py-2 border border-[#080808] hover:bg-[#080808] hover:text-white transition-colors duration-300"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Book a Consultation
                </Link>
              </nav>

              {/* Close Button */}
              <div className="my-8 flex justify-center">
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center justify-center space-x-2 px-6 py-3 border border-[#080808] bg-[#080808] text-white hover:bg-white hover:text-[#080808] transition-colors duration-300 font-body text-sm tracking-widest uppercase"
                >
                  <X size={16} />
                  <span>Close Menu</span>
                </button>
              </div>

              <div className="mt-auto">
                <div className="flex justify-center space-x-6 mb-6">
                  <Link 
                    href="https://instagram.com/bowenislandtattoo" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-10 h-10 flex items-center justify-center border border-[#080808] text-[#080808] hover:bg-[#080808] hover:text-white transition-colors duration-300"
                  >
                    <Instagram size={18} />
                  </Link>
                  <Link 
                    href="mailto:info@bowenislandtattoo.com"
                    className="w-10 h-10 flex items-center justify-center border border-[#080808] text-[#080808] hover:bg-[#080808] hover:text-white transition-colors duration-300"
                  >
                    <AtSign size={18} />
                  </Link>
                </div>
                <div className="text-center text-[#444444] text-sm font-body">
                  <p>Bowen Island, BC, Canada</p>
                  <p className="mt-1">By Appointment Only</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
