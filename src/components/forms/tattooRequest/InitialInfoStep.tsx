import React, { useState, useEffect } from 'react';
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
  const [emailTouched, setEmailTouched] = useState(false);
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [emailSuggestion, setEmailSuggestion] = useState<string | null>(null);
  const [emailValidationState, setEmailValidationState] = useState<'valid' | 'invalid' | 'checking' | 'idle'>('idle');
  
  // Email validation with suggestions for common typos
  const validateEmail = (email: string) => {
    if (!email) {
      setEmailValidationState('idle');
      setEmailSuggestion(null);
      return;
    }

    setEmailValidationState('checking');
    
    // Simulate brief checking delay for better UX
    setTimeout(() => {
      const emailRegex = /^\S+@\S+\.\S+$/;
      const isValid = emailRegex.test(email);
      
      if (isValid) {
        setEmailValidationState('valid');
        setEmailSuggestion(null);
      } else {
        setEmailValidationState('invalid');
        
        // Check for common typos and suggest corrections
        const commonTypos = [
          { typo: /@gmai\.com$/i, suggestion: '@gmail.com' },
          { typo: /@gmail\.co$/i, suggestion: '@gmail.com' },
          { typo: /@yahooo\.com$/i, suggestion: '@yahoo.com' },
          { typo: /@hotmial\.com$/i, suggestion: '@hotmail.com' },
          { typo: /@outlok\.com$/i, suggestion: '@outlook.com' },
          { typo: /@iclod\.com$/i, suggestion: '@icloud.com' },
        ];
        
        const typo = commonTypos.find(t => t.typo.test(email));
        if (typo) {
          const suggestedEmail = email.replace(typo.typo, typo.suggestion);
          setEmailSuggestion(suggestedEmail);
        } else {
          setEmailSuggestion(null);
        }
      }
    }, 300);
  };

  useEffect(() => {
    if (emailTouched && formData.contactEmail) {
      validateEmail(formData.contactEmail);
    }
  }, [formData.contactEmail, emailTouched]);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleInputChange(e);
    if (emailTouched) {
      validateEmail(e.target.value);
    }
  };

  const handleEmailBlur = () => {
    setEmailTouched(true);
    if (formData.contactEmail) {
      validateEmail(formData.contactEmail);
    }
  };

  const applySuggestion = () => {
    if (emailSuggestion) {
      const syntheticEvent = {
        target: { name: 'contactEmail', value: emailSuggestion }
      } as React.ChangeEvent<HTMLInputElement>;
      handleInputChange(syntheticEvent);
      setEmailSuggestion(null);
      setEmailValidationState('valid');
    }
  };
  
  // Enhanced phone formatting with country code support
  const formatPhone = (value: string) => {
    // Remove all non-digit characters
    const phoneNumber = value.replace(/\D/g, '');
    
    // Handle different phone number lengths
    if (phoneNumber.length === 0) return '';
    
    // If starts with 1 (country code), handle accordingly
    if (phoneNumber.startsWith('1') && phoneNumber.length > 1) {
      const withoutCountryCode = phoneNumber.slice(1);
      const formatted = formatLocalNumber(withoutCountryCode);
      return `+1 ${formatted}`;
    }
    
    // Otherwise format as local number
    return formatLocalNumber(phoneNumber);
  };

  const formatLocalNumber = (phoneNumber: string) => {
    const phoneLength = phoneNumber.length;
    
    if (phoneLength < 4) return phoneNumber;
    if (phoneLength < 7) {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
    }
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
  };
  
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    e.target.value = formatted;
    handleInputChange(e);
  };

  const handlePhonePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    const formatted = formatPhone(pastedText);
    
    const syntheticEvent = {
      target: { name: 'contactPhone', value: formatted }
    } as React.ChangeEvent<HTMLInputElement>;
    handleInputChange(syntheticEvent);
  };
  
  return (
    <div className="space-y-8">
      {/* Request Purpose Section */}
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
          <option value="" className="bg-[#080808] text-white/80">What type of request is this?</option>
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

      {/* Visual Separator */}
      <div className="flex items-center justify-center my-8">
        <div className="w-16 h-px bg-gradient-to-r from-transparent via-[#C9A449]/40 to-transparent"></div>
        <div className="mx-4 w-1.5 h-1.5 bg-[#C9A449]/60 rounded-full"></div>
        <div className="w-16 h-px bg-gradient-to-l from-transparent via-[#C9A449]/40 to-transparent"></div>
      </div>
      
      {/* Artist & Timeline Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
        <div className="form-control">
          <label className="block pb-2">
            <span className="font-body text-white/90 font-medium text-sm tracking-wide">Preferred Artist</span>
            <span className="text-white/60 text-xs ml-2">(Optional)</span>
          </label>
          <input
            type="text"
            name="preferredArtist"
            value={formData.preferredArtist || ''}
            onChange={handleInputChange}
            className="w-full h-12 bg-[#080808]/50 border border-white/20 hover:border-white/30 focus:border-[#C9A449] focus:ring-2 focus:ring-[#C9A449]/40 rounded-md font-body text-white placeholder-white/40 backdrop-blur-sm transition-all duration-300 focus:outline-none px-4"
            placeholder="Kelly Miller, Lacey, or no preference"
          />
        </div>
        
        <div className="form-control">
          <label className="block pb-2">
            <span className="font-body text-white/90 font-medium text-sm tracking-wide">Timeline</span>
          </label>
          <select
            name="timeframe"
            value={formData.timeframe || ''}
            onChange={handleInputChange}
            className="w-full h-12 bg-[#080808]/50 border border-white/20 hover:border-white/30 focus:border-[#C9A449] focus:ring-2 focus:ring-[#C9A449]/40 rounded-md font-body text-white placeholder-white/40 backdrop-blur-sm transition-all duration-300 focus:outline-none"
          >
            <option value="" className="bg-[#080808] text-white/80">When would you like this done?</option>
            {TIMEFRAMES.map((timeframe) => (
              <option key={timeframe} value={timeframe} className="bg-[#080808] text-white">
                {timeframe}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Visual Separator */}
      <div className="flex items-center justify-center my-8">
        <div className="w-16 h-px bg-gradient-to-r from-transparent via-[#C9A449]/40 to-transparent"></div>
        <div className="mx-4 w-1.5 h-1.5 bg-[#C9A449]/60 rounded-full"></div>
        <div className="w-16 h-px bg-gradient-to-l from-transparent via-[#C9A449]/40 to-transparent"></div>
      </div>
      
      {/* Contact Information Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
        <div className="form-control">
          <label className="block pb-2">
            <span className="font-body text-white/90 font-medium text-sm tracking-wide">
              Email Address<span className="text-red-400 ml-1">*</span>
            </span>
          </label>
          <div className="relative">
            <input
              type="email"
              name="contactEmail"
              value={formData.contactEmail || ''}
              onChange={handleEmailChange}
              onBlur={handleEmailBlur}
              required
              className={`w-full h-12 bg-[#080808]/50 border rounded-md font-body text-white placeholder-white/40 backdrop-blur-sm transition-all duration-300 focus:outline-none focus:ring-2 px-4 pr-12 ${
                validationErrors?.contactEmail || emailValidationState === 'invalid'
                  ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/30' 
                  : emailValidationState === 'valid'
                    ? 'border-green-500/50 focus:border-[#C9A449] focus:ring-[#C9A449]/40'
                    : 'border-white/20 hover:border-white/30 focus:border-[#C9A449] focus:ring-[#C9A449]/40'
              }`}
              placeholder="your.email@example.com"
            />
            
            {/* Validation status icon */}
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {emailValidationState === 'checking' && (
                <svg className="animate-spin h-4 w-4 text-[#C9A449]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {emailValidationState === 'valid' && (
                <svg className="h-4 w-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
          </div>
          
          {/* Email validation feedback */}
          {validationErrors?.contactEmail && (
            <p className="text-red-400 text-xs mt-2 font-body">{validationErrors.contactEmail}</p>
          )}
          {emailSuggestion && (
            <div className="mt-2 p-2 bg-blue-900/20 border border-blue-500/30 rounded-md">
              <p className="text-blue-300 text-xs font-body">
                Did you mean{" "}
                <button
                  type="button"
                  onClick={applySuggestion}
                  className="text-blue-400 hover:text-blue-300 underline font-medium"
                >
                  {emailSuggestion}
                </button>
                ?
              </p>
            </div>
          )}
          {emailValidationState === 'valid' && !validationErrors?.contactEmail && (
            <p className="text-green-400 text-xs mt-2 font-body">✓ Valid email address</p>
          )}
        </div>
        
        <div className="form-control">
          <label className="block pb-2">
            <span className="font-body text-white/90 font-medium text-sm tracking-wide">Phone Number</span>
            <span className="text-white/60 text-xs ml-2">(Optional)</span>
          </label>
          <input
            type="tel"
            name="contactPhone"
            value={formData.contactPhone || ''}
            onChange={handlePhoneChange}
            onPaste={handlePhonePaste}
            onBlur={() => setPhoneTouched(true)}
            className="w-full h-12 bg-[#080808]/50 border border-white/20 hover:border-white/30 focus:border-[#C9A449] focus:ring-2 focus:ring-[#C9A449]/40 rounded-md font-body text-white placeholder-white/40 backdrop-blur-sm transition-all duration-300 focus:outline-none px-4"
            placeholder="(123) 456-7890 or +1 (123) 456-7890"
            maxLength={18} // Increased for country code
          />
          <p className="text-xs text-white/50 mt-2 ml-1 font-body">
            US/Canada format supported. Include +1 for country code if needed.
          </p>
        </div>
      </div>
      
      {/* Contact Preference Section */}
      <div className="form-control mt-2">
        <label className="block pb-3">
          <span className="font-body text-white/90 font-medium text-sm tracking-wide">How should we contact you?</span>
        </label>
        <div className="flex flex-wrap gap-3 sm:gap-4 mt-1">
          <label className={`flex items-center gap-3 px-4 sm:px-5 py-3 rounded-md border cursor-pointer transition-all duration-300 hover:border-[#C9A449]/50 ${
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
          
          <label className={`flex items-center gap-3 px-4 sm:px-5 py-3 rounded-md border cursor-pointer transition-all duration-300 hover:border-[#C9A449]/50 ${
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
          
          <label className={`flex items-center gap-3 px-4 sm:px-5 py-3 rounded-md border cursor-pointer transition-all duration-300 hover:border-[#C9A449]/50 ${
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