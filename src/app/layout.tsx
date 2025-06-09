import type { Metadata, Viewport } from "next";
import "./globals.css";
import ClientLayout from "./ClientLayout";

export const metadata: Metadata = {
  title: "Bowen Island Tattoo",
  description: "Victorian Gothic meets Modern Minimalism - A private tattoo studio on Bowen Island",
  keywords: ["tattoo", "Bowen Island", "custom tattoo", "tattoo artist", "Vancouver", "gothic tattoo", "minimalist tattoo"],
  authors: [{ name: "Bowen Island Tattoo" }],
  creator: "Bowen Island Tattoo",
  publisher: "Bowen Island Tattoo",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  // Mobile-specific optimizations
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#C9A449" },
    { media: "(prefers-color-scheme: dark)", color: "#080808" },
  ],
  // App-like experience on mobile
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Bowen Island Tattoo",
  },
  // Open Graph for social sharing (mobile users share a lot)
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://bowenislandtattoo.com",
    siteName: "Bowen Island Tattoo",
    title: "Bowen Island Tattoo - Victorian Gothic meets Modern Minimalism",
    description: "A private tattoo studio on Bowen Island specializing in custom designs where Victorian Gothic meets Modern Minimalism.",
    images: [
      {
        url: "/images/og-image.jpg", // You'll want to create this
        width: 1200,
        height: 630,
        alt: "Bowen Island Tattoo Studio",
      },
    ],
  },
  // Twitter/X Card for mobile sharing
  twitter: {
    card: "summary_large_image",
    title: "Bowen Island Tattoo",
    description: "Victorian Gothic meets Modern Minimalism - A private tattoo studio on Bowen Island",
    images: ["/images/og-image.jpg"],
  },
  // Mobile browser configuration
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "msapplication-TileColor": "#C9A449",
    "msapplication-config": "/browserconfig.xml",
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
    { media: "(prefers-color-scheme: light)", color: "#C9A449" },
    { media: "(prefers-color-scheme: dark)", color: "#080808" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        {/* Preconnect to external domains for faster loading */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        
        {/* DNS prefetch for faster resource loading */}
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        
        {/* Touch Icons for mobile home screen */}
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#C9A449" />
        
        {/* Microsoft Tiles */}
        <meta name="msapplication-TileColor" content="#C9A449" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        
        {/* Prevent phone number detection */}
        <meta name="format-detection" content="telephone=no" />
        
        {/* Optimize font loading for mobile */}
        <link 
          rel="preload" 
          href="/fonts/heading-font.woff2" 
          as="font" 
          type="font/woff2" 
          crossOrigin=""
        />
        <link 
          rel="preload" 
          href="/fonts/body-font.woff2" 
          as="font" 
          type="font/woff2" 
          crossOrigin=""
        />
      </head>
      <body 
        className="antialiased bg-[#080808] text-white selection:bg-[#C9A449]/20 selection:text-[#C9A449]"
        suppressHydrationWarning={true}
      >
        {/* Improved mobile interaction and accessibility */}
        <div className="min-h-screen flex flex-col">
          <ClientLayout>
            {children}
          </ClientLayout>
        </div>
      </body>
    </html>
  );
}
