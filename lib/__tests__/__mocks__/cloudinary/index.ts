import { jest } from '@jest/globals';

// Import the original types from the real module
import type { CloudinaryUploadResult } from '../../cloudinary/index';

// Create mock functions
export const validateUploadResult = jest.fn<(publicId: string) => Promise<CloudinaryUploadResult | null>>();
export const generateUploadSignature = jest.fn<
  (params?: Record<string, any>, timestamp?: number) => { 
    signature: string; 
    timestamp: number; 
    apiKey: string; 
    cloudName: string 
  }
>();
export const uploadImage = jest.fn();
export const deleteImage = jest.fn();
export const getTransformedImageUrl = jest.fn();

// Export the mocked functions as default
export default {
  cloudinary: {
    api: { resource: jest.fn() },
    uploader: { upload: jest.fn(), destroy: jest.fn() },
    utils: { api_sign_request: jest.fn() },
    url: jest.fn(),
    config: jest.fn()
  },
  validateUploadResult,
  generateUploadSignature,
  uploadImage,
  deleteImage,
  getTransformedImageUrl
}; 