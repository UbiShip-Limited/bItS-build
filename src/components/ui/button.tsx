"use client";

import React from "react";
import Link from "next/link";

type ButtonProps = {
  href?: string;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "link";
  size?: "sm" | "md" | "lg";
  className?: string;
  isDisabled?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => void;
  children: React.ReactNode;
  icon?: React.ReactNode;
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
    "font-body tracking-[0.15em] uppercase transition-all duration-300 relative overflow-hidden group inline-flex items-center justify-center",
    {
      // Primary - Gold background
      "bg-gold text-obsidian hover:bg-gold/90 border border-gold shadow-subtle hover:shadow-elegant": variant === "primary",
      // Secondary - Obsidian background
      "bg-obsidian text-white hover:bg-obsidian/90 border border-obsidian shadow-subtle": variant === "secondary",
      // Outline - Transparent with border
      "bg-transparent text-obsidian hover:bg-gold/5 border border-obsidian/20 hover:border-gold": variant === "outline",
      // Ghost - No border
      "bg-transparent text-obsidian hover:text-gold border-0 p-0": variant === "ghost",
      // Link - Underlined text
      "bg-transparent text-gold hover:text-gold/80 border-0 underline underline-offset-4 decoration-1 p-0": variant === "link",
      
      // Sizes with consistent padding
      "px-4 py-2 text-xs": size === "sm" && variant !== "ghost" && variant !== "link",
      "px-6 py-2.5 text-sm": size === "md" && variant !== "ghost" && variant !== "link",
      "px-8 py-3 text-base": size === "lg" && variant !== "ghost" && variant !== "link",
      
      // Disabled state
      "opacity-50 cursor-not-allowed": isDisabled,
    },
    className
  );

  // If href is provided, render as Link
  if (href && !isDisabled) {
    return (
      <Link href={href} className={baseClasses} onClick={onClick}>
        {icon && <span className="mr-2 inline-flex relative z-10">{icon}</span>}
        <span className="relative z-10">{children}</span>
        {/* Subtle hover effect overlay */}
        {(variant === "primary" || variant === "secondary" || variant === "outline") && (
          <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
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
      {icon && <span className="mr-2 inline-flex relative z-10">{icon}</span>}
      <span className="relative z-10">{children}</span>
      {/* Subtle hover effect overlay */}
      {(variant === "primary" || variant === "secondary" || variant === "outline") && (
        <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      )}
    </button>
  );
}

// Utility function for class names if it doesn't exist elsewhere
function cn(...classes: (string | boolean | undefined | { [key: string]: boolean })[]): string {
  return classes
    .filter(Boolean)
    .map((c) => {
      if (typeof c === "object") {
        return Object.entries(c)
          .filter(([, value]) => value)
          .map(([key]) => key);
      }
      return c;
    })
    .flat()
    .join(" ");
}