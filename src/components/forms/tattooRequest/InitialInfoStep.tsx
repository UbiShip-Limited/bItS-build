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
        <label className="label pb-2">
          <span className="label-text text-[#080808] font-semibold text-sm">Request Purpose<span className="text-red-500 ml-1">*</span></span>
        </label>
        <select
          name="purpose"
          value={formData.purpose || ''}
          onChange={handleInputChange}
          required
          className={`select select-bordered w-full h-12 bg-gray-50 border-[#444444]/20 focus:border-[#C9A449] focus:ring-2 focus:ring-[#C9A449]/20 rounded-md text-[#080808] ${
            validationErrors?.purpose ? 'border-red-500' : ''
          }`}
        >
          <option value="">Select purpose...</option>
          {TATTOO_PURPOSES.map((purpose) => (
            <option key={purpose} value={purpose}>
              {purpose}
            </option>
          ))}
        </select>
        {validationErrors?.purpose && (
          <p className="text-red-500 text-xs mt-2">{validationErrors.purpose}</p>
        )}
      </div>
      
      <div className="form-control">
        <label className="label pb-2">
          <span className="label-text text-[#080808] font-semibold text-sm">Preferred Artist (Optional)</span>
        </label>
        <input
          type="text"
          name="preferredArtist"
          value={formData.preferredArtist || ''}
          onChange={handleInputChange}
          className="input input-bordered w-full h-12 bg-gray-50 border-[#444444]/20 focus:border-[#C9A449] focus:ring-2 focus:ring-[#C9A449]/20 rounded-md text-[#080808]"
          placeholder="Leave blank if no preference"
        />
      </div>
      
      <div className="form-control">
        <label className="label pb-2">
          <span className="label-text text-[#080808] font-semibold text-sm">Timeframe</span>
        </label>
        <select
          name="timeframe"
          value={formData.timeframe || ''}
          onChange={handleInputChange}
          className="select select-bordered w-full h-12 bg-gray-50 border-[#444444]/20 focus:border-[#C9A449] focus:ring-2 focus:ring-[#C9A449]/20 rounded-md text-[#080808]"
        >
          <option value="">Select timeframe...</option>
          {TIMEFRAMES.map((timeframe) => (
            <option key={timeframe} value={timeframe}>
              {timeframe}
            </option>
          ))}
        </select>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="form-control">
          <label className="label pb-2">
            <span className="label-text text-[#080808] font-semibold text-sm">Email<span className="text-red-500 ml-1">*</span></span>
          </label>
          <input
            type="email"
            name="contactEmail"
            value={formData.contactEmail || ''}
            onChange={handleInputChange}
            required
            className={`input input-bordered w-full h-12 bg-gray-50 border-[#444444]/20 focus:border-[#C9A449] focus:ring-2 focus:ring-[#C9A449]/20 rounded-md text-[#080808] ${
              validationErrors?.contactEmail ? 'border-red-500' : ''
            }`}
            placeholder="your.email@example.com"
          />
          {validationErrors?.contactEmail && (
            <p className="text-red-500 text-xs mt-2">{validationErrors.contactEmail}</p>
          )}
        </div>
        
        <div className="form-control">
          <label className="label pb-2">
            <span className="label-text text-[#080808] font-semibold text-sm">Phone</span>
          </label>
          <input
            type="tel"
            name="contactPhone"
            value={formData.contactPhone || ''}
            onChange={handleInputChange}
            className="input input-bordered w-full h-12 bg-gray-50 border-[#444444]/20 focus:border-[#C9A449] focus:ring-2 focus:ring-[#C9A449]/20 rounded-md text-[#080808]"
            placeholder="(123) 456-7890"
          />
        </div>
      </div>
      
      <div className="form-control mt-2">
        <label className="label pb-2">
          <span className="label-text text-[#080808] font-semibold text-sm">Preferred Contact Method</span>
        </label>
        <div className="flex flex-wrap gap-4 mt-1">
          <label className={`label cursor-pointer gap-3 px-5 py-2.5 rounded-md border transition-all duration-200 hover:border-[#C9A449]/50 ${
            formData.contactPreference === 'email' 
              ? 'bg-[#C9A449]/5 border-[#C9A449]' 
              : 'bg-white border-[#444444]/20'
          }`}>
            <input 
              type="radio" 
              name="contactPreference" 
              value="email"
              checked={formData.contactPreference === 'email'}
              onChange={handleInputChange}
              className="radio radio-sm radio-primary border-[#C9A449]" 
            />
            <span className="label-text text-[#080808]">Email</span>
          </label>
          <label className={`label cursor-pointer gap-3 px-5 py-2.5 rounded-md border transition-all duration-200 hover:border-[#C9A449]/50 ${
            formData.contactPreference === 'phone' 
              ? 'bg-[#C9A449]/5 border-[#C9A449]' 
              : 'bg-white border-[#444444]/20'
          }`}>
            <input 
              type="radio" 
              name="contactPreference" 
              value="phone"
              checked={formData.contactPreference === 'phone'}
              onChange={handleInputChange}
              className="radio radio-sm radio-primary border-[#C9A449]" 
            />
            <span className="label-text text-[#080808]">Phone</span>
          </label>
          <label className={`label cursor-pointer gap-3 px-5 py-2.5 rounded-md border transition-all duration-200 hover:border-[#C9A449]/50 ${
            formData.contactPreference === 'either' 
              ? 'bg-[#C9A449]/5 border-[#C9A449]' 
              : 'bg-white border-[#444444]/20'
          }`}>
            <input 
              type="radio" 
              name="contactPreference" 
              value="either"
              checked={formData.contactPreference === 'either'}
              onChange={handleInputChange}
              className="radio radio-sm radio-primary border-[#C9A449]" 
            />
            <span className="label-text text-[#080808]">Either</span>
          </label>
        </div>
      </div>
    </div>
  );
};

export default InitialInfoStep;