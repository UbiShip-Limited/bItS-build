"use client";

import { cn } from "@/src/lib/utils/cn";
import {
  Instagram,
  Facebook,
  AtSign,
  Phone,
  MapPin,
  Globe,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import { GAEvents } from '@/src/lib/analytics/ga-events';
import { typography, colors, effects, layout, components } from '@/src/lib/styles/globalStyleConstants';

export function Footer() {
  const pages = [
    {
      title: "Gallery",
      href: "#gallery",
    },
    {
      title: "Artists",
      href: "#artists",
    },
    {
      title: "Services",
      href: "#services",
    },
    {
      title: "Booking",
      href: "/tattooRequest",
    },
    {
      title: "About",
      href: "#about",
    },
    {
      title: "Contact",
      href: "/tattooRequest",
    },
    {
      title: "Aftercare",
      href: "#aftercare",
    },
  ];

  const currentYear = new Date().getFullYear();

  return (
    <footer 
      className="border-t border-gold-500/20 bg-obsidian text-white px-4 sm:px-8 py-12 sm:py-20 w-full relative overflow-hidden"
      style={{ 
        backgroundColor: 'var(--obsidian, #0A0A0A)',
      }}
    >
      <div className="max-w-7xl mx-auto text-sm justify-between items-start">
        <div className="flex flex-col items-center justify-center w-full relative">
          <div className="mb-8">
            <Logo />
          </div>

          <ul className="transition-colors flex flex-wrap justify-center text-gray-300 list-none gap-4 sm:gap-6 mb-8 sm:mb-12">
            {pages.map((page, idx) => (
              <li key={"pages" + idx} className="list-none">
                <Link
                  className="transition-colors hover:text-gold-500 font-body text-sm sm:text-base tracking-tight"
                  href={page.href}
                >
                  {page.title}
                </Link>
              </li>
            ))}
          </ul>

          <GridLineHorizontal className="w-full max-w-3xl mx-auto mb-8 sm:mb-12" />

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 text-center mb-8 sm:mb-12 w-full max-w-3xl">
            <div className="flex flex-col items-center">
              <MapPin className="h-5 sm:h-6 w-5 sm:w-6 text-gold-500 mb-2 sm:mb-3" />
              <p className="text-gray-300 font-body tracking-tight text-sm sm:text-base">
                565 Artisan Lane<br />
                Bowen Island, BC V0N1G2<br />
                <span className="text-xs sm:text-sm italic text-gray-400">Artisan Square</span>
              </p>
            </div>
           
            <div className="flex flex-col items-center">
              <p className="text-gold-500 font-heading text-base sm:text-lg mb-1 sm:mb-2">Studio Hours</p>
              <p className="text-gray-300 font-body tracking-tight text-sm sm:text-base">
                Tuesday - Saturday<br />
                11:00 AM - 7:00 PM<br />
                <span className="text-xs sm:text-sm italic text-gray-400">By appointment only</span>
              </p>
            </div>

            <div className="flex flex-col items-center">
              <p className="text-gold-500 font-heading text-base sm:text-lg mb-1 sm:mb-2">Contact / Booking</p>
              <Link
                href="/tattooRequest"
                className="text-gray-300 font-body tracking-tight text-sm sm:text-base underline hover:text-gold-500 transition-colors"
              >
                Request a Tattoo or Contact Us
              </Link>
            </div>
          </div>

          <GridLineHorizontal className="w-full max-w-3xl mx-auto mb-6 sm:mb-8" />
        </div>
        
        <div className="flex flex-col sm:flex-row justify-between sm:mt-8 items-center w-full gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 text-center sm:text-left">
            <p className="text-gray-400 font-body tracking-tight text-xs sm:text-sm">
              &copy; {currentYear} Bowen Island Tattoo. All rights reserved.
            </p>
            <div className="flex gap-4 sm:gap-6 text-xs sm:text-sm">
              <Link href="/privacy-policy" className="text-gray-400 hover:text-gold-500 transition-colors font-body tracking-tight">
                Privacy Policy
              </Link>
              <Link href="/terms-of-service" className="text-gray-400 hover:text-gold-500 transition-colors font-body tracking-tight">
                Terms of Service
              </Link>
            </div>
            <div className="text-xs sm:text-sm text-gray-400 font-body tracking-tight">
              Developed by{" "}
              <Link 
                href="https://ubiship.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-gold-500 transition-colors"
              >
                UbiShip Limited
              </Link>
              {" • "}
              <Link 
                href="/auth/login" 
                className="text-gray-400 hover:text-gold-500/70 transition-colors"
                title="Staff Portal"
              >
                Staff Portal
              </Link>
            </div>
          </div>
          <div className="flex gap-3 sm:gap-4">
            <Link 
              href="https://www.bowenislandtattooshop.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-gold-500 transition-colors"
              title="Website"
            >
              <Globe className="h-5 w-5 sm:h-6 sm:w-6" />
            </Link>
            <Link 
              href="https://www.facebook.com/bowenislandtattooshop" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-gold-500 transition-colors"
              title="Facebook"
              onClick={() => GAEvents.socialMediaClicked('Facebook')}
            >
              <Facebook className="h-5 w-5 sm:h-6 sm:w-6" />
            </Link>
            <Link 
              href="https://instagram.com/bowenislandtattooshop" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-gold-500 transition-colors"
              title="Instagram"
              onClick={() => GAEvents.socialMediaClicked('Instagram')}
            >
              <Instagram className="h-5 w-5 sm:h-6 sm:w-6" />
            </Link>
            <Link 
              href="mailto:bowenislandtattooshop@gmail.com"
              className="text-gray-400 hover:text-gold-500 transition-colors"
              title="Email"
              onClick={() => GAEvents.emailClicked()}
            >
              <AtSign className="h-5 w-5 sm:h-6 sm:w-6" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

const GridLineHorizontal = ({
  className,
  offset,
}: {
  className?: string;
  offset?: string;
}) => {
  return (
    <div
      style={
        {
          "--background": "#080808",
          "--color": "rgba(201, 164, 73, 0.2)",
          "--height": "1px",
          "--width": "5px",
          "--fade-stop": "90%",
          "--offset": offset || "200px",
          "--color-dark": "rgba(201, 164, 73, 0.3)",
          maskComposite: "exclude",
        } as React.CSSProperties
      }
      className={cn(
        "w-[calc(100%+var(--offset))] h-[var(--height)]",
        "bg-[linear-gradient(to_right,var(--color),var(--color)_50%,transparent_0,transparent)]",
        "[background-size:var(--width)_var(--height)]",
        "[mask:linear-gradient(to_left,var(--background)_var(--fade-stop),transparent),_linear-gradient(to_right,var(--background)_var(--fade-stop),transparent),_linear-gradient(black,black)]",
        "[mask-composite:exclude]",
        "z-30",
        className
      )}
    ></div>
  );
};

const Logo = () => {
  return (
    <Link
      href="/"
      className="font-normal flex flex-col sm:flex-row items-center gap-2 sm:gap-3 text-white px-2 py-1 relative z-20 group"
    >
      <Image
        src="/images/bowen-logo.svg"
        alt="Bowen Island Tattoo"
        width={60}
        height={60}
        className="group-hover:scale-105 transition-transform brightness-0 invert sm:w-[80px] sm:h-[80px]"
      />
      <div className="font-heading text-center sm:text-left">
        <span className="block text-xl sm:text-2xl">Bowen Island</span>
        <span className="block text-lg sm:text-xl text-gold-500 -mt-1">Tattoo Studio</span>
      </div>
    </Link>
  );
};