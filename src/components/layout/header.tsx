"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { MobileHeader } from "./mobile-header";
import { Button } from "@/src/components/ui/button";
import { GAEvents } from '@/src/lib/analytics/ga-events';
import { typography, colors, effects, layout, components } from '@/src/lib/styles/globalStyleConstants';
import { handleNavClick } from '@/src/lib/utils/smoothScroll';

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

  // Consistent responsive padding system with extended top coverage
  const headerClasses = hasMounted && scrolled 
    ? "pt-4 pb-3 md:pt-5 md:pb-4" 
    : "pt-8 pb-6 md:pt-10 md:pb-8";

  const navigationItems = [
    { name: "Home", path: "/" },
    { name: "Artists", path: "#artists" },
    { name: "Gallery", path: "#gallery" },
    { name: "Services", path: "#services" },
    { name: "FAQ", path: "#faq" },
    { name: "Aftercare", path: "#aftercare" },
    { name: "About", path: "#about" },
    { name: "Contact", path: "/contact" },
  ];

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 min-h-[80px] transition-all duration-500 ${headerClasses}`}>
      <div className="container mx-auto px-6 md:px-8 h-full">
        {/* Main header layout with improved spacing */}
        <div className="flex items-center justify-between h-full">
          
          {/* Desktop Navigation - Centered with uniform spacing */}
          <nav className="hidden md:flex items-center justify-center flex-1">
            <div className="flex items-center space-x-8 lg:space-x-10">
              {navigationItems.map((item) => (
                <Link 
                  key={item.name} 
                  href={item.path}
                  className="relative font-body text-lg tracking-tight text-white hover:text-gold-500 transition-all duration-300 group drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] py-2"
                  onClick={(e) => {
                    handleNavClick(e, item.path);
                    GAEvents.navigationItemClicked(item.name);
                  }}
                >
                  {item.name}
                  {/* Refined underline effect */}
                  <div className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-gradient-to-r from-gold-500 via-gold-500/80 to-transparent group-hover:w-full transition-all duration-300"></div>
                </Link>
              ))}
            </div>
          </nav>

          {/* Action Section - Consistent spacing */}
          <div className="flex items-center space-x-4">
            {/* Desktop Booking Button */}
            <div className="hidden md:block">
              <Button 
                href="/tattooRequest"
                variant="outline"
                size="md"
              >
                Book Now
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden relative p-2 rounded-sm border border-transparent hover:border-white/20 transition-all duration-300"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            >
              {isMenuOpen ? (
                <X className="h-6 w-6 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" />
              ) : (
                <Menu className="h-6 w-6 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" />
              )}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu Component */}
      <MobileHeader isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
    </header>
  );
}