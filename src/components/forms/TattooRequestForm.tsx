'use client'

import React, { useState } from 'react';
import useTattooRequestForm from '../../hooks/useTattooRequestForm';
import ProgressSteps from './tattooRequest/ProgressSteps';
import InitialInfoStep from './tattooRequest/InitialInfoStep';
import DesignDetailsStep from './tattooRequest/DesignDetailsStep';
import ReferenceImagesStep from './tattooRequest/ReferenceImagesStep';
import TattooRequestSuccess from './tattooRequest/TattooRequestSuccess';
import { Button } from '@/src/components/ui/button';
import { GAEvents } from '@/src/lib/analytics/ga-events';

const TattooRequestForm: React.FC = () => {
  const {
    formData,
    isLoading,
    error,
    success,
    response,
    handleInputChange,
    submitRequest,
    resetForm,
    uploadImages,
    isUploading,
    validationErrors,
    hasSavedData,
    restoreSavedData,
    clearSavedData,
  } = useTattooRequestForm();
  
  const [step, setStep] = useState(1);
  const [honeypot, setHoneypot] = useState('');
  const [showSavedDataPrompt, setShowSavedDataPrompt] = useState(hasSavedData);
  const totalSteps = 3;
  
  // Update saved data prompt when hasSavedData changes
  React.useEffect(() => {
    setShowSavedDataPrompt(hasSavedData);
  }, [hasSavedData]);
  
  // Track form start
  React.useEffect(() => {
    GAEvents.tattooRequestStarted();
  }, []);
  
  const handleImageUpload = (images: Array<{ url: string; file: File; publicId?: string }>) => {
    console.log('🖼️ handleImageUpload called with:', images);
    
    // Extract just the File objects for upload
    const files = images.map(img => img.file);
    console.log('📁 Extracted files for upload:', files.map(f => ({ name: f.name, size: f.size })));
    
    uploadImages(files);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    console.log('🚨 FORM SUBMIT TRIGGERED!', { 
      currentStep: step, 
      totalSteps,
      shouldSubmit: step >= totalSteps,
      eventType: e.type,
      target: e.target
    });
    
    e.preventDefault();
    
    if (step < totalSteps) {
      console.log('⚠️ Form submitted early! Should be on step', totalSteps, 'but on step', step);
      return; // Don't submit if not on final step
    }
    
    console.log('✅ Proceeding with form submission');
    await submitRequest();
    GAEvents.tattooRequestSubmitted();
  };

  const handleRestoreData = () => {
    restoreSavedData();
    setShowSavedDataPrompt(false);
  };

  const handleDismissSavedData = () => {
    clearSavedData();
    setShowSavedDataPrompt(false);
  };
  
  const goToNextStep = () => {
    console.log('🔍 goToNextStep called:', { 
      currentStep: step, 
      totalSteps, 
      stepLessThanTotal: step < totalSteps,
      shouldShowNext: step < totalSteps ? 'YES' : 'NO',
      shouldShowSubmit: step >= totalSteps ? 'YES' : 'NO'
    });
    
    const isValid = validateCurrentStep();
    console.log('✅ Step validation result:', isValid);
    
    if (isValid) {
      const nextStep = Math.min(step + 1, totalSteps);
      console.log('📈 Advancing from step', step, 'to step', nextStep);
      setStep(nextStep);
      window.scrollTo(0, 0);
    } else {
      console.log('❌ Validation failed for step:', step);
    }
  };
  
  const goToPrevStep = () => {
    setStep(Math.max(step - 1, 1));
    window.scrollTo(0, 0);
  };
  
  const validateCurrentStep = () => {
    if (step === 1) {
      // Check if required fields for step 1 are filled
      return formData.purpose && formData.contactEmail;
    }
    if (step === 2) {
      // Check if required fields for step 2 are filled
      return formData.description && formData.placement && formData.size;
    }
    return true;
  };
  
  // If the form was successfully submitted, show the success state
  if (success && response) {
    return <TattooRequestSuccess response={response} resetForm={resetForm} />;
  }

  return (
    <div className="max-w-4xl mx-auto mb-24 relative">
      {/* Enhanced card background with refined styling */}
      <div className="absolute inset-0 bg-obsidian/80 backdrop-blur-md rounded-3xl border border-gold-500/20 shadow-[0_8px_32px_rgba(0,0,0,0.12)]"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-gold-500/[0.03] via-transparent to-gold-500/[0.01] rounded-3xl"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(184,149,106,0.05),transparent_50%)] rounded-3xl"></div>
      
      {/* Saved Data Restoration Prompt */}
      {showSavedDataPrompt && (
        <div className="relative z-20 mb-6 p-4 bg-blue-900/10 backdrop-blur-md border border-blue-500/20 rounded-xl shadow-[0_4px_16px_rgba(59,130,246,0.08)]">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center mt-0.5">
                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 className="text-blue-300 font-body font-medium text-sm mb-1">
                  Previously saved data found
                </h4>
                <p className="text-blue-200/80 font-body text-xs leading-relaxed">
                  We found a previously saved version of your tattoo request. Would you like to continue where you left off?
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 ml-4">
              <button
                type="button"
                onClick={handleRestoreData}
                className="px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 hover:border-blue-500/40 rounded-lg text-blue-300 hover:text-blue-200 font-body text-xs transition-all duration-300 shadow-sm hover:shadow-md"
              >
                Restore
              </button>
              <button
                type="button"
                onClick={handleDismissSavedData}
                className="px-3 py-1.5 bg-transparent hover:bg-red-500/10 border border-red-500/20 hover:border-red-500/30 rounded-lg text-red-300 hover:text-red-200 font-body text-xs transition-all duration-300"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="relative z-10 overflow-hidden rounded-3xl">
        <div className="p-6 sm:p-8 md:p-10 lg:p-12">
          {/* Form Header with refined styling */}
          <div className="text-center mb-10">
            <h2 className="font-body text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold leading-[1.1] mb-6 text-white tracking-tight">Tell Us Your Story</h2>
            
            {/* Enhanced dots divider */}
            <div className="mb-8 flex items-center justify-center gap-4">
              <div className="w-1 h-1 bg-gold-500/30 rounded-full animate-pulse" style={{animationDelay: '0ms'}}></div>
              <div className="w-2 h-2 bg-gold-500/40 rounded-full relative">
                <div className="absolute inset-0 bg-gold-500/20 rounded-full blur-sm scale-150 animate-pulse"></div>
              </div>
              <div className="w-1 h-1 bg-gold-500/30 rounded-full animate-pulse" style={{animationDelay: '200ms'}}></div>
            </div>
            
            <p className="text-white/60 mb-6 max-w-2xl mx-auto font-body text-base sm:text-lg lg:text-xl leading-[1.7] px-2 sm:px-4">
              Every tattoo has a story. Share yours below, and we'll connect within 2-3 days to begin bringing it to life.
            </p>

            {/* Auto-save indicator with better positioning */}
            <div className="inline-flex items-center justify-center text-white/40 text-xs font-body bg-white/5 px-4 py-2 rounded-full border border-white/10">
              <svg className="w-3 h-3 mr-2 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span className="tracking-wide">Your progress is automatically saved</span>
            </div>
          </div>
          
          {/* Progress Steps */}
          <div className="mb-10">
            <ProgressSteps currentStep={step} totalSteps={totalSteps} />
          </div>
          
          {/* Error message */}
          {error && (
            <div className="bg-red-900/10 backdrop-blur-sm border border-red-500/20 p-5 rounded-xl mb-8 text-red-300 shadow-[0_4px_16px_rgba(239,68,68,0.08)] relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-red-500 via-red-400 to-red-500"></div>
              <div className="flex items-start gap-3 ml-2">
                <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="font-body text-sm">{error}</p>
              </div>
            </div>
          )}
          
          {/* Form Steps */}
          <div className="space-y-8">
            {step === 1 && (
              <InitialInfoStep 
                formData={formData} 
                handleInputChange={handleInputChange} 
                validationErrors={validationErrors || undefined}
              />
            )}
            
            {step === 2 && (
              <DesignDetailsStep 
                formData={formData} 
                handleInputChange={handleInputChange} 
                validationErrors={validationErrors || undefined}
              />
            )}
            
            {step === 3 && (
              <ReferenceImagesStep 
                formData={formData} 
                handleInputChange={handleInputChange} 
                handleImageUpload={handleImageUpload}
                isUploading={isUploading}
              />
            )}
          </div>
          
          {/* Show validation errors if submit was attempted */}
          {validationErrors && step === 3 && (
            <div className="mt-6 p-4 bg-red-900/10 backdrop-blur-sm border border-red-500/20 rounded-xl shadow-[0_4px_16px_rgba(239,68,68,0.08)]">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <p className="text-red-400 text-sm font-semibold mb-2 font-body">Please fix the following errors:</p>
                  <ul className="space-y-1 text-red-300/90 text-sm font-body">
                    {Object.entries(validationErrors).map(([field, error]) => (
                      <li key={field} className="flex items-start gap-2">
                        <span className="text-red-400/60 mt-1.5">•</span>
                        <span>{error}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="text-red-300/70 text-xs mt-3 font-body">
                    You may need to go back to previous steps to correct these issues.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Show general error if one exists */}
          {error && (
            <div className="mt-4 p-4 bg-red-900/10 backdrop-blur-sm border border-red-500/20 rounded-xl shadow-[0_4px_16px_rgba(239,68,68,0.08)]">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-red-400 text-sm font-body">{error}</p>
              </div>
            </div>
          )}
          
          {/* Honeypot field - hidden from users but visible to bots */}
          <input
            type="text"
            name="website"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            style={{ position: 'absolute', left: '-9999px' }}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
          />
          
          {/* Navigation Buttons */}
          <div className="mt-10 flex justify-between items-center gap-4">

            {step > 1 ? (
              <Button
                type="button"
                onClick={goToPrevStep}
                variant="outline"
                size="md"
                className="min-w-[120px]"
                icon={
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                }
              >
                Previous
              </Button>
            ) : (
              <div className="min-w-[120px]"></div> // Empty div for spacing
            )}
            
            {step < totalSteps ? (
              <Button
                type="button"
                onClick={goToNextStep}
                variant="primary"
                size="md"
                isDisabled={!validateCurrentStep()}
                className="min-w-[160px] group"
              >
                <span className="flex items-center">
                  Next
                  <span className="ml-2 text-xs opacity-70">(Step {step} of {totalSteps})</span>
                  <svg className="ml-3 w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </Button>
            ) : (
              <div className="relative">
                <Button
                  type="submit"
                  variant={validationErrors ? "outline" : "primary"}
                  size="md"
                  isDisabled={isLoading || (isUploading && (!formData.referenceImages || formData.referenceImages.length === 0))}
                  onClick={() => console.log('🔴 Submit button clicked:', { isLoading, isUploading, isDisabled: isLoading || isUploading, hasImages: formData.referenceImages?.length || 0 })}
                  className={validationErrors ? "border-red-500/40 text-red-400 hover:border-red-500/60 min-w-[180px]" : "min-w-[180px] group"}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 818-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Submitting...
                    </span>
                  ) : validationErrors ? (
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Fix Errors to Submit
                    </span>
                  ) : (
                    <span className="flex items-center">
                      Submit Request
                      <svg className="ml-2 w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </span>
                  )}
                </Button>
                {validationErrors && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 -translate-y-full">
                    <div className="bg-red-900/90 backdrop-blur-sm text-white text-xs rounded-lg px-3 py-1.5 whitespace-nowrap shadow-lg border border-red-500/20">
                      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-red-900/90 border-r border-b border-red-500/20"></div>
                      Please correct the errors above
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default TattooRequestForm;