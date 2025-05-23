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
    <div className="max-w-4xl mx-auto mb-20">
      <form onSubmit={handleSubmit} className="bg-white shadow-2xl rounded-lg overflow-hidden border border-gray-100">
        <div className="p-10">
          <h2 className="font-heading text-3xl mb-3 text-[#080808]">Tattoo Request Form</h2>
          <p className="text-[#444444] mb-10 max-w-2xl">
            Fill out the form below to request a custom tattoo design. Our artists will review your request and get back to you within 2-3 business days.
          </p>
          
          {/* Progress Steps */}
          <div className="mb-12">
            <ProgressSteps currentStep={step} totalSteps={totalSteps} />
          </div>
          
          {/* Error message */}
          {error && (
            <div className="bg-red-50 p-5 rounded-md mb-8 text-red-800 border-l-4 border-red-500">
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
          <div className="mt-12 flex justify-between">
            {step > 1 ? (
              <button
                type="button"
                onClick={goToPrevStep}
                className="btn btn-outline border-[#444444] text-[#444444] hover:bg-[#444444] hover:text-white px-8"
              >
                Previous
              </button>
            ) : (
              <div></div> // Empty div for spacing
            )}
            
            {step < totalSteps ? (
              <button
                type="button"
                onClick={goToNextStep}
                className={`btn bg-[#C9A449] text-white hover:bg-[#C9A449]/90 border-none px-8 shadow-md ${
                  !validateCurrentStep() ? 'opacity-70 cursor-not-allowed' : ''
                }`}
                disabled={!validateCurrentStep()}
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                disabled={isLoading || isUploading}
                className="btn bg-[#C9A449] text-white hover:bg-[#C9A449]/90 border-none px-8 shadow-md"
              >
                {isLoading ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  'Submit Request'
                )}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default TattooRequestForm;