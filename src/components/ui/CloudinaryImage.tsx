"use client"

import React from 'react';
import Image, { ImageProps } from 'next/image';

interface CloudinaryImageProps extends Omit<ImageProps, 'src'> {
  publicId: string;
  cloudName?: string;
  transformations?: string;
  responsive?: boolean;
}

/**
 * Optimized Cloudinary image component with automatic format selection
 * and responsive loading
 */
export function CloudinaryImage({
  publicId,
  cloudName,
  transformations = 'f_auto,q_auto',
  responsive = true,
  alt,
  width,
  height,
  ...props
}: CloudinaryImageProps) {
  const cloud = cloudName || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'demo';
  const baseUrl = `https://res.cloudinary.com/${cloud}/image/upload`;
  
  // Build the image URL
  const buildUrl = (extraTransform?: string) => {
    const transforms = extraTransform 
      ? `${transformations},${extraTransform}`
      : transformations;
    return `${baseUrl}/${transforms}/${publicId}`;
  };
  
  // Default src
  const src = buildUrl();
  
  // Generate srcSet for responsive images if enabled
  const srcSet = responsive && width ? `
    ${buildUrl(`w_${Math.round(Number(width) * 0.5)}`)} ${Math.round(Number(width) * 0.5)}w,
    ${buildUrl(`w_${width}`)} ${width}w,
    ${buildUrl(`w_${Math.round(Number(width) * 1.5)}`)} ${Math.round(Number(width) * 1.5)}w,
    ${buildUrl(`w_${Math.round(Number(width) * 2)}`)} ${Math.round(Number(width) * 2)}w
  ` : undefined;
  
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      {...(srcSet && { srcSet })}
      {...props}
    />
  );
}

/**
 * Helper to get Cloudinary URL with transformations
 */
export function getCloudinaryUrl(
  publicId: string,
  transformations?: string,
  cloudName?: string
): string {
  const cloud = cloudName || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'demo';
  const transforms = transformations || 'f_auto,q_auto';
  return `https://res.cloudinary.com/${cloud}/image/upload/${transforms}/${publicId}`;
}

/**
 * Responsive image configuration for common use cases
 */
export const CLOUDINARY_PRESETS = {
  hero: {
    desktop: 'w_1920,h_1080,c_fill,f_auto,q_auto:best',
    tablet: 'w_1200,h_675,c_fill,f_auto,q_auto',
    mobile: 'w_800,h_600,c_fill,f_auto,q_auto'
  },
  gallery: {
    thumbnail: 'w_300,h_300,c_fill,f_auto,q_auto',
    medium: 'w_800,h_800,c_limit,f_auto,q_auto',
    large: 'w_1200,h_1200,c_limit,f_auto,q_auto'
  },
  logo: {
    small: 'w_200,f_auto,q_auto',
    medium: 'w_400,f_auto,q_auto',
    large: 'w_600,f_auto,q_auto'
  }
};