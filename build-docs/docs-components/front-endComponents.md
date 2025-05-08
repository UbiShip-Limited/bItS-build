# Bowen Island Tattoo - Component Documentation

This document provides an overview of the custom components created for the Bowen Island Tattoo website. The site features a dark, romantic aesthetic with black backgrounds and darker shades of gold accents throughout.

## Table of Contents

1. [Hero Component](#hero-component)
2. [Parallax Sections Component](#parallax-sections-component)
3. [Gallery Component](#gallery-component)
4. [Technical Implementation](#technical-implementation)

---

## Hero Component

The Hero component serves as the main landing section for the website, creating an immediate impression with its dramatic lighting and elegant typography.

### Key Features

- **Dramatic Lighting Effect**: A dark background with a focused lighting effect in the center that creates a spotlight effect while keeping the edges very dark.
- **Offset Typography**: The main heading uses Playfair Display in italic style for an elegant, cursive-like appearance, positioned on the left side of the screen.
- **Dark Gold Color Scheme**: Uses deeper amber/gold shades for text and buttons to create a rich, luxurious feel.
- **Responsive Design**: Adapts seamlessly to different screen sizes while maintaining the dramatic aesthetic.
- **Call-to-Action Buttons**: Two styled buttons for viewing work and booking consultations.

### Visual Elements

- Background with multiple overlay layers to create the vignette effect
- Decorative SVG element in the bottom right corner
- Responsive text sizing that scales appropriately on different devices

### Code Highlights

\`\`\`tsx
// Multiple overlay layers for the dramatic lighting effect
<div className="absolute inset-0 bg-black/70"></div>
<div className="absolute inset-0 bg-gradient-radial from-transparent via-black/30 to-black/90"></div>
<div className="absolute inset-0 flex items-center justify-center">
  <div className="w-1/3 h-1/3 rounded-full bg-gradient-radial from-amber-900/20 via-transparent to-transparent blur-2xl"></div>
</div>
\`\`\`

---

## Parallax Sections Component

The Parallax Sections component creates an engaging scrolling experience with three staggered sections that alternate between left and right alignment, with images that move at different rates than the text.

### Key Features

- **Staggered Layout**: Three full-height sections that alternate between image-left/text-right and text-left/image-right.
- **Parallax Scrolling Effect**: Images move at a different rate than the scroll, creating a dynamic, engaging experience.
- **Consistent Styling**: Maintains the dark background with gold/amber text from the hero section.
- **Thematic Content**: Each section highlights a different aspect of the tattoo shop (Traditional Artistry, Modern Expression, Personalized Experience).

### Technical Implementation

- Uses framer-motion's `useScroll` and `useTransform` hooks to create the parallax effect
- Each section has its own ref and scroll progress tracker
- The y-position of each image is transformed based on the scroll progress

### Code Highlights

\`\`\`tsx
// Scroll progress tracking for parallax effect
const { scrollYProgress: scrollYProgress1 } = useScroll({
  target: section1Ref,
  offset: ["start end", "end start"],
})

// Transform values for parallax effect
const y1 = useTransform(scrollYProgress1, [0, 1], [100, -100])

// Applied to the image container
<motion.div className="relative h-[400px] md:h-[600px] w-full" style={{ y: y1 }}>
  <Image src="/tattoo-image-1.png" alt="Traditional tattoo art" fill className="object-cover" />
  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
</motion.div>
\`\`\`

---

## Gallery Component

The Gallery component showcases the tattoo artists' work in a clean, elegant grid layout with lightbox functionality for viewing larger images.

### Key Features

- **Clean Grid Layout**: A responsive grid that displays 1, 2, or 3 columns depending on screen size.
- **Elegant Hover Effects**: Subtle animations reveal image details on hover with a gradient overlay.
- **Lightbox Functionality**: Click on any image to view a larger version with details in a full-screen overlay.
- **Consistent Styling**: Maintains the dark and gold aesthetic established in previous components.

### Visual Elements

- Square aspect ratio for all images ensures consistent presentation
- Gradient overlays that reveal image details on hover
- Smooth animations for a polished user experience

### Code Highlights

\`\`\`tsx
// Hover effects for gallery items
<div className="relative group cursor-pointer overflow-hidden rounded-lg">
  <div className="aspect-square relative">
    {/* Gradient overlay */}
    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

    {/* Image */}
    <Image
      src={item.src || "/placeholder.svg"}
      alt={item.alt}
      fill
      className="object-cover transition-transform duration-700 group-hover:scale-105"
    />

    {/* Caption */}
    <div className="absolute bottom-0 left-0 right-0 p-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform translate-y-2 group-hover:translate-y-0">
      <p className="text-amber-200 font-serif italic text-lg">{item.alt}</p>
      <p className="text-amber-400/80 text-sm">Artist: {item.artist}</p>
    </div>
  </div>
</div>
\`\`\`

---

## Technical Implementation

### Font Integration

The site uses Next.js's built-in font system to load the Playfair Display font, which provides the elegant, cursive-like typography throughout the site.

\`\`\`tsx
// In layout.tsx
import { Playfair_Display } from 'next/font/google'

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-playfair",
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={playfair.variable}>{children}</body>
    </html>
  )
}
\`\`\`

### Color Scheme

The site uses a carefully selected palette of dark backgrounds with gold/amber accents:

- Background: Black (#000000)
- Primary Text: Amber-700/90 (a darker gold with slight transparency)
- Secondary Text: Amber-800/80 (an even darker gold with more transparency)
- Accents: Various shades of amber from 200 to 950
- Buttons: Amber-950 for backgrounds, Amber-200/90 for text

### Animation Libraries

The site uses Framer Motion for various animations:
- Parallax scrolling effects in the Parallax Sections component
- Smooth transitions in the Gallery component
- Lightbox animations

### Responsive Design

All components are fully responsive and adapt to different screen sizes:
- Mobile: Single column layouts with appropriate text sizing
- Tablet: Two column layouts where appropriate
- Desktop: Full layouts with optimal spacing and proportions

---

## Component Integration

The components are integrated in the main page.tsx file:

\`\`\`tsx
import Hero from "../hero"
import ParallaxSections from "../parallax-sections"
import TattooGallery from "../tattoo-gallery"

export default function Page() {
  return (
    <div>
      <Hero />
      <ParallaxSections />
      <TattooGallery />
    </div>
  )
}
\`\`\`

This creates a cohesive flow from the dramatic hero section, through the engaging parallax content sections, to the elegant gallery showcase.
