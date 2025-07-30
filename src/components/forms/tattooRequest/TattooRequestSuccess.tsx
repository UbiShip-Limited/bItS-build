import React, { useState } from 'react';
import { Button } from '@/src/components/ui/button';
import { formatReferenceNumber, formatTrackingToken, copyToClipboard } from '@/src/lib/utils/referenceFormatter';

interface ResponseData {
  id: string;
  message: string;
  trackingToken?: string;
}

interface TattooRequestSuccessProps {
  response: ResponseData;
  resetForm: () => void;
}

const TattooRequestSuccess: React.FC<TattooRequestSuccessProps> = ({ response, resetForm }) => {
  const [copiedRef, setCopiedRef] = useState(false);
  const [copiedTracking, setCopiedTracking] = useState(false);
  
  const formattedReference = formatReferenceNumber(response.id);
  const formattedTracking = response.trackingToken ? formatTrackingToken(response.trackingToken) : null;
  
  const handleCopyReference = async () => {
    const success = await copyToClipboard(formattedReference);
    if (success) {
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 2000);
    }
  };
  
  const handleCopyTracking = async () => {
    if (formattedTracking) {
      const success = await copyToClipboard(formattedTracking);
      if (success) {
        setCopiedTracking(true);
        setTimeout(() => setCopiedTracking(false), 2000);
      }
    }
  };
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
        
        {/* Request Details Card with enhanced styling */}
        <div className="border border-[#C9A449]/30 p-6 rounded-xl mb-6 bg-[#080808]/40 backdrop-blur-sm relative overflow-hidden shadow-[0_8px_32px_rgba(201,164,73,0.1)] animate-fadeIn">
          {/* Enhanced ornamental corner elements */}
          <div className="absolute top-0 left-0 w-8 h-8 border-l-2 border-t-2 border-[#C9A449]/40 rounded-tl-lg"></div>
          <div className="absolute top-0 right-0 w-8 h-8 border-r-2 border-t-2 border-[#C9A449]/40 rounded-tr-lg"></div>
          <div className="absolute bottom-0 left-0 w-8 h-8 border-l-2 border-b-2 border-[#C9A449]/40 rounded-bl-lg"></div>
          <div className="absolute bottom-0 right-0 w-8 h-8 border-r-2 border-b-2 border-[#C9A449]/40 rounded-br-lg"></div>
          
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#C9A449]/5 via-transparent to-[#C9A449]/5 rounded-xl pointer-events-none"></div>
          
          <div className="relative z-10">
            <div className="flex items-center mb-4">
              <div className="w-6 h-[0.5px] bg-gradient-to-r from-transparent to-[#C9A449]/60"></div>
              <h3 className="font-heading text-lg text-[#C9A449] mx-3 tracking-wide">Request Details</h3>
              <div className="flex-1 h-[0.5px] bg-gradient-to-l from-transparent to-[#C9A449]/60"></div>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              <div>
                <p className="text-white/50 text-sm font-body mb-2">Reference Number</p>
                <div className="flex items-center gap-3">
                  <div className="relative bg-[#C9A449]/10 border border-[#C9A449]/30 px-5 py-3 rounded-lg shadow-[0_4px_12px_rgba(201,164,73,0.15)] animate-slideIn">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#C9A449]/0 via-[#C9A449]/10 to-[#C9A449]/0 rounded-lg animate-shimmer"></div>
                    <p className="font-mono font-bold text-[#C9A449] text-xl tracking-wider relative z-10">{formattedReference}</p>
                  </div>
                  <button
                    onClick={handleCopyReference}
                    className="group relative p-2 bg-[#080808]/50 border border-white/10 rounded-lg hover:border-[#C9A449]/30 transition-all duration-300"
                    title="Copy reference number"
                  >
                    {copiedRef ? (
                      <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-white/60 group-hover:text-[#C9A449]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    )}
                    {copiedRef && (
                      <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-green-500/90 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                        Copied!
                      </span>
                    )}
                  </button>
                </div>
                <p className="text-white/40 text-xs mt-2 font-body flex items-center gap-1">
                  <svg className="w-3 h-3 text-[#C9A449]/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Keep this number for your records
                </p>
              </div>
              <div>
                <p className="text-white/50 text-sm font-body mb-1">Message</p>
                <p className="text-white/90 font-body leading-relaxed">{response.message}</p>
              </div>
              {formattedTracking && (
                <div>
                  <p className="text-white/50 text-sm font-body mb-2">Tracking Code</p>
                  <div className="flex items-center gap-3">
                    <div className="relative bg-white/5 border border-white/20 px-4 py-2.5 rounded-lg animate-slideIn" style={{animationDelay: '200ms'}}>
                      <p className="font-mono font-medium text-white/90 text-lg tracking-wider">{formattedTracking}</p>
                    </div>
                    <button
                      onClick={handleCopyTracking}
                      className="group relative p-2 bg-[#080808]/50 border border-white/10 rounded-lg hover:border-[#C9A449]/30 transition-all duration-300"
                      title="Copy tracking code"
                    >
                      {copiedTracking ? (
                        <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-white/60 group-hover:text-[#C9A449]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      )}
                      {copiedTracking && (
                        <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-green-500/90 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                          Copied!
                        </span>
                      )}
                    </button>
                  </div>
                  <p className="text-white/40 text-xs mt-2 font-body">Use this code for anonymous tracking</p>
                </div>
              )}
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
          <Button
            type="button"
            onClick={resetForm}
            variant="outline"
            size="lg"
          >
            Submit Another Request
            <svg className="ml-2 w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TattooRequestSuccess;
