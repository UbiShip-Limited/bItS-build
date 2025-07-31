import type { Metadata, Viewport } from "next";
import "./globals.css";
import ClientLayout from "./ClientLayout";
import { StructuredData } from "../components/StructuredData";
import GoogleAnalytics from "@/src/components/analytics/GoogleAnalytics";
import VercelAnalytics from "@/src/components/analytics/VercelAnalytics";

export const metadata: Metadata = {
  title: {
    default: "Bowen Island Tattoo - Premium Custom Tattoos Near Vancouver | Kelly Miller",
    template: "%s | Bowen Island Tattoo"
  },
  description: "Premium custom tattoo studio on Bowen Island near Vancouver, BC. Master artist Kelly Miller specializes in Victorian Gothic, wildlife realism & custom designs. Private studio by appointment only.",
  keywords: [
    // Primary keywords
    "tattoo", "Bowen Island", "custom tattoo", "tattoo artist", "Vancouver", 
    // Local SEO keywords
    "Vancouver tattoo", "BC tattoo artist", "Bowen Island tattoo studio", "West Vancouver tattoo",
    "North Shore tattoo", "private tattoo studio", "appointment only tattoo",
    // Style keywords
    "gothic tattoo", "minimalist tattoo", "wildlife tattoo", "realism tattoo", "custom design tattoo",
    "Victorian gothic tattoo", "geometric tattoo", "watercolor tattoo",
    // Artist keywords  
    "Kelly Miller tattoo", "master tattoo artist", "premium tattoo studio", "boutique tattoo",
    // Experience keywords
    "private tattoo session", "luxury tattoo experience", "island tattoo studio"
  ],
  authors: [{ name: "Kelly Miller", url: "https://bowenislandtattoo.com" }],
  creator: "Bowen Island Tattoo Studio",
  publisher: "Bowen Island Tattoo Studio",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://bowenislandtattoo.com'),
  category: "Art & Design",
  classification: "Tattoo Studio",
  // Enhanced app experience
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Bowen Island Tattoo",
    startupImage: "/images/startup-image.png"
  },
  // Enhanced Open Graph for social sharing
  openGraph: {
    type: "website",
    locale: "en_CA", // Canadian locale
    url: "https://bowenislandtattoo.com",
    siteName: "Bowen Island Tattoo Studio",
    title: "Bowen Island Tattoo - Premium Custom Tattoos Near Vancouver BC",
    description: "Master artist Kelly Miller creates stunning custom tattoos in a private island studio. Victorian Gothic meets Modern Minimalism. Serving Vancouver, West Vancouver & North Shore by appointment.",
    images: [
      {
        url: "/images/og-bowen-tattoo-main.jpg",
        width: 1200,
        height: 630,
        alt: "Bowen Island Tattoo Studio - Premium Custom Tattoos Near Vancouver",
        type: "image/jpeg"
      },
      {
        url: "/images/og-bowen-tattoo-square.jpg", 
        width: 1200,
        height: 1200,
        alt: "Bowen Island Tattoo Studio Logo",
        type: "image/jpeg"
      }
    ],
  },
  // Enhanced Twitter/X Card
  twitter: {
    card: "summary_large_image",
    site: "@bowenislandtattoo", // If you have a Twitter account
    creator: "@kellymillertattoo", // If Kelly has a Twitter
    title: "Bowen Island Tattoo - Premium Custom Tattoos Near Vancouver",
    description: "Master artist Kelly Miller creates stunning custom tattoos in a private island studio. Victorian Gothic meets Modern Minimalism.",
    images: ["/images/og-bowen-tattoo-main.jpg"],
  },
  // Mobile browser configuration
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes", 
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "msapplication-TileColor": "#080808",
    "msapplication-config": "/browserconfig.xml",
    "theme-color": "#080808",
    // Geo tags for local SEO
    "geo.region": "CA-BC",
    "geo.placename": "Bowen Island",
    "geo.position": "49.3827;-123.3639", // Approximate coordinates for Bowen Island
    "ICBM": "49.3827, -123.3639",
    // Additional SEO tags
    "robots": "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
  },
};

// Viewport configuration for optimal mobile experience
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5, // Allow zoom for accessibility
  userScalable: true, // Important for accessibility
  viewportFit: "cover", // For devices with notches/safe areas
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#080808" },
    { media: "(prefers-color-scheme: dark)", color: "#080808" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth dark">
      <head>
        {/* Preconnect to external domains for faster loading */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        
        {/* DNS prefetch and preconnect for faster resource loading */}
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="" />
        
        {/* Touch Icons for mobile home screen */}
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#080808" />
        
        {/* Microsoft Tiles */}
        <meta name="msapplication-TileColor" content="#080808" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        
        {/* Prevent phone number detection */}
        <meta name="format-detection" content="telephone=no" />
        
        {/* Structured Data for SEO */}
        <StructuredData type="homepage" />
        
        {/* Google Analytics */}
        <GoogleAnalytics />
        
        {/* Vercel Analytics */}
        <VercelAnalytics />
      </head>
      <body 
        className="antialiased text-white selection:bg-black/20 selection:text-white"
        style={{ backgroundColor: 'var(--obsidian, #0A0A0A)' }}
        suppressHydrationWarning={true}
      >
        {/* Improved mobile interaction and accessibility */}
        <div className="min-h-screen flex flex-col overflow-x-hidden">
          <ClientLayout>
            {children}
          </ClientLayout>
        </div>
      </body>
    </html>
  );
}
