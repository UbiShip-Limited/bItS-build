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
        <label className="flex justify-between items-center pb-2">
          <span className="font-body text-white/90 font-medium text-sm tracking-wide">
            Description<span className="text-red-400 ml-1">*</span>
          </span>
          <div className="relative inline-block">
            <button 
              type="button"
              onClick={() => toggleTooltip('description')}
              className="text-[#C9A449] hover:text-[#C9A449]/80 focus:outline-none transition-colors duration-300 p-1"
            >
              <IoInformationCircleOutline size={18} />
            </button>
            {showTooltip === 'description' && (
              <div className="absolute z-20 w-72 p-4 bg-[#080808]/95 backdrop-blur-sm shadow-xl rounded-md border border-[#C9A449]/30 text-sm text-white/80 -right-2 top-8">
                <div className="font-body leading-relaxed">
                  Be as specific as possible! Include the main elements, meanings, and any specific details that are important to you.
                </div>
                <div className="absolute -top-2 right-2.5 w-3 h-3 bg-[#080808]/95 border-t border-l border-[#C9A449]/30 transform rotate-45"></div>
              </div>
            )}
          </div>
        </label>
        <textarea
          name="description"
          value={formData.description || ''}
          onChange={handleInputChange}
          required
          className={`w-full bg-[#080808]/50 border rounded-md font-body text-white placeholder-white/40 backdrop-blur-sm transition-all duration-300 focus:outline-none focus:ring-2 h-40 p-4 resize-none ${
            validationErrors?.description 
              ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/30' 
              : 'border-white/20 hover:border-white/30 focus:border-[#C9A449] focus:ring-[#C9A449]/40'
          }`}
          placeholder="Describe your tattoo idea in detail..."
        />
        {validationErrors?.description && (
          <p className="text-red-400 text-xs mt-2 font-body">{validationErrors.description}</p>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
        <div className="form-control">
          <label className="flex justify-between items-center pb-2">
            <span className="font-body text-white/90 font-medium text-sm tracking-wide">
              Placement<span className="text-red-400 ml-1">*</span>
            </span>
            <div className="relative inline-block">
              <button 
                type="button"
                onClick={() => toggleTooltip('placement')}
                className="text-[#C9A449] hover:text-[#C9A449]/80 focus:outline-none transition-colors duration-300 p-1"
              >
                <IoInformationCircleOutline size={18} />
              </button>
              {showTooltip === 'placement' && (
                <div className="absolute z-20 w-72 p-4 bg-[#080808]/95 backdrop-blur-sm shadow-xl rounded-md border border-[#C9A449]/30 text-sm text-white/80 -right-2 top-8">
                  <div className="font-body leading-relaxed">
                    Where on your body would you like the tattoo? Be as specific as possible (e.g., "inner left forearm" instead of just "arm").
                  </div>
                  <div className="absolute -top-2 right-2.5 w-3 h-3 bg-[#080808]/95 border-t border-l border-[#C9A449]/30 transform rotate-45"></div>
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
            className={`w-full h-12 bg-[#080808]/50 border rounded-md font-body text-white placeholder-white/40 backdrop-blur-sm transition-all duration-300 focus:outline-none focus:ring-2 px-4 ${
              validationErrors?.placement 
                ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/30' 
                : 'border-white/20 hover:border-white/30 focus:border-[#C9A449] focus:ring-[#C9A449]/40'
            }`}
            placeholder="Forearm, back, shoulder, etc."
          />
          {validationErrors?.placement && (
            <p className="text-red-400 text-xs mt-2 font-body">{validationErrors.placement}</p>
          )}
        </div>
        
        <div className="form-control">
          <label className="block pb-2">
            <span className="font-body text-white/90 font-medium text-sm tracking-wide">
              Size<span className="text-red-400 ml-1">*</span>
            </span>
          </label>
          <select
            name="size"
            value={formData.size || ''}
            onChange={handleInputChange}
            required
            className={`w-full h-12 bg-[#080808]/50 border rounded-md font-body text-white placeholder-white/40 backdrop-blur-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#C9A449]/40 focus:border-[#C9A449] ${
              validationErrors?.size 
                ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/30' 
                : 'border-white/20 hover:border-white/30'
            }`}
          >
            <option value="" className="bg-[#080808] text-white/80">Select size...</option>
            {TATTOO_SIZES.map((size) => (
              <option key={size} value={size} className="bg-[#080808] text-white">
                {size}
              </option>
            ))}
          </select>
          {validationErrors?.size && (
            <p className="text-red-400 text-xs mt-2 font-body">{validationErrors.size}</p>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
        <div className="form-control">
          <label className="block pb-2">
            <span className="font-body text-white/90 font-medium text-sm tracking-wide">Color Preference</span>
          </label>
          <select
            name="colorPreference"
            value={formData.colorPreference || ''}
            onChange={handleInputChange}
            className="w-full h-12 bg-[#080808]/50 border border-white/20 hover:border-white/30 focus:border-[#C9A449] focus:ring-2 focus:ring-[#C9A449]/40 rounded-md font-body text-white placeholder-white/40 backdrop-blur-sm transition-all duration-300 focus:outline-none"
          >
            <option value="" className="bg-[#080808] text-white/80">Select color preference...</option>
            {COLOR_PREFERENCES.map((color) => (
              <option key={color} value={color} className="bg-[#080808] text-white">
                {color}
              </option>
            ))}
          </select>
        </div>
        
        <div className="form-control">
          <label className="block pb-2">
            <span className="font-body text-white/90 font-medium text-sm tracking-wide">Style</span>
          </label>
          <select
            name="style"
            value={formData.style || ''}
            onChange={handleInputChange}
            className="w-full h-12 bg-[#080808]/50 border border-white/20 hover:border-white/30 focus:border-[#C9A449] focus:ring-2 focus:ring-[#C9A449]/40 rounded-md font-body text-white placeholder-white/40 backdrop-blur-sm transition-all duration-300 focus:outline-none"
          >
            <option value="" className="bg-[#080808] text-white/80">Select style...</option>
            {TATTOO_STYLES.map((style) => (
              <option key={style} value={style} className="bg-[#080808] text-white">
                {style}
              </option>
            ))}
            <option value="other" className="bg-[#080808] text-white">Other (please describe in "design description" or "reference")</option>
          </select>
        </div>
      </div>
      
      <div className="form-control mt-8">
        <label className="block pb-3">
          <span className="font-body text-white/90 font-medium text-sm tracking-wide">Additional Notes</span>
        </label>
        <textarea
          name="additionalNotes"
          value={formData.additionalNotes || ''}
          onChange={handleInputChange}
          className="w-full bg-[#080808]/50 border border-white/20 hover:border-white/30 focus:border-[#C9A449] focus:ring-2 focus:ring-[#C9A449]/40 rounded-md font-body text-white placeholder-white/40 backdrop-blur-sm transition-all duration-300 focus:outline-none h-36 p-4 resize-none"
          placeholder="Any other details you'd like to share..."
        />
        <p className="text-xs text-white/50 mt-3 ml-1 font-body italic">
          Optional: Use this space for any additional information that might help our artists understand your request.
        </p>
      </div>
    </div>
  );
};

export default DesignDetailsStep; 