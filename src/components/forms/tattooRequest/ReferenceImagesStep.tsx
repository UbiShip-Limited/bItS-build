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
        <label className="label pb-2">
          <span className="label-text text-[#080808] font-semibold text-sm">Reference Images</span>
          <div className="relative inline-block">
            <button 
              type="button"
              onClick={() => toggleTooltip('images')}
              className="text-[#C9A449] hover:text-[#C9A449]/80 focus:outline-none"
            >
              <IoInformationCircleOutline size={20} />
            </button>
            {showTooltip === 'images' && (
              <div className="absolute z-10 w-64 p-3 bg-white shadow-lg rounded-md border border-[#444444]/20 text-xs text-[#444444] -right-2 top-6">
                Images that inspire your tattoo help our artists understand your vision. You can upload photos of similar tattoos, artwork, or anything that represents your idea.
                <div className="tooltip-arrow"></div>
              </div>
            )}
          </div>
        </label>
        <ImageUpload 
          onImagesSelected={handleImageUpload} 
          existingImages={formData.referenceImages}
        />
        
        {isUploading && (
          <div className="mt-2 flex items-center text-[#444444]">
            <span className="loading loading-spinner loading-sm mr-2"></span>
            Uploading images...
          </div>
        )}
      </div>
      <div className="form-control">
        <label className="label pb-2">
          <span className="label-text text-[#080808] font-semibold text-sm">Additional Notes</span>
        </label>
        <textarea
          name="additionalNotes"
          value={formData.additionalNotes || ''}
          onChange={handleInputChange}
          className="textarea textarea-bordered w-full bg-gray-50 border-[#444444]/20 focus:border-[#C9A449] focus:ring-2 focus:ring-[#C9A449]/20 h-24 rounded-md text-[#080808] resize-none"
          placeholder="Any other details you'd like to share..."
        />
      </div>
      
      <div className="bg-[#f8f8f8] p-4 rounded-md border-l-4 border-[#C9A449] mt-6">
        <h4 className="text-[#080808] font-medium text-sm mb-2">What happens after submission?</h4>
        <ul className="text-xs text-[#444444] space-y-1">
          <li>• Our artists will review your request within 2-3 business days</li>
          <li>• If your design is accepted, a 30% non-refundable deposit will be required</li>
          <li>• The deposit goes toward the final price of your tattoo</li>
          <li>• Our minimum charge for tattoos is $150</li>
        </ul>
      </div>
    </div>
  );
};

export default ReferenceImagesStep; 