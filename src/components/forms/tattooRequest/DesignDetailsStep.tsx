import React, { useState } from 'react';
import { IoInformationCircleOutline } from 'react-icons/io5';
import { TATTOO_SIZES, TATTOO_STYLES, COLOR_PREFERENCES } from '../../../app-data/tattooFormData';
import { TattooFormData, ValidationErrors } from '../../../hooks/useTattooRequestForm';

interface DesignDetailsStepProps {
  formData: TattooFormData;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  validationErrors?: ValidationErrors;
}

const DesignDetailsStep: React.FC<DesignDetailsStepProps> = ({ 
  formData, 
  handleInputChange, 
  validationErrors 
}) => {
  const [showTooltip, setShowTooltip] = useState<string | null>(null);
  
  const toggleTooltip = (id: string) => {
    setShowTooltip(showTooltip === id ? null : id);
  };
  
  return (
    <div className="space-y-8">
      <div className="form-control">
        <label className="label pb-2 flex justify-between">
          <span className="label-text text-[#080808] font-semibold text-sm">Description<span className="text-red-500 ml-1">*</span></span>
          <div className="relative inline-block">
            <button 
              type="button"
              onClick={() => toggleTooltip('description')}
              className="text-[#C9A449] hover:text-[#C9A449]/80 focus:outline-none transition-colors duration-200"
            >
              <IoInformationCircleOutline size={20} />
            </button>
            {showTooltip === 'description' && (
              <div className="absolute z-10 w-72 p-4 bg-white shadow-xl rounded-md border border-[#444444]/20 text-sm text-[#444444] -right-2 top-7">
                Be as specific as possible! Include the main elements, meanings, and any specific details that are important to you.
                <div className="absolute -top-2 right-2.5 w-3 h-3 bg-white border-t border-l border-[#444444]/20 transform rotate-45"></div>
              </div>
            )}
          </div>
        </label>
        <textarea
          name="description"
          value={formData.description || ''}
          onChange={handleInputChange}
          required
          className={`textarea textarea-bordered w-full bg-gray-50 border-[#444444]/20 focus:border-[#C9A449] focus:ring-2 focus:ring-[#C9A449]/20 h-40 rounded-md text-[#080808] ${
            validationErrors?.description ? 'border-red-500' : ''
          }`}
          placeholder="Describe your tattoo idea in detail..."
        />
        {validationErrors?.description && (
          <p className="text-red-500 text-xs mt-2">{validationErrors.description}</p>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="form-control">
          <label className="label pb-2 flex justify-between">
            <span className="label-text text-[#080808] font-semibold text-sm">Placement<span className="text-red-500 ml-1">*</span></span>
            <div className="relative inline-block">
              <button 
                type="button"
                onClick={() => toggleTooltip('placement')}
                className="text-[#C9A449] hover:text-[#C9A449]/80 focus:outline-none transition-colors duration-200"
              >
                <IoInformationCircleOutline size={20} />
              </button>
              {showTooltip === 'placement' && (
                <div className="absolute z-10 w-72 p-4 bg-white shadow-xl rounded-md border border-[#444444]/20 text-sm text-[#444444] -right-2 top-7">
                  Where on your body would you like the tattoo? Be as specific as possible (e.g., "inner left forearm" instead of just "arm").
                  <div className="absolute -top-2 right-2.5 w-3 h-3 bg-white border-t border-l border-[#444444]/20 transform rotate-45"></div>
                </div>
              )}
            </div>
          </label>
          <input
            type="text"
            name="placement"
            value={formData.placement || ''}
            onChange={handleInputChange}
            required
            className={`input input-bordered w-full h-12 bg-gray-50 border-[#444444]/20 focus:border-[#C9A449] focus:ring-2 focus:ring-[#C9A449]/20 rounded-md text-[#080808] ${
              validationErrors?.placement ? 'border-red-500' : ''
            }`}
            placeholder="Forearm, back, shoulder, etc."
          />
          {validationErrors?.placement && (
            <p className="text-red-500 text-xs mt-2">{validationErrors.placement}</p>
          )}
        </div>
        
        <div className="form-control">
          <label className="label pb-2">
            <span className="label-text text-[#080808] font-semibold text-sm">Size<span className="text-red-500 ml-1">*</span></span>
          </label>
          <select
            name="size"
            value={formData.size || ''}
            onChange={handleInputChange}
            required
            className={`select select-bordered w-full h-12 bg-gray-50 border-[#444444]/20 focus:border-[#C9A449] focus:ring-2 focus:ring-[#C9A449]/20 rounded-md text-[#080808] ${
              validationErrors?.size ? 'border-red-500' : ''
            }`}
          >
            <option value="">Select size...</option>
            {TATTOO_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
          {validationErrors?.size && (
            <p className="text-red-500 text-xs mt-2">{validationErrors.size}</p>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="form-control">
          <label className="label pb-2">
            <span className="label-text text-[#080808] font-semibold text-sm">Color Preference</span>
          </label>
          <select
            name="colorPreference"
            value={formData.colorPreference || ''}
            onChange={handleInputChange}
            className="select select-bordered w-full h-12 bg-gray-50 border-[#444444]/20 focus:border-[#C9A449] focus:ring-2 focus:ring-[#C9A449]/20 rounded-md text-[#080808]"
          >
            <option value="">Select color preference...</option>
            {COLOR_PREFERENCES.map((color) => (
              <option key={color} value={color}>
                {color}
              </option>
            ))}
          </select>
        </div>
        
        <div className="form-control">
          <label className="label pb-2">
            <span className="label-text text-[#080808] font-semibold text-sm">Style</span>
          </label>
          <select
            name="style"
            value={formData.style || ''}
            onChange={handleInputChange}
            className="select select-bordered w-full h-12 bg-gray-50 border-[#444444]/20 focus:border-[#C9A449] focus:ring-2 focus:ring-[#C9A449]/20 rounded-md text-[#080808]"
          >
            <option value="">Select style...</option>
            {TATTOO_STYLES.map((style) => (
              <option key={style} value={style}>
                {style}
              </option>
            ))}
            <option value="other">Other (please describe in &quot;design description&quot; or &quot;reference&quot;)</option>
          </select>
        </div>
      </div>
      
      <div className="form-control mt-8">
        <label className="label pb-3">
          <span className="label-text text-[#080808] font-semibold text-sm">Additional Notes</span>
        </label>
        <textarea
          name="additionalNotes"
          value={formData.additionalNotes || ''}
          onChange={handleInputChange}
          className="textarea textarea-bordered w-full bg-gray-50 border-[#444444]/20 focus:border-[#C9A449] focus:ring-2 focus:ring-[#C9A449]/20 h-36 rounded-md text-[#080808]"
          placeholder="Any other details you'd like to share..."
        />
        <p className="text-xs text-[#444444]/70 mt-3 ml-1">
          Optional: Use this space for any additional information that might help our artists understand your request.
        </p>
      </div>
    </div>
  );
};

export default DesignDetailsStep; 