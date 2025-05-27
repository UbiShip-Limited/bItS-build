import crypto from 'crypto';

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
  format: string;
  width: number;
  height: number;
  resourceType: string;
  secureUrl: string;
  metadata: Record<string, any>;
}

/**
 * Mock implementation for testing without real Cloudinary credentials
 */
export const generateUploadSignature = (
  params: Record<string, any> = {},
  timestamp: number = Math.round(new Date().getTime() / 1000)
): { signature: string; timestamp: number; apiKey: string; cloudName: string } => {
  // Create a mock signature
  const paramsToSign = { ...params, timestamp };
  const sortedParams = Object.keys(paramsToSign)
    .sort()
    .map(key => `${key}=${paramsToSign[key]}`)
    .join('&');
  
  // Generate a mock signature using crypto
  const signature = crypto
    .createHash('sha256')
    .update(sortedParams + 'mock_secret')
    .digest('hex');
  
  return { 
    signature, 
    timestamp,
    apiKey: 'mock_api_key_123456',
    cloudName: 'demo' 
  };
};

export const validateUploadResult = async (
  publicId: string
): Promise<CloudinaryUploadResult | null> => {
  // Mock validation - in real implementation this would check with Cloudinary
  return {
    url: `https://res.cloudinary.com/demo/image/upload/${publicId}`,
    publicId: publicId,
    format: 'jpg',
    width: 800,
    height: 600,
    resourceType: 'image',
    secureUrl: `https://res.cloudinary.com/demo/image/upload/${publicId}`,
    metadata: {}
  };
};

export const uploadImage = async (
  filePath: string,
  folder: string = 'tattoo-requests',
  tags: string[] = []
): Promise<CloudinaryUploadResult | null> => {
  // Mock upload - generate a fake public ID
  const publicId = `${folder}/${crypto.randomBytes(16).toString('hex')}`;
  
  return {
    url: `https://res.cloudinary.com/demo/image/upload/${publicId}`,
    publicId: publicId,
    format: 'jpg',
    width: 800,
    height: 600,
    resourceType: 'image',
    secureUrl: `https://res.cloudinary.com/demo/image/upload/${publicId}`,
    metadata: {}
  };
};

export const deleteImage = async (publicId: string): Promise<boolean> => {
  // Mock delete
  return true;
};

export const getTransformedImageUrl = (
  publicId: string,
  transformations: Record<string, any> = {}
): string => {
  return `https://res.cloudinary.com/demo/image/upload/${publicId}`;
};

export default {
  validateUploadResult,
  generateUploadSignature,
  uploadImage,
  deleteImage,
  getTransformedImageUrl
}; 