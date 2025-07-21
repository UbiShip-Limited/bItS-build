"use client"

import React from 'react';
import TattooRequestForm from '../../components/forms/TattooRequestForm';

const TattooRequestPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-obsidian py-16 px-6 relative overflow-hidden">
      {/* Ornamental background elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-20 left-10 w-32 h-32 border border-gold/20 rotate-45 hidden md:block"></div>
        <div className="absolute bottom-20 right-10 w-24 h-24 border border-gold/30 rotate-12 hidden md:block"></div>
        <div className="absolute top-1/2 left-20 w-16 h-16 border border-gold/15 -rotate-12 hidden lg:block"></div>
        <div className="absolute top-32 right-32 w-20 h-20 border border-gold/25 rotate-45 hidden lg:block"></div>
      </div>
      
      {/* Central ornamental divider */}
      <div className="absolute top-0 left-1/2 h-full w-px -translate-x-1/2 z-0 hidden sm:block">
        <div className="h-full w-full bg-gradient-to-b from-transparent via-gold/30 to-transparent"></div>
      </div>
      
      <div className="max-w-4xl mx-auto mb-8 text-center relative z-10">
        {/* Ornamental line above title */}
        <div className="mb-8">
          <div className="flex items-center justify-center">
            <div className="w-16 sm:w-32 h-px bg-gradient-to-r from-transparent via-gold/80 to-gold/50"></div>
            <div className="mx-4 flex items-center justify-center w-6 h-6">
              <div className="w-4 h-4 border border-gold/80 rotate-45"></div>
              <div className="absolute w-2 h-2 bg-gold/30 rotate-45"></div>
            </div>
            <div className="w-16 sm:w-32 h-px bg-gradient-to-l from-transparent via-gold/80 to-gold/50"></div>
          </div>
        </div>
        
        <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl mb-6 text-white tracking-wide uppercase">Request a Tattoo</h1>
        
        {/* Ornamental line below title */}
        <div className="mb-8">
          <div className="flex items-center justify-center">
            <div className="w-20 sm:w-36 h-px bg-gradient-to-r from-transparent via-gold/80 to-gold/50"></div>
            <div className="mx-4 relative flex items-center justify-center">
              <span className="text-gold text-sm z-10">✦</span>
              <span className="absolute transform scale-150 text-gold/20 text-sm">✦</span>
            </div>
            <div className="w-20 sm:w-36 h-px bg-gradient-to-l from-transparent via-gold/80 to-gold/50"></div>
          </div>
        </div>
        
        <p className="text-white/80 max-w-2xl mx-auto font-body text-lg leading-relaxed px-4">
          Our artists will review your request and contact you to discuss details, pricing, and scheduling. We look forward to bringing your vision to life.
        </p>
      </div>
      
      <div className="relative z-10">
        <TattooRequestForm />
      </div>
    </div>
  );
};

export default TattooRequestPage; 