import React from 'react';
import { TattooFormResponse } from '../../../hooks/useTattooRequestForm';

interface TattooRequestSuccessProps {
  response: TattooFormResponse;
  resetForm: () => void;
}

const TattooRequestSuccess: React.FC<TattooRequestSuccessProps> = ({ response, resetForm }) => {
  return (
    <div className="max-w-3xl mx-auto p-8 bg-white shadow-xl rounded-md">
      <div className="text-center mb-8">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-[#C9A449]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h2 className="font-heading text-2xl mt-4 text-[#080808]">Request Submitted Successfully</h2>
        <p className="text-[#444444] mt-2">Your tattoo request has been received. We'll review it and get back to you within 2-3 business days.</p>
      </div>
      
      <div className="border border-[#444444]/20 p-6 rounded-md mb-6 bg-white/50">
        <h3 className="font-heading text-lg mb-4 text-[#080808]">Request Details</h3>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <p className="text-[#444444] text-sm">Reference Number</p>
            <p className="font-bold text-[#080808]">{response.id}</p>
          </div>
          <div>
            <p className="text-[#444444] text-sm">Description</p>
            <p className="text-[#080808]">{response.description}</p>
          </div>
          <div>
            <p className="text-[#444444] text-sm">Tracking Code</p>
            <p className="font-bold text-[#080808]">{response.trackingToken || 'N/A'}</p>
          </div>
        </div>
      </div>
      
      <div className="bg-[#f8f8f8] p-5 rounded-md mb-6 border-l-4 border-[#C9A449]">
        <h4 className="font-heading text-sm mb-2 text-[#080808]">What happens next?</h4>
        <ol className="list-decimal pl-5 text-sm text-[#444444] space-y-1">
          <li>Our artists will review your request within 2-3 business days</li>
          <li>You'll receive an email with initial feedback and next steps</li>
          <li>If your design is accepted, we'll request a deposit to begin the design process</li>
          <li>After the design is finalized, we'll schedule your tattoo appointment</li>
        </ol>
      </div>
      
      <div className="text-center">
        <button
          type="button"
          onClick={resetForm}
          className="btn btn-outline border-[#C9A449] text-[#C9A449] hover:bg-[#C9A449] hover:text-white"
        >
          Submit Another Request
        </button>
      </div>
    </div>
  );
};

export default TattooRequestSuccess;
