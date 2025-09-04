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
    <div className="space-y-8">
      {/* Reference Images Section */}
      <div className="form-control">
        <label className="flex justify-between items-center pb-3">
          <div className="flex items-center gap-2">
            <span className="font-body text-white/90 font-medium text-sm tracking-wide">Reference Images</span>
            <span className="font-body text-white/60 text-xs">(Optional)</span>
          </div>
          <div className="relative inline-block">
            <button 
              type="button"
              onClick={() => toggleTooltip('images')}
              className="text-[#C9A449] hover:text-[#C9A449]/80 focus:outline-none transition-colors duration-300 p-1"
            >
              <IoInformationCircleOutline size={18} />
            </button>
            {showTooltip === 'images' && (
              <div className="absolute z-20 w-72 p-4 bg-[#080808]/95 backdrop-blur-sm shadow-xl rounded-md border border-[#C9A449]/30 text-sm text-white/80 -right-2 top-8">
                <div className="font-body leading-relaxed">
                  <p className="mb-2">Reference images help our artists understand your vision:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Similar tattoos you admire</li>
                    <li>Art styles or imagery</li>
                    <li>Color palettes</li>
                    <li>Specific elements or details</li>
                  </ul>
                  <p className="mt-2 text-xs text-white/60">Supports JPG, PNG, GIF • Max 10MB per file</p>
                </div>
                <div className="absolute -top-2 right-2.5 w-3 h-3 bg-[#080808]/95 border-t border-l border-[#C9A449]/30 transform rotate-45"></div>
              </div>
            )}
          </div>
        </label>
        <div className="border border-white/20 rounded-md bg-[#080808]/30 backdrop-blur-sm overflow-hidden">
          <ImageUpload 
            onImagesSelected={handleImageUpload} 
            existingImages={formData.referenceImages}
            maxImages={5}
            maxFileSize={10 * 1024 * 1024} // 10MB
          />
        </div>
        
        {isUploading && (
          <div className="mt-3 p-4 bg-[#C9A449]/10 border border-[#C9A449]/30 rounded-md">
            <div className="flex items-center text-[#C9A449] font-body text-sm">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-[#C9A449]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="font-medium">Uploading images to our secure server...</span>
            </div>
            <p className="mt-2 text-xs text-white/60 ml-8">This may take a moment for larger files</p>
            {/* Debug info */}
            <div className="mt-2 p-2 bg-black/20 rounded text-xs font-mono text-white/80">
              <div>Upload State: {isUploading ? 'UPLOADING' : 'IDLE'}</div>
              <div>Current Images: {formData.referenceImages?.length || 0}</div>
            </div>
          </div>
        )}

        {formData.referenceImages && formData.referenceImages.length > 0 && !isUploading && (
          <div className="mt-3 p-3 bg-green-900/20 border border-green-500/30 rounded-md">
            <p className="text-green-400 text-xs font-body">
              ✓ {formData.referenceImages.length} image{formData.referenceImages.length > 1 ? 's' : ''} uploaded successfully
            </p>
          </div>
        )}
      </div>

      {/* Visual Separator */}
      <div className="flex items-center justify-center my-8">
        <div className="w-16 h-px bg-gradient-to-r from-transparent via-[#C9A449]/40 to-transparent"></div>
        <div className="mx-4 w-1.5 h-1.5 bg-[#C9A449]/60 rounded-full"></div>
        <div className="w-16 h-px bg-gradient-to-l from-transparent via-[#C9A449]/40 to-transparent"></div>
      </div>
      
      {/* Enhanced Additional Notes Section */}
      <div className="form-control">
        <label className="flex justify-between items-center pb-2">
          <span className="font-body text-white/90 font-medium text-sm tracking-wide">Additional Notes & Details</span>
          <div className="relative inline-block">
            <button 
              type="button"
              onClick={() => toggleTooltip('notes')}
              className="text-[#C9A449] hover:text-[#C9A449]/80 focus:outline-none transition-colors duration-300 p-1"
            >
              <IoInformationCircleOutline size={18} />
            </button>
            {showTooltip === 'notes' && (
              <div className="absolute z-20 w-72 p-4 bg-[#080808]/95 backdrop-blur-sm shadow-xl rounded-md border border-[#C9A449]/30 text-sm text-white/80 -right-2 top-8">
                <div className="font-body leading-relaxed">
                  <p className="mb-2">Use this space for anything else important:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Timeline preferences or deadlines</li>
                    <li>Budget considerations</li>
                    <li>Skin tone or allergy information</li>
                    <li>Previous tattoo experience</li>
                    <li>Special requests or concerns</li>
                  </ul>
                </div>
                <div className="absolute -top-2 right-2.5 w-3 h-3 bg-[#080808]/95 border-t border-l border-[#C9A449]/30 transform rotate-45"></div>
              </div>
            )}
          </div>
        </label>
        <textarea
          name="additionalNotes"
          value={formData.additionalNotes || ''}
          onChange={handleInputChange}
          className="w-full bg-[#080808]/50 border border-white/20 hover:border-white/30 focus:border-[#C9A449] focus:ring-2 focus:ring-[#C9A449]/40 rounded-md font-body text-white placeholder-white/40 backdrop-blur-sm transition-all duration-300 focus:outline-none h-32 p-4 resize-none"
          placeholder="Share any additional details, timeline preferences, budget considerations, skin allergies, or special requests..."
        />
        <p className="text-xs text-white/50 mt-3 ml-1 font-body italic">
          Optional: Include anything else that might help our artists create the perfect tattoo for you.
        </p>
      </div>
      
      {/* Information panel with enhanced styling */}
      <div className="bg-gradient-to-r from-[#C9A449]/10 via-[#C9A449]/5 to-[#C9A449]/10 p-6 rounded-md border border-[#C9A449]/30 mt-8 relative overflow-hidden">
        {/* Ornamental corner elements */}
        <div className="absolute top-0 left-0 w-8 h-8 border-l-2 border-t-2 border-[#C9A449]/40"></div>
        <div className="absolute top-0 right-0 w-8 h-8 border-r-2 border-t-2 border-[#C9A449]/40"></div>
        <div className="absolute bottom-0 left-0 w-8 h-8 border-l-2 border-b-2 border-[#C9A449]/40"></div>
        <div className="absolute bottom-0 right-0 w-8 h-8 border-r-2 border-b-2 border-[#C9A449]/40"></div>
        
        <div className="relative z-10">
          <div className="flex items-center mb-4">
            <div className="w-8 h-[0.5px] bg-gradient-to-r from-transparent to-[#C9A449]/60"></div>
            <h4 className="font-heading text-[#C9A449] font-medium text-base mx-3 tracking-wide">What happens next?</h4>
            <div className="w-8 h-[0.5px] bg-gradient-to-l from-transparent to-[#C9A449]/60"></div>
          </div>
          
          <div className="grid gap-3 sm:gap-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 w-6 h-6 bg-[#C9A449]/20 rounded-full flex items-center justify-center mr-3 mt-0.5">
                <span className="text-[#C9A449] text-xs font-bold">1</span>
              </div>
              <p className="font-body text-sm text-white/80 leading-relaxed">
                Our artists will review your request within <span className="text-[#C9A449] font-medium">24-48 hours</span>
              </p>
            </div>
            
            <div className="flex items-start">
              <div className="flex-shrink-0 w-6 h-6 bg-[#C9A449]/20 rounded-full flex items-center justify-center mr-3 mt-0.5">
                <span className="text-[#C9A449] text-xs font-bold">2</span>
              </div>
              <p className="font-body text-sm text-white/80 leading-relaxed">
                If your design is accepted, a <span className="text-[#C9A449] font-medium">30% non-refundable deposit</span> will be required
              </p>
            </div>
            
            <div className="flex items-start">
              <div className="flex-shrink-0 w-6 h-6 bg-[#C9A449]/20 rounded-full flex items-center justify-center mr-3 mt-0.5">
                <span className="text-[#C9A449] text-xs font-bold">3</span>
              </div>
              <p className="font-body text-sm text-white/80 leading-relaxed">
                The deposit goes toward the final price • <span className="text-[#C9A449] font-medium">$150 minimum charge</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReferenceImagesStep; 