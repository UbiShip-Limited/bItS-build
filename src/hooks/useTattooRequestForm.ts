import { useState } from 'react';
import { TattooRequestService, TattooRequestResponse } from '../lib/api/services/tattooRequestService';
import { ImageUploadService } from '../lib/api/services/ImageUploadService';
import { apiClient } from '../lib/api/apiClient';

// Initialize the services
const tattooRequestService = new TattooRequestService(apiClient);
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

export interface ValidationErrors {
  purpose?: string;
  contactEmail?: string;
  description?: string;
  placement?: string;
  size?: string;
  [key: string]: string | undefined;
}

interface ResponseData {
  id: string;
  description: string;
  trackingToken?: string;
  [key: string]: any;
}

export interface TattooFormResponse {
  id: string;
  description: string;
  trackingToken?: string;
  [key: string]: any;
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

export interface UseTattooRequestFormReturn {
  formData: TattooRequestFormData;
  isLoading: boolean;
  isUploading: boolean;
  error: string | null;
  success: boolean;
  response: ResponseData | null;
  validationErrors: ValidationErrors | null;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  uploadImages: (files: File[]) => Promise<void>;
  submitRequest: () => Promise<void>;
  resetForm: () => void;
}

const useTattooRequestForm = (): UseTattooRequestFormReturn => {
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
  const [validationErrors, setValidationErrors] = useState<ValidationErrors | null>(null);
  
  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};
    
    if (!formData.contactEmail) {
      errors.contactEmail = 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(formData.contactEmail)) {
      errors.contactEmail = 'Please enter a valid email address';
    }
    
    if (!formData.description) {
      errors.description = 'Description is required';
    } else if (formData.description.length < 10) {
      errors.description = 'Description should be at least 10 characters';
    }
    
    if (!formData.placement) {
      errors.placement = 'Placement is required';
    }
    
    if (!formData.size) {
      errors.size = 'Size is required';
    }
    
    if (!formData.purpose) {
      errors.purpose = 'Purpose is required';
    }
    
    setValidationErrors(Object.keys(errors).length > 0 ? errors : null);
    return Object.keys(errors).length === 0;
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Clear specific field validation error when it's being edited
    if (validationErrors && validationErrors[name as keyof ValidationErrors]) {
      setValidationErrors({
        ...validationErrors,
        [name]: undefined
      });
    }
    
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const uploadImages = async (files: File[]) => {
    if (!files.length) return;
    
    setIsUploading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });
      
      const response = await fetch('/tattoo-requests/upload-images', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload images');
      }
      
      const data = await response.json();
      
      setFormData(prev => ({
        ...prev,
        referenceImages: [
          ...prev.referenceImages,
          ...data.images.map((img: any) => ({
            url: img.url,
            file: files.find(f => f.name === img.originalName) || files[0],
            publicId: img.publicId
          }))
        ]
      }));
    } catch (err: any) {
      setError(err.message || 'Failed to upload images');
    } finally {
      setIsUploading(false);
    }
  };
  
  const submitRequest = async () => {
    setIsLoading(true);
    setError(null);
    
    // Validate form before submission
    if (!validateForm()) {
      setIsLoading(false);
      return;
    }
    
    try {
      // Convert the form data to match the TattooRequest model in Prisma
      const requestData = {
        contactEmail: formData.contactEmail,
        contactPhone: formData.contactPhone,
        description: formData.description,
        placement: formData.placement,
        size: formData.size,
        colorPreference: formData.colorPreference || undefined,
        style: formData.style || undefined,
        purpose: formData.purpose,
        preferredArtist: formData.preferredArtist || undefined,
        timeframe: formData.timeframe || undefined,
        contactPreference: formData.contactPreference || 'email',
        additionalNotes: formData.additionalNotes || undefined,
        referenceImages: formData.referenceImages.map(img => ({
          url: img.url,
          publicId: img.publicId
        }))
      };
      
      // Submit tattoo request
      const response = await fetch('/tattoo-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit request');
      }
      
      const tattooRequestData = await response.json();
      setSuccess(true);
      setResponse(tattooRequestData);
    } catch (err: any) {
      setError(err.message || 'An error occurred while submitting your request');
    } finally {
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
    setSuccess(false);
    setResponse(null);
    setError(null);
    setValidationErrors(null);
  };
  
  return {
    formData,
    isLoading,
    isUploading,
    error,
    success,
    response,
    validationErrors,
    handleInputChange,
    uploadImages,
    submitRequest,
    resetForm
  };
};

export default useTattooRequestForm;