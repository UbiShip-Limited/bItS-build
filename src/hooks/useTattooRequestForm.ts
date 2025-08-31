import { useState, useEffect, useCallback } from 'react';
import { TattooRequestApiClient } from '../lib/api/services/tattooRequestApiClient';
import { ImageUploadService } from '../lib/api/services/ImageUploadService';
import { apiClient } from '../lib/api/apiClient';
import { useRecaptcha } from './useRecaptcha';

// Initialize the services ONCE
const tattooRequestClient = new TattooRequestApiClient(apiClient);
const imageUploadService = new ImageUploadService(apiClient);

interface TattooRequestFormData {
  contactEmail: string;
  contactPhone: string;
  description: string;
  placement: string;
  size: string;
  colorPreference: string;
  style: string;
  referenceImages: Array<{ url: string; file: File; publicId?: string }>;
  purpose: string;
  preferredArtist?: string;
  timeframe?: string;
  contactPreference?: string;
  additionalNotes?: string;
}

interface ResponseData {
  id: string;
  message: string;
  trackingToken?: string;
}

interface InternalValidationErrors {
  [key: string]: string;
}

interface UseTattooRequestFormReturn {
  formData: TattooRequestFormData;
  isLoading: boolean;
  error: string | null;
  success: boolean;
  response: ResponseData | null;
  validationErrors: InternalValidationErrors | null;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  submitRequest: () => Promise<void>;
  resetForm: () => void;
  uploadImages: (files: File[]) => Promise<void>;
  isUploading: boolean;
  // Auto-save related
  hasSavedData: boolean;
  restoreSavedData: () => void;
  clearSavedData: () => void;
}

export interface TattooFormData {
  purpose?: string;
  preferredArtist?: string;
  timeframe?: string;
  contactEmail?: string;
  contactPhone?: string;
  contactPreference?: string;
  description?: string;
  placement?: string;
  size?: string;
  colorPreference?: string;
  style?: string;
  additionalNotes?: string;
  referenceImages?: Array<{ url: string; file: File; publicId?: string }>;
}

export interface ValidationErrors {
  contactEmail?: string;
  description?: string;
  placement?: string;
  size?: string;
  purpose?: string;
}

const AUTOSAVE_KEY = 'tattoo_request_form_data';
const AUTOSAVE_INTERVAL = 30000; // 30 seconds

