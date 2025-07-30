"use client";

import { cn } from "@/src/lib/utils/cn";
import {
  IconBrandInstagram,
  IconBrandFacebook,
  IconAt,
  IconPhone,
  IconMapPin,
  IconWorld,
} from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import { GAEvents } from '@/src/lib/analytics/ga-events';
import { typography, colors, effects, layout, components } from '@/src/lib/styles/globalStyleConstants';

export function Footer() {
  const pages = [
    {
      title: "Gallery",
      href: "/gallery",
    },
    {
      title: "Artists",
      href: "/artists",
    },
    {
      title: "Services",
      href: "/services",
    },
    {
      title: "Booking",
      href: "/tattooRequest",
    },
    {
      title: "About",
      href: "/about",
    },
    {
      title: "Contact",
      href: "/contact",
    },
    {
      title: "Aftercare",
      href: "/aftercare",
    },
  ];

  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-gold-500/20 bg-obsidian text-white px-8 py-20 w-full relative overflow-hidden">
      <div className="max-w-7xl mx-auto text-sm justify-between items-start md:px-8">
        <div className="flex flex-col items-center justify-center w-full relative">
          <div className="mr-0 md:mr-4 md:flex mb-8">
            <Logo />
          </div>

          <ul className="transition-colors flex sm:flex-row flex-col text-gray-300 list-none gap-6 mb-12">
            {pages.map((page, idx) => (
              <li key={"pages" + idx} className="list-none text-center sm:text-left">
                <Link
                  className="transition-colors hover:text-gold-500-500 font-body text-base tracking-tight"
                  href={page.href}
                >
                  {page.title}
                </Link>
              </li>
            ))}
          </ul>

          <GridLineHorizontal className="max-w-7xl mx-auto mt-8 mb-12" />

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center mb-12 w-full max-w-3xl">
            <div className="flex flex-col items-center">
              <IconMapPin className="h-6 w-6 text-gold-500 mb-3" />
              <p className="text-gray-300 font-body tracking-tight">
                565 Artisan Lane<br />
                Bowen Island, BC V0N1G2<br />
                <span className="text-sm italic text-gray-400">Artisan Square</span>
              </p>
            </div>
            <div className="flex flex-col items-center">
              <IconPhone className="h-6 w-6 text-gold-500 mb-3" />
              <p className="text-gray-300 font-body tracking-tight">
                (604) 323-4350<br />
                <a 
                  href="mailto:bowenislandtattooshop@gmail.com" 
                  className="text-sm text-gold-500 hover:text-gold-500-500/80 transition-colors"
                  onClick={() => GAEvents.emailClicked()}
                >
                  bowenislandtattooshop@gmail.com
                </a>
              </p>
            </div>
            <div className="flex flex-col items-center">
              <p className="text-gold-500 font-heading text-lg mb-2">Studio Hours</p>
              <p className="text-gray-300 font-body tracking-tight">
                Tuesday - Saturday<br />
                11:00 AM - 7:00 PM<br />
                <span className="text-sm italic text-gray-400">By appointment only</span>
              </p>
            </div>
          </div>

          <GridLineHorizontal className="max-w-7xl mx-auto mb-8" />
        </div>
        
        <div className="flex sm:flex-row flex-col justify-between mt-8 items-center w-full">
          <div className="flex flex-col sm:flex-row items-center gap-4 mb-8 sm:mb-0">
            <p className="text-gray-400 font-body tracking-tight">
              &copy; {currentYear} Bowen Island Tattoo. All rights reserved.
            </p>
            <div className="flex space-x-6 text-sm">
              <Link href="/privacy-policy" className="text-gray-400 hover:text-gold-500-500 transition-colors font-body tracking-tight">
                Privacy Policy
              </Link>
              <Link href="/terms-of-service" className="text-gray-400 hover:text-gold-500-500 transition-colors">
                Terms of Service
              </Link>
            </div>
            <div className="text-sm text-gray-400 font-body tracking-tight">
              Developed by{" "}
              <Link 
                href="https://ubiship.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-gold-500-500 transition-colors"
              >
                UbiShip Limited
              </Link>
            </div>
          </div>
          <div className="flex gap-4">
            <Link 
              href="https://www.bowenislandtattooshop.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-gold-500-500 transition-colors"
              title="Website"
            >
              <IconWorld className="h-6 w-6" />
            </Link>
            <Link 
              href="https://www.facebook.com/bowenislandtattooshop" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-gold-500-500 transition-colors"
              title="Facebook"
              onClick={() => GAEvents.socialMediaClicked('Facebook')}
            >
              <IconBrandFacebook className="h-6 w-6" />
            </Link>
            <Link 
              href="https://instagram.com/bowenislandtattooshop" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-gold-500-500 transition-colors"
              title="Instagram"
              onClick={() => GAEvents.socialMediaClicked('Instagram')}
            >
              <IconBrandInstagram className="h-6 w-6" />
            </Link>
            <Link 
              href="mailto:bowenislandtattooshop@gmail.com"
              className="text-gray-400 hover:text-gold-500-500 transition-colors"
              title="Email"
              onClick={() => GAEvents.emailClicked()}
            >
              <IconAt className="h-6 w-6" />
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
      className="font-normal flex flex-col sm:flex-row items-center gap-3 text-white px-2 py-1 relative z-20 group"
    >
      <Image
        src="/images/bowen-logo.svg"
        alt="Bowen Island Tattoo"
        width={80}
        height={80}
        className="group-hover:scale-105 transition-transform brightness-0 invert"
      />
      <div className="font-heading text-center sm:text-left">
        <span className="block text-2xl">Bowen Island</span>
        <span className="block text-xl text-gold-500 -mt-1">Tattoo Studio</span>
      </div>
    </Link>
  );
};