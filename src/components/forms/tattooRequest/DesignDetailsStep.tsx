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
  const [charCount, setCharCount] = useState(formData.description?.length || 0);
  
  const toggleTooltip = (id: string) => {
    setShowTooltip(showTooltip === id ? null : id);
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCharCount(e.target.value.length);
    handleInputChange(e);
  };
  
  return (
    <div className="space-y-8">
      {/* Design Description Section */}
      <div className="form-control">
        <label className="flex justify-between items-center pb-2">
          <span className="font-body text-white/90 font-medium text-sm tracking-wide">
            Design Description<span className="text-red-400 ml-1">*</span>
          </span>
          <div className="flex items-center gap-3">
            <span className={`text-xs font-body transition-colors duration-300 ${
              charCount < 10 ? 'text-red-400' : charCount >= 10 ? 'text-green-400' : 'text-white/60'
            }`}>
              {charCount}/10+ chars
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
                    <p className="mb-2">Be as specific as possible! Include:</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>Main elements and imagery</li>
                      <li>Style preferences</li>
                      <li>Meaningful details</li>
                      <li>Size considerations</li>
                    </ul>
                  </div>
                  <div className="absolute -top-2 right-2.5 w-3 h-3 bg-[#080808]/95 border-t border-l border-[#C9A449]/30 transform rotate-45"></div>
                </div>
              )}
            </div>
          </div>
        </label>
        <textarea
          name="description"
          value={formData.description || ''}
          onChange={handleDescriptionChange}
          required
          className={`w-full bg-[#080808]/30 border rounded-xl font-body text-white placeholder-white/30 backdrop-blur-sm transition-all duration-300 focus:outline-none focus:ring-2 h-40 p-4 resize-none ${
            validationErrors?.description 
              ? 'border-red-500/40 focus:border-red-500 focus:ring-red-500/20' 
              : charCount >= 10
                ? 'border-green-500/30 focus:border-[#C9A449]/60 focus:ring-[#C9A449]/30'
                : 'border-white/10 hover:border-white/20 focus:border-[#C9A449]/60 focus:ring-[#C9A449]/30'
          }`}
          placeholder="Describe your tattoo vision in detail... What elements do you want? What style appeals to you? Any meaningful symbolism?"
        />
        {validationErrors?.description && (
          <p className="text-red-400 text-xs mt-2 font-body">{validationErrors.description}</p>
        )}
        {charCount >= 10 && !validationErrors?.description && (
          <p className="text-green-400 text-xs mt-2 font-body">✓ Great detail! This helps our artists understand your vision.</p>
        )}
      </div>

      {/* Visual Separator */}
      <div className="flex items-center justify-center my-6 sm:my-8">
        <div className="w-12 sm:w-16 h-[1px] bg-gradient-to-r from-transparent via-[#C9A449]/30 to-transparent"></div>
        <div className="mx-3 sm:mx-4 relative">
          <div className="w-1.5 h-1.5 bg-[#C9A449]/50 rounded-full"></div>
          <div className="absolute inset-0 bg-[#C9A449]/20 rounded-full blur-sm scale-[2] animate-pulse"></div>
        </div>
        <div className="w-12 sm:w-16 h-[1px] bg-gradient-to-l from-transparent via-[#C9A449]/30 to-transparent"></div>
      </div>
      
      {/* Placement & Size Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
        <div className="form-control">
          <label className="flex justify-between items-center pb-2">
            <span className="font-body text-white/90 font-medium text-sm tracking-wide">
              Body Placement<span className="text-red-400 ml-1">*</span>
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
                    <p className="mb-2">Be specific about location:</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>"Inner left forearm" vs just "arm"</li>
                      <li>"Behind right ear" vs "ear area"</li>
                      <li>"Upper back between shoulders"</li>
                    </ul>
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
            className={`w-full h-12 bg-[#080808]/30 border rounded-xl font-body text-white placeholder-white/30 backdrop-blur-sm transition-all duration-300 focus:outline-none focus:ring-2 px-4 ${
              validationErrors?.placement 
                ? 'border-red-500/40 focus:border-red-500 focus:ring-red-500/20' 
                : 'border-white/10 hover:border-white/20 focus:border-[#C9A449]/60 focus:ring-[#C9A449]/30'
            }`}
            placeholder="e.g., Inner left forearm, behind right ear..."
          />
          {validationErrors?.placement && (
            <p className="text-red-400 text-xs mt-2 font-body">{validationErrors.placement}</p>
          )}
        </div>
        
        <div className="form-control">
          <label className="block pb-2">
            <span className="font-body text-white/90 font-medium text-sm tracking-wide">
              Approximate Size<span className="text-red-400 ml-1">*</span>
            </span>
          </label>
          <select
            name="size"
            value={formData.size || ''}
            onChange={handleInputChange}
            required
            className={`w-full h-12 bg-[#080808]/30 border rounded-xl font-body text-white placeholder-white/30 backdrop-blur-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#C9A449]/30 focus:border-[#C9A449]/60 px-4 ${
              validationErrors?.size 
                ? 'border-red-500/40 focus:border-red-500 focus:ring-red-500/20' 
                : 'border-white/10 hover:border-white/20'
            }`}
          >
            <option value="" className="bg-[#080808] text-white/80">Select size range...</option>
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

      {/* Visual Separator */}
      <div className="flex items-center justify-center my-6 sm:my-8">
        <div className="w-12 sm:w-16 h-[1px] bg-gradient-to-r from-transparent via-[#C9A449]/30 to-transparent"></div>
        <div className="mx-3 sm:mx-4 relative">
          <div className="w-1.5 h-1.5 bg-[#C9A449]/50 rounded-full"></div>
          <div className="absolute inset-0 bg-[#C9A449]/20 rounded-full blur-sm scale-[2] animate-pulse"></div>
        </div>
        <div className="w-12 sm:w-16 h-[1px] bg-gradient-to-l from-transparent via-[#C9A449]/30 to-transparent"></div>
      </div>
      
      {/* Style & Color Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
        <div className="form-control">
          <label className="block pb-2">
            <span className="font-body text-white/90 font-medium text-sm tracking-wide">Color Preference</span>
          </label>
          <select
            name="colorPreference"
            value={formData.colorPreference || ''}
            onChange={handleInputChange}
            className="w-full h-12 bg-[#080808]/30 border border-white/10 hover:border-white/20 focus:border-[#C9A449]/60 focus:ring-2 focus:ring-[#C9A449]/30 rounded-xl font-body text-white placeholder-white/30 backdrop-blur-sm transition-all duration-300 focus:outline-none px-4"
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
            <span className="font-body text-white/90 font-medium text-sm tracking-wide">Tattoo Style</span>
          </label>
          <select
            name="style"
            value={formData.style || ''}
            onChange={handleInputChange}
            className="w-full h-12 bg-[#080808]/30 border border-white/10 hover:border-white/20 focus:border-[#C9A449]/60 focus:ring-2 focus:ring-[#C9A449]/30 rounded-xl font-body text-white placeholder-white/30 backdrop-blur-sm transition-all duration-300 focus:outline-none px-4"
          >
            <option value="" className="bg-[#080808] text-white/80">Select style preference...</option>
            {TATTOO_STYLES.map((style) => (
              <option key={style} value={style} className="bg-[#080808] text-white">
                {style}
              </option>
            ))}
            <option value="other" className="bg-[#080808] text-white">Other (please describe in references)</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default DesignDetailsStep; 