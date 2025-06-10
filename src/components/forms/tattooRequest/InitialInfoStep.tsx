import React, { useState } from 'react';
import { TATTOO_PURPOSES, TIMEFRAMES } from '../../../app-data/tattooFormData';
import { TattooFormData, ValidationErrors } from '../../../hooks/useTattooRequestForm';

interface InitialInfoStepProps {
  formData: TattooFormData;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  validationErrors?: ValidationErrors;
}

const InitialInfoStep: React.FC<InitialInfoStepProps> = ({ 
  formData, 
  handleInputChange, 
  validationErrors 
}) => {
  return (
    <div className="space-y-8">
      <div className="form-control">
        <label className="block pb-2">
          <span className="font-body text-white/90 font-medium text-sm tracking-wide">
            Request Purpose<span className="text-red-400 ml-1">*</span>
          </span>
        </label>
        <select
          name="purpose"
          value={formData.purpose || ''}
          onChange={handleInputChange}
          required
          className={`w-full h-12 bg-[#080808]/50 border rounded-md font-body text-white placeholder-white/40 backdrop-blur-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#C9A449]/40 focus:border-[#C9A449] ${
            validationErrors?.purpose 
              ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/30' 
              : 'border-white/20 hover:border-white/30'
          }`}
        >
          <option value="" className="bg-[#080808] text-white/80">Select purpose...</option>
          {TATTOO_PURPOSES.map((purpose) => (
            <option key={purpose} value={purpose} className="bg-[#080808] text-white">
              {purpose}
            </option>
          ))}
        </select>
        {validationErrors?.purpose && (
          <p className="text-red-400 text-xs mt-2 font-body">{validationErrors.purpose}</p>
        )}
      </div>
      
      <div className="form-control">
        <label className="block pb-2">
          <span className="font-body text-white/90 font-medium text-sm tracking-wide">Preferred Artist (Optional)</span>
        </label>
        <input
          type="text"
          name="preferredArtist"
          value={formData.preferredArtist || ''}
          onChange={handleInputChange}
          className="w-full h-12 bg-[#080808]/50 border border-white/20 hover:border-white/30 focus:border-[#C9A449] focus:ring-2 focus:ring-[#C9A449]/40 rounded-md font-body text-white placeholder-white/40 backdrop-blur-sm transition-all duration-300 focus:outline-none px-4"
          placeholder="Leave blank if no preference"
        />
      </div>
      
      <div className="form-control">
        <label className="block pb-2">
          <span className="font-body text-white/90 font-medium text-sm tracking-wide">Timeframe</span>
        </label>
        <select
          name="timeframe"
          value={formData.timeframe || ''}
          onChange={handleInputChange}
          className="w-full h-12 bg-[#080808]/50 border border-white/20 hover:border-white/30 focus:border-[#C9A449] focus:ring-2 focus:ring-[#C9A449]/40 rounded-md font-body text-white placeholder-white/40 backdrop-blur-sm transition-all duration-300 focus:outline-none"
        >
          <option value="" className="bg-[#080808] text-white/80">Select timeframe...</option>
          {TIMEFRAMES.map((timeframe) => (
            <option key={timeframe} value={timeframe} className="bg-[#080808] text-white">
              {timeframe}
            </option>
          ))}
        </select>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
        <div className="form-control">
          <label className="block pb-2">
            <span className="font-body text-white/90 font-medium text-sm tracking-wide">
              Email<span className="text-red-400 ml-1">*</span>
            </span>
          </label>
          <input
            type="email"
            name="contactEmail"
            value={formData.contactEmail || ''}
            onChange={handleInputChange}
            required
            className={`w-full h-12 bg-[#080808]/50 border rounded-md font-body text-white placeholder-white/40 backdrop-blur-sm transition-all duration-300 focus:outline-none focus:ring-2 px-4 ${
              validationErrors?.contactEmail 
                ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/30' 
                : 'border-white/20 hover:border-white/30 focus:border-[#C9A449] focus:ring-[#C9A449]/40'
            }`}
            placeholder="your.email@example.com"
          />
          {validationErrors?.contactEmail && (
            <p className="text-red-400 text-xs mt-2 font-body">{validationErrors.contactEmail}</p>
          )}
        </div>
        
        <div className="form-control">
          <label className="block pb-2">
            <span className="font-body text-white/90 font-medium text-sm tracking-wide">Phone</span>
          </label>
          <input
            type="tel"
            name="contactPhone"
            value={formData.contactPhone || ''}
            onChange={handleInputChange}
            className="w-full h-12 bg-[#080808]/50 border border-white/20 hover:border-white/30 focus:border-[#C9A449] focus:ring-2 focus:ring-[#C9A449]/40 rounded-md font-body text-white placeholder-white/40 backdrop-blur-sm transition-all duration-300 focus:outline-none px-4"
            placeholder="(123) 456-7890"
          />
        </div>
      </div>
      
      <div className="form-control mt-2">
        <label className="block pb-3">
          <span className="font-body text-white/90 font-medium text-sm tracking-wide">Preferred Contact Method</span>
        </label>
        <div className="flex flex-wrap gap-3 sm:gap-4 mt-1">
          <label className={`flex items-center gap-3 px-4 sm:px-5 py-2.5 rounded-md border cursor-pointer transition-all duration-300 hover:border-[#C9A449]/50 ${
            formData.contactPreference === 'email' 
              ? 'bg-[#C9A449]/10 border-[#C9A449] shadow-md shadow-[#C9A449]/20' 
              : 'bg-[#080808]/30 border-white/20 hover:bg-[#080808]/50'
          }`}>
            <input 
              type="radio" 
              name="contactPreference" 
              value="email"
              checked={formData.contactPreference === 'email'}
              onChange={handleInputChange}
              className="sr-only" 
            />
            <div className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${
              formData.contactPreference === 'email' 
                ? 'border-[#C9A449] bg-[#C9A449]' 
                : 'border-white/40'
            }`}>
              {formData.contactPreference === 'email' && (
                <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
              )}
            </div>
            <span className="font-body text-white/90 text-sm">Email</span>
          </label>
          
          <label className={`flex items-center gap-3 px-4 sm:px-5 py-2.5 rounded-md border cursor-pointer transition-all duration-300 hover:border-[#C9A449]/50 ${
            formData.contactPreference === 'phone' 
              ? 'bg-[#C9A449]/10 border-[#C9A449] shadow-md shadow-[#C9A449]/20' 
              : 'bg-[#080808]/30 border-white/20 hover:bg-[#080808]/50'
          }`}>
            <input 
              type="radio" 
              name="contactPreference" 
              value="phone"
              checked={formData.contactPreference === 'phone'}
              onChange={handleInputChange}
              className="sr-only" 
            />
            <div className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${
              formData.contactPreference === 'phone' 
                ? 'border-[#C9A449] bg-[#C9A449]' 
                : 'border-white/40'
            }`}>
              {formData.contactPreference === 'phone' && (
                <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
              )}
            </div>
            <span className="font-body text-white/90 text-sm">Phone</span>
          </label>
          
          <label className={`flex items-center gap-3 px-4 sm:px-5 py-2.5 rounded-md border cursor-pointer transition-all duration-300 hover:border-[#C9A449]/50 ${
            formData.contactPreference === 'either' 
              ? 'bg-[#C9A449]/10 border-[#C9A449] shadow-md shadow-[#C9A449]/20' 
              : 'bg-[#080808]/30 border-white/20 hover:bg-[#080808]/50'
          }`}>
            <input 
              type="radio" 
              name="contactPreference" 
              value="either"
              checked={formData.contactPreference === 'either'}
              onChange={handleInputChange}
              className="sr-only" 
            />
            <div className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${
              formData.contactPreference === 'either' 
                ? 'border-[#C9A449] bg-[#C9A449]' 
                : 'border-white/40'
            }`}>
              {formData.contactPreference === 'either' && (
                <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
              )}
            </div>
            <span className="font-body text-white/90 text-sm">Either</span>
          </label>
        </div>
      </div>
    </div>
  );
};

export default InitialInfoStep;