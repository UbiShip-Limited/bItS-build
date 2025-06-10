"use client";

import Link from "next/link";
import Image from "next/image";
import { Instagram, AtSign, Mail, Phone, MapPin } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-[#444444]/20">
      {/* Main Footer */}
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand Column */}
          <div className="flex flex-col items-center md:items-start">
            <div className="flex items-center mb-6">
              <Image 
                src="/images/bowen-logo.svg" 
                alt="Bowen Island Tattoo" 
                width={60} 
                height={60}
                className="mr-3"
              />
              <div className="font-heading text-2xl text-[#080808]">
                <span className="block">Bowen Island</span>
                <span className="block text-[#C9A449] -mt-1">Tattoo</span>
              </div>
            </div>
            <p className="text-[#444444] text-center md:text-left mb-6 font-body leading-relaxed max-w-xs">
              A private tattoo studio offering bespoke designs in a serene island setting. Victorian elegance meets modern craftsmanship.
            </p>
            <div className="flex space-x-4">
              <Link 
                href="https://instagram.com/bowenislandtattoo" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 flex items-center justify-center border border-[#080808] text-[#080808] hover:bg-[#080808] hover:text-white transition-colors duration-300"
                aria-label="Instagram"
              >
                <Instagram size={18} />
              </Link>
              <Link 
                href="mailto:info@bowenislandtattoo.com"
                className="w-10 h-10 flex items-center justify-center border border-[#080808] text-[#080808] hover:bg-[#080808] hover:text-white transition-colors duration-300"
                aria-label="Email"
              >
                <AtSign size={18} />
              </Link>
            </div>
          </div>

          {/* Navigation Column */}
          <div className="flex flex-col items-center md:items-start">
            <h3 className="font-heading text-xl text-[#080808] mb-6 relative">
              Navigation
              <span className="absolute -bottom-2 left-0 w-12 h-[1px] bg-[#C9A449]"></span>
            </h3>
            <nav className="grid grid-cols-2 gap-x-8 gap-y-3">
              {[
                { name: "Home", path: "/" },
                { name: "Artists", path: "/artists" },
                { name: "Gallery", path: "/gallery" },
                { name: "Services", path: "/services" },
                { name: "About", path: "/about" },
                { name: "Contact", path: "/contact" },
                { name: "Booking", path: "/booking" },
                { name: "Aftercare", path: "/aftercare" },
              ].map((item) => (
                <Link 
                  key={item.name} 
                  href={item.path}
                  className="font-body text-[#444444] hover:text-[#C9A449] transition-colors"
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>

          {/* Contact Column */}
          <div className="flex flex-col items-center md:items-start">
            <h3 className="font-heading text-xl text-[#080808] mb-6 relative">
              Visit Us
              <span className="absolute -bottom-2 left-0 w-12 h-[1px] bg-[#C9A449]"></span>
            </h3>
            <div className="font-body text-[#444444] space-y-3">
              <div className="flex items-start">
                <MapPin size={18} className="mr-3 mt-1 text-[#080808]" />
                <div>
                  <p>123 Artisan Lane</p>
                  <p>Bowen Island, BC V0N 1G0</p>
                </div>
              </div>
              <div className="flex items-center">
                <Phone size={18} className="mr-3 text-[#080808]" />
                <p>(604) 555-1234</p>
              </div>
              <div className="flex items-center">
                <Mail size={18} className="mr-3 text-[#080808]" />
                <p>info@bowenislandtattoo.com</p>
              </div>
              <div className="pt-4">
                <p className="font-heading text-[#080808] mb-2">Hours</p>
                <p>Tuesday - Saturday</p>
                <p>11:00 AM - 7:00 PM</p>
                <p className="mt-1 text-sm italic">By Appointment Only</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-[#444444]/20 py-6">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center text-sm font-body text-[#444444]">
          <div className="mb-4 md:mb-0">
            © {currentYear} Bowen Island Tattoo. All rights reserved.
          </div>
          <div className="flex space-x-6">
            <Link href="/privacy-policy" className="hover:text-[#C9A449] transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms-of-service" className="hover:text-[#C9A449] transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}