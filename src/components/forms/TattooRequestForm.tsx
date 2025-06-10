import React, { useState } from 'react';
import useTattooRequestForm from '../../hooks/useTattooRequestForm';
import ProgressSteps from './tattooRequest/ProgressSteps';
import InitialInfoStep from './tattooRequest/InitialInfoStep';
import DesignDetailsStep from './tattooRequest/DesignDetailsStep';
import ReferenceImagesStep from './tattooRequest/ReferenceImagesStep';
import TattooRequestSuccess from './tattooRequest/TattooRequestSuccess';

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
  } = useTattooRequestForm();
  
  const [step, setStep] = useState(1);
  const totalSteps = 3;
  
  const handleImageUpload = (images: Array<{ url: string; file: File; publicId?: string }>) => {
    // Extract just the File objects for upload
    const files = images.map(img => img.file);
    uploadImages(files);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitRequest();
  };
  
  const goToNextStep = () => {
    if (validateCurrentStep()) {
      setStep(Math.min(step + 1, totalSteps));
      window.scrollTo(0, 0);
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
    <div className="max-w-4xl mx-auto mb-20 relative">
      {/* Ornamental background for form */}
      <div className="absolute inset-0 bg-[#080808]/95 backdrop-blur-sm rounded-lg border border-[#C9A449]/30 shadow-2xl"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-[#C9A449]/5 via-transparent to-[#C9A449]/10 rounded-lg"></div>
      
      <form onSubmit={handleSubmit} className="relative z-10 overflow-hidden rounded-lg">
        <div className="p-6 sm:p-8 md:p-10">
          {/* Form Header with ornamental styling */}
          <div className="text-center mb-10">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 sm:w-16 h-[0.5px] bg-gradient-to-r from-transparent via-[#C9A449]/60 to-[#C9A449]/40"></div>
              <div className="mx-3 sm:mx-4 flex items-center justify-center w-5 h-5">
                <div className="w-3 h-3 border border-[#C9A449]/60 rotate-45"></div>
                <div className="absolute w-1.5 h-1.5 bg-[#C9A449]/20 rotate-45"></div>
              </div>
              <div className="w-12 sm:w-16 h-[0.5px] bg-gradient-to-l from-transparent via-[#C9A449]/60 to-[#C9A449]/40"></div>
            </div>
            
            <h2 className="font-heading text-2xl sm:text-3xl mb-3 text-white tracking-wide">Tattoo Request Form</h2>
            
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 sm:w-20 h-[0.5px] bg-gradient-to-r from-transparent via-[#C9A449]/60 to-[#C9A449]/40"></div>
              <div className="mx-3 sm:mx-4 relative flex items-center justify-center">
                <span className="text-[#C9A449]/80 text-xs z-10">✦</span>
                <span className="absolute transform scale-125 text-[#C9A449]/20 text-xs">✦</span>
              </div>
              <div className="w-16 sm:w-20 h-[0.5px] bg-gradient-to-l from-transparent via-[#C9A449]/60 to-[#C9A449]/40"></div>
            </div>
            
            <p className="text-white/70 mb-10 max-w-2xl mx-auto font-body leading-relaxed">
              Fill out the form below to request a custom tattoo design. Our artists will review your request and get back to you within 2-3 business days.
            </p>
          </div>
          
          {/* Progress Steps */}
          <div className="mb-12">
            <ProgressSteps currentStep={step} totalSteps={totalSteps} />
          </div>
          
          {/* Error message */}
          {error && (
            <div className="bg-red-900/20 border border-red-500/30 p-5 rounded-md mb-8 text-red-300 border-l-4 border-l-red-500">
              <p>{error}</p>
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
          
          {/* Navigation Buttons */}
          <div className="mt-12 flex justify-between items-center">
            {step > 1 ? (
              <button
                type="button"
                onClick={goToPrevStep}
                className="group relative overflow-hidden bg-transparent border border-white/30 text-white hover:bg-white/10 hover:border-white/50 transition-all duration-300 px-6 sm:px-8 py-3 rounded-md font-body tracking-wide uppercase text-sm"
              >
                <span className="relative z-10">Previous</span>
              </button>
            ) : (
              <div></div> // Empty div for spacing
            )}
            
            {step < totalSteps ? (
              <button
                type="button"
                onClick={goToNextStep}
                className={`group relative overflow-hidden bg-[#C9A449] text-white hover:bg-[#C9A449]/90 border border-[#C9A449] hover:border-[#C9A449]/80 transition-all duration-300 px-6 sm:px-8 py-3 rounded-md font-body tracking-wide uppercase text-sm shadow-lg hover:shadow-xl ${
                  !validateCurrentStep() ? 'opacity-70 cursor-not-allowed hover:bg-[#C9A449] hover:border-[#C9A449]' : ''
                }`}
                disabled={!validateCurrentStep()}
              >
                <span className="relative z-10 flex items-center">
                  Next
                  <svg className="ml-2 w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </button>
            ) : (
              <button
                type="submit"
                disabled={isLoading || isUploading}
                className="group relative overflow-hidden bg-[#C9A449] text-white hover:bg-[#C9A449]/90 border border-[#C9A449] hover:border-[#C9A449]/80 transition-all duration-300 px-6 sm:px-8 py-3 rounded-md font-body tracking-wide uppercase text-sm shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <span className="relative z-10 flex items-center">
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Submitting...
                    </>
                  ) : (
                    'Submit Request'
                  )}
                </span>
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default TattooRequestForm;