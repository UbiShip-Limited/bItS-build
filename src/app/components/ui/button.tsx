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
  // Base classes for all button variants
  const baseClasses = cn(
    "btn",
    {
      "btn-primary": variant === "primary",
      "btn-secondary": variant === "secondary",
      "btn-outline": variant === "outline",
      "btn-ghost": variant === "ghost",
      "btn-link": variant === "link",
      "btn-sm": size === "sm",
      "btn-md": size === "md",
      "btn-lg": size === "lg",
      "btn-disabled": isDisabled,
    },
    className
  );

  // If href is provided, render as Link
  if (href && !isDisabled) {
    return (
      <Link href={href} className={baseClasses} onClick={onClick}>
        {icon && <span className="mr-2">{icon}</span>}
        {children}
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
      {icon && <span className="mr-2">{icon}</span>}
      {children}
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
          .filter(([_, value]) => value)
          .map(([key]) => key);
      }
      return c;
    })
    .flat()
    .join(" ");
}
