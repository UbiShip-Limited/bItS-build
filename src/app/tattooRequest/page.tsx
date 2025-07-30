import React from 'react';
import { Metadata } from 'next';
import TattooRequestForm from '../../components/forms/TattooRequestForm';
import { StructuredData } from '../../components/StructuredData';

// Enhanced metadata for tattoo request page
export const metadata: Metadata = {
  title: "Request Custom Tattoo Design - Bowen Island Tattoo Studio",
  description: "Book your custom tattoo consultation with master artist Kelly Miller on Bowen Island. Specializing in Victorian Gothic, wildlife realism & personalized designs. Private studio near Vancouver BC.",
  keywords: [
    "tattoo consultation", "custom tattoo design", "book tattoo appointment", "Bowen Island tattoo booking",
    "Vancouver tattoo consultation", "Kelly Miller tattoo", "custom tattoo request", "tattoo design process",
    "private tattoo consultation", "gothic tattoo design", "wildlife tattoo design", "realism tattoo booking"
  ],
  openGraph: {
    title: "Request Custom Tattoo Design - Bowen Island Tattoo",
    description: "Book your private consultation with master artist Kelly Miller. Custom tattoo designs created in our exclusive island studio near Vancouver.",
    url: "https://bowenislandtattoo.com/tattooRequest",
    images: [
      {
        url: "/images/og-tattoo-request.jpg",
        width: 1200,
        height: 630,
        alt: "Custom Tattoo Design Consultation - Bowen Island Tattoo Studio"
      }
    ]
  },
  twitter: {
    title: "Request Custom Tattoo Design - Bowen Island Tattoo",
    description: "Book your private consultation with master artist Kelly Miller for a custom tattoo design experience.",
    images: ["/images/og-tattoo-request.jpg"]
  },
  alternates: {
    canonical: "https://bowenislandtattoo.com/tattooRequest"
  }
};

const TattooRequestPage: React.FC = () => {
  return (
    <>
      {/* Enhanced structured data for this page */}
      <StructuredData type="tattooRequest" />
      
      <div className="min-h-screen bg-gradient-to-b from-[#080808] via-[#0a0a0a] to-[#080808] py-16 px-6 relative overflow-hidden">
        {/* Subtle ambient glow effects */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-gold-500/5 rounded-full blur-[100px]"></div>
          <div className="absolute bottom-1/3 right-1/4 w-[300px] h-[300px] bg-gold-500/3 rounded-full blur-[80px]"></div>
        </div>
        
        {/* Subtle central divider */}
        <div className="absolute top-0 left-1/2 h-full w-px -translate-x-1/2 z-0 hidden lg:block">
          <div className="h-full w-full bg-gradient-to-b from-transparent via-gold-500/10 to-transparent"></div>
        </div>
        
        <div className="max-w-4xl mx-auto mb-8 text-center relative z-10">
          {/* Simplified ornamental divider above title */}
          <div className="mb-6 flex items-center justify-center">
            <div className="w-24 sm:w-32 md:w-40 h-px bg-gradient-to-r from-transparent via-gold-500/40 to-gold-500/20" />
            <div className="mx-4 sm:mx-6 relative">
              <div className="w-3 h-3 bg-gold-500/40 rounded-full" />
              <div className="absolute inset-0 bg-gold-500/20 rounded-full blur-md scale-[3] animate-pulse" />
            </div>
            <div className="w-24 sm:w-32 md:w-40 h-px bg-gradient-to-l from-transparent via-gold-500/40 to-gold-500/20" />
          </div>
          
          <h1 className="font-body text-5xl sm:text-6xl md:text-7xl lg:text-7xl font-semibold leading-tight mb-4 text-white">Start Your Journey</h1>
          
          {/* Subtle dots divider below title */}
          <div className="mb-6 flex items-center justify-center gap-4">
            <div className="w-1.5 h-1.5 bg-gold-500/20 rounded-full"></div>
            <div className="w-2 h-2 bg-gold-500/30 rounded-full relative">
              <div className="absolute inset-0 bg-gold-500/10 rounded-full blur-xs scale-150" />
            </div>
            <div className="w-1.5 h-1.5 bg-gold-500/20 rounded-full"></div>
          </div>
          
          <p className="text-white/70 max-w-2xl mx-auto font-body text-lg sm:text-xl leading-relaxed px-4">
            Share your vision with us. We'll craft something meaningful together.
          </p>
        </div>
        
        <div className="relative z-10">
          <TattooRequestForm />
        </div>
      </div>
    </>
  );
};

export default TattooRequestPage; 