const useTattooRequestForm = (): UseTattooRequestFormReturn => {
  const { executeRecaptcha, isAvailable: isRecaptchaAvailable } = useRecaptcha({ action: 'tattoo_request' });
  
  const [formData, setFormData] = useState<TattooRequestFormData>({
    contactEmail: '',
    contactPhone: '',
    description: '',
    placement: '',
    size: '',
    colorPreference: '',
    style: '',
    referenceImages: [],
    purpose: '',
    preferredArtist: '',
    timeframe: '',
    contactPreference: 'email',
    additionalNotes: ''
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [response, setResponse] = useState<ResponseData | null>(null);
  const [validationErrors, setValidationErrors] = useState<InternalValidationErrors | null>(null);
  const [hasSavedData, setHasSavedData] = useState(false);

  // Check for saved data on component mount
  useEffect(() => {
    try {
      const savedData = localStorage.getItem(AUTOSAVE_KEY);
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        // Only consider it saved data if it has meaningful content
        const hasContent = parsedData.contactEmail || parsedData.description || parsedData.purpose;
        setHasSavedData(hasContent);
      }
    } catch (error) {
      console.warn('Failed to check for saved form data:', error);
    }
  }, []);

  // Auto-save functionality
  const saveFormData = useCallback(() => {
    try {
      // Only save if there's meaningful data to save
      const hasContent = formData.contactEmail || formData.description || formData.purpose;
      if (hasContent && !success) {
        // Exclude file objects from localStorage (they can't be serialized)
        const dataToSave = {
          ...formData,
          referenceImages: formData.referenceImages.map(img => ({
            url: img.url,
            publicId: img.publicId
          }))
        };
        localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(dataToSave));
      }
    } catch (error) {
      console.warn('Failed to save form data:', error);
    }
  }, [formData, success]);

  // Set up auto-save interval
  useEffect(() => {
    const interval = setInterval(saveFormData, AUTOSAVE_INTERVAL);
    return () => clearInterval(interval);
  }, [saveFormData]);

  // Save data when user leaves the page
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveFormData();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [saveFormData]);

  const restoreSavedData = useCallback(() => {
    try {
      const savedData = localStorage.getItem(AUTOSAVE_KEY);
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        setFormData(prevData => ({
          ...prevData,
          ...parsedData,
          // Restore reference images without file objects (they'll need to be re-uploaded)
          referenceImages: parsedData.referenceImages || []
        }));
        setHasSavedData(false);
      }
    } catch (error) {
      console.error('Failed to restore saved form data:', error);
    }
  }, []);

  const clearSavedData = useCallback(() => {
    try {
      localStorage.removeItem(AUTOSAVE_KEY);
      setHasSavedData(false);
    } catch (error) {
      console.warn('Failed to clear saved form data:', error);
    }
  }, []);

  const validateForm = (): boolean => {
    console.log('🔍 Validating form...', formData);
    const errors: InternalValidationErrors = {};
    
    if (!formData.contactEmail) {
      errors.contactEmail = 'Email is required';
      console.log('❌ Missing email');
    } else if (!/^\S+@\S+\.\S+$/.test(formData.contactEmail)) {
      errors.contactEmail = 'Please enter a valid email address';
      console.log('❌ Invalid email format:', formData.contactEmail);
    }
    
    if (!formData.description) {
      errors.description = 'Description is required';
      console.log('❌ Missing description');
    } else if (formData.description.length < 10) {
      errors.description = 'Description should be at least 10 characters';
      console.log('❌ Description too short:', formData.description.length, 'chars');
    }
    
    if (!formData.placement) {
      errors.placement = 'Placement is required';
      console.log('❌ Missing placement');
    }
    
    if (!formData.size) {
      errors.size = 'Size is required';
      console.log('❌ Missing size');
    }
    
    if (!formData.purpose) {
      errors.purpose = 'Purpose is required';
      console.log('❌ Missing purpose');
    }
    
    console.log('📊 Validation errors:', errors);
    setValidationErrors(Object.keys(errors).length > 0 ? errors : null);
    return Object.keys(errors).length === 0;
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear validation error for this field when user starts typing
    if (validationErrors && validationErrors[name]) {
      setValidationErrors(prev => {
        if (!prev) return null;
        const newErrors = { ...prev };
        delete newErrors[name];
        return Object.keys(newErrors).length > 0 ? newErrors : null;
      });
    }
  };
  
  const uploadImages = async (files: File[]) => {
    console.log('🔍 Upload started:', { fileCount: files.length, fileNames: files.map(f => f.name) });
    
    if (files.length === 0) return;
    
    setIsUploading(true);
    setError(null);
    
    try {
      console.log('📤 Starting upload process...');
      
      // Upload all files
      const uploadPromises = files.map(file => imageUploadService.uploadImage(file));
      const uploadResults = await Promise.all(uploadPromises);
      
      console.log('✅ Upload successful:', uploadResults);
      
      // Update form data with uploaded images
      const newImages = uploadResults.map((result, index) => ({
        url: result.url,
        file: files[index],
        publicId: result.publicId
      }));
      
      setFormData(prev => ({
        ...prev,
        referenceImages: [...prev.referenceImages, ...newImages]
      }));
      
      console.log('📊 Form data updated with new images:', newImages.length);
      
    } catch (err: any) {
      console.error('❌ Upload failed:', err);
      setError(err.message || 'Failed to upload images');
    } finally {
      console.log('🏁 Setting isUploading to false');
      setIsUploading(false);
    }
  };
  
  const submitRequest = async () => {
    console.log('🚀 submitRequest called');
    setIsLoading(true);
    setError(null);
    
    console.log('📋 Current form data:', formData);
    
    const isValid = validateForm();
    console.log('✅ Form validation result:', isValid);
    
    if (!isValid) {
      console.log('❌ Form validation failed, stopping submission');
      setIsLoading(false);
      return;
    }
    
    console.log('🎯 Proceeding with form submission...');
    
    try {
      // Execute reCAPTCHA if available (but don't block on failure)
      let recaptchaToken: string | null = null;
      console.log('🔐 reCAPTCHA available:', isRecaptchaAvailable);
      
      if (isRecaptchaAvailable) {
        try {
          console.log('🔐 Executing reCAPTCHA...');
          recaptchaToken = await executeRecaptcha();
          console.log('🔐 reCAPTCHA token received:', !!recaptchaToken);
        } catch (error) {
          console.warn('⚠️ reCAPTCHA execution failed, continuing without it:', error);
          // Continue without reCAPTCHA rather than blocking the submission
        }
      } else {
        console.log('ℹ️ reCAPTCHA not configured, proceeding without it');
      }
      
      // Prepare the tattoo request data
      const requestData: any = {
        contactEmail: formData.contactEmail,
        contactPhone: formData.contactPhone,
        description: formData.description,
        placement: formData.placement,
        size: formData.size,
        colorPreference: formData.colorPreference,
        style: formData.style,
        purpose: formData.purpose,
        preferredArtist: formData.preferredArtist,
        timeframe: formData.timeframe,
        contactPreference: formData.contactPreference,
        additionalNotes: formData.additionalNotes,
        // Include reference images directly in the creation
        referenceImages: formData.referenceImages
          .filter(img => img.publicId)
          .map(img => ({
            url: img.url,
            publicId: img.publicId!
          }))
      };
      
      // Add reCAPTCHA token only if we have a valid one
      // Skip sending it if it's null to avoid backend validation issues
      if (recaptchaToken) {
        requestData.recaptchaToken = recaptchaToken;
      }
      
      // Add empty honeypot field (bot trap)
      requestData.honeypot = '';
      
      // Create the tattoo request with all data including images
      console.log('📮 Sending request to API:', requestData);
      const tattooRequestData = await tattooRequestClient.create(requestData);
      console.log('✅ API response received:', tattooRequestData);
      
      setSuccess(true);
      setResponse({
        id: tattooRequestData.id,
        message: 'Request submitted successfully'
      });
      
      // Clear saved data on successful submission
      clearSavedData();
    } catch (err: any) {
      console.error('❌ Form submission error:', err);
      // Extract error message from axios response if available
      const errorMessage = err.response?.data?.error || err.response?.data?.message || err.message || 'An error occurred while submitting your request';
      console.error('📊 Full error details:', {
        status: err.response?.status,
        data: err.response?.data,
        message: errorMessage
      });
      setError(errorMessage);
    } finally {
      console.log('🏁 Setting isLoading to false');
      setIsLoading(false);
    }
  };
  
  const resetForm = () => {
    setFormData({
      contactEmail: '',
      contactPhone: '',
      description: '',
      placement: '',
      size: '',
      colorPreference: '',
      style: '',
      referenceImages: [],
      purpose: '',
      preferredArtist: '',
      timeframe: '',
      contactPreference: 'email',
      additionalNotes: ''
    });
    setError(null);
    setValidationErrors(null);
    setSuccess(false);
    setResponse(null);
    clearSavedData();
  };
  
  return {
    formData,
    isLoading,
    error,
    success,
    response,
    validationErrors,
    handleInputChange,
    submitRequest,
    resetForm,
    uploadImages,
    isUploading,
    hasSavedData,
    restoreSavedData,
    clearSavedData
  };
};

export default useTattooRequestForm;