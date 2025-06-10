import React, { useState } from 'react';
import { IoInformationCircleOutline } from 'react-icons/io5';
import ImageUpload from '../../ui/ImageUpload';
import { TattooFormData } from '../../../hooks/useTattooRequestForm';

interface ReferenceImagesStepProps {
  formData: TattooFormData;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  handleImageUpload: (images: Array<{ url: string; file: File; publicId?: string }>) => void;
  isUploading: boolean;
}

const ReferenceImagesStep: React.FC<ReferenceImagesStepProps> = ({ 
  formData, 
  handleInputChange, 
  handleImageUpload,
  isUploading
}) => {
  const [showTooltip, setShowTooltip] = useState<string | null>(null);
  
  const toggleTooltip = (id: string) => {
    setShowTooltip(showTooltip === id ? null : id);
  };
  
  return (
    <div className="space-y-6">
      <div className="form-control">
        <label className="flex justify-between items-center pb-3">
          <span className="font-body text-white/90 font-medium text-sm tracking-wide">Reference Images</span>
          <div className="relative inline-block">
            <button 
              type="button"
              onClick={() => toggleTooltip('images')}
              className="text-[#C9A449] hover:text-[#C9A449]/80 focus:outline-none transition-colors duration-300 p-1"
            >
              <IoInformationCircleOutline size={18} />
            </button>
            {showTooltip === 'images' && (
              <div className="absolute z-20 w-64 p-4 bg-[#080808]/95 backdrop-blur-sm shadow-xl rounded-md border border-[#C9A449]/30 text-sm text-white/80 -right-2 top-8">
                <div className="font-body leading-relaxed">
                  Images that inspire your tattoo help our artists understand your vision. You can upload photos of similar tattoos, artwork, or anything that represents your idea.
                </div>
                <div className="absolute -top-2 right-2.5 w-3 h-3 bg-[#080808]/95 border-t border-l border-[#C9A449]/30 transform rotate-45"></div>
              </div>
            )}
          </div>
        </label>
        <div className="border border-white/20 rounded-md bg-[#080808]/30 backdrop-blur-sm">
          <ImageUpload 
            onImagesSelected={handleImageUpload} 
            existingImages={formData.referenceImages}
          />
        </div>
        
        {isUploading && (
          <div className="mt-3 flex items-center text-[#C9A449]/80 font-body text-sm">
            <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-[#C9A449]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Uploading images...
          </div>
        )}
      </div>
      
      <div className="form-control">
        <label className="block pb-2">
          <span className="font-body text-white/90 font-medium text-sm tracking-wide">Additional Notes</span>
        </label>
        <textarea
          name="additionalNotes"
          value={formData.additionalNotes || ''}
          onChange={handleInputChange}
          className="w-full bg-[#080808]/50 border border-white/20 hover:border-white/30 focus:border-[#C9A449] focus:ring-2 focus:ring-[#C9A449]/40 rounded-md font-body text-white placeholder-white/40 backdrop-blur-sm transition-all duration-300 focus:outline-none h-24 p-4 resize-none"
          placeholder="Any other details you'd like to share..."
        />
      </div>
      
      {/* Information panel with ornamental styling */}
      <div className="bg-gradient-to-r from-[#C9A449]/10 via-[#C9A449]/5 to-[#C9A449]/10 p-6 rounded-md border border-[#C9A449]/30 mt-8 relative overflow-hidden">
        {/* Ornamental corner elements */}
        <div className="absolute top-0 left-0 w-8 h-8 border-l-2 border-t-2 border-[#C9A449]/40"></div>
        <div className="absolute top-0 right-0 w-8 h-8 border-r-2 border-t-2 border-[#C9A449]/40"></div>
        <div className="absolute bottom-0 left-0 w-8 h-8 border-l-2 border-b-2 border-[#C9A449]/40"></div>
        <div className="absolute bottom-0 right-0 w-8 h-8 border-r-2 border-b-2 border-[#C9A449]/40"></div>
        
        <div className="relative z-10">
          <div className="flex items-center mb-3">
            <div className="w-8 h-[0.5px] bg-gradient-to-r from-transparent to-[#C9A449]/60"></div>
            <h4 className="font-heading text-[#C9A449] font-medium text-base mx-3 tracking-wide">What happens next?</h4>
            <div className="w-8 h-[0.5px] bg-gradient-to-l from-transparent to-[#C9A449]/60"></div>
          </div>
          
          <ul className="space-y-2 font-body text-sm text-white/80 leading-relaxed">
            <li className="flex items-start">
              <span className="text-[#C9A449] mr-3 mt-1 text-xs">•</span>
              Our artists will review your request within 24-48 hours
            </li>
            <li className="flex items-start">
              <span className="text-[#C9A449] mr-3 mt-1 text-xs">•</span>
              If your design is accepted, a 30% non-refundable deposit will be required
            </li>
            <li className="flex items-start">
              <span className="text-[#C9A449] mr-3 mt-1 text-xs">•</span>
              The deposit goes toward the final price of your tattoo
            </li>
            <li className="flex items-start">
              <span className="text-[#C9A449] mr-3 mt-1 text-xs">•</span>
              Our minimum charge for tattoos is $150
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ReferenceImagesStep; 