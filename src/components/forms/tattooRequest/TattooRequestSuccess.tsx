import React from 'react';
import { TattooFormResponse } from '../../../hooks/useTattooRequestForm';

interface TattooRequestSuccessProps {
  response: TattooFormResponse;
  resetForm: () => void;
}

const TattooRequestSuccess: React.FC<TattooRequestSuccessProps> = ({ response, resetForm }) => {
  return (
    <div className="max-w-3xl mx-auto relative">
      {/* Ornamental background */}
      <div className="absolute inset-0 bg-[#080808]/95 backdrop-blur-sm rounded-lg border border-[#C9A449]/30 shadow-2xl"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-[#C9A449]/5 via-transparent to-[#C9A449]/10 rounded-lg"></div>
      
      <div className="relative z-10 p-8 sm:p-12">
        {/* Success Icon and Header */}
        <div className="text-center mb-8">
          {/* Ornamental line above icon */}
          <div className="flex items-center justify-center mb-6">
            <div className="w-12 sm:w-16 h-[0.5px] bg-gradient-to-r from-transparent via-[#C9A449]/60 to-[#C9A449]/40"></div>
            <div className="mx-3 sm:mx-4 flex items-center justify-center w-5 h-5">
              <div className="w-3 h-3 border border-[#C9A449]/60 rotate-45"></div>
              <div className="absolute w-1.5 h-1.5 bg-[#C9A449]/20 rotate-45"></div>
            </div>
            <div className="w-12 sm:w-16 h-[0.5px] bg-gradient-to-l from-transparent via-[#C9A449]/60 to-[#C9A449]/40"></div>
          </div>
          
          {/* Success Icon */}
          <div className="relative inline-block mb-4">
            <div className="w-16 h-16 mx-auto bg-[#C9A449] rounded-full flex items-center justify-center shadow-lg shadow-[#C9A449]/30">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            {/* Glow effect */}
            <div className="absolute -inset-2 bg-[#C9A449]/20 rounded-full blur-xl"></div>
          </div>
          
          <h2 className="font-heading text-2xl sm:text-3xl mb-3 text-white tracking-wide">
            Thank you for your tattoo request!
          </h2>
          
          {/* Ornamental line below title */}
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 sm:w-20 h-[0.5px] bg-gradient-to-r from-transparent via-[#C9A449]/60 to-[#C9A449]/40"></div>
            <div className="mx-3 sm:mx-4 relative flex items-center justify-center">
              <span className="text-[#C9A449]/80 text-xs z-10">✦</span>
              <span className="absolute transform scale-125 text-[#C9A449]/20 text-xs">✦</span>
            </div>
            <div className="w-16 sm:w-20 h-[0.5px] bg-gradient-to-l from-transparent via-[#C9A449]/60 to-[#C9A449]/40"></div>
          </div>
          
          <p className="text-white/70 font-body">We&apos;ve received your submission</p>
        </div>
        
        {/* Request Details Card */}
        <div className="border border-[#C9A449]/30 p-6 rounded-md mb-6 bg-[#080808]/30 backdrop-blur-sm relative overflow-hidden">
          {/* Ornamental corner elements */}
          <div className="absolute top-0 left-0 w-6 h-6 border-l-2 border-t-2 border-[#C9A449]/30"></div>
          <div className="absolute top-0 right-0 w-6 h-6 border-r-2 border-t-2 border-[#C9A449]/30"></div>
          <div className="absolute bottom-0 left-0 w-6 h-6 border-l-2 border-b-2 border-[#C9A449]/30"></div>
          <div className="absolute bottom-0 right-0 w-6 h-6 border-r-2 border-b-2 border-[#C9A449]/30"></div>
          
          <div className="relative z-10">
            <div className="flex items-center mb-4">
              <div className="w-6 h-[0.5px] bg-gradient-to-r from-transparent to-[#C9A449]/60"></div>
              <h3 className="font-heading text-lg text-[#C9A449] mx-3 tracking-wide">Request Details</h3>
              <div className="flex-1 h-[0.5px] bg-gradient-to-l from-transparent to-[#C9A449]/60"></div>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              <div>
                <p className="text-white/50 text-sm font-body mb-1">Reference Number</p>
                <p className="font-body font-medium text-white text-lg tracking-wide">{response.id}</p>
              </div>
              <div>
                <p className="text-white/50 text-sm font-body mb-1">Description</p>
                <p className="text-white/90 font-body leading-relaxed">{response.description}</p>
              </div>
              <div>
                <p className="text-white/50 text-sm font-body mb-1">Tracking Code</p>
                <p className="font-body font-medium text-white text-lg tracking-wide">{response.trackingToken || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Next Steps Information */}
        <div className="bg-gradient-to-r from-[#C9A449]/10 via-[#C9A449]/5 to-[#C9A449]/10 p-6 rounded-md border border-[#C9A449]/30 mb-8 relative overflow-hidden">
          {/* Ornamental corner elements */}
          <div className="absolute top-0 left-0 w-8 h-8 border-l-2 border-t-2 border-[#C9A449]/40"></div>
          <div className="absolute top-0 right-0 w-8 h-8 border-r-2 border-t-2 border-[#C9A449]/40"></div>
          <div className="absolute bottom-0 left-0 w-8 h-8 border-l-2 border-b-2 border-[#C9A449]/40"></div>
          <div className="absolute bottom-0 right-0 w-8 h-8 border-r-2 border-b-2 border-[#C9A449]/40"></div>
          
          <div className="relative z-10">
            <div className="flex items-center mb-3">
              <div className="w-8 h-[0.5px] bg-gradient-to-r from-transparent to-[#C9A449]/60"></div>
              <h4 className="font-heading text-[#C9A449] font-medium text-base mx-3 tracking-wide">What&apos;s next?</h4>
              <div className="w-8 h-[0.5px] bg-gradient-to-l from-transparent to-[#C9A449]/60"></div>
            </div>
            
            <p className="text-white/80 font-body leading-relaxed">
              We&apos;ll review your request within 24-48 hours. Once approved, 
              you&apos;ll receive an email with next steps and payment instructions.
            </p>
          </div>
        </div>
        
        {/* Action Button */}
        <div className="text-center">
          <button
            type="button"
            onClick={resetForm}
            className="group relative overflow-hidden bg-transparent border border-[#C9A449] text-[#C9A449] hover:bg-[#C9A449]/10 hover:border-[#C9A449]/80 transition-all duration-300 px-8 py-3 rounded-md font-body tracking-wide uppercase text-sm shadow-md hover:shadow-lg"
          >
            <span className="relative z-10 flex items-center">
              Submit Another Request
              <svg className="ml-2 w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TattooRequestSuccess;
