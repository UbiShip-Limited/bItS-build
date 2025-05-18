import { jest } from '@jest/globals';

export interface CloudinaryUploadResult {
  publicId: string;
  url: string;
  secureUrl: string;
  format: string;
  width: number;
  height: number;
  resourceType: string;
  metadata: Record<string, any>;
}

export const validateUploadResult = jest.fn();
export const generateUploadSignature = jest.fn();
export const uploadImage = jest.fn();
export const deleteImage = jest.fn();
export const getTransformedImageUrl = jest.fn();

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