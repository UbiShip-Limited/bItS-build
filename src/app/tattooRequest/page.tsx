import React from 'react';
import { Metadata } from 'next';
import TattooRequestForm from '../../components/forms/TattooRequestForm';
import { StructuredData } from '../../components/StructuredData';
import { typography, colors, effects, components } from '@/src/lib/styles/globalStyleConstants';

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
      
      <div className="min-h-screen bg-gradient-to-b from-[#080808] via-[#0a0a0a] to-[#080808] py-12 sm:py-16 px-4 sm:px-6 relative overflow-hidden">
        {/* Enhanced ambient glow effects */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-gold-500/[0.03] rounded-full blur-[120px] animate-pulse" style={{animationDuration: '4s'}}></div>
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-gold-500/[0.02] rounded-full blur-[100px] animate-pulse" style={{animationDuration: '6s', animationDelay: '2s'}}></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gold-500/[0.01] rounded-full blur-[150px]"></div>
        </div>
        
        {/* Subtle central divider */}
        <div className="absolute top-0 left-1/2 h-full w-px -translate-x-1/2 z-0 hidden lg:block">
          <div className="h-full w-full bg-gradient-to-b from-transparent via-gold-500/10 to-transparent"></div>
        </div>
        
        <div className="max-w-4xl mx-auto mb-8 sm:mb-10 text-center relative z-10">
          {/* Enhanced ornamental divider above title */}
          <div className="mb-8 flex items-center justify-center">
            <div className="w-20 sm:w-28 md:w-36 h-[1px] bg-gradient-to-r from-transparent via-gold-500/30 to-gold-500/10" />
            <div className="mx-3 sm:mx-4 md:mx-5 relative">
              <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-gold-500/40 rounded-full" />
              <div className="absolute inset-0 bg-gold-500/20 rounded-full blur-sm scale-[2.5] animate-pulse" />
            </div>
            <div className="mx-2 relative">
              <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gold-500/50 rounded-full" />
              <div className="absolute inset-0 bg-gold-500/30 rounded-full blur-md scale-[3] animate-pulse" style={{animationDelay: '0.5s'}} />
            </div>
            <div className="mx-3 sm:mx-4 md:mx-5 relative">
              <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-gold-500/40 rounded-full" />
              <div className="absolute inset-0 bg-gold-500/20 rounded-full blur-sm scale-[2.5] animate-pulse" style={{animationDelay: '1s'}} />
            </div>
            <div className="w-20 sm:w-28 md:w-36 h-[1px] bg-gradient-to-l from-transparent via-gold-500/30 to-gold-500/10" />
          </div>
          
          <h1 className={`${typography.h1} ${colors.textPrimary} mb-6`}>Start Your Journey</h1>
          
          {/* Enhanced dots divider below title */}
          <div className="mb-6 sm:mb-8 flex items-center justify-center gap-3 sm:gap-4">
            <div className="w-1 h-1 bg-gold-500/30 rounded-full animate-pulse" style={{animationDelay: '0ms'}}></div>
            <div className="w-1.5 h-1.5 bg-gold-500/40 rounded-full animate-pulse" style={{animationDelay: '200ms'}}></div>
            <div className="w-2 h-2 bg-gold-500/50 rounded-full relative">
              <div className="absolute inset-0 bg-gold-500/20 rounded-full blur-sm scale-[2] animate-pulse" />
            </div>
            <div className="w-1.5 h-1.5 bg-gold-500/40 rounded-full animate-pulse" style={{animationDelay: '400ms'}}></div>
            <div className="w-1 h-1 bg-gold-500/30 rounded-full animate-pulse" style={{animationDelay: '600ms'}}></div>
          </div>
          
          <p className={`${colors.textSecondary} max-w-2xl mx-auto ${typography.paragraphLarge} px-2 sm:px-4`}>
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