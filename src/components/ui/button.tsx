"use client";

import React from "react";
import Link from "next/link";
import { cn } from "@/src/lib/utils/cn";

type ButtonProps = {
  href?: string;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "link";
  size?: "sm" | "md" | "lg";
  className?: string;
  isDisabled?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => void;
  children: React.ReactNode;
  icon?: React.ReactNode;
  type?: "button" | "submit" | "reset";
};

export function Button({
  href,
  variant = "primary",
  size = "md",
  className = "",
  isDisabled = false,
  onClick,
  children,
  icon,
  ...props
}: ButtonProps) {
  // Base classes for all button variants with refined Bowen Island styling
  const baseClasses = cn(
    "font-body tracking-[0.02em] uppercase transition-all duration-800 ease-smooth relative overflow-hidden group inline-flex items-center justify-center rounded-2xl",
    {
      // Primary - Refined gold background
      "bg-gold-500/90 text-obsidian hover:bg-gold-500 border border-gold-500/70 shadow-[0_4px_14px_rgba(184,149,106,0.25)] hover:shadow-[0_6px_20px_rgba(184,149,106,0.35)] backdrop-blur-sm": variant === "primary",
      // Secondary - Refined obsidian background
      "bg-obsidian/90 text-white hover:bg-obsidian border border-obsidian/80 shadow-refined hover:shadow-refined-lg backdrop-blur-sm": variant === "secondary",
      // Outline - Refined transparent with border
      "bg-transparent text-gold-500/80 hover:bg-gold-500/10 border border-gold-500/30 hover:border-gold-500/50 hover:text-gold-500 backdrop-blur-sm shadow-sm hover:shadow-md": variant === "outline",
      // Ghost - No border with subtle hover
      "bg-transparent text-obsidian/90 hover:text-gold-500/80 border-0 p-0 hover:bg-gold-500/5 rounded-xl": variant === "ghost",
      // Link - Refined underlined text
      "bg-transparent text-gold-500/90 hover:text-gold-500 border-0 underline underline-offset-4 decoration-1 p-0": variant === "link",
      
      // Refined sizes with better padding
      "px-6 py-3 text-xs min-h-[40px]": size === "sm" && variant !== "ghost" && variant !== "link",
      "px-8 py-3.5 text-sm min-h-[48px]": size === "md" && variant !== "ghost" && variant !== "link",
      "px-10 py-4 text-base min-h-[56px]": size === "lg" && variant !== "ghost" && variant !== "link",
      
      // Refined disabled state
      "opacity-30 cursor-not-allowed hover:bg-current hover:border-current": isDisabled,
    },
    className
  );

  // If href is provided, render as Link
  if (href && !isDisabled) {
    return (
      <Link href={href} className={baseClasses} onClick={onClick}>
        <span className="inline-flex items-center relative z-10">
          {icon && <span className="inline-flex">{icon}</span>}
          {children}
        </span>
        {/* Refined hover effect overlay */}
        {(variant === "primary" || variant === "secondary" || variant === "outline") && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-800 rounded-2xl" />
        )}
      </Link>
    );
  }

  // Otherwise render as button
  return (
    <button 
      className={baseClasses} 
      disabled={isDisabled} 
      onClick={onClick} 
      {...props}
    >
      <span className="inline-flex items-center relative z-10">
        {icon && <span className="inline-flex">{icon}</span>}
        {children}
      </span>
      {/* Refined hover effect overlay */}
      {(variant === "primary" || variant === "secondary" || variant === "outline") && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-600 rounded-2xl" />
      )}
    </button>
  );
}